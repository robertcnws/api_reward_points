from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY
from django.http import Http404, JsonResponse
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from datetime import datetime, timedelta, timezone as dt_timezone
from bson.objectid import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import LoginUser, LoginUserVerificationCode, UserRole
from api_reward_points.models import Tracking, RewardPoints, RewardPointsHistory
from api_integration.views import fetch_client_invoices
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import MyTokenObtainPairSerializer, RevocationCheckTokenRefreshSerializer
from utils.data_util import transform_data_to_mongo, get_national_phone_number, calculate_reward_points
from utils.model_util import create_reward_invoice_instance
import json
import logging
import boto3

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


####################################
# TOKEN AUTHENTICATION VIEW
####################################

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    

####################################
# TOKEN REFRESH VIEW
####################################

class MyTokenRefreshView(TokenRefreshView):
    serializer_class = RevocationCheckTokenRefreshSerializer


# HEALTH CHECK VIEW

@csrf_exempt
def health_check(request):
    return JsonResponse({'status': 'ok'})


@csrf_exempt
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


@csrf_exempt
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
                
                    
                tracking = Tracking(
                    user_reporter=current_user,
                    action='login',
                    created_time=timezone.now(),
                    managed_data={
                        'data': 'User logged in successfully',
                    }
                )
                tracking.save()
                
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


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
        tracking = Tracking(
            user_reporter=current_user,
            action='logout',
            created_time=timezone.now(),
            managed_data={
                'data': 'User logged out successfully',
            }
        )
        tracking.save()
        return JsonResponse({'data': 'User logged out'}, status=200)
    return JsonResponse({'error': 'User not logged in', 'description': 'User not logged in'}, status=400)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
            email = user.email
            # send_email_verification_code(email, code)
            logger.info(f'Email sent to {email} with code {code}')
            print(f'Email sent to {email} with code {code}')
            
            # tracking_info = transform_data_to_mongo(user, exclude_fields=['password'])
            
            tracking = Tracking(
                user_reporter=user,
                action='register',
                created_time=timezone.now(),
                managed_data={
                    'data': 'User registered successfully',
                }
            )
            tracking.save()
            
            return JsonResponse({'data': {'username': user.username}}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
            tracking = Tracking(
                user_reporter=user,
                action='verify_user',
                created_time=timezone.now(),
                managed_data={
                    'data': 'User verified successfully',
                }
            )
            tracking.save()
            return JsonResponse({'data': 'User verified successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON', 'description': 'Request is not in a valid format'}, status=400)
    return JsonResponse({'error': 'Method not allowed', 'description': 'Method not allowed'}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
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
            # send_email_verification_code(email, code)
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
    
    
def send_email_verification_code(email, code):
        email_html_message = render_to_string(
            "api_authorization/email_send_verification_code.html",  
            {"code": code}, 
        )
        message = "Verification code sent successfully."
        return send_generic_email(
            [email], 
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


def get_rewards_points(user):
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
    
    if response.get('count', 0) > 0:
        final_invoices = []
        invoices = response.get('results', [])
        for invoice in invoices:
            inv = create_reward_invoice_instance(invoice)
            if inv and inv.payment_made > 0:
                final_invoices.append(inv)
        if final_invoices:
            total_amount_invoices = sum(inv.payment_made for inv in final_invoices)
            total_gained_points = calculate_reward_points(total_amount_invoices)
            reward_points = RewardPoints.objects(user=user).first()
            if not reward_points:
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
                reward_points.total_gained_points = total_gained_points
                reward_points.total_amount_invoices = total_amount_invoices
                reward_points.invoices = final_invoices
                reward_points.last_modified = timezone.now()
                
            reward_points.save()
            
            all_history = RewardPointsHistory.objects(
                reward_points=reward_points, 
                action='gained'
            ).only('gained_points')
            
            total_history_gained = sum(history.gained_points for history in all_history)
            
            if total_history_gained == 0:
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='gained',
                    gained_points=total_gained_points,
                    spent_points=0,
                    description='Initial reward points created based on invoices',
                    info=[transform_data_to_mongo(inv) for inv in final_invoices]
                )
            else:
                new_points_gained = total_gained_points - total_history_gained
                if new_points_gained <= 0:
                    return reward_points
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='gained',
                    gained_points=total_gained_points - total_history_gained,
                    spent_points=0,
                    description='Additional reward points created based on invoices',
                    info=[transform_data_to_mongo(inv) for inv in final_invoices]
                )
            history.save()
            return reward_points