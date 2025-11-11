from rest_framework.response import Response

from concurrent.futures import ThreadPoolExecutor

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