from django.shortcuts import redirect
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from datetime import datetime, timedelta, timezone as dt_timezone
from bson.objectid import ObjectId
from api_authorization.models import LoginUser, LoginUserVerificationCode, UserRole
from api_reward_points.models import RewardPoints, RewardPointsHistory
from api_integration.views import fetch_client_invoices
from utils.data_util import (
    transform_data_to_mongo, 
    get_national_phone_number, 
    calculate_reward_points, 
    create_tracking
)
from utils.model_util import create_reward_invoice_instance
import json
import logging
import boto3
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
            user = LoginUser.objects(username=username).first()
            
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
                
                current_user = LoginUser.objects(username=username).first()
                current_user.last_login = timezone.now()
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
                    exclude_fields=[
                        'password', 
                        'is_staff', 
                        'is_active', 
                        'is_verified', 
                        'last_login', 
                        'date_joined',
                        'last_modified_time', 
                        'created_time'
                    ]
                )
                
                return JsonResponse({'data': user}, status=200)
            
            login_user = LoginUser.objects(username=username).first()
            
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
    if user_reporter:
        request.session.flush()
        logger.info(f'User {user_reporter["username"]} logged out')
        current_user = LoginUser.objects(username=user_reporter['username']).first()
        if current_user:
            current_user.last_login = timezone.now()
            current_user.save()
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
            list_emails = ['admin@newwindowsystem.com', 'robertoc@newwindowsystem.com']
            send_email_verification_code(list_emails, code)
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
            list_emails = ['admin@newwindowsystem.com', 'robertoc@newwindowsystem.com']
            send_email_verification_code(list_emails, code)
            logger.info(f'Email sent to {email} with code {code}')
            print(f'Email sent to {email} with code {code}')
            return JsonResponse({'data': 'Email sent successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)



def send_sms_verification_code(phone_number, message):
    try:
        sns = boto3.client(
            'sns', 
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        sns.publish(
            PhoneNumber=phone_number,
            Message=message
        )
        logger.info(f'SMS sent to {phone_number}')
        print(f'SMS sent to {phone_number}')
    except Exception as e:
        logger.error(f'Error sending SMS: {e}')
        print(f'Error sending SMS: {e}')
        raise e
    
    
def send_email_verification_code(list_emails, code):
        email_html_message = render_to_string(
            "api_authorization/email_send_verification_code.html",  
            {"code": code}, 
        )
        message = "Verification code sent successfully."
        return send_generic_email(
            list_emails, 
            email_html_message, 
            "Verification Code for Reward Points System", 
            message_response=message
        )
        

def send_email_pending_approval(points, username, first_name, last_name, list_receivers):
    email_html_message = render_to_string(
            "api_authorization/email_send_pending_approval_user.html",  
            {"username": username, "first_name": first_name, "last_name": last_name, "points": points}, 
    )
    message = "Pending approval email sent successfully."
    return send_generic_email(
        list_receivers, 
        email_html_message, 
        f"Pending Approval (user: {username}) for Reward Points System",
        message_response=message
    )
    
    
def send_generic_email(list_receivers, email_html_message, subject, sender=settings.EMAIL_HOST_USER, message_response=None):
        email_msg = EmailMessage(
            subject,
            email_html_message,
            f'New Window System <{sender}>',
            list_receivers,
        )
        email_msg.content_subtype = "html"  
        email_msg.send(fail_silently=False)
        message = message_response or "Email sent successfully."
        return JsonResponse({"message": message}, status=200)

    
def generate_verification_code():
    import random
    return str(random.randint(100000, 999999)) 


def get_rewards_points(user, description=None):
    if not user:
        raise ValueError("User is required to create initial reward points")
    data = {
        'companyName': user.company_name,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'phone': get_national_phone_number(user.phone_number) if user.phone_number else None,
        'email': user.email,
        'status': 'paid',
    }
    response = fetch_client_invoices(data)
    
    if not response or 'count' not in response or 'results' not in response:
        return None
    
    reward_points = RewardPoints.objects(user=user).first()
    
    if response.get('count', 0) > 0:
        final_invoices = []
        invoices = response.get('results', [])
        new_points = 0
        for invoice in invoices:
            inv = create_reward_invoice_instance(invoice)
            if inv and inv.payment_made > 0:
                final_invoices.append(inv)
        if final_invoices:
            total_amount_invoices = sum(inv.payment_made for inv in final_invoices)
            total_gained_points = calculate_reward_points(total_amount_invoices)
            
            if not reward_points:
                new_points = total_gained_points
                reward_points = RewardPoints(
                    user=user,
                    total_gained_points=total_gained_points,
                    total_spent_points=0,
                    total_amount_invoices=total_amount_invoices,
                    invoices=final_invoices,
                    created_time=timezone.now(),
                    last_modified_time=timezone.now()
                )
            else:
                current_cumulate_points = reward_points.total_gained_points + reward_points.total_spent_points
                new_points = total_gained_points - current_cumulate_points
                reward_points.total_gained_points += new_points
                reward_points.total_amount_invoices = total_amount_invoices
                reward_points.invoices = final_invoices
                reward_points.last_modified = timezone.now()
                
            reward_points.save()
            
            all_history = RewardPointsHistory.objects(
                reward_points=reward_points, 
                # action__in=['gained', 'assigned', 'refunded']
            ).all()
            
            history = None
            
            if new_points > 0 and not all_history:
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='gained',
                    gained_points=new_points,
                    spent_points=0,
                    description='Initial reward points created based on invoices' if not description else description,
                    info=[transform_data_to_mongo(inv) for inv in final_invoices]
                )
            elif new_points > 0:
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='gained',
                    gained_points=new_points,
                    spent_points=0,
                    description='Additional reward points created based on invoices' if not description else description,
                    info=[transform_data_to_mongo(inv) for inv in final_invoices]
                )
            elif new_points < 0:
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='substracted',
                    gained_points=0,
                    spent_points=-new_points,
                    description='Reward points substracted based on new configuration' if not description else description,
                    info=[transform_data_to_mongo(inv) for inv in final_invoices]
                )
                
                # reward_points.total_substracted_points += -new_points
                # reward_points.last_modified = timezone.now()
            
            if history:
                history.save()
            return reward_points
