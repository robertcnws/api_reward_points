from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser, UserRole
from api_authorization.views import get_rewards_points
from api_reward_points.models import (
     RewardPointsSettings,
)
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    

#############################################
# UPDATE POINTS SETTINGS
#############################################

def update_points_settings(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    points = RewardPointsSettings.objects(id=id).first()
    if not points:
        return Response({'error': 'Points setting not found'}, status=404)
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            amount = data.get('amount', 0.0)
            points_value = data.get('points', 0)
            description = data.get('description', '')
            
            points.amount = amount
            points.points = points_value
            points.description = description
            points.last_modified_time = timezone.now()
            
            points.save()
            
            description = points.description or f'Update Points Settings {points.amount} - {points.points}'
            update_reward_points_in_users(description=description)
            
            tracking_info = transform_data_to_mongo(
                points, 
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'update points settings',
                object_id=points.id,
                object_type='RewardPointsSettings',
                object_name=points.description or f'Points Settings {points.amount} - {points.points}',
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='points_settings'
            info=f'has updated points settings ({points.description or f"Points Settings {points.amount} - {points.points}"})'
            info_id=points.id
            type='update_points_settings'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Points settings updated successfully',
                'data': json.loads(points.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error updating points settings: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# CREATE POINTS SETTINGS
#############################################

def create_points_settings(request):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            amount = data.get('amount', 0.0)
            points = data.get('points', 0)
            description = data.get('description', '')
            
            points = RewardPointsSettings(
                amount=amount,
                points=points,
                description=description,
                created_time=timezone.now(),
                last_modified_time=timezone.now()
            )
            
            points.save()
            
            description = points.description or f'New Points Settings {points.amount} - {points.points}'
            update_reward_points_in_users(description=description)
            
            tracking_info = transform_data_to_mongo(
                points, 
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create points settings',
                object_id=points.id,
                object_type='RewardPointsSettings',
                object_name=points.description or f'Points Settings {points.amount} - {points.points}',
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='points_settings'
            info=f'has created new points settings ({points.description or f"Points Settings {points.amount} - {points.points}"})'
            info_id=points.id
            type='create_points_settings'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Points settings created successfully',
                'data': json.loads(points.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating points settings: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE POINTS SETTINGS
#############################################

def delete_points_settings(request, id):
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    points = RewardPointsSettings.objects(id=id).first()
    if not points:
        return Response({'error': 'Points settings not found'}, status=404)
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            tracking_info = transform_data_to_mongo(
                points, 
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete points settings',
                object_id=points.id,
                object_type='RewardPointsSettings',
                object_name=points.description or f'Points Settings {points.amount} - {points.points}',
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='points_settings'
            info=f'has deleted a points settings ({points.description or f"Points Settings {points.amount} - {points.points}"})'
            info_id=points.id
            type='delete_points_settings'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            description = points.description or f'Delete Points Settings {points.amount} - {points.points}'
            
            points.delete()
            
            update_reward_points_in_users(description=description)
                        
            return Response({'message': 'Points settings deleted successfully'}, status=200)
        
        except Exception as e:
            logger.error(f"Error deleting points settings: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE LIST OF POINTS SETTINGS
#############################################

def delete_list_points_settings(request):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    ids = data.get('ids', [])
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        
        list_tracking_info = []
        list_names = []
        
        try:
            for point_id in ids:
                points = RewardPointsSettings.objects(id=point_id).first()
                if not points:
                    continue
                
                list_names.append(points.description or f'Points Settings {points.amount} - {points.points}')
                
                tracking_info = transform_data_to_mongo(
                    points, 
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
                        
                list_tracking_info.append(tracking_info)
                
                points.delete()
                
            description = points.description or f'Delete list of Points Settings {", ".join(list_names)}'
            update_reward_points_in_users(description=description)
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(list_names)} points settings',
                object_id=",".join(ids),
                object_type='RewardPointsSettings',
                object_name=','.join(list_names),
                managed_data={
                    'data': list_tracking_info,
                }
            )
                                
            module='points_settings'
            info=f'has deleted list of {len(list_names)} points settings ({", ".join(list_names)})'
            info_id='list'
            type='delete_points_settings_list'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({'message': 'Points settings deleted successfully'}, status=200)
        
        except Exception as e:
            logger.error(f"Error deleting list of points settings: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


# #############################################
# # UPDATE REwARD POINTS IN USERS
# #############################################

def update_reward_points_in_users(description=None):
    roleClient = UserRole.objects(name='client').first()
    if roleClient:
        users = LoginUser.objects(user_role=roleClient, is_active=True, is_verified=True).all()
        if users:
            for user in users:
                get_rewards_points(user, description=description)