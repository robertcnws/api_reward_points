from rest_framework.response import Response

from concurrent.futures import ThreadPoolExecutor

from utils.data_util import (
    generate_order_number,
    generate_confirmation_number,
    generate_pin_number,
)

from api_reward_points.models import (
     RewardStoreProductSelectionCart,
     RewardStoreProductSelectionBuy,
)

def calculate_purchase_fraction(
    logger,
    reward_points,
    gained_points, 
    assigned_points, 
    purchased_points
):
    lost_gained_points = gained_points - purchased_points
    lost_assigned_points = assigned_points - purchased_points
    lost_both_points = (gained_points + assigned_points) - purchased_points
    purchase_type = None
    purchase_fraction = [0, 0]
    if lost_both_points < 0:
        logger.error("Insufficient points available")
        return Response({'error': 'Insufficient points available'}, status=400)
    elif lost_both_points >= 0:
        if lost_gained_points >= 0 and lost_assigned_points < 0:
            # reward_points.total_gained_points = lost_gained_points
            purchase_type = 'gained_points'
            purchase_fraction = [purchased_points , 0]
        elif lost_assigned_points >= 0 and lost_gained_points < 0:
            # reward_points.total_assigned_points = lost_assigned_points
            purchase_type = 'assigned_points'
            purchase_fraction = [0, purchased_points]
        elif lost_gained_points < 0 and lost_assigned_points < 0:
            if gained_points > assigned_points:
                remains = purchased_points - assigned_points
                # reward_points.total_gained_points = gained_points - remains
                # reward_points.total_assigned_points = 0
                purchase_fraction = [remains, assigned_points]
            else:
                remains = purchased_points - gained_points
                # reward_points.total_assigned_points = assigned_points - remains
                # reward_points.total_gained_points = 0
                purchase_fraction = [gained_points, remains]
            purchase_type = 'mixed_points'
    return purchase_type, purchase_fraction


def bulk_save(docs, workers=4):
    with ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(lambda d: d.save(), docs))
        
        
# HELPER

def buy_single(selection, reward_points, store_product, logger, now):
    default_qty = selection.quantity or 1
    purchased_points = (store_product.assigned_points or 0) * default_qty

    gained_points = reward_points.total_gained_points or 0
    assigned_points = reward_points.total_assigned_points or 0

    purchase_type, purchase_fraction = calculate_purchase_fraction(
        logger, reward_points, gained_points, assigned_points, purchased_points
    )
    if not isinstance(purchase_type, str):
        return purchase_type, None  # retorna Response en tu flujo

    # BUY (save → signals)
    buy = RewardStoreProductSelectionBuy(
        store_product_selection=selection,
        created_time=now,
        last_modified_time=now,
        has_been_used=False,
        order_number=generate_order_number(),
        confirmation_number=generate_confirmation_number(),
        pin_number=generate_pin_number(),
        purchase_type=purchase_type,
        purchase_fraction=purchase_fraction,
    )
    buy.save()
    
    reward_points.total_spent_points = (reward_points.total_spent_points or 0) + purchased_points
    reward_points.last_modified_time = now
    reward_points.save()
    
    cart = RewardStoreProductSelectionCart.objects(
        store_product_selection=selection, is_bought=False
    ).first()
    if cart:
        cart.is_bought = True
        cart.last_modified_time = now
        cart.save()

    return buy, purchased_points