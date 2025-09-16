from django.http import JsonResponse
from django.conf import settings
import json
import logging
import api_authorization.repo_util.constant_utils as constants
from utils.api_utils import ApiError
from api_authorization.repo_util.register_utils import _parse_json_body
from api_authorization.models import (
    LoginUser, 
    LoginUserVerificationCode, 
)
from api_reward_points.models import RewardPoints
from api_authorization.repo_util.authorization_utils import (
    send_email_pending_approval,
)
from utils.data_util import create_tracking
from datetime import datetime

logger = logging.getLogger(__name__)

def _require_username_code(data):
    username = data.get('username')
    code = data.get('code')
    if not username or not code:
        raise ApiError(400, {
            'error': 'Username and code required',
            'description': 'Username and code required'
        })
    return username, code

def _get_user_or_404(username):
    user = LoginUser.objects(username=username).first()
    if not user:
        raise ApiError(404, {
            'error': 'User not found',
            'description': 'User does not exist'
        })
    return user

def _get_verification_or_400(user, code):
    verification_code = LoginUserVerificationCode.objects(user=user, code=code).first()
    if not verification_code:
        raise ApiError(400, {
            'error': constants.ERROR_VERIFICATION_CODE_INVALID['error'],
            'description': constants.ERROR_VERIFICATION_CODE_INVALID['description'],
            'error_name': constants.ERROR_VERIFICATION_CODE_INVALID['error_name'],
            'error_username': user.username,
            'error_email': user.email,
            'error_phone_number': user.phone_number
        })
    if verification_code.is_expired():
        raise ApiError(400, {
            'error': constants.ERROR_VERIFICATION_CODE_EXPIRED['error'],
            'description': constants.ERROR_VERIFICATION_CODE_EXPIRED['description'],
            'error_name': constants.ERROR_VERIFICATION_CODE_EXPIRED['error_name'],
            'error_username': user.username,
            'error_email': user.email,
            'error_phone_number': user.phone_number
        })
    return verification_code

def _mark_verified_and_cleanup(user, verification_code):
    user.is_verified = True
    user.save()
    verification_code.delete()
    logger.info('User %s verified successfully', user.username)

def _notify_admin_if_points(user):
    current_year = datetime.now().year
    rp = RewardPoints.objects(user=user).first()
    if not rp:
        return
    points = rp.total_gained_points
    # if points > 0:
    send_email_pending_approval(
        points=points,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_name=user.user_role.name if user.user_role else "No Role",
        company_name=user.company_name if user.company_name else "No Company",
        created_time=user.created_time,
        current_year=current_year,
        list_receivers=settings.DJANGO_LIST_ADMIN_EMAIL_RECEIPTS,
        pending_url=settings.DJANGO_PENDING_USERS_URL
    )

def _track_verify(user):
    create_tracking(
        user,
        'verify_user',
        object_id=str(user.id),
        object_type='LoginUser',
        object_name=user.username,
        managed_data='User verified successfully'
    )

# ------------------ Endpoint ------------------

def verify_user(request):
    if request.method != 'POST':
        return JsonResponse(
            constants.ERROR_METHOD_NOT_ALLOWED,
            status=405
        )

    try:
        data = _parse_json_body(request)
        username, code = _require_username_code(data)
        user = _get_user_or_404(username)
        verification = _get_verification_or_400(user, code)

        _mark_verified_and_cleanup(user, verification)
        _notify_admin_if_points(user)
        _track_verify(user)

        return JsonResponse({'data': 'User verified successfully'}, status=200)

    except ApiError as e:
        return JsonResponse(e.payload, status=e.status)
    except Exception as e:
        logger.exception("Unhandled error on verify_user: %s", e)
        return JsonResponse(
            constants.ERROR_UNEXPECTED,
            status=500
        )