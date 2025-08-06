from rest_framework.response import Response
from django.utils import timezone
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
)
from api_authorization.models import LoginUser, UserRole


import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE USER ROLE
#############################################

def create_user_role(request): 
    data = request.data
    name = data.get('name')
    description = data.get('description')
    user_reporter = data.get('userReporter')
    
    if not name:
        return Response({'error': 'Name is required'}, status=400)
    
    try:
        user_role = UserRole.objects.filter(name=name).first()
        if user_role:
            return Response({'error': 'User role already exists'}, status=400)
        
        user_role = UserRole(
            name=name,
            description=description,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        
        user_role.save()
        
        tracking_info = transform_data_to_mongo(
            user_role,
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
                action=f'create user role',
                object_id=user_role.id,
                object_type='UserRole',
                object_name=user_role.name,
                managed_data=tracking_info
            )
            
            module='user_roles'
            info=f'has created a new user role ({user_role.name})'
            info_id=user_role.id
            type='create_user_role'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            return Response({'success': 'User role created successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT USER ROLE
#############################################

def edit_user_role(request, id): 
    try:
        user_role = UserRole.objects.filter(id=id).first()
        if not user_role:
            return Response({'error': 'User role does not exist'}, status=400)
        
        data = request.data
        name = data.get('name')
        description = data.get('description')
        user_reporter = data.get('userReporter')
        
        if not name:
            return Response({'error': 'Name is required'}, status=400)
    
        check_user_role = UserRole.objects(name=name).first()
        if check_user_role and check_user_role.id != user_role.id:
            return Response({'error': 'User role already exists'}, status=400)
        
        user_role.name = name
        user_role.description = description
        user_role.last_modified_time = timezone.now()
        user_role.save()
        
        tracking_info = transform_data_to_mongo(
            user_role,
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
                action=f'update user role',
                object_id=user_role.id,
                object_type='UserRole',
                object_name=user_role.name,
                managed_data=tracking_info
            )
        
        
            module='user_roles'
            info=f'has updated a user role ({user_role.name})'
            info_id=user_role.id
            type='update_user_role'
            create_notification(module, info_id, info, type, user_reporter.username)
        
            return Response({'success': 'User role created successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# DELETE USER ROLE
#############################################

def delete_user_role(request, id): 
    try:
        user_role = UserRole.objects.filter(id=id).first()
        if not user_role:
            return Response({'error': 'User role does not exist'}, status=400)
        
        data = request.data
        user_reporter = data.get('userReporter')
        
        existing_user_with_role = LoginUser.objects(user_role=user_role).first()
        if existing_user_with_role:
            return Response({'error': f'User role {existing_user_with_role.name} is in use'}, status=400)
        
        tracking_info = transform_data_to_mongo(
            user_role,
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
                action=f'delete user role',
                object_id=user_role.id,
                object_type='UserRole',
                object_name=user_role.name,
                managed_data=tracking_info
            )
            
            module='user_roles'
            info=f'has deleted a user role ({user_role.name})'
            info_id=user_role.id
            type='delete_user_role'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            user_role.delete()
        
            return Response({'success': 'User role deleted successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE USER ROLES
#############################################

def delete_user_roles(request): 
    try:
        data = request.data
        user_reporter = data.get('userReporter')
        ids = data.get('userRoleIds')
        
        user_roles = UserRole.objects(id__in=ids)
        if not user_roles:
            return Response({'error': 'User roles not found'}, status=404)
        
        users = LoginUser.objects.all()
        
        for user_role in user_roles:
            users = [user for user in users if str(user.user_role['id']) == str(user_role.id)]
            if users:
                return Response({'error': 'User role(s) in use'}, status=400)
        
        tracking_info = [
            transform_data_to_mongo(
                user_role,
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
            ) for user_role in user_roles
        ]
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            list_names = [user_role.name for user_role in user_roles]
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(user_roles)} user roles',
                object_id=','.join([str(user_role.id) for user_role in user_roles]),
                object_type='UserRole',
                object_name=','.join(list_names),
                managed_data=tracking_info
            )
        
            module='user_roles'
            info=f'has deleted list of {len(user_roles)} user roles ({", ".join(list_names)})'
            info_id='list'
            type='delete_user_roles'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            user_roles.delete()
            
            return Response({'success': 'User roles deleted successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)