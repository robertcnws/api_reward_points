from django.shortcuts import redirect
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta, timezone as dt_timezone
from bson.objectid import ObjectId
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
from api_reward_points.models import RewardPoints
from utils.data_util import transform_data_to_mongo, create_tracking
from api_authorization.repo_util.authorization_utils import (
    generate_verification_code,
    send_email_verification_code,
    send_email_pending_approval,
    get_rewards_points,
)
import json
import logging
import jwt

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def is_user_verified(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  
            username = data.get('username') 
            if not username :
                return JsonResponse({
                    'error': 'Username required', 
                    'description': 'Username required'
                }, status=400)
            user = LoginUser.objects(Q(username__iexact=username) | Q(email__iexact=username)).first()
            
            if not user:
                return JsonResponse({
                    'error': 'User not found', 
                    'description': 'User does not exist',
                    'error_name': 'user_not_found'
                }, status=404)
                
            if not user.is_verified:
                return JsonResponse({
                    'error': 'User not verified', 
                    'description': 'User is not verified',
                    'error_name': 'user_not_verified',
                    'error_username': user.username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=400)
                
            if not user.is_approved:
                return JsonResponse({
                    'error': 'User not approved', 
                    'description': 'User is not approved by admin',
                    'error_name': 'user_not_approved',
                    'error_username': user.username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=403)
                
            return JsonResponse({
                    'username': user.username,
                    'is_verified': user.is_verified
                }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


def transfer_login(request):
    if request.method == 'POST':
        
        if request.content_type == "application/json":
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)
            token = data.get("token")
        else:
            token = request.POST.get("token")
        if not token:
            return JsonResponse({"error": "Token required"}, status=400)

        # 1) Decode JWT
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
    return JsonResponse({"error": "Method not allowed"}, status=405)


def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  
            username = data.get('username')
            password = data.get('password') 
            if not username or not password:
                return JsonResponse({'error': 'Username and password required', 'description': 'Username and password required'}, status=400)
            user = authenticate(request, username=username, password=password)
            if user is not None:
                user = user.to_mongo().to_dict()
                del user['password']
                if '_id' in user and isinstance(user['_id'], ObjectId):
                    user['_id'] = str(user['_id'])
                request.session['user_id'] = user['_id']
                request.session[BACKEND_SESSION_KEY] = 'api_authorization.backends.MongoDBBackend'
                request.session.set_expiry(0)
                request.session.modified = True
                
                current_user = LoginUser.objects(Q(username__iexact=username) | Q(email__iexact=username)).first()
                current_user.last_login = timezone.now()
                current_user.show_tour_guide_modal = True
                current_user.save()
                
                create_tracking(
                    current_user, 
                    'login', 
                    object_id=str(current_user.id), 
                    object_type='LoginUser', 
                    object_name=current_user.username, 
                    managed_data='User logged in successfully'
                )
                
                user = transform_data_to_mongo(
                    current_user, 
                    exclude_fields=['password', 'is_staff']
                )
                
                return JsonResponse({'data': user}, status=200)
            
            login_user = LoginUser.objects(Q(username__iexact=username) | Q(email__iexact=username)).first()
            
            if login_user and not login_user.is_approved:
                return JsonResponse({
                    'error': 'User not approved', 
                    'description': 'User is not approved by admin',
                    'error_name': 'user_not_approved',
                    'error_username': login_user.username,
                    'error_email': login_user.email,
                    'error_phone_number': login_user.phone_number
                }, status=403)
            elif login_user and not login_user.is_active:
                return JsonResponse({
                    'error': 'User not active',
                    'description': 'User is not active',
                    'error_name': 'user_not_active',
                    'error_username': login_user.username,
                    'error_email': login_user.email,
                    'error_phone_number': login_user.phone_number
                }, status=403)
            elif login_user and not login_user.is_verified:
                return JsonResponse({
                    'error': 'User not verified', 
                    'description': 'User is not verified',
                    'error_name': 'user_not_verified',
                    'error_username': login_user.username,
                    'error_email': login_user.email,
                    'error_phone_number': login_user.phone_number
                }, status=403)
            elif login_user:
                return JsonResponse({
                    'error': 'Invalid credentials', 
                    'description' : 'Incorrect Password',
                    'error_name': 'invalid_credentials',
                    'error_username': login_user.username,
                    'error_email': login_user.email,
                    'error_phone_number': login_user.phone_number
                }, status=400)
            else:
                return JsonResponse({
                    'error': 'Invalid credentials', 
                    'description' : 'Username does not exist',
                    'error_name': 'invalid_username',
                }, status=400)
        except json.JSONDecodeError:
            
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


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
            except (InvalidToken, TokenError) as e:
                return JsonResponse({'error':'Invalid token'}, status=400)
        logger.info(f'User {user_reporter["username"]} logged out')
        current_user = LoginUser.objects(username=user_reporter['username']).first()
        if current_user:
            current_user.last_login = timezone.now()
            current_user.show_tour_guide_modal = True
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
        return JsonResponse({'error': 'User not found', 'description': 'User does not exist'}, status=404)
    return JsonResponse({'error': 'User not logged in', 'description': 'User not logged in'}, status=400)


def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            if not username or not password:
                return JsonResponse({'error': 'Username and password required', 'description': 'Username and password required'}, status=400)
            if LoginUser.objects(username=username, is_verified=True).first():
                return JsonResponse({
                    'error': 'Username already exists and is active', 
                    'description': 'Username already exists and is active', 
                    'error_name': 'username_exists',
                    'error_mail': None
                }, status=400)
            user = LoginUser.objects(username=username, is_verified=False).first()
            if user:
                return JsonResponse({
                    'error': 'Username already exists and is NOT verified', 
                    'description': 'Username already exists and is NOT verified',
                    'error_name': 'username_not_verified',
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=400)
            company_name = data.get('companyName', '')
            user_exists_company = LoginUser.objects(company_name=company_name, is_approved=True).first()
            if user_exists_company:
                return JsonResponse({
                    'error': 'Company already exists and is active', 
                    'description': 'Company already exists and is active', 
                    'error_name': 'company_exists',
                    'error_mail': None
                }, status=400)
            user_role_name = settings.DJANGO_REGISTER_USER_ROLE
            user_role = UserRole.objects(name=user_role_name).first()
            if not user_role:
                logger.warning(f'User role {user_role_name} does not exist, creating it')
                user_role = UserRole(
                    name=user_role_name,
                    created_time=timezone.now(),
                    last_modified_time=timezone.now()
                )
                user_role.save()
                logger.info(f'User role {user_role_name} created successfully')
            user = LoginUser(
                username=username,
                first_name=data.get('firstName', ''),
                last_name=data.get('lastName', ''),
                company_name=data.get('companyName', ''),
                email=data.get('email', ''),
                phone_number=data.get('phoneNumber', ''),
                is_staff=data.get('is_staff', False),
                is_active=True,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
                date_joined=timezone.now(),
                is_verified=data.get('is_verified', False),
                user_role=user_role,
                avatar_url=data.get('avatarUrl', ''),
                disapproval_count=0,
                show_tour_guide_modal=True,
            )
            user.set_password(password)
            user.save()
            
            reward_points = RewardPoints(
                user=user,
                total_gained_points=0,
                total_spent_points=0,
                total_assigned_points=0,
                total_substracted_points=0,
                total_amount_invoices=0,
                invoices=[],
                created_time=timezone.now(),
                last_modified_time=timezone.now()
            )

            reward_points.save()

            get_rewards_points(user)
            
            logger.info(f'User {username} registered successfully')
            expiration = datetime.now(dt_timezone.utc) + timedelta(minutes=10)
            
            code = generate_verification_code()
            
            LoginUserVerificationCode.objects.create(
                user=user,
                code=code,
                expires_at=expiration
            )
            
            phone = user.phone_number
            message = f"Your (Reward Points System) verification code is: {code}. It will expire in 10 minutes."
            # send_sms_verification_code(phone, message)
            logger.info(f'SMS sent to {phone} with code {code}')
            print(f'SMS sent to {phone} with code {code}')
            # list_emails = [user.email]
            list_emails = ['robertoc@newwindowsystem.com']
            template = 'email_send_verification_code.html'
            response_message = 'Verification code sent successfully.'
            subject = 'Verification Code for Customer Portal'
            send_email_verification_code(list_emails, code, template, response_message, subject)
            logger.info(f'Email sent to {user.email} with code {code}')
            # print(f'Email sent to {email} with code {code}')
            
            # tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
            
            create_tracking(
                user, 
                'register', 
                object_id=str(user.id), 
                object_type='LoginUser', 
                object_name=user.username, 
                managed_data='User registered successfully'
            )
            
            return JsonResponse({'data': {'username': user.username}}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


def verify_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            code = data.get('code')
            if not username or not code:
                return JsonResponse({'error': 'Username and code required', 'description': 'Username and code required'}, status=400)
            user = LoginUser.objects(username=username).first()
            if not user:
                return JsonResponse({'error': 'User not found', 'description': 'User does not exist'}, status=404)
            verification_code = LoginUserVerificationCode.objects(user=user, code=code).first()
            if not verification_code:
                return JsonResponse({
                    'error': 'Invalid verification code', 
                    'description': 'Verification code is invalid',
                    'error_name': 'verification_code_invalid',
                    'error_username': username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=400)
            if verification_code.is_expired():
                return JsonResponse({
                    'error': 'Expired verification code', 
                    'description': 'Verification code has expired, please request a new one',
                    'error_name': 'verification_code_expired',
                    'error_username': username,
                    'error_email': user.email,
                    'error_phone_number': user.phone_number
                }, status=400)
            user.is_verified = True
            user.save()
            verification_code.delete()
            logger.info(f'User {username} verified successfully')
            reward_points = RewardPoints.objects(user=user).first()
            if reward_points:
                points = reward_points.total_gained_points
                if points > 0:
                    send_email_pending_approval(
                        points=points,
                        username=user.username,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        list_receivers=settings.DJANGO_LIST_ADMIN_EMAIL_RECEIPTS
                    )
            create_tracking(
                user, 
                'verify_user', 
                object_id=str(user.id), 
                object_type='LoginUser', 
                object_name=user.username, 
                managed_data='User verified successfully'
            )
            return JsonResponse({'data': 'User verified successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


def send_verification_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # phone_number = data.get('phoneNumber')
            # if not phone_number:
            #     return JsonResponse({'error': 'Phone number required', 'description': 'Phone number is required'}, status=400)
            # verification_code = generate_verification_code()
            # message = f'Your (Reward Points System) verification code is: {verification_code}'
            # send_sms_verification_code(phone_number, message)
            # logger.info(f'SMS sent to {phone_number} with code {verification_code}')
            # print(f'SMS sent to {phone_number} with code {verification_code}')
            # return JsonResponse({'data': 'SMS sent successfully'}, status=200)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'Email required', 'description': 'Email is required'}, status=400)
            username = data.get('username')
            if not username:
                return JsonResponse({'error': 'Username required', 'description': 'Username is required'}, status=400)
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
            # list_emails = [email]
            list_emails = ['robertoc@newwindowsystem.com']
            template = 'email_send_verification_code.html'
            response_message = 'Verification code sent successfully.'
            subject = 'Verification Code for Customer Portal'
            send_email_verification_code(list_emails, code, template, response_message, subject)
            logger.info(f'Email sent to {email} with code {code}')
            print(f'Email sent to {email} with code {code}')
            return JsonResponse({'data': 'Email sent successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


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
            
            phone = user.phone_number
            message = f"Your verification code to RECOVER PASSWORD is: {code}. It will expire in 10 minutes."
            # send_sms_verification_code(phone, message)
            logger.info(f'SMS sent to {phone} with code {code}')
            print(f'SMS sent to {phone} with code {code}')
            # list_emails = [user.email]
            list_emails = ['robertoc@newwindowsystem.com']
            template = 'email_send_recover_code.html'
            response_message = 'Recovery code sent successfully.'
            subject = 'Recovery Code for Customer Portal'
            send_email_verification_code(list_emails, code, template, response_message, subject)
            logger.info(f'Email sent to {user.email} with code {code}')
            # print(f'Email sent to {email} with code {code}')
            
            # tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
            
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
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


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
                return JsonResponse({
                    'error': 'Confirmation code required', 
                    'description': 'Confirmation code is required'
                }, status=400)
                
            new_password = data.get('newPassword')
            if not new_password:
                return JsonResponse({
                    'error': 'New password required',
                    'description': 'New password is required'
                }, status=400)

            user = LoginUser.objects(email=email, is_verified=True, is_approved=True).first()
            if not user:
                return JsonResponse({
                    'error': 'User not found or inactive',
                    'description': 'User not found or inactive',
                    'error_name': 'user_not_found',
                    'error_mail': None
                }, status=400)
                
            existing_recovery_code = LoginUserRecoverPasswordCode.objects(user=user, code=confirmation_code).first()

            if not existing_recovery_code:
                return JsonResponse({
                    'error': 'Invalid or expired confirmation code',
                    'description': 'Invalid or expired confirmation code',
                    'error_name': 'invalid_confirmation_code',
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
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)