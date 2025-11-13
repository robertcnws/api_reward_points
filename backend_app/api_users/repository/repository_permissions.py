from rest_framework.response import Response
from django.utils import timezone
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
)
from api_authorization.models import LoginUser, SystemPermission


import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE PERMISSION
#############################################

def create_permission(request): 
    data = request.data
    name = data.get('name')
    description = data.get('description')
    user_reporter = data.get('userReporter')
    
    if not name:
        return Response({'error': 'Name is required'}, status=400)
    
    key = name.lower().replace(' ', '_')
    
    try:
        permission = SystemPermission.objects.filter(key=key).first()
        if permission:
            return Response({'error': 'Permission already exists'}, status=400)
        
        permission = SystemPermission(
            name=name,
            description=description,
            key=key,
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        
        permission.save()
        
        tracking_info = transform_data_to_mongo(
            permission,
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
                action=f'create system permission',
                object_id=permission.id,
                object_type='SystemPermission',
                object_name=permission.name,
                managed_data=tracking_info
            )
            
            module='permissions'
            info=f'has created a new system permission ({permission.name})'
            info_id=permission.id
            type='create_permission'
            create_notification(module, info_id, info, type, user_reporter.username)

            return Response({'success': 'System permission created successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT PERMISSION
#############################################

def edit_permission(request, id): 
    try:
        permission = SystemPermission.objects.filter(id=id).first()
        if not permission:
            return Response({'error': 'System permission does not exist'}, status=400)
        
        data = request.data
        name = data.get('name')
        description = data.get('description')
        user_reporter = data.get('userReporter')
        
        if not name:
            return Response({'error': 'Name is required'}, status=400)
        
        key = name.lower().replace(' ', '_')

        check_permission = SystemPermission.objects.filter(key=key).first()
        if check_permission and check_permission.id != permission.id:
            return Response({'error': 'System permission already exists'}, status=400)

        permission.name = name
        permission.description = description
        permission.last_modified_time = timezone.now()
        permission.save()
        
        tracking_info = transform_data_to_mongo(
            permission,
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
                action=f'update system permission',
                object_id=permission.id,
                object_type='SystemPermission',
                object_name=permission.name,
                managed_data=tracking_info
            )
        
        
            module='permissions'
            info=f'has updated a system permission ({permission.name})'
            info_id=permission.id
            type='update_permission'
            create_notification(module, info_id, info, type, user_reporter.username)

            return Response({'success': 'System permission updated successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# DELETE PERMISSION
#############################################

def delete_permission(request, id): 
    try:
        permission = SystemPermission.objects.filter(id=id).first()
        if not permission:
            return Response({'error': 'System permission does not exist'}, status=400)
        
        data = request.data
        user_reporter = data.get('userReporter')
        
        in_use_qs = LoginUser.objects(customerportal_permissions__in=[permission])
        if in_use_qs.count() > 0:
            sample = [u.username for u in in_use_qs.only('username').limit(5)]
            return Response({
                'error': f'Permission "{permission.name}" is used by {in_use_qs.count()} user(s).',
                'users_sample': sample
            }, status=409)

        tracking_info = transform_data_to_mongo(
            permission,
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
                action=f'delete system permission',
                object_id=permission.id,
                object_type='SystemPermission',
                object_name=permission.name,
                managed_data=tracking_info
            )
            
            module='permissions'
            info=f'has deleted a system permission ({permission.name})'
            info_id=permission.id
            type='delete_permission'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            permission.delete()

            return Response({'success': 'System permission deleted successfully'}, status=200)

        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE PERMISSIONS
#############################################

def delete_permissions(request): 
    try:
        data = request.data
        user_reporter = data.get('userReporter')
        ids = data.get('customerportalPermissionIds')
        
        permissions = SystemPermission.objects(id__in=ids)
        if not permissions:
            return Response({'error': 'System permissions not found'}, status=404)
        
        by_id = {str(p.id): p for p in permissions}
        
        users_qs = LoginUser.objects(
            customerportal_permissions__in=permissions
        ).only('username', 'customerportal_permissions')

        if users_qs.count() > 0:
            perms_in_use = set()
            users_sample = []
            for u in users_qs.limit(10):  
                users_sample.append(u.username)
                if u.customerportal_permissions:
                    for perm in u.customerportal_permissions:
                        if perm in permissions:
                            perms_in_use.add(str(perm.id))

            blocked = [{
                "id": pid,
                "name": by_id[pid].name if pid in by_id else pid
            } for pid in perms_in_use]

            return Response({
                "error": "Some permissions are in use by users.",
                "blocked_permissions": blocked,
                "users_sample": users_sample,
                "users_count": users_qs.count(),
            }, status=409)
        
        tracking_info = [
            transform_data_to_mongo(
                permission,
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
            ) for permission in permissions
        ]
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            list_names = [permission.name for permission in permissions]
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(permissions)} system permissions',
                object_id=','.join([str(permission.id) for permission in permissions]),
                object_type='SystemPermission',
                object_name=','.join(list_names),
                managed_data=tracking_info
            )
        
            module='permissions'
            info=f'has deleted list of {len(permissions)} system permissions ({", ".join(list_names)})'
            info_id='list'
            type='delete_permissions'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            permissions.delete()

            return Response({'success': 'System permissions deleted successfully'}, status=200)

        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)