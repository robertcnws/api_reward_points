from rest_framework.response import Response
from django.utils import timezone
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
)
from api_authorization.models import LoginUser, Functionality, UserRole


import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE FUNCTIONALITY
#############################################

def create_functionality(request): 
    data = request.data
    name = data.get('name')
    description = data.get('description')
    link = data.get('link')
    user_reporter = data.get('userReporter')
    is_active = data.get('isActive', True)
    roles_allowed = data.get('rolesAllowed', [])
    
    if not name:
        return Response({'error': 'Name is required'}, status=400)
    
    key = name.lower().replace(' ', '_')
    
    try:
        functionality = Functionality.objects.filter(key=key).first()
        if functionality:
            return Response({'error': 'Functionality already exists'}, status=400)
        
        obj_roles_allowed = UserRole.objects(id__in=roles_allowed)
        
        functionality = Functionality(
            name=name,
            description=description,
            link=link,
            key=key,
            is_active=is_active,
            roles_allowed=list(obj_roles_allowed),
            created_time=timezone.now(),
            last_modified_time=timezone.now(),
        )
        
        functionality.save()
        
        tracking_info = transform_data_to_mongo(
            functionality,
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
                action=f'create system functionality',
                object_id=functionality.id,
                object_type='Functionality',
                object_name=functionality.name,
                managed_data=tracking_info
            )
            
            module='functionalities'
            info=f'has created a new system functionality ({functionality.name})'
            info_id=functionality.id
            type='create_functionality'
            create_notification(module, info_id, info, type, user_reporter.username)

            return Response({'success': 'System functionality created successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# EDIT FUNCTIONALITY
#############################################

def edit_functionality(request, id): 
    try:
        functionality = Functionality.objects.filter(id=id).first()
        if not functionality:
            return Response({'error': 'System functionality does not exist'}, status=400)
        
        data = request.data
        name = data.get('name')
        link = data.get('link')
        description = data.get('description')
        is_active = data.get('isActive', True)
        roles_allowed = data.get('rolesAllowed', [])
        obj_roles_allowed = UserRole.objects(id__in=roles_allowed)
        user_reporter = data.get('userReporter')
        
        if not name:
            return Response({'error': 'Name is required'}, status=400)
        
        key = name.lower().replace(' ', '_')

        check_functionality = Functionality.objects.filter(key=key).first()
        if check_functionality and check_functionality.id != functionality.id:
            return Response({'error': 'System functionality already exists'}, status=400)
        functionality.name = name
        functionality.description = description
        functionality.link = link
        functionality.is_active = is_active
        functionality.roles_allowed = list(obj_roles_allowed)
        functionality.last_modified_time = timezone.now()
        functionality.save()
        
        tracking_info = transform_data_to_mongo(
            functionality,
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
                action=f'update system functionality',
                object_id=functionality.id,
                object_type='Functionality',
                object_name=functionality.name,
                managed_data=tracking_info
            )
        
        
            module='functionalities'
            info=f'has updated a system functionality ({functionality.name})'
            info_id=functionality.id
            type='update_functionality'
            create_notification(module, info_id, info, type, user_reporter.username)

            return Response({'success': 'System functionality updated successfully'}, status=200)
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    

#############################################
# DELETE FUNCTIONALITY
#############################################

def delete_functionality(request, id): 
    try:
        functionality = Functionality.objects.filter(id=id).first()
        if not functionality:
            return Response({'error': 'System functionality does not exist'}, status=400)
        
        data = request.data
        user_reporter = data.get('userReporter')

        tracking_info = transform_data_to_mongo(
            functionality,
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
                action=f'delete system functionality',
                object_id=functionality.id,
                object_type='Functionality',
                object_name=functionality.name,
                managed_data=tracking_info
            )
            
            module='functionalities'
            info=f'has deleted a system functionality ({functionality.name})'
            info_id=functionality.id
            type='delete_functionality'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            functionality.delete()

            return Response({'success': 'System functionality deleted successfully'}, status=200)

        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE FUNCTIONALITIES
#############################################

def delete_functionalities(request): 
    try:
        data = request.data
        user_reporter = data.get('userReporter')
        ids = data.get('functionalityIds')
        
        functionalities = Functionality.objects(id__in=ids)
        if not functionalities:
            return Response({'error': 'System functionalities not found'}, status=404)
        
        tracking_info = [
            transform_data_to_mongo(
                functionality,
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
            ) for functionality in functionalities
        ]
        
        user_reporter = LoginUser.objects.filter(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            list_names = [functionality.name for functionality in functionalities]
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(functionalities)} system functionalities',
                object_id=','.join([str(functionality.id) for functionality in functionalities]),
                object_type='Functionality',
                object_name=','.join(list_names),
                managed_data=tracking_info
            )
        
            module='functionalities'
            info=f'has deleted list of {len(functionalities)} system functionalities ({", ".join(list_names)})'
            info_id='list'
            type='delete_functionalities'
            create_notification(module, info_id, info, type, user_reporter['username'])
            
            functionalities.delete()

            return Response({'success': 'System functionalities deleted successfully'}, status=200)

        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)