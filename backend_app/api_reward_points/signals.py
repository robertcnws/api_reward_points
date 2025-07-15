from mongoengine import signals
from utils.data_util import (
    serialize_datetime, 
    transform_data_to_mongo,
    camelize
)

from api_reward_points.models import (
    RewardPointsSettings,
    RewardPoints,
    RewardStoreProduct,
    RewardStoreProductReview,
    RewardStoreProductReviewReaction,
    RewardStoreProductSelectionCart,
    RewardStoreProductSelectionBuy,
    RewardPointsHistory,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

##########################################################################
# PointHistory by username
##########################################################################    

def point_history_by_username_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"point_history_{document.reward_points.user.username}" if document.reward_points and document.reward_points.user else None
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.reward_points,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'point_history_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "rewardPoints": full_selection if document.reward_points else None,
                "action": document.action,
                "gainedPoints": document.gained_points,
                "spentPoints": document.spent_points,
                "info": document.info,
                "description": document.description,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


def point_history_by_username_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"point_history_{document.reward_points.user.username}" \
        if document.reward_points and document.reward_points.user \
        else f"point_history_{document.username}"
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.reward_points,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'point_history_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "rewardPoints": full_selection if document.reward_points else None,
                "action": document.action,
                "gainedPoints": document.gained_points,
                "spentPoints": document.spent_points,
                "info": document.info,
                "description": document.description,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))

###########################################################################
# StoreProductSelectionBuy all
###########################################################################

def store_product_selection_buy_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_buy_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "hasBeenUsed": document.has_been_used,
                "hasRequestedRefund": document.has_requested_refund,
                "quantityUsed": document.quantity_used,
                "orderNumber": document.order_number,
                "confirmationNumber": document.confirmation_number,
                "notes": document.notes,
                "purchaseType": document.purchase_type,
                "purchaseFraction": document.purchase_fraction,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('store_product_selection_buy', serialize_datetime(event))


def store_product_selection_buy_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_buy_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "hasBeenUsed": document.has_been_used,
                "hasRequestedRefund": document.has_requested_refund,
                "quantityUsed": document.quantity_used,
                "orderNumber": document.order_number,
                "confirmationNumber": document.confirmation_number,
                "notes": document.notes,
                "purchaseType": document.purchase_type,
                "purchaseFraction": document.purchase_fraction,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('store_product_selection_buy', serialize_datetime(event))

##########################################################################
# StoreProductSelectionBuy by username
##########################################################################    

def store_product_selection_buy_by_username_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"store_product_selection_buy_{document.store_product_selection.user.username}" \
        if document.store_product_selection and document.store_product_selection.user \
        else f"store_product_selection_buy_{document.username}"
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_buy_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "hasBeenUsed": document.has_been_used,
                "hasRequestedRefund": document.has_requested_refund,
                "quantityUsed": document.quantity_used,
                "orderNumber": document.order_number,
                "confirmationNumber": document.confirmation_number,
                "notes": document.notes,
                "purchaseType": document.purchase_type,
                "purchaseFraction": document.purchase_fraction,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


def store_product_selection_buy_by_username_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_selection_buy_{document.store_product_selection.user.username}" \
        if document.store_product_selection and document.store_product_selection.user \
        else f"store_product_selection_buy_{document.username}"
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_buy_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "hasBeenUsed": document.has_been_used,
                "hasRequestedRefund": document.has_requested_refund,
                "quantityUsed": document.quantity_used,
                "orderNumber": document.order_number,
                "confirmationNumber": document.confirmation_number,
                "notes": document.notes,
                "purchaseType": document.purchase_type,
                "purchaseFraction": document.purchase_fraction,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


##########################################################################
# StoreProductSelectionCart by username
##########################################################################    

def store_product_selection_cart_by_username_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"store_product_selection_cart_{document.store_product_selection.user.username}" \
        if document.store_product_selection and document.store_product_selection.user \
        else f"store_product_selection_cart_{document.username}"
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_cart_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "isBought": document.is_bought,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


def store_product_selection_cart_by_username_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_selection_cart_{document.store_product_selection.user.username}" \
        if document.store_product_selection and document.store_product_selection.user \
        else f"store_product_selection_cart_{document.username}"
    if not group_name:
        return
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_selection_cart_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "isBought": document.is_bought,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


##########################################################################
# StoreProduct by ID
##########################################################################    

def store_product_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.id)}"
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                # "id": str(document.id),
                # "user": str(document.user.id) if document.user else None,
                # "totalGainedPoints": document.total_gained_points,
                # "totalSpentPoints": document.total_spent_points,
                # "totalAmountInvoices": document.total_amount_invoices,
                # "invoices": [str(invoice.id) for invoice in document.invoices],
                # "createdTime": document.created_time,
                # "lastModifiedTime": document.last_modified_time,
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": full_selection if document.attachments else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def store_product_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.id)}"
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'deleted',
            "item": {
                # "id": str(document.id),
                # "user": str(document.user.id) if document.user else None,
                # "totalGainedPoints": document.total_gained_points,
                # "totalSpentPoints": document.total_spent_points,
                # "totalAmountInvoices": document.total_amount_invoices,
                # "invoices": [str(invoice.id) for invoice in document.invoices],
                # "createdTime": document.created_time,
                # "lastModifiedTime": document.last_modified_time,
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": full_selection if document.attachments else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product.id)}"
    full_selection = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_review_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": full_selection if document.user else None,
                "rating": document.rating,
                "comment": document.comment,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product.id)}"
    full_selection = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_review_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": full_selection if document.user else None,
                "rating": document.rating,
                "comment": document.comment,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_reaction_saved(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product_review.store_product.id)}"
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_review = transform_data_to_mongo(
        document.store_product_review,
        exclude_fields=[ 'password' ],
    )
    full_selection_review = camelize(full_selection_review)
    event = {
        'type': 'store_product_review_reaction_update',
        'message': {
            'type': 'created',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "storeProductReview": full_selection_review if document.store_product_review else None,
                "reactionType": document.reaction_type,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_reaction_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product_review.store_product.id)}"
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_review = transform_data_to_mongo(
        document.store_product_review,
        exclude_fields=[ 'password' ],
    )
    full_selection_review = camelize(full_selection_review)
    event = {
        'type': 'store_product_review_reaction_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "storeProductReview": full_selection_review if document.store_product_review else None,
                "reactionType": document.reaction_type,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))


##########################################################################
# StoreProduct
##########################################################################

def store_product_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": full_selection if document.attachments else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('store_product', serialize_datetime(event))


def store_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": full_selection if document.attachments else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('store_product', serialize_datetime(event))

##########################################################################
# PointsSettings
##########################################################################

def points_settings_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'points_settings_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "amount": document.amount,
                "points": document.points,
                "description": document.description,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('points_settings', serialize_datetime(event))
    
    
def points_settings_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'points_settings_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "amount": document.amount,
                "points": document.points,
                "description": document.description,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('points_settings', serialize_datetime(event))
    
    
##########################################################################
# RewardPoints
##########################################################################

def reward_points_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_invoices = transform_data_to_mongo(
        document.invoices,
        exclude_fields=[ 'password' ],
    )
    full_selection_invoices = camelize(full_selection_invoices)
    total_available_points = document.total_gained_points + \
                             document.total_assigned_points - \
                             document.total_substracted_points
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAssignedPoints": document.total_assigned_points,
                "totalSubstractedPoints": document.total_substracted_points,
                "totalRefundedPoints": document.total_refunded_points,
                "totalAvailablePoints": total_available_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": full_selection_invoices if document.invoices else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('reward_points', serialize_datetime(event))
    
    
def reward_points_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_invoices = transform_data_to_mongo(
        document.invoices,
        exclude_fields=[ 'password' ],
    )
    full_selection_invoices = camelize(full_selection_invoices)
    total_available_points = document.total_gained_points + \
                             document.total_assigned_points - \
                             document.total_substracted_points
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAssignedPoints": document.total_assigned_points,
                "totalSubstractedPoints": document.total_substracted_points,
                "totalRefundedPoints": document.total_refunded_points,
                "totalAvailablePoints": total_available_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": full_selection_invoices if document.invoices else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('reward_points', serialize_datetime(event))
    
##########################################################################
# RewardPoints by ID
##########################################################################    

def reward_points_by_id_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"reward_points_{str(document.id)}"
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_invoices = transform_data_to_mongo(
        document.invoices,
        exclude_fields=[ 'password' ],
    )
    full_selection_invoices = camelize(full_selection_invoices)
    total_available_points = document.total_gained_points + \
                             document.total_assigned_points - \
                             document.total_substracted_points
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAssignedPoints": document.total_assigned_points,
                "totalSubstractedPoints": document.total_substracted_points,
                "totalAvailablePoints": total_available_points,
                "totalRefundedPoints": document.total_refunded_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": full_selection_invoices if document.invoices else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def reward_points_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"reward_points_{str(document.id)}"
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    full_selection_invoices = transform_data_to_mongo(
        document.invoices,
        exclude_fields=[ 'password' ],
    )
    full_selection_invoices = camelize(full_selection_invoices)
    total_available_points = document.total_gained_points + \
                             document.total_assigned_points - \
                             document.total_substracted_points
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAssignedPoints": document.total_assigned_points,
                "totalSubstractedPoints": document.total_substracted_points,
                "totalAvailablePoints": total_available_points,
                "totalRefundedPoints": document.total_refunded_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": full_selection_invoices if document.invoices else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    


signals.post_save.connect(points_settings_saved, sender=RewardPointsSettings)
signals.post_delete.connect(points_settings_deleted, sender=RewardPointsSettings)
signals.post_save.connect(reward_points_saved, sender=RewardPoints)
signals.post_delete.connect(reward_points_deleted, sender=RewardPoints)
signals.post_save.connect(reward_points_by_id_saved, sender=RewardPoints)
signals.post_delete.connect(reward_points_by_id_deleted, sender=RewardPoints)
signals.post_save.connect(store_product_saved, sender=RewardStoreProduct)
signals.post_delete.connect(store_product_deleted, sender=RewardStoreProduct)
signals.post_save.connect(store_product_by_id_saved, sender=RewardStoreProduct)
signals.post_delete.connect(store_product_by_id_deleted, sender=RewardStoreProduct)
signals.post_save.connect(store_product_review_saved, sender=RewardStoreProductReview)
signals.post_delete.connect(store_product_review_deleted, sender=RewardStoreProductReview)
signals.post_save.connect(store_product_review_reaction_saved, sender=RewardStoreProductReviewReaction)
signals.post_delete.connect(store_product_review_reaction_deleted, sender=RewardStoreProductReviewReaction)
signals.post_save.connect(store_product_selection_cart_by_username_saved, sender=RewardStoreProductSelectionCart)
signals.post_delete.connect(store_product_selection_cart_by_username_deleted, sender=RewardStoreProductSelectionCart)
signals.post_save.connect(store_product_selection_buy_saved, sender=RewardStoreProductSelectionBuy)
signals.post_delete.connect(store_product_selection_buy_deleted, sender=RewardStoreProductSelectionBuy)
signals.post_save.connect(store_product_selection_buy_by_username_saved, sender=RewardStoreProductSelectionBuy)
signals.post_delete.connect(store_product_selection_buy_by_username_deleted, sender=RewardStoreProductSelectionBuy)
signals.post_save.connect(point_history_by_username_saved, sender=RewardPointsHistory)
signals.post_delete.connect(point_history_by_username_deleted, sender=RewardPointsHistory)