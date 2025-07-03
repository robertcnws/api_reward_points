from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProduct,
     RewardStoreProductSelection,
     RewardStoreProductSelectionCart,
     RewardStoreProductSelectionBuy,
     RewardPoints,
     RewardPointsHistory,
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
# CREATE STORE PRODUCT SELECTION CART
#############################################

def create_store_product_selection_cart(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:

            store_product = RewardStoreProduct.objects(id=id).first()
            if not store_product:
                return Response({'error': 'Store product not found'}, status=404)

            quantity = data.get('quantity', None)
            if not quantity:
                return Response({'error': 'Quantity is required'}, status=400)

            selection = RewardStoreProductSelection(
                store_product=store_product,
                user=user_reporter,
                quantity=quantity,
                created_time=to_aware(timezone.now()),
                last_modified_time=to_aware(timezone.now()),
            )
            selection.save()
            
            cart = RewardStoreProductSelectionCart(
                store_product_selection=selection,
                is_bought=False,
                created_time=to_aware(timezone.now()),
                last_modified_time=to_aware(timezone.now()),
            )
            cart.save()

            tracking_info = transform_data_to_mongo(
                cart, 
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
                action=f'create store product selection cart',
                object_id=cart.id,
                object_type='RewardStoreProductSelectionCart',
                object_name=cart.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )

            module='store_product_selection_carts'
            info=f'has created new store product selection cart ({cart.id})'
            info_id=cart.id
            type='create_store_product_selection_cart'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product selection cart created successfully',
                'data': json.loads(cart.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product selection cart: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE STORE PRODUCT SELECTION CART
#############################################

def delete_store_product_selection_cart(request, id):
    try:
        data = request.data
    
        user_reporter = json.loads(data.get('userReporter', None))
        
        user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
        
        if not user_reporter:
            return Response({'error': 'User reporter not found'}, status=404)
        
        cart = RewardStoreProductSelectionCart.objects(id=id).first()
        if not cart:
            return Response({'error': 'Store product selection cart not found'}, status=404)
        
        selection_id = cart.store_product_selection.id
        selection = RewardStoreProductSelection.objects(id=selection_id).first()    
        if not selection:
            return Response({'error': 'Store product selection not found'}, status=404)
        
        tracking_info = transform_data_to_mongo(
            cart, 
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
            action=f'delete store product selection cart',
            object_id=cart.id,
            object_type='RewardStoreProductSelectionCart',
            object_name=cart.store_product_selection.store_product.name,
            managed_data={
                'data': tracking_info
            }
        )
        
        create_notification(
            module='store_product_selection_carts',
            info_id=cart.id,
            info=f'has deleted store product selection cart ({cart.id})',
            type='delete_store_product_selection_cart',
            username=user_reporter.username
        )

        cart.delete()
        selection.delete()
        
        
        return Response(status=204)

    except Exception as e:
        logger.error(f"Error deleting store product selection cart: {str(e)}")
        return Response({'error': str(e)}, status=500)
    

#############################################
# DELETE ALL STORE PRODUCT SELECTION CART
#############################################

def delete_all_store_product_selection_carts(request):
    try:
        data = request.data
    
        user_reporter = json.loads(data.get('userReporter', None))
        
        user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
        
        if not user_reporter:
            return Response({'error': 'User reporter not found'}, status=404)
        
        selections = RewardStoreProductSelection.objects(user=user_reporter).all()
        if not selections:
            return Response({'error': 'No store product selections found for the user'}, status=404)

        carts = RewardStoreProductSelectionCart.objects(
            store_product_selection__in=selections, 
            is_bought=False
        ).all()
        if not carts:
            return Response({'error': 'No store product selection carts found for the user'}, status=404)
        
        tracking_info = transform_data_to_mongo(
            carts, 
            exclude_fields=[
                'password', 
                'is_staff', 
                'is_active', 
                'is_verified', 
                'last_login', 
                'date_joined',
                'last_modified_time', 
                'created_time',
                'description',
                'attachments',
            ]
        )
        
        create_tracking(
            user_reporter=user_reporter,
            action=f'delete store product selection cart',
            object_id=",".join([str(cart.id) for cart in carts]),
            object_type='RewardStoreProductSelectionCart',
            object_name=','.join([cart.store_product_selection.store_product.name for cart in carts]),
            managed_data={
                'data': tracking_info
            }
        )
        
        create_notification(
            module='store_product_selection_carts',
            info_id='list',
            info=f'has deleted a list of {len(carts)} store product selection carts for user {user_reporter.username}',
            type='delete_store_product_selection_cart',
            username=user_reporter.username
        )
        
        new_selections = [s for s in selections if str(s.id) in [str(c.store_product_selection.id) for c in carts]]

        for cart in carts:
            cart.delete()
        for selection in new_selections:
            selection.delete()

        return Response(status=204)

    except Exception as e:
        logger.error(f"Error deleting store product selection carts: {str(e)}")
        return Response({'error': str(e)}, status=500)
    

#############################################
# CREATE STORE PRODUCT SELECTION BUY
#############################################

def create_store_product_selection_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                return Response({'error': 'Reward points not found for the user'}, status=404)

            store_product = RewardStoreProduct.objects(id=id).first()
            if not store_product:
                return Response({'error': 'Store product not found'}, status=404)

            quantity = data.get('quantity', None)
            if not quantity:
                return Response({'error': 'Quantity is required'}, status=400)

            selection = RewardStoreProductSelection(
                store_product=store_product,
                user=user_reporter,
                quantity=quantity,
                created_time=to_aware(timezone.now()),
                last_modified_time=to_aware(timezone.now()),
            )
            selection.save()

            buy = RewardStoreProductSelectionBuy(
                store_product_selection=selection,
                created_time=to_aware(timezone.now()),
                last_modified_time=to_aware(timezone.now()),
                has_been_used=False,
            )
            buy.save()
            
            cart = RewardStoreProductSelectionCart.objects(
                store_product_selection=selection,
                is_bought=False
            ).first()
            
            if cart:
                cart.is_bought = True
                cart.last_modified_time = to_aware(timezone.now())
                cart.save()
                
            purchased_points = store_product.assigned_points * quantity
                
            gained_points = reward_points.total_gained_points
            spent_points = reward_points.total_spent_points + purchased_points
            reward_points.total_gained_points = gained_points - spent_points
            reward_points.last_modified = timezone.now()
            
            reward_points.save()

            tracking_info = transform_data_to_mongo(
                buy,
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
            
            description = f'Used {purchased_points} points to buy {quantity} of {store_product.name}'
            
            history = RewardPointsHistory(
                created_time=timezone.now(),
                reward_points=reward_points,
                action='spent',
                gained_points=0,
                spent_points=spent_points,
                description=description,
                info=tracking_info,
            )
            
            history.save()
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create store product selection buy',
                object_id=buy.id,
                object_type='RewardStoreProductSelectionBuy',
                object_name=buy.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )

            module='store_product_selection_buys'
            info=f'has created new store product selection buy ({buy.id})'
            info_id=buy.id
            type='create_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product selection buy created successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)