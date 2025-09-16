from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta, timezone as dt_timezone
from api_authorization.models import (
    LoginUser, 
    LoginUserVerificationCode, 
    UserRole,
)
from api_reward_points.models import RewardPoints
from utils.data_util import create_tracking
from utils.api_utils import ApiError
import json
import logging
import api_authorization.repo_util.constant_utils as constants
import api_authorization.repo_util.authorization_utils as auth_utils

logger = logging.getLogger(__name__)


# ------------------ Helpers ------------------

def _parse_json_body(request):
    try:
        return json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        raise ApiError(400, constants.ERROR_INVALID_JSON)

def _require_username_password(data):
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        raise ApiError(400, constants.USERNAME_AND_PASSWORD_REQUIRED)
    return username, password

def _check_username_not_taken(username):
    if LoginUser.objects(username=username, is_verified=True).first():
        raise ApiError(400, {
            'error': constants.USERNAME_EXISTS_AND_IS_ACTIVE['error'],
            'description': constants.USERNAME_EXISTS_AND_IS_ACTIVE['description'],
            'error_name': constants.USERNAME_EXISTS_AND_IS_ACTIVE['error_name'],
            'error_mail': None,
        })
    
    user = LoginUser.objects(username=username, is_verified=False).first()
    if user:
        raise ApiError(400, {
            'error': constants.USERNAME_EXISTS_AND_IS_NOT_VERIFIED['error'],
            'description': constants.USERNAME_EXISTS_AND_IS_NOT_VERIFIED['description'],
            'error_name': constants.USERNAME_EXISTS_AND_IS_NOT_VERIFIED['error_name'],
            'error_email': user.email,
            'error_phone_number': user.phone_number,
        })

def _check_company_name_available(company_name):
    if not company_name:
        return
    user_exists_company = LoginUser.objects(company_name=company_name, is_approved=True).first()
    if user_exists_company:
        raise ApiError(400, {
            'error': constants.COMPANY_EXISTS_AND_IS_ACTIVE['error'],
            'description': constants.COMPANY_EXISTS_AND_IS_ACTIVE['description'],
            'error_name': constants.COMPANY_EXISTS_AND_IS_ACTIVE['error_name'],
            'error_mail': None,
        })

def _get_or_create_user_role(role_name: str):
    role = UserRole.objects(name=role_name).first()
    if role:
        return role
    logger.warning('User role %s does not exist, creating it', role_name)
    now = timezone.now()
    role = UserRole(name=role_name, created_time=now, last_modified_time=now)
    role.save()
    logger.info('User role %s created successfully', role_name)
    return role

def _build_and_save_user(data, username, password, user_role):
    now = timezone.now()
    user = LoginUser(
        username=username,
        first_name=data.get('firstName', ''),
        last_name=data.get('lastName', ''),
        company_name=data.get('companyName', ''),
        email=data.get('email', ''),
        phone_number=data.get('phoneNumber', ''),
        is_staff=data.get('is_staff', False),
        is_active=True,
        created_time=now,
        last_modified_time=now,
        date_joined=now,
        is_verified=data.get('is_verified', False),
        user_role=user_role,
        avatar_url=data.get('avatarUrl', ''),
        disapproval_count=0,
        show_tour_guide_modal=True,
        show_intro_guide_modal=True,
    )
    user.set_password(password)
    user.save()
    return user

def _init_reward_points_for_user(user):
    now = timezone.now()
    reward_points = RewardPoints(
        user=user,
        total_gained_points=0,
        total_spent_points=0,
        total_assigned_points=0,
        total_substracted_points=0,
        total_amount_invoices=0,
        invoices=[],
        created_time=now,
        last_modified_time=now,
    )
    reward_points.save()
    auth_utils.get_rewards_points(user)

def _issue_verification_code(user):
    expiration = datetime.now(dt_timezone.utc) + timedelta(minutes=10)
    code = auth_utils.generate_verification_code()
    LoginUserVerificationCode.objects.create(user=user, code=code, expires_at=expiration)
    return code

def _notify_user_with_code(user, code, settings):
    phone = user.phone_number
    message = f"Your (Reward Points System) verification code is: {code}. It will expire in 10 minutes."
    # send_sms_verification_code(phone, message)
    logger.info('SMS sent to %s with code %s', phone, code)
    
    if settings.ENVIRONMENT == 'prod':
        list_emails = settings.DJANGO_LIST_ADMIN_EMAIL_RECEIPTS
        list_emails.append(user.email)
    else:
        list_emails = settings.DJANGO_LIST_ADMIN_EMAIL_RECEIPTS

    template = 'email_send_verification_code.html'
    response_message = 'Verification code sent successfully.'
    subject = f'Verification Code for Customer Portal ({user.first_name} {user.last_name})'
    current_year = datetime.now().year

    auth_utils.send_email_verification_code(
        list_emails, code, template, response_message, subject, user.first_name, user.last_name, current_year
    )
    logger.info('Email sent to %s with code %s', user.email, code)

def _track_register(user):
    create_tracking(
        user,
        'register',
        object_id=str(user.id),
        object_type='LoginUser',
        object_name=user.username,
        managed_data='User registered successfully'
    )

# ------------------ Endpoint ------------------

def register(request):
    if request.method != 'POST':
        return JsonResponse(
            {'error': 'Method not allowed', 'description': 'Method not allowed'},
            status=405
        )

    try:
        data = _parse_json_body(request)
        
        username, password = _require_username_password(data)
        _check_username_not_taken(username)
        _check_company_name_available(data.get('companyName', ''))
        
        user_role_name = settings.DJANGO_REGISTER_USER_ROLE
        user_role = _get_or_create_user_role(user_role_name)
        
        user = _build_and_save_user(data, username, password, user_role)
        
        _init_reward_points_for_user(user)
        
        code = _issue_verification_code(user)
        _notify_user_with_code(user, code, settings)
        
        _track_register(user)

        logger.info('User %s registered successfully', username)
        return JsonResponse({'data': {'username': user.username}}, status=201)

    except ApiError as e:
        return JsonResponse(e.payload, status=e.status)
    except Exception as e:
        logger.exception("Unhandled error on register: %s", e)
        return JsonResponse(
            {'error': 'Unexpected error', 'description': 'Please, try again later.'},
            status=500
        )
