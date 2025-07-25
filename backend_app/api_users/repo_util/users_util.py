from api_reward_points.models import (
    RewardPoints, 
    RewardPointsHistory,
    RewardStoreProductSelection,
    RewardStoreProductSelectionBuy,
)
from utils.data_util import (
    to_aware,
)
from django.utils import timezone

def inherit_from_unapproved_user(user_exists_company, user_to_inherit):
    existing_reward_points = RewardPoints.objects.filter(user=user_exists_company).first()
    actual_reward_points = RewardPoints.objects.filter(user=user_to_inherit).first()
    if existing_reward_points and actual_reward_points:
        actual_reward_points.total_gained_points = existing_reward_points.total_gained_points
        actual_reward_points.total_spent_points = existing_reward_points.total_spent_points
        actual_reward_points.total_assigned_points = existing_reward_points.total_assigned_points
        actual_reward_points.total_substracted_points = existing_reward_points.total_substracted_points
        actual_reward_points.total_refunded_points = existing_reward_points.total_refunded_points
        actual_reward_points.total_amount_invoices = existing_reward_points.total_amount_invoices
        actual_reward_points.invoices = existing_reward_points.invoices
        actual_reward_points.last_modified_time = to_aware(timezone.now())
        actual_reward_points.save()
        
        existing_history = RewardPointsHistory.objects.filter(
            reward_points=existing_reward_points,
            action__in=['spent', 'refunded', 'assigned', 'substracted']
        ).all()
        for history in existing_history:
            extra_description = f', made by user '
            description = history.description if \
                          extra_description in history.description else \
                          f'{history.description}{extra_description}{user_to_inherit.username}'
            history.reward_points = actual_reward_points
            history.description = description
            history.last_modified_time = to_aware(timezone.now())
            history.save()
            
        existing_selections = RewardStoreProductSelection.objects.filter(
            user=user_exists_company
        ).all()
        
        existing_buys = RewardStoreProductSelectionBuy.objects.filter(
            store_product_selection__in=existing_selections
        ).all()
        
        updated_selections = [eb.store_product_selection for eb in existing_buys]
        
        for selection in updated_selections:
            selection.user = user_to_inherit
            selection.last_modified_time = to_aware(timezone.now())
            selection.save()