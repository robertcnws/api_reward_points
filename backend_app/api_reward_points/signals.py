from mongoengine import signals
from utils.data_util import serialize_datetime

from api_reward_points.models import (
    RewardPointsSettings,
    RewardPoints,
    RewardStoreProduct,
    RewardStoreProductReview,
    RewardStoreProductReviewReaction,
    RewardStoreProductSelectionCart,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json


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
    event = {
        'type': 'store_product_selection_cart_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "storeProductSelection": str(document.store_product_selection.id) if document.store_product_selection else None,
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
    event = {
        'type': 'store_product_selection_cart_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "storeProductSelection": str(document.store_product_selection.id) if document.store_product_selection else None,
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
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def store_product_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.id)}"
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product.id)}"
    event = {
        'type': 'store_product_review_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
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
    event = {
        'type': 'store_product_review_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
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
    event = {
        'type': 'store_product_review_reaction_update',
        'message': {
            'type': 'created',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "storeProductReview": str(document.store_product_review.id),
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
    event = {
        'type': 'store_product_review_reaction_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "storeProductReview": str(document.store_product_review.id),
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
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": [str(a.id) for a in document.attachments],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('store_product', serialize_datetime(event))


def store_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'store_product_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": [str(a.id) for a in document.attachments],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
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
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('reward_points', serialize_datetime(event))
    
    
def reward_points_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
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
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    

def reward_points_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"reward_points_{str(document.id)}"
    event = {
        'type': 'reward_points_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "user": str(document.user.id) if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "invoices": [str(invoice.id) for invoice in document.invoices],
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