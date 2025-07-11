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
    generate_order_number,
    generate_confirmation_number,
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
            
            info = f'has created new store product selection cart of \
                {cart.store_product_selection.store_product.name} \
                with quantity {cart.store_product_selection.quantity} \
                and total points \
                {cart.store_product_selection.store_product.assigned_points * cart.store_product_selection.quantity}'

            module='store_product_selection_carts'
            info=info
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
        
        info = f'has deleted store product selection cart of \
                {cart.store_product_selection.store_product.name} \
                with quantity {cart.store_product_selection.quantity} \
                and total points \
                {cart.store_product_selection.store_product.assigned_points * cart.store_product_selection.quantity}'
        
        create_notification(
            module='store_product_selection_carts',
            info_id=cart.id,
            info=info,
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
            action=f'delete list of {len(carts)} store product selection cart',
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
            type='delete_list_store_product_selection_cart',
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
# CREATE STORE PRODUCT SELECTION BUY FROM CART
#############################################

def _buy_single_cart(cart, reward_points):
    selection = cart.store_product_selection
    if not selection:
        return Response({'error': 'Store product selection not found in cart'}, status=404)

    buy = RewardStoreProductSelectionBuy(
        store_product_selection=selection,
        created_time=to_aware(timezone.now()),
        last_modified_time=to_aware(timezone.now()),
        has_been_used=False,
        order_number=generate_order_number(),
        confirmation_number=generate_confirmation_number(),
    )
    buy.save()
                
    cart.is_bought = True
    cart.last_modified_time = to_aware(timezone.now())
    cart.save()
            
    store_product = selection.store_product
    if not store_product:
        return Response({'error': 'Store product not found in selection'}, status=404)
                
    purchased_points = store_product.assigned_points * selection.quantity
                
    gained_points = reward_points.total_gained_points
    spent_points = reward_points.total_spent_points + purchased_points
    reward_points.total_gained_points = gained_points - purchased_points
    reward_points.total_spent_points = spent_points
    reward_points.last_modified = timezone.now()
            
    reward_points.save()
    
    return buy, selection, purchased_points, store_product


def create_store_product_selection_cart_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                return Response({'error': 'Reward points not found for the user'}, status=404)
            
            cart = RewardStoreProductSelectionCart.objects(
                id=id,
                is_bought=False
            ).first()
            
            if not cart:
                return Response({'error': 'Store product selection cart not found or already bought'}, status=404)

            buy, selection, purchased_points, store_product = _buy_single_cart(cart, reward_points)
            if not isinstance(buy, RewardStoreProductSelectionBuy):
                return buy

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
            
            description = f'Used {purchased_points} points to buy {selection.quantity} of {store_product.name}'
            
            history = RewardPointsHistory(
                created_time=timezone.now(),
                reward_points=reward_points,
                action='spent',
                gained_points=0,
                spent_points=purchased_points,
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

            info = f'has created new store product selection buy of \
                {buy.store_product_selection.store_product.name} \
                with quantity {buy.store_product_selection.quantity} \
                and total points \
                {buy.store_product_selection.store_product.assigned_points * buy.store_product_selection.quantity}'

            module='store_product_selection_buys'
            info=info
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


def create_all_store_product_selection_cart_buy(request):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                return Response({'error': 'Reward points not found for the user'}, status=404)
            
            carts = RewardStoreProductSelectionCart.objects(
                is_bought=False,
                store_product_selection__user__in=[user_reporter]
            ).first()

            if not carts:
                return Response({'error': 'Store product selection carts not found or already bought'}, status=404)
            
            list_tracking_info = []
            total_purchased_points = 0

            for cart in carts:
                buy, _, purchased_points, _ = _buy_single_cart(cart, reward_points)
                if not isinstance(buy, RewardStoreProductSelectionBuy):
                    return buy
                total_purchased_points += purchased_points
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
                list_tracking_info.append(tracking_info)
            
            description = f'Used {total_purchased_points} points to buy {len(carts)} products from cart'
            
            history = RewardPointsHistory(
                created_time=timezone.now(),
                reward_points=reward_points,
                action='spent',
                gained_points=0,
                spent_points=total_purchased_points,
                description=description,
                info=tracking_info,
            )
            
            history.save()
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create all store product selection buy',
                object_id=",".join([buy.get('id') for buy in list_tracking_info]),
                object_type='RewardStoreProductSelectionBuy',
                object_name=','.join([buy.get('store_product_selection', {}).get('store_product', {}).get('name', '') for buy in list_tracking_info]),
                managed_data={
                    'data': list_tracking_info
                }
            )

            info = f'has created new store product selection buy of \
                {len(carts)} products from cart with total points \
                {total_purchased_points}'

            module='store_product_selection_buys'
            info=info
            info_id=','.join([str(buy.get('id')) for buy in list_tracking_info])
            type='create_all_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store products selection buy created successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store products selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)
    

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
            
            purchased_points = store_product.assigned_points * quantity
            gained_points = reward_points.total_gained_points
            
            if gained_points < purchased_points:
                return Response({'error': 'Not enough points to buy this store product'}, status=400)

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
                order_number=generate_order_number(),
                confirmation_number=generate_confirmation_number(),
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
                
            
            spent_points = reward_points.total_spent_points + purchased_points
            reward_points.total_gained_points = gained_points - purchased_points
            reward_points.total_spent_points = spent_points
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
                spent_points=purchased_points,
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

            info = f'has created new store product selection buy of \
                {buy.store_product_selection.store_product.name} \
                with quantity {buy.store_product_selection.quantity} \
                and total points \
                {buy.store_product_selection.store_product.assigned_points * buy.store_product_selection.quantity}'

            module='store_product_selection_buys'
            info=info
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


#############################################
# DELETE STORE PRODUCT SELECTION BUY
#############################################

def delete_store_product_selection_buy(request, id):
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not buy:
                return Response({'error': 'Store product selection buy not found'}, status=404)
            
            selection_id = buy.store_product_selection.id
            selection = RewardStoreProductSelection.objects(id=selection_id).first()
            if not selection:
                return Response({'error': 'Store product selection not found'}, status=404)
            
            if buy.has_been_used:
                return Response({'error': 'Cannot delete a used store product selection buy'}, status=400)
            
            cart = RewardStoreProductSelectionCart.objects(
                store_product_selection=selection,
                is_bought=True
            ).first()
            
            if cart:
                cart.delete()
                
            user = selection.user
            if not user:
                return Response({'error': 'User not found for the store product selection'}, status=404)
                
            reward_points = RewardPoints.objects(user=user).first()
            if not reward_points:
                return Response({'error': 'User reward points not found'}, status=404)
            
            store_product = buy.store_product_selection.store_product
            if not store_product:
                return Response({'error': 'Store product not found in buy selection'}, status=404)
            
            purchased_points = store_product.assigned_points * selection.quantity
            
            gained_points = reward_points.total_gained_points + purchased_points
            spent_points = reward_points.total_spent_points - purchased_points
            
            reward_points.total_gained_points = gained_points
            reward_points.total_spent_points = spent_points
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
            
            description = f'Refunded {purchased_points} points from buy {selection.quantity} of {store_product.name}'
            
            history = RewardPointsHistory(
                created_time=timezone.now(),
                reward_points=reward_points,
                action='refunded',
                gained_points=purchased_points,
                spent_points=0,
                description=description,
                info=tracking_info,
            )
            
            history.save()
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete store product selection buy',
                object_id=buy.id,
                object_type='RewardStoreProductSelectionBuy',
                object_name=buy.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )
            
            info = f'has deleted store product selection buy of \
                {buy.store_product_selection.store_product.name} \
                with quantity {buy.store_product_selection.quantity} \
                and total points \
                {buy.store_product_selection.store_product.assigned_points * buy.store_product_selection.quantity}'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='delete_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            # DELETING THE BUY
            buy.delete()
            selection.delete()
                        
            return Response({
                'message': 'Store product selection buy created successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE LIST OF STORE PRODUCT SELECTION BUY
#############################################

def delete_list_store_product_selection_buys(request):
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            ids = data.get('ids', None)
            if not ids or not isinstance(ids, list):
                return Response({'error': 'IDs list is required'}, status=400)

            buys = RewardStoreProductSelectionBuy.objects(id__in=ids)
            if not buys:
                return Response({'error': 'No store product selection buys found'}, status=404)
            
            list_tracking_info = []
            
            for buy in buys:
                if not buy:
                    continue

                selection_id = buy.store_product_selection.id
                selection = RewardStoreProductSelection.objects(id=selection_id).first()
                if not selection:
                    return Response({'error': 'Store product selection not found'}, status=404)
                
                if buy.has_been_used:
                    return Response({'error': 'Cannot delete a used store product selection buy'}, status=400)
                
                cart = RewardStoreProductSelectionCart.objects(
                    store_product_selection=selection,
                    is_bought=True
                ).first()
                
                if cart:
                    cart.delete()
                    
                user = selection.user
                if not user:
                    return Response({'error': 'User not found for the store product selection'}, status=404)
                    
                reward_points = RewardPoints.objects(user=user).first()
                if not reward_points:
                    return Response({'error': 'User reward points not found'}, status=404)
                
                store_product = buy.store_product_selection.store_product
                if not store_product:
                    return Response({'error': 'Store product not found in buy selection'}, status=404)
                
                purchased_points = store_product.assigned_points * selection.quantity
                
                gained_points = reward_points.total_gained_points + purchased_points
                spent_points = reward_points.total_spent_points - purchased_points
                
                reward_points.total_gained_points = gained_points
                reward_points.total_spent_points = spent_points
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
                
                description = f'Refunded {purchased_points} points from buy {selection.quantity} of {store_product.name}'
                
                history = RewardPointsHistory(
                    created_time=timezone.now(),
                    reward_points=reward_points,
                    action='refunded',
                    gained_points=purchased_points,
                    spent_points=0,
                    description=description,
                    info=tracking_info,
                )
                
                history.save()

                list_tracking_info.append(tracking_info)

                # DELETING THE BUY
                buy.delete()
                selection.delete()

            # Create a single tracking entry for all deleted buys
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(buys)} store product selection buys',
                object_id=",".join([str(buy.id) for buy in buys]),
                object_type='RewardStoreProductSelectionBuy',
                object_name=None,
                managed_data={
                    'data': list_tracking_info
                }
            )
            
            info = f'has deleted a list of {len(buys)} store product selection buys for user {user_reporter.username}'
            create_notification(
                module='store_product_selection_buys',
                info_id='list',
                info=info,
                type='delete_list_store_product_selection_buy',
                username=user_reporter.username
            )

            return Response({
                'message': 'Store product selection buy created successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# MANAGE REFUND STORE PRODUCT SELECTION BUY
#############################################

def manage_refund_store_product_selection_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try: 
            refund_buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not refund_buy:
                return Response({'error': 'Store product selection buy not found'}, status=404)
            
            refund_buy.has_requested_refund = not refund_buy.has_requested_refund
            refund_buy.last_modified_time = to_aware(timezone.now())
            refund_buy.save()
            
            tracking_info = transform_data_to_mongo(
                refund_buy,
                include_fields=[
                    'store_product_selection', 
                    'created_time', 
                    'last_modified_time', 
                    'has_been_used', 
                    'has_requested_refund'
                ]
            )
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'manage store product selection buy refund',
                object_id=refund_buy.id,
                object_type='RewardStoreProductSelectionBuy',
                object_name=refund_buy.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )

            info = f'has {"requested" if refund_buy.has_requested_refund else "cancelled"} \
                refund for store product selection buy of \
                {refund_buy.store_product_selection.store_product.name}'

            module='store_product_selection_buys'
            info=info
            info_id=refund_buy.id
            type='manage_store_product_selection_buy_refund'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product selection buy refund status updated successfully',
                'data': json.loads(refund_buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# MANAGE USE STORE PRODUCT SELECTION BUY
#############################################

def manage_use_store_product_selection_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try: 
            buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not buy:
                return Response({'error': 'Store product selection buy not found'}, status=404)
            
            quantity_used = data.get('quantityUsed', 0)
            if quantity_used <= 0:
                return Response({'error': 'Invalid quantity used'}, status=400)
            
            notes = data.get('notes', None)
            
            total_quantity_used = buy.quantity_used + quantity_used if buy.quantity_used else quantity_used

            buy.has_been_used = True
            buy.quantity_used = total_quantity_used
            if notes:
                buy.notes = notes
            buy.last_modified_time = to_aware(timezone.now())
            buy.save()
            
            tracking_info = transform_data_to_mongo(
                buy,
                include_fields=[
                    'store_product_selection', 
                    'created_time', 
                    'last_modified_time', 
                    'has_been_used',
                    'quantity_used', 
                    'order_number', 
                    'confirmation_number',
                    'notes'
                ]
            )
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'manage store product selection buy use',
                object_id=buy.id,
                object_type='RewardStoreProductSelectionBuy',
                object_name=buy.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )

            info = f'has used store product selection buy of {buy.store_product_selection.store_product.name} \
                with quantity used {total_quantity_used}'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='manage_store_product_selection_buy_use'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product selection buy use status updated successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error managing use in store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)