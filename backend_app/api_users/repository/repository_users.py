from rest_framework.response import Response
from django.utils import timezone
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
)
from api_authorization.models import LoginUser, UserRole


from api_users.repo_util.users_util import inherit_from_unapproved_user
import logging
import json

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    
    
#############################################
# CREATE USER
#############################################

def create_user(request): 
    data = request.data
    company_name = data.get('companyName', 'NWS') 
    username = data.get('username')
    email = data.get('email')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    phone_number = data.get('phoneNumber')
    role = data.get('role')
    password = data.get('password')
    user_reporter = data.get('userReporter')
    avatar_url = data.get('avatarUrl', '')
    
    try:
        user = LoginUser.objects.filter(username=username).first()
        if user:
            return Response({'error': 'User already exists'}, status=400)
        
        role = UserRole.objects.filter(id=role).first()
        if not role:
            return Response({'error': 'Role does not exist'}, status=400)
        
        user = LoginUser(
            company_name=company_name,
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_role=role,
            is_active=True,
            is_verified=True,
            is_approved=True,
            avatar_url=avatar_url,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
            approved_time=timezone.now(),
            disapproval_count=0,
        )
        
        user.set_password(password)
        user.save()
        
        tracking_info = transform_data_to_mongo(
            user, 
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
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create user',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has created a new user ({user.username})'
            info_id=user.id
            type='create_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            return Response({'success': 'User created successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT USER
#############################################

def edit_user(request, id): 
    try:
        user = LoginUser.objects.filter(id=id).first()
        if not user:
            return Response({'error': 'User does not exist'}, status=400)
        
        data = request.data
        company_name = data.get('companyName', 'NWS')
        username = data.get('username')
        email = data.get('email')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        phone_number = data.get('phoneNumber')
        role = data.get('role')
        password = data.get('password')
        user_reporter = data.get('userReporter')
        status = data.get('status', 'active')
    
    
        check_user = LoginUser.objects.filter(username=username).first()
        if check_user and check_user.id != user.id:
            return Response({'error': 'User already exists'}, status=400)
        
        role = UserRole.objects.filter(id=role).first()
        if not role:
            return Response({'error': 'Role does not exist'}, status=400)
        
        user.username = username if username else user.username
        user.company_name = company_name if company_name else user.company_name
        user.email = email if email else user.email
        user.first_name = first_name if first_name else user.first_name
        user.last_name = last_name if last_name else user.last_name
        user.phone_number = phone_number if phone_number else user.phone_number
        user.user_role = role if role else user.user_role
        user.is_active = True if status == 'active' else False
        user.last_modified_time = timezone.now()
        if password:
            user.set_password(password)
        user.save()
        
        tracking_info = transform_data_to_mongo(
            user, 
            exclude_fields=[
                'password', 
                'is_staff',
                'is_verified', 
                'last_login', 
                'date_joined',
                'last_modified_time', 
                'created_time'
            ]
        )
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'update user',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has updated a user ({user.username})'
            info_id=user.id
            type='update_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            return Response({'success': 'User updated successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# CHANGE PASSWORD
#############################################

def change_password(request, id):
    data = request.data
    same_user = data.get('isSameUser')
    current_password = data.get('password')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')
    
    try:
        user = LoginUser.objects(id=id).first()
    except LoginUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if same_user == 'same' and not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)
    
    if new_password != confirm_password:
        return Response({'error': 'New password and confirm password must match'}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    tracking_info = transform_data_to_mongo(
        user, 
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
    
    if user:
        
        create_tracking(
            user_reporter=user,
            action=f'change password',
            object_id=user.id,
            object_type='LoginUser',
            object_name=user.username,
            managed_data=tracking_info
        )
    
        return Response({'message': 'Password updated successfully'}, status=200)
    
    return Response({'error': 'User not found'}, status=404)


#############################################
# DELETE USER
#############################################

def delete_user(request, id):
    data = request.data
    user_reporter = data.get('userReporter')
    try:
        user = LoginUser.objects(id=id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)
        
        if user.username == user_reporter['username']:
            return Response({'error': 'You cannot delete your own account'}, status=400)
        
        tracking_info = transform_data_to_mongo(
            user, 
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
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete user',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has deleted a user ({user.username})'
            info_id=user.id
            type='delete_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
                
            user.delete()
            
            return Response({'message': 'User deleted successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except LoginUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        
#############################################
# DELETE USERS
#############################################

def delete_users(request):
    data = request.data
    user_reporter = data.get('userReporter')
    ids = data.get('userIds')
    try:
        users = LoginUser.objects(id__in=ids)
        if not users:
            return Response({'error': 'Users not found'}, status=404)
        
        users = [user for user in users if user.username != user_reporter['username']] 
        if not users:
            return Response({'error': 'You cannot delete your own account'}, status=400)
        
        tracking_info = [
            transform_data_to_mongo(
                user, 
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
            ) for user in users
        ]
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(users)} users',
                object_id=','.join([str(user.id) for user in users]),
                object_type='LoginUser',
                object_name=','.join([user.username for user in users]),
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has deleted {len(users)} users'
            info_id='list'
            type='delete_users'
            create_notification(module, info_id, info, type, user_reporter['username'])
                
            for user in users:
                user.delete()
            
            return Response({'message': 'Users deleted successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except LoginUser.DoesNotExist:
            return Response({'error': 'Users not found'}, status=404)
        
#############################################
# CHANGE APPROVAL USER
#############################################

def change_approval_user(request, id):
    data = request.data
    user_reporter = data.get('userReporter')
    try:
        user = LoginUser.objects(id=id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        approval_status = user.is_approved
        disapproval_count = user.disapproval_count

        company_name = user.company_name
        if company_name:
            if not user.is_approved: 
                user_exists_company = LoginUser.objects(company_name=company_name, is_approved=True).first()
                if user_exists_company:
                    return Response({
                            'error': 'User cannot be approved because company already exists and is active', 
                            'description': 'User cannot be approved because company already exists and is active', 
                            'error_name': 'company_exists',
                            'error_mail': None
                    }, status=400)
            else:
                users_exists_company = LoginUser.objects(
                    company_name=company_name, 
                    is_approved=False,
                    id__ne=user.id
                ).first()
                if users_exists_company:
                    
                    inherit_from_unapproved_user(user_exists_company, user)
        
        user.is_approved = not user.is_approved
        if not approval_status and disapproval_count == 0:
            user.approved_time = timezone.now()
        if approval_status:
            disapproval_count += 1
            user.disapproval_count = disapproval_count
        user.save()
        
        tracking_info = transform_data_to_mongo(
            user, 
            include_fields=['is_approved', 'username', 'id']
        )
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'change to {"approved" if user.is_approved else "NOT approved"}',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has change approval user ({user.username}) to {"approved" if user.is_approved else "not approved"}'
            info_id=user.id
            type='change_approval_user'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            return Response({'message': 'User approval change successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except LoginUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        
#############################################
# CHANGE VERIFY USER
#############################################

def change_verify_user(request, id):
    data = request.data
    user_reporter = data.get('userReporter')
    try:
        user = LoginUser.objects(id=id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        user.is_verified = not user.is_verified
        user.save()
        
        tracking_info = transform_data_to_mongo(
            user, 
            include_fields=['is_verified', 'username', 'id']
        )
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'change to {"verified" if user.is_verified else "NOT verified"}',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has change verify user ({user.username}) to {"verified" if user.is_verified else "not verified"}'
            info_id=user.id
            type='change_verify_user'
            create_notification(module, info_id, info, type, user_reporter['username'])

            return Response({'message': 'User verify change successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except LoginUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        
#############################################
# CHANGE SHOW TOUR GUIDE USER
#############################################

def change_show_tour_guide_user(request, id):
    data = request.data
    user_reporter = json.loads(data.get('userReporter'))
    try:
        user = LoginUser.objects(id=id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        user.show_tour_guide_modal = not user.show_tour_guide_modal
        user.save()
        
        tracking_info = transform_data_to_mongo(
            user,
            include_fields=['show_tour_guide_modal', 'username', 'id']
        )

        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None

        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'change to {"show" if user.show_tour_guide_modal else "NOT show"}',
                object_id=user.id,
                object_type='LoginUser',
                object_name=user.username,
                managed_data=tracking_info
            )
                
            module='users'
            info=f'has change show tour guide user ({user.username}) to {"show" if user.show_tour_guide_modal else "not show"}'
            info_id=user.id
            type='change_show_tour_guide_user'
            create_notification(module, info_id, info, type, user_reporter['username'])

            return Response({'message': 'User show tour guide change successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except LoginUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)