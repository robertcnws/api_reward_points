from django.http import JsonResponse
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth import BACKEND_SESSION_KEY  
from mongoengine.queryset.visitor import Q  
from utils.api_utils import ApiError
from api_authorization.repo_util.register_utils import _parse_json_body
from api_authorization.models import (
    LoginUser,
)
from api_authorization.repo_util.authorization_utils import (
    set_initial_tour_and_intro,
)
from utils.data_util import (
    transform_data_to_mongo, 
    create_tracking
)
from api_reward_points_async_task_sequence.tasks import (
    task_create_notification_async, 
    task_create_tracking_async
)
import json
import logging
import api_authorization.repo_util.constant_utils as constants

logger = logging.getLogger(__name__)

# ------------------ Helpers específicos ------------------

def _require_username_password(data):
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        raise ApiError(400, constants.USERNAME_AND_PASSWORD_REQUIRED)
    return username, password

def _find_user_by_login(username):
    return LoginUser.objects(Q(username__iexact=username) | Q(email__iexact=username)).first()

def _raise_state_error_if_any(login_user):
    if not login_user:
        raise ApiError(400, {
            'error': constants.ERROR_INVALID_USERNAME['error'],
            'description': constants.ERROR_INVALID_USERNAME['description'],
            'error_name': constants.ERROR_INVALID_USERNAME['error_name'],
        })
    if not login_user.is_approved:
        raise ApiError(403, {
            'error': constants.USER_NOT_APPROVED['error'],
            'description': constants.USER_NOT_APPROVED['description'],
            'error_name': constants.USER_NOT_APPROVED['error_name'],
            'error_username': login_user.username,
            'error_email': login_user.email,
            'error_phone_number': login_user.phone_number,
        })
    if not login_user.is_active:
        raise ApiError(403, {
            'error': constants.USER_NOT_ACTIVE['error'],
            'description': constants.USER_NOT_ACTIVE['description'],
            'error_name': constants.USER_NOT_ACTIVE['error_name'],
            'error_username': login_user.username,
            'error_email': login_user.email,
            'error_phone_number': login_user.phone_number,
        })
    if not login_user.is_verified:
        raise ApiError(403, {
            'error': constants.USER_NOT_VERIFIED['error'],
            'description': constants.USER_NOT_VERIFIED['description'],
            'error_name': constants.USER_NOT_VERIFIED['error_name'],
            'error_username': login_user.username,
            'error_email': login_user.email,
            'error_phone_number': login_user.phone_number,
        })
    raise ApiError(400, {
        'error': constants.ERROR_INVALID_CREDENTIALS['error'],
        'description': constants.ERROR_INVALID_CREDENTIALS['description'],
        'error_name': constants.ERROR_INVALID_CREDENTIALS['error_name'],
        'error_username': login_user.username,
        'error_email': login_user.email,
        'error_phone_number': login_user.phone_number,
    })

def _establish_session(request, user_obj):
    request.session['user_id'] = str(user_obj.id)
    request.session[BACKEND_SESSION_KEY] = 'api_authorization.backends.MongoDBBackend'
    request.session.set_expiry(0)  
    request.session.modified = True

def _post_login_side_effects(current_user):
    current_user.last_login = timezone.now()
    set_initial_tour_and_intro(current_user) 
    current_user.save()
    # create_tracking(
    #     current_user,
    #     'login',
    #     object_id=str(current_user.id),
    #     object_type='LoginUser',
    #     object_name=current_user.username,
    #     managed_data='User logged in successfully'
    # )
    task_create_tracking_async.delay(
        user_reporter_id=str(current_user.id),
        action=f'login',
        id=str(current_user.id),
        type='LoginUser',
        name=current_user.username,
        tracking_info='User logged in successfully',
    )

# ------------------ Endpoint ------------------

def login(request):
    if request.method != 'POST':
        return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)

    try:
        data = _parse_json_body(request)
        username, password = _require_username_password(data)
        
        auth_user = authenticate(request, username=username, password=password)
        if auth_user is not None:
            current_user = _find_user_by_login(username)
            if not current_user:
                raise ApiError(400, constants.ERROR_INVALID_CREDENTIALS)

            _establish_session(request, current_user)
            _post_login_side_effects(current_user)
            
            user_payload = transform_data_to_mongo(
                current_user,
                exclude_fields=['password', 'is_staff']
            )
            return JsonResponse({'data': user_payload}, status=200)
        
        login_user = _find_user_by_login(username)
        _raise_state_error_if_any(login_user)

    except ApiError as e:
        return JsonResponse(e.payload, status=e.status)
    except json.JSONDecodeError:
        return JsonResponse(constants.ERROR_INVALID_JSON, status=400)
    except Exception as e:
        logger.exception("Unhandled error on login: %s", e)
        return JsonResponse(
            constants.ERROR_UNEXPECTED,
            status=500
        )