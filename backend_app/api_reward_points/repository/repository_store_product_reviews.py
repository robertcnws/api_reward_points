from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProduct,
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
# CREATE STORE PRODUCT REVIEW
#############################################

def create_store_product_review(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            store_product = RewardStoreProduct.objects(id=id).first()
            if not store_product:
                logger.error("Store product not found")
                return Response({'error': 'Store product not found'}, status=404)            
            
            rating = data.get('rating', 0)
            
            comment = data.get('comment', '')
            
            review = RewardStoreProductReview(
                store_product=store_product,
                user=user_reporter,
                rating=rating,
                comment=comment,
                created_time=to_aware(timezone.now()),
                last_modified_time=to_aware(timezone.now()),
            )
            
            review.save()
            
            tracking_info = transform_data_to_mongo(
                review, 
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
                action=f'create store product review',
                object_id=review.id,
                object_type='RewardStoreProductReview',
                object_name=review.comment,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_product_reviews'
            info=f'has made new review ({review.comment.capitalize()}) on product {store_product.name}'
            info_id=review.id
            type='create_store_product_review'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product review created successfully',
                'data': json.loads(review.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE STORE PRODUCT REVIEW
#############################################

def delete_store_product_review(request, id):
    user_reporter = json.loads(request.data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            review = RewardStoreProductReview.objects(id=id).first()
            if not review:
                logger.error("Store product review not found")
                return Response({'error': 'Store product review not found'}, status=404)
            
            tracking_info = transform_data_to_mongo(
                review, 
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
                action=f'delete store product review',
                object_id=review.id,
                object_type='RewardStoreProductReview',
                object_name=review.comment,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_product_reviews'
            info=f'has deleted review ({review.comment.capitalize()}) on product {review.store_product.name}'
            info_id=review.id
            type='delete_store_product_review'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            reactions = RewardStoreProductReviewReaction.objects(store_product_review=review).all()
            if reactions:
                for reaction in reactions:
                    react = RewardStoreProductReviewReaction.objects(id=reaction.id).first()
                    if react:
                        react.delete()
            
            review.delete()
                        
            return Response({
                'message': 'Store product review deleted successfully',
            }, status=204)
        
        except Exception as e:
            logger.error(f"Error deleting store product review: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404) 