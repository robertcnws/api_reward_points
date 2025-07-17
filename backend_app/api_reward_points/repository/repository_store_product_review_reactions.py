from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProductReview,
     RewardStoreProductReviewReaction,
)
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
    to_aware,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE STORE PRODUCT REVIEW REACTION
#############################################

def manage_store_product_review_reaction(request, review_id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:

            review = RewardStoreProductReview.objects(id=review_id).first()
            if not review:
                logger.error("Store product review not found")
                return Response({'error': 'Store product review not found'}, status=404)

            reaction_type = data.get('reactionType', None)
            if not reaction_type:
                logger.error("Reaction type is required")
                return Response({'error': 'Reaction type is required'}, status=400)
            
            reaction = RewardStoreProductReviewReaction.objects(
                store_product_review=review,
                user=user_reporter,
            ).first()

            if reaction:
                reaction.reaction_type = reaction_type
                reaction.last_modified_time = to_aware(timezone.now())
                reaction.save()
            else:
                reaction = RewardStoreProductReviewReaction(
                    store_product_review=review,
                    user=user_reporter,
                    reaction_type=reaction_type,
                    created_time=to_aware(timezone.now()),
                    last_modified_time=to_aware(timezone.now()),
            )

            reaction.save()

            tracking_info = transform_data_to_mongo(
                reaction, 
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
                action=f'create store product review reaction',
                object_id=reaction.id,
                object_type='RewardStoreProductReviewReaction',
                object_name=reaction.reaction_type,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_product_review_reactions'
            info=f'has made new reaction ({reaction.reaction_type.capitalize()}) on product {review.store_product.name} review by {review.user.username}'
            info_id=reaction.id
            type='create_store_product_review_reaction'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product review reaction created successfully',
                'data': json.loads(reaction.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product review reaction: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)