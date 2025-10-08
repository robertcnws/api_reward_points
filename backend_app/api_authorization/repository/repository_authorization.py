from django.shortcuts import redirect
from django.contrib.auth import BACKEND_SESSION_KEY
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta, timezone as dt_timezone
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from mongoengine.queryset.visitor import Q
from api_authorization.models import (
    LoginUser, 
    LoginUserVerificationCode, 
    LoginUserRecoverPasswordCode,
    UserRole,
    ExternalUsers,
    RevokedToken,
)
from utils.data_util import create_tracking
from api_authorization.repo_util.authorization_utils import (
    generate_verification_code,
    send_email_verification_code,
    get_rewards_points,
    set_initial_tour_and_intro,
)
import json
import logging
import jwt
import api_authorization.repo_util.constant_utils as constants
import api_authorization.repo_util.register_utils as register_utils
import api_authorization.repo_util.verify_user_utils as verify_user_utils
import api_authorization.repo_util.login_utils as login_utils

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def is_user_verified(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  
            username = data.get('username') 
            if not username :
                return JsonResponse({
                    'error': constants.USERNAME_REQUIRED['error'], 
                    'description': constants.USERNAME_REQUIRED['description']
                }, status=400)
            user = LoginUser.objects(Q(username__iexact=username) | Q(email__iexact=username)).first()
            
            if not user:
                return JsonResponse({
                    'error': constants.USER_NOT_FOUND['error'],
                    'description': constants.USER_NOT_FOUND['description'],
                    'error_name': constants.USER_NOT_FOUND['error_name']
                }, status=404)
                
            if not user.is_verified:
                return JsonResponse({
                    'error': constants.USER_NOT_VERIFIED['error'],
                    'description': constants.USER_NOT_VERIFIED['description'],
                    'error_name': constants.USER_NOT_VERIFIED['error_name'],
                    'error_username': user.username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=400)
                
            if not user.is_approved:
                return JsonResponse({
                    'error': constants.USER_NOT_APPROVED['error'],
                    'description': constants.USER_NOT_APPROVED['description'],
                    'error_name': constants.USER_NOT_APPROVED['error_name'],
                    'error_username': user.username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=403)
                
            return JsonResponse({
                    'username': user.username,
                    'is_verified': user.is_verified
                }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse(constants.ERROR_INVALID_JSON, status=400)
    return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)


def _validate_request(request):
    token = None
    if request.content_type == "application/json":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        token = data.get("token")
    else:
        token = request.POST.get("token")
    return token


def transfer_login(request):
    if request.method == 'POST':
        
        token = _validate_request(request)
        if not token:
            return JsonResponse({"error": "Token required"}, status=400)
        
        try:
            payload = jwt.decode(
                token,
                settings.SSO_SHARED_SECRET,
                algorithms=["HS256"],
                issuer=settings.SSO_ISSUER,
                audience=settings.SSO_AUDIENCE_CUSTOMERPORTAL,
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Token expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "Invalid token"}, status=401)

        # 2) Get or create Django user
        username = payload["sub"]
        email = payload.get("email", "")
        first_name = payload.get("first_name", "")
        last_name = payload.get("last_name", "")
        role_name = payload.get("role_name", "designer")
        
        role = UserRole.objects(name=role_name).first()
        if not role:
            role = UserRole(name=role_name, created_time=timezone.now(), last_modified_time=timezone.now())
            role.save()

        user = LoginUser.objects(username=username, user_role=role).first()
        if not user:
            user = LoginUser(
                username=username, 
                email=email, 
                first_name=first_name, 
                last_name=last_name, 
                user_role=role,
                company_name='NWS',
                is_verified=True,
                is_approved=True,
                is_active=True,
                is_staff=False,
                phone_number=None,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                approved_time=timezone.now(),
                disapproval_count=0,
                show_tour_guide_modal=True,
                show_intro_guide_modal=True,
            )
            
            user.set_password(f"Guest-{username}") 
            user.save()
        
        request.session['user_id'] = str(user.id)
        request.session['sso_authenticated'] = True
        request.session[BACKEND_SESSION_KEY] = 'api_authorization.backends.MongoDBBackend'
        request.session.set_expiry(0)
        request.session.modified = True
        
        user.last_login = timezone.now()
        user.save()
        
        external_user = ExternalUsers.objects(user=user).first()
        
        if not external_user:
            external_user = ExternalUsers(
                user=user,
                is_logged_in=True,
                last_login=timezone.now(),
                created_time=timezone.now(),
                last_modified_time=timezone.now()
            )
            external_user.save()
        else:
            external_user.is_logged_in = True
            external_user.last_login = timezone.now()
            external_user.last_modified_time = timezone.now()
            external_user.save()

        create_tracking(
            user,
            'login',
            object_id=str(user.id),
            object_type='LoginUser',
            object_name=user.username,
            managed_data='User logged in via SSO'
        )
        
        return redirect(f"{settings.FRONTEND_URL}/dashboard")
    return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)


def login(request):
    return login_utils.login(request)


def logout(request):
    data = request.data
    user_reporter = data.get('userReporter', None)
    refresh_token = data.get('refreshToken', None)
    if user_reporter:
        request.session.flush()
        if refresh_token:
            try:
                token = UntypedToken(refresh_token)
                jti   = token['jti']
                revoked_token = RevokedToken(jti=jti)
                revoked_token.save()
            except (InvalidToken, TokenError):
                return JsonResponse({'error':'Invalid token'}, status=400)
        logger.info(f'User {user_reporter["username"]} logged out')
        current_user = LoginUser.objects(username=user_reporter['username']).first()
        if current_user:
            current_user.last_login = timezone.now()
            set_initial_tour_and_intro(current_user)
            current_user.save()
            external_user = ExternalUsers.objects(user=current_user).first()
            if external_user:
                external_user.is_logged_in = False
                external_user.last_login = timezone.now()
                external_user.last_modified_time = timezone.now()
                external_user.save()
            create_tracking(
                current_user, 
                'logout', 
                object_id=str(current_user.id), 
                object_type='LoginUser', 
                object_name=current_user.username, 
                managed_data='User logged out successfully'
            )
            return JsonResponse({'data': 'User logged out'}, status=200)
        return JsonResponse(constants.USER_NOT_FOUND, status=404)
    return JsonResponse({'error': 'User not logged in', 'description': 'User not logged in'}, status=400)


def register(request):
    return register_utils.register(request)


def verify_user(request):
    return verify_user_utils.verify_user(request)


def send_verification_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse(constants.ERROR_EMAIL_REQUIRED, status=400)
            username = data.get('username')
            if not username:
                return JsonResponse(constants.ERROR_USERNAME_REQUIRED, status=400)
            user = LoginUser.objects(username=username).first()
            if not user:
                return JsonResponse({'error': 'User not found', 'description': 'User does not exist'}, status=404)
            verification_code = LoginUserVerificationCode.objects(user=user).first()
            if verification_code:
                verification_code.delete()
            expiration = datetime.now(dt_timezone.utc) + timedelta(minutes=10)
            code = generate_verification_code()
            LoginUserVerificationCode.objects.create(
                user=user,
                code=code,
                expires_at=expiration
            )
            # list_emails = [email, settings.EMAIL_SUPPORT] if \
            #     settings.ENVIRONMENT == 'prod' else [settings.EMAIL_SUPPORT]
            list_emails = [email]
            template = 'email_send_verification_code.html'
            response_message = 'Verification code sent successfully.'
            first_name = user.first_name
            last_name = user.last_name
            subject = f'Verification Code for Customer Portal ({first_name} {last_name})'
            send_email_verification_code(list_emails, code, template, response_message, subject, first_name, last_name)
            logger.info(f'Email sent to {email} with code {code}')
            print(f'Email sent to {email} with code {code}')
            return JsonResponse({'data': 'Email sent successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse(constants.ERROR_INVALID_JSON, status=400)
    return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)


def reset_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'Email required', 'description': 'Email is required'}, status=400)
            if not LoginUser.objects(email=email, is_verified=True, is_approved=True).first():
                return JsonResponse({
                    'error': 'Email not found or inactive',
                    'description': 'Email not found or inactive',
                    'error_name': 'email_not_found',
                    'error_mail': None
                }, status=400)

            user = LoginUser.objects(email=email).first()
            
            expiration = datetime.now(dt_timezone.utc) + timedelta(minutes=10)
            
            code = generate_verification_code()
            
            recovery_password_code = LoginUserRecoverPasswordCode.objects(user=user).first()

            if recovery_password_code:
                recovery_password_code.delete()

            LoginUserRecoverPasswordCode.objects.create(
                user=user,
                code=code,
                expires_at=expiration
            )
            # list_emails = [user.email, settings.EMAIL_SUPPORT] if \
            #     settings.ENVIRONMENT == 'prod' else [settings.EMAIL_SUPPORT]
            list_emails = [user.email]
            template = 'email_send_recover_code.html'
            response_message = 'Recovery code sent successfully.'
            first_name = user.first_name
            last_name = user.last_name
            subject = f'Recovery Code for Customer Portal ({first_name} {last_name})'
            current_year = datetime.now().year
            send_email_verification_code(list_emails, code, template, response_message, subject, first_name, last_name, current_year)
            logger.info(f'Email sent to {user.email} with code {code}')
            
            create_tracking(
                user, 
                'recover_password', 
                object_id=str(user.id), 
                object_type='LoginUser', 
                object_name=user.username, 
                managed_data='User requested password recovery'
            )

            return JsonResponse({
                'data': {
                    'username': user.username, 
                    'email': user.email,
                    'id': str(user.id)
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse(constants.ERROR_INVALID_JSON, status=400)
    return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)


def update_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            email = data.get('email')
            if not email:
                return JsonResponse({
                    'error': 'Email required', 
                    'description': 'Email is required'
                }, status=400)
                
            confirmation_code = data.get('confirmationCode')
            if not confirmation_code:
                return JsonResponse(constants.ERROR_CONFIRMATION_CODE_REQUIRED, status=400)
                
            new_password = data.get('newPassword')
            if not new_password:
                return JsonResponse(constants.ERROR_NEW_PASSWORD_REQUIRED, status=400)

            user = LoginUser.objects(email=email, is_verified=True, is_approved=True).first()
            if not user:
                return JsonResponse({
                    'error': constants.USER_NOT_FOUND_OR_INACTIVE['error'],
                    'description': constants.USER_NOT_FOUND_OR_INACTIVE['description'],
                    'error_name': constants.USER_NOT_FOUND_OR_INACTIVE['error_name'],
                    'error_mail': None
                }, status=400)
                
            existing_recovery_code = LoginUserRecoverPasswordCode.objects(user=user, code=confirmation_code).first()

            if not existing_recovery_code:
                return JsonResponse({
                    'error': constants.ERROR_CONFIRMATION_CODE_INVALID_OR_EXPIRED['error'],
                    'description': constants.ERROR_CONFIRMATION_CODE_INVALID_OR_EXPIRED['description'],
                    'error_name': constants.ERROR_CONFIRMATION_CODE_INVALID_OR_EXPIRED['error_name'],
                    'error_mail': None
                }, status=400)

            existing_recovery_code.delete()

            user.set_password(new_password)
            user.save()

            create_tracking(
                user, 
                'update_password', 
                object_id=str(user.id), 
                object_type='LoginUser', 
                object_name=user.username, 
                managed_data='User updated password'
            )

            return JsonResponse({
                'data': {
                    'username': user.username, 
                    'email': user.email,
                    'id': str(user.id)
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse(constants.ERROR_INVALID_JSON, status=400)
    return JsonResponse(constants.ERROR_METHOD_NOT_ALLOWED, status=405)


def get_refetch_rewards_points(id):
    user = LoginUser.objects(id=id).first()
    if not user:
        return JsonResponse({'error': 'User not found'}, status=404)
    get_rewards_points(user)
    full_name = f"{user.first_name} {user.last_name}"
    return JsonResponse({'message': f'Reward Points for {full_name} refetched successfully'}, status=200)