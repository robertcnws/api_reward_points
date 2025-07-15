from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser, UserRole
from api_authorization.views import get_rewards_points
from api_reward_points.models import (
     RewardPoints,
     RewardPointsHistory,
)
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
    to_aware
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
    

#############################################
# MANAGE POINTS
#############################################

def manage_points(request, user_id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))

    user = LoginUser.objects(id=user_id).first()
    if not user:
        logger.error("User not found")
        return Response({'error': 'User not found'}, status=404)

    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            reward_points = RewardPoints.objects(user=user).first()
            if not reward_points:
                # logger.error("Reward points not found for the user")
                # return Response({'error': 'Reward points not found for the user'}, status=404)
                reward_points = RewardPoints(
                    user=user,
                    total_assigned_points=0.0,
                    total_spent_points=0.0,
                    total_gained_points=0.0,
                    total_substracted_points=0.0,
                    total_refunded_points=0.0,
                    total_amount_invoices=0.0,
                    invoices=[],
                    created_time=to_aware(timezone.now()),
                    last_modified_time=to_aware(timezone.now())
                )
                reward_points.save()
            
            new_assigned_points = data.get('newAssignedPoints', 0.0)
            new_spent_points = data.get('newSpentPoints', 0.0)
            
            points_to_add = new_assigned_points - new_spent_points
            
            current_assigned_points = reward_points.total_assigned_points or 0.0
            
            current_gained_points = reward_points.total_gained_points or 0.0
            
            current_substracted_points = reward_points.total_substracted_points or 0.0
            
            total_current_points = current_assigned_points + current_gained_points - current_substracted_points + points_to_add

            if total_current_points < 0:
                logger.error("Insufficient points available")
                return Response({'error': 'Insufficient points available'}, status=400)

            reward_points.total_assigned_points += new_assigned_points
            reward_points.total_substracted_points += new_spent_points
            reward_points.last_modified_time = to_aware(timezone.now())
            reward_points.save()
    
            tracking_info = transform_data_to_mongo(
                reward_points, 
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
            
            if new_assigned_points > 0:
                history = RewardPointsHistory(
                    created_time=to_aware(timezone.now()),
                    reward_points=reward_points,
                    action='assigned',
                    gained_points=new_assigned_points,
                    spent_points=0,
                    description=f'Assigned {new_assigned_points} points by {user_reporter.username} to user {user.username}',
                    info=tracking_info
                )
                history.save()
                
            if new_spent_points > 0:
                history = RewardPointsHistory(
                    created_time=to_aware(timezone.now()),
                    reward_points=reward_points,
                    action='substracted',
                    gained_points=0,
                    spent_points=new_spent_points,
                    description=f'Substracted {new_spent_points} points by {user_reporter.username} for user {user.username}',
                    info=tracking_info
                )
                history.save()
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'Managed points for user {user.username}',
                object_id=reward_points.id,
                object_type='RewardPoints',
                object_name=f'Manage Reward Points for {user.username}',
                managed_data={
                    'data': tracking_info
                }
            )
            
            if new_assigned_points > 0 and new_spent_points > 0:
                description = f'has updated reward points for user {user.username} with new assigned points {new_assigned_points} and new spent points {new_spent_points}'
            elif new_assigned_points > 0:
                description = f'has updated reward points for user {user.username} with new assigned points {new_assigned_points}'
            elif new_spent_points > 0:
                description = f'has updated reward points for user {user.username} with new spent points {new_spent_points}'

            module='reward_points'
            info=description
            info_id=reward_points.id
            type='manage_reward_points'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Reward points updated successfully',
                'data': json.loads(reward_points.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error updating reward points: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)

