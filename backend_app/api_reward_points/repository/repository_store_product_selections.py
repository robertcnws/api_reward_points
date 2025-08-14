from rest_framework.response import Response
from django.utils import timezone
from django.template.loader import render_to_string
from api_authorization.models import LoginUser
from api_authorization.repo_util.authorization_utils import send_generic_email
from api_reward_points.models import (
     RewardStoreProduct,
     RewardStoreProductSelection,
     RewardStoreProductSelectionCart,
     RewardStoreProductSelectionBuy,
     RewardPoints,
     RewardPointsHistory,
)
from api_reward_points.repository.repo_util.store_product_selection_util import calculate_purchase_fraction
from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
    to_aware,
    generate_order_number,
    generate_confirmation_number,
    generate_pin_number,
)
from utils.s3_utils import generate_default_file_url
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try:

            store_product = RewardStoreProduct.objects(id=id).first()
            if not store_product:
                logger.error(f"Store product not found with id: {id}")
                return Response({'error': 'Store product not found'}, status=404)

            quantity = data.get('quantity', None)
            if not quantity or quantity <= 0:
                logger.error(f"Quantity is required for store product: {store_product.name}")
                return Response({'error': 'Quantity is required'}, status=400)
            
            default_qty = 1
            list_carts = []
            total_carts_points = 0

            for _ in range(quantity):
                selection = RewardStoreProductSelection(
                    store_product=store_product,
                    user=user_reporter,
                    quantity=default_qty,
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
                
                list_carts.append(cart)
                total_carts_points += store_product.assigned_points * default_qty
            
            info = f'has added ' \
                f'{len(list_carts)} ' \
                f'{list_carts[0].store_product_selection.store_product.name.upper()} ' \
                f'to reward cart ' \
                f'with total points ' \
                f'{total_carts_points}'

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
            logger.error("User reporter not found")
            return Response({'error': 'User reporter not found'}, status=404)
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        cart = RewardStoreProductSelectionCart.objects(id=id).first()
        if not cart:
            logger.error("Store product selection cart not found")
            return Response({'error': 'Store product selection cart not found'}, status=404)
        
        selection_id = cart.store_product_selection.id
        selection = RewardStoreProductSelection.objects(id=selection_id).first()    
        if not selection:
            logger.error("Store product selection not found")
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
        
        info = f'has deleted \
                {cart.store_product_selection.store_product.name.upper()} \
                from cart \
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
            logger.error("User reporter not found")
            return Response({'error': 'User reporter not found'}, status=404)
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        selections = RewardStoreProductSelection.objects(user=user_reporter).all()
        if not selections:
            logger.error("No store product selections found for the user")
            return Response({'error': 'No store product selections found for the user'}, status=404)

        carts = RewardStoreProductSelectionCart.objects(
            store_product_selection__in=selections, 
            is_bought=False
        ).all()
        if not carts:
            logger.error("No store product selection carts found for the user")
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

        info = f'has deleted a list of {len(carts)} \
            carts ({", ".join([cart.store_product_selection.store_product.name.upper() for cart in carts])})'

        create_notification(
            module='store_product_selection_carts',
            info_id='list',
            info=info,
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
        logger.error("Store product selection not found in cart")
        return Response({'error': 'Store product selection not found in cart'}, status=404)
    
    gained_points = reward_points.total_gained_points
    assigned_points = reward_points.total_assigned_points
    purchased_points = selection.store_product.assigned_points * selection.quantity

    purchase_type, purchase_fraction = calculate_purchase_fraction(
        logger,
        reward_points,
        gained_points, 
        assigned_points, 
        purchased_points
    )
            
    if not isinstance(purchase_type, str):
        logger.error("Error calculating redeemed order fraction")
        return purchase_type
            
            
    buy = RewardStoreProductSelectionBuy(
        store_product_selection=selection,
        created_time=to_aware(timezone.now()),
        last_modified_time=to_aware(timezone.now()),
        has_been_used=False,
        order_number=generate_order_number(),
        confirmation_number=generate_confirmation_number(),
        pin_number=generate_pin_number(),
        purchase_type=purchase_type,
        purchase_fraction=purchase_fraction,
    )
    buy.save()
            
    spent_points = reward_points.total_spent_points + purchased_points
    reward_points.total_spent_points = spent_points
    reward_points.last_modified = timezone.now()
            
    reward_points.save()
                
    cart.is_bought = True
    cart.last_modified_time = to_aware(timezone.now())
    cart.save()
            
    store_product = selection.store_product
    if not store_product:
        logger.error("Store product not found in selection")
        return Response({'error': 'Store product not found in selection'}, status=404)
    
    return buy, selection, purchased_points, store_product


def create_store_product_selection_cart_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                logger.error("Reward points not found for the user")
                return Response({'error': 'Reward points not found for the user'}, status=404)
            
            cart = RewardStoreProductSelectionCart.objects(
                id=id,
                is_bought=False
            ).first()
            
            if not cart:
                logger.error("Store product selection cart not found or already bought")
                return Response({'error': 'Store product selection cart not found or already bought'}, status=404)

            buy, selection, purchased_points, store_product = _buy_single_cart(cart, reward_points)
            if not isinstance(buy, RewardStoreProductSelectionBuy):
                logger.error("Error buying single cart")
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
            
            description = f'Used {purchased_points} points to redeem {selection.quantity} of {store_product.name}'
            
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

            info = f'has redeemed order # {buy.order_number} of \
                {buy.store_product_selection.store_product.name.upper()} \
                with total points \
                {buy.store_product_selection.store_product.assigned_points * buy.store_product_selection.quantity}'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='create_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            # SENDING EMAIL
            
            file = buy.store_product_selection.store_product.attachments[0].file if \
                len(buy.store_product_selection.store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
            buy.default_url = generate_default_file_url(file)
            
            send_email_confirmation(
                type='purchase',
                points=purchased_points,
                user=user_reporter,
                purchases=[buy],
                # list_receivers=[user_reporter.email]
                # list_receivers=['nnws15815@gmail.com', 'admin@newwindowsystem.com']
                list_receivers=['nnws15815@gmail.com']
            )
                        
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                logger.error("Reward points not found for the user")
                return Response({'error': 'Reward points not found for the user'}, status=404)
            
            selections = list(RewardStoreProductSelection.objects(user=user_reporter))
            if not selections:
                logger.error("No store product selections found for the user")
                return Response({'error': 'No store product selections found for the user'}, status=404)
            
            carts = list(RewardStoreProductSelectionCart.objects(
                is_bought=False,
                store_product_selection__in=selections
            ).all())

            if not carts:
                logger.error("Store product selection carts not found or already bought")
                return Response({'error': 'Store product selection carts not found or already bought'}, status=404)
            
            list_tracking_info = []
            list_buys = []
            total_purchased_points = 0

            for cart in carts:
                buy, _, purchased_points, _ = _buy_single_cart(cart, reward_points)
                if not isinstance(buy, RewardStoreProductSelectionBuy):
                    logger.error("Error buying single cart")
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
                list_buys.append(buy)
            
            description = f'Used {total_purchased_points} points to redeem {len(carts)} products from cart'
            
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
            
            ids = [str(item.get('id')) for item in list_tracking_info if item.get('id') is not None]
            
            names = [
                item
                .get('store_product_selection', {})
                .get('store_product', {})
                .get('name') or ''
                for item in list_tracking_info
            ]
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create all store product selection buy',
                object_id=",".join(ids),
                object_type='RewardStoreProductSelectionBuy',
                object_name=','.join(names),
                managed_data={
                    'data': list_tracking_info
                }
            )

            info = f'has redeemed orders of \
                {len(carts)} products \
                ({", ".join([cart.store_product_selection.store_product.name.upper() for cart in carts])}) \
                from cart with total points \
                {total_purchased_points}'

            module='store_product_selection_buys'
            info=info
            info_id=','.join(ids)
            type='create_all_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            # SENDING EMAIL
            
            for buy in list_buys:
                if not hasattr(buy, 'default_url'):
                    buy.default_url = None
                file = buy.store_product_selection.store_product.attachments[0].file if \
                    len(buy.store_product_selection.store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
                buy.default_url = generate_default_file_url(file)

            send_email_confirmation(
                type='purchase',
                points=total_purchased_points,
                user=user_reporter,
                purchases=list_buys,
                # list_receivers=[user_reporter.email]
                # list_receivers=['nnws15815@gmail.com', 'admin@newwindowsystem.com']
                list_receivers=['nnws15815@gmail.com']
            )
                        
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try:
            
            reward_points = RewardPoints.objects(user=user_reporter).first()
            
            if not reward_points:
                logger.error("Reward points not found for the user")
                return Response({'error': 'Reward points not found for the user'}, status=404)

            store_product = RewardStoreProduct.objects(id=id).first()
            if not store_product:
                logger.error("Store product not found")
                return Response({'error': 'Store product not found'}, status=404)

            quantity = data.get('quantity', None)
            if not quantity or quantity <= 0:
                logger.error(f"Quantity is required for store product: {store_product.name}")
                return Response({'error': 'Quantity is required'}, status=400)
            
            list_buys = []
            total_buys_points = 0
            default_qty = 1
            
            for _ in range(quantity):
            
                purchased_points = store_product.assigned_points * default_qty
                gained_points = reward_points.total_gained_points
                assigned_points = reward_points.total_assigned_points

                if gained_points + assigned_points < purchased_points:
                    logger.error(f"Not enough points to redeem this store product: {store_product.name}")
                    return Response({'error': 'Not enough points to redeem this store product'}, status=400)

                selection = RewardStoreProductSelection(
                    store_product=store_product,
                    user=user_reporter,
                    quantity=default_qty,
                    created_time=to_aware(timezone.now()),
                    last_modified_time=to_aware(timezone.now()),
                )
                selection.save()
            
                cart = RewardStoreProductSelectionCart.objects(
                    store_product_selection=selection,
                    is_bought=False
                ).first()
            
                if cart:
                    cart.is_bought = True
                    cart.last_modified_time = to_aware(timezone.now())
                    cart.save()
                
                purchase_type, purchase_fraction = calculate_purchase_fraction(
                    logger,
                    reward_points,
                    gained_points, 
                    assigned_points, 
                    purchased_points
                )
            
                if not isinstance(purchase_type, str):
                    logger.error("Error calculating redeemed order fraction")
                    return purchase_type
            
            
                buy = RewardStoreProductSelectionBuy(
                    store_product_selection=selection,
                    created_time=to_aware(timezone.now()),
                    last_modified_time=to_aware(timezone.now()),
                    has_been_used=False,
                    order_number=generate_order_number(),
                    confirmation_number=generate_confirmation_number(),
                    pin_number=generate_pin_number(),
                    purchase_type=purchase_type,
                    purchase_fraction=purchase_fraction,
                )
                buy.save()
            
                spent_points = reward_points.total_spent_points + purchased_points
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

                description = f'Used {purchased_points} points to redeem {default_qty} {store_product.name}'

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
                
                list_buys.append(buy)
                total_buys_points += purchased_points

            info = f'has redeemed {len(list_buys)} orders of \
                {list_buys[0].store_product_selection.store_product.name.upper()} \
                and total points \
                {total_buys_points}'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='create_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            # SENDING EMAIL
            
            for buy in list_buys:
            
                file = buy.store_product_selection.store_product.attachments[0].file if \
                    len(buy.store_product_selection.store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
                buy.default_url = generate_default_file_url(file)
            
            send_email_confirmation(
                type='purchase',
                points=total_buys_points,
                user=user_reporter,
                purchases=list_buys,
                # list_receivers=[user_reporter.email]
                # list_receivers=['nnws15815@gmail.com', 'admin@newwindowsystem.com']
                list_receivers=['nnws15815@gmail.com']
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
# DELETE STORE PRODUCT SELECTION BUY
#############################################

def delete_store_product_selection_buy(request, id):
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try:
            
            buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not buy:
                logger.error("Order not found")
                return Response({'error': 'Order not found'}, status=404)

            selection_id = buy.store_product_selection.id
            selection = RewardStoreProductSelection.objects(id=selection_id).first()
            if not selection:
                logger.error("Selection not found")
                return Response({'error': 'Selection not found'}, status=404)

            if buy.has_been_used:
                logger.error("Cannot delete a used redeemed order")
                return Response({'error': 'Cannot delete a used redeemed order'}, status=400)

            cart = RewardStoreProductSelectionCart.objects(
                store_product_selection=selection,
                is_bought=True
            ).first()
            
            if cart:
                cart.delete()
                
            user = selection.user
            if not user:
                logger.error("User not found for the store product selection")
                return Response({'error': 'User not found for the store product selection'}, status=404)
                
            reward_points = RewardPoints.objects(user=user).first()
            if not reward_points:
                logger.error("User reward points not found")
                return Response({'error': 'User reward points not found'}, status=404)
            
            store_product = buy.store_product_selection.store_product
            if not store_product:
                logger.error("Store product not found")
                return Response({'error': 'Store product not found'}, status=404)
            
            purchased_points = store_product.assigned_points * selection.quantity
            
            refund_gained_points = int(buy.purchase_fraction[0])
            refund_spent_points = int(buy.purchase_fraction[1])
            
            gained_points = reward_points.total_gained_points + refund_gained_points
            if gained_points < 0:
                logger.error("Earned points cannot be negative")
                return Response({'error': 'Earned points cannot be negative'}, status=400)
            assigned_points = reward_points.total_assigned_points + refund_spent_points
            if assigned_points < 0:
                logger.error("Assigned points cannot be negative")
                return Response({'error': 'Assigned points cannot be negative'}, status=400)
            
            spent_points = reward_points.total_spent_points - purchased_points
            if spent_points < 0:
                logger.error("Spent points cannot be negative")
                return Response({'error': 'Spent points cannot be negative'}, status=400)
            
            reward_points.total_gained_points = gained_points
            reward_points.total_assigned_points = assigned_points
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
            
            description = f'Refunded {purchased_points} points from redeem {selection.quantity} of {store_product.name}'
            
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

            info = f'has deleted a redeemed order # {buy.order_number} of \
                {buy.store_product_selection.store_product.name.upper()} \
                with quantity {buy.store_product_selection.quantity} \
                and refunded \
                {purchased_points} \
                points to user {user.username}'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='delete_store_product_selection_buy'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            # SENDING EMAIL
            
            file = buy.store_product_selection.store_product.attachments[0].file if \
                len(buy.store_product_selection.store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
            buy.default_url = generate_default_file_url(file)
            
            send_email_confirmation(
                type='refund',
                points=purchased_points,
                user=user_reporter,
                purchases=[buy],
                # list_receivers=[user_reporter.email]
                # list_receivers=['nnws15815@gmail.com', 'admin@newwindowsystem.com']
                list_receivers=['nnws15815@gmail.com']
            )
            
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403) 
        
        try:
            
            ids = data.get('ids', None)
            if not ids or not isinstance(ids, list):
                logger.error("IDs list is required")
                return Response({'error': 'IDs list is required'}, status=400)

            buys = RewardStoreProductSelectionBuy.objects(id__in=ids)
            if not buys:
                logger.error("No store product selection buys found")
                return Response({'error': 'No store product selection buys found'}, status=404)
            
            list_tracking_info = []
            list_buys = []
            
            total_purchased_points = 0
            
            for buy in buys:
                if not buy:
                    continue

                selection_id = buy.store_product_selection.id
                selection = RewardStoreProductSelection.objects(id=selection_id).first()
                if not selection:
                    logger.error("Store product selection not found")
                    return Response({'error': 'Store product selection not found'}, status=404)
                
                if buy.has_been_used:
                    logger.error("Cannot delete a used store product selection buy")
                    return Response({'error': 'Cannot delete a used store product selection buy'}, status=400)
                
                cart = RewardStoreProductSelectionCart.objects(
                    store_product_selection=selection,
                    is_bought=True
                ).first()
                
                if cart:
                    cart.delete()
                    
                user = selection.user
                if not user:
                    logger.error("User not found for the store product selection")
                    return Response({'error': 'User not found for the store product selection'}, status=404)
                    
                reward_points = RewardPoints.objects(user=user).first()
                if not reward_points:
                    logger.error("User reward points not found")
                    return Response({'error': 'User reward points not found'}, status=404)
                
                store_product = buy.store_product_selection.store_product
                if not store_product:
                    logger.error("Store product not found in buy selection")
                    return Response({'error': 'Store product not found in buy selection'}, status=404)
                
                purchased_points = store_product.assigned_points * selection.quantity
                total_purchased_points += purchased_points
                
                refund_gained_points = int(buy.purchase_fraction[0])
                refund_spent_points = int(buy.purchase_fraction[1])
                
                gained_points = reward_points.total_gained_points + refund_gained_points
                if gained_points < 0:
                    logger.error("Earned points cannot be negative")
                    return Response({'error': 'Earned points cannot be negative'}, status=400)
                assigned_points = reward_points.total_assigned_points + refund_spent_points
                if assigned_points < 0:
                    logger.error("Assigned points cannot be negative")
                    return Response({'error': 'Assigned points cannot be negative'}, status=400)
                
                spent_points = reward_points.total_spent_points - purchased_points
                if spent_points < 0:
                    logger.error("Spent points cannot be negative")
                    return Response({'error': 'Spent points cannot be negative'}, status=400)
                
                reward_points.total_gained_points = gained_points
                reward_points.total_assigned_points = assigned_points
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
                
                description = f'Refunded {purchased_points} points from redeemed of {selection.quantity} {store_product.name}'
                
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
                list_buys.append(buy)

                # DELETING THE BUY
                buy.delete()
                selection.delete()

            # Create a single tracking entry for all deleted buys
            
            buy_ids = [str(buy.id) for buy in buys if buy is not None]
            buy_names = [
                buy.store_product_selection.store_product.name for buy in buys if buy is not None
            ]
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(buys)} store product selection buys',
                object_id=",".join(buy_ids),
                object_type='RewardStoreProductSelectionBuy',
                object_name=','.join(buy_names),
                managed_data={
                    'data': list_tracking_info
                }
            )
            
            info = f'has deleted a list of {len(buys)} \
                redeemed orders ({", ".join([buy.store_product_selection.store_product.name.upper() \
                    for buy in buys if buy is not None])})\
                for user {user.username} and refunded {total_purchased_points} points'
                
            create_notification(
                module='store_product_selection_buys',
                info_id='list',
                info=info,
                type='delete_list_store_product_selection_buy',
                username=user_reporter.username
            )
            
            # SENDING EMAIL
            
            for buy in list_buys:
                if not hasattr(buy, 'default_url'):
                    buy.default_url = None
                file = buy.store_product_selection.store_product.attachments[0].file if \
                    len(buy.store_product_selection.store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
                buy.default_url = generate_default_file_url(file)
            
            send_email_confirmation(
                type='refund',
                points=total_purchased_points,
                user=user_reporter,
                purchases=list_buys,
                # list_receivers=[user_reporter.email]
                # list_receivers=['nnws15815@gmail.com', 'admin@newwindowsystem.com']
                list_receivers=['nnws15815@gmail.com']
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try: 
            refund_buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not refund_buy:
                logger.error("Store product selection buy not found")
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
                refund for redeemed order # {refund_buy.order_number} of \
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
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try: 
            buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not buy:
                logger.error("Store product selection buy not found")
                return Response({'error': 'Store product selection buy not found'}, status=404)
            
            quantity_used = data.get('quantityUsed', 0)
            if quantity_used <= 0:
                return Response({'error': 'Invalid quantity used'}, status=400)
            
            notes = data.get('notes', '')
            
            total_quantity_used = buy.quantity_used + quantity_used if buy.quantity_used else quantity_used

            buy.has_been_used = True
            buy.quantity_used = total_quantity_used
            if notes:
                buy.notes = notes
            buy.last_modified_time = to_aware(timezone.now())
            buy.redeemed_time = to_aware(timezone.now())
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

            info = f'has completed use of {buy.store_product_selection.store_product.name.upper()} \
                with quantity {total_quantity_used} to user {buy.store_product_selection.user.username} effectively'

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



#############################################
# MANAGE IS REMOVED STORE PRODUCT SELECTION BUY
#############################################

def manage_remove_store_product_selection_buy(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        
        if not user_reporter.is_approved:
            logger.error("User reporter is not approved")
            return Response({'error': f'You are not currently as APPROVED USER anymore'}, status=403)
        
        try: 
            buy = RewardStoreProductSelectionBuy.objects(id=id).first()
            if not buy:
                logger.error("Store product selection buy not found")
                return Response({'error': 'Store product selection buy not found'}, status=404)

            buy.is_removed = not buy.is_removed
            buy.last_modified_time = to_aware(timezone.now())
            buy.save()
            
            tracking_info = transform_data_to_mongo(
                buy,
                include_fields=[
                    'store_product_selection', 
                    'created_time', 
                    'last_modified_time', 
                    'is_removed',
                    'order_number', 
                    'confirmation_number',
                    'notes'
                ]
            )
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'manage store product selection buy remove',
                object_id=buy.id,
                object_type='RewardStoreProductSelectionBuy',
                object_name=buy.store_product_selection.store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )

            info = f'has removed {buy.store_product_selection.store_product.name.upper()} \
                for user {buy.store_product_selection.user.username} effectively'

            module='store_product_selection_buys'
            info=info
            info_id=buy.id
            type='manage_store_product_selection_buy_remove'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product selection buy remove status updated successfully',
                'data': json.loads(buy.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error managing remove in store product selection buy: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)



def send_email_confirmation(type, points, user, purchases, list_receivers):
    email_html_message = render_to_string(
            f"api_reward_points/email_send_{type}_confirmation.html",  
            {
             "username": user.username, 
             "first_name": user.first_name, 
             "last_name": user.last_name, 
             "purchase_total_points": points,
             "list_purchases": purchases,
            }, 
    )
    message = f"Thank you for your {type}! Your redeemed order has been successfully processed. \
    You can view your {type} details in your account."
    today = to_aware(timezone.now())
    today_str = today.strftime("%Y-%m-%d %H:%M:%S")
    return send_generic_email(
        list_receivers, 
        email_html_message, 
        f"{type.capitalize()} Confirmation - {today_str}",
        message_response=message
    )