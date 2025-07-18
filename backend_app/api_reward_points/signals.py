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
    RewardStoreProductSelection,
    RewardStoreProductSelectionCart,
    RewardStoreProductSelectionBuy,
    RewardPointsHistory,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import api_reward_points.signal_events as signal_events

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
    event = signal_events.event_point_history(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_point_history(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    # print('full_selection', full_selection)
    event = signal_events.event_store_product_selection_buy(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)('store_product_selection_buy', serialize_datetime(event))


def store_product_selection_buy_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.store_product_selection,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_store_product_selection_buy(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    # print('full_selection_by_username', full_selection)
    event = signal_events.event_store_product_selection_buy(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product_selection_buy(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product_selection_cart(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product_selection_cart(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    selections = RewardStoreProductSelection.objects(store_product=document).only('id')
    if not selections:
        return
    sel_ids = [sel.id for sel in selections]
    related_buys = RewardStoreProductSelectionBuy.objects(store_product_selection__in=sel_ids)
    related_carts = RewardStoreProductSelectionCart.objects(store_product_selection__in=sel_ids)

    for buy in related_buys:
        sel_data = transform_data_to_mongo(
            buy.store_product_selection,
            exclude_fields=['password'],
        )
        sel_data = camelize(sel_data)

        event_buy = signal_events.event_store_product_selection_buy(
            type='created' if created else 'updated',
            document=buy,
            full_selection=sel_data
        )

        username = buy.store_product_selection.user.username
        group_name = f"store_product_selection_buy_{username}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            serialize_datetime(event_buy)
        )
        async_to_sync(channel_layer.group_send)(
            'store_product_selection_buy',
            serialize_datetime(event_buy)
        )
        
    for cart in related_carts:
        sel_data = transform_data_to_mongo(
            cart.store_product_selection,
            exclude_fields=['password'],
        )
        sel_data = camelize(sel_data)

        event_cart = signal_events.event_store_product_selection_cart(
            type='created' if created else 'updated',
            document=cart,
            full_selection=sel_data
        )

        username = cart.store_product_selection.user.username
        group_name = f"store_product_selection_cart_{username}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            serialize_datetime(event_cart)
        )
    

def store_product_by_id_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.id)}"
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_store_product(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product_review(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)(group_name, serialize_datetime(event))
    
    
def store_product_review_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"store_product_{str(document.store_product.id)}"
    full_selection = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_store_product_review(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
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
    event = signal_events.event_store_product_review_reaction(
        type='created',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_review=full_selection_review
    )
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
    event = signal_events.event_store_product_review_reaction(
        type='deleted',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_review=full_selection_review
    )
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
    event = signal_events.event_store_product(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)('store_product', serialize_datetime(event))
    
    selections = RewardStoreProductSelection.objects(store_product=document).only('id')
    if not selections:
        return
    sel_ids = [sel.id for sel in selections]
    related_buys = RewardStoreProductSelectionBuy.objects(store_product_selection__in=sel_ids)
    related_carts = RewardStoreProductSelectionCart.objects(store_product_selection__in=sel_ids)

    for buy in related_buys:
        sel_data = transform_data_to_mongo(
            buy.store_product_selection,
            exclude_fields=['password'],
        )
        sel_data = camelize(sel_data)

        event_buy = signal_events.event_store_product_selection_buy(
            type='created' if created else 'updated',
            document=buy,
            full_selection=sel_data
        )

        username = buy.store_product_selection.user.username
        group_name = f"store_product_selection_buy_{username}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            serialize_datetime(event_buy)
        )
        async_to_sync(channel_layer.group_send)(
            'store_product_selection_buy',
            serialize_datetime(event_buy)
        )

    for cart in related_carts:
        sel_data = transform_data_to_mongo(
            cart.store_product_selection,
            exclude_fields=['password'],
        )
        sel_data = camelize(sel_data)

        event_cart = signal_events.event_store_product_selection_cart(
            type='created' if created else 'updated',
            document=cart,
            full_selection=sel_data
        )

        username = cart.store_product_selection.user.username
        group_name = f"store_product_selection_cart_{username}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            serialize_datetime(event_cart)
        )


def store_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.attachments,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_store_product(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)('store_product', serialize_datetime(event))

##########################################################################
# PointsSettings
##########################################################################

def points_settings_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = signal_events.event_points_settings(
        type='created' if created else 'updated',
        document=document
    )
    async_to_sync(channel_layer.group_send)('points_settings', serialize_datetime(event))
    
    
def points_settings_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = signal_events.event_points_settings(
        type='deleted',
        document=document
    )
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
    event = signal_events.event_reward_points(
        type='created' if created else 'updated',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_invoices=full_selection_invoices
    )
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
    event = signal_events.event_reward_points(
        type='deleted',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_invoices=full_selection_invoices
    )
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
    event = signal_events.event_reward_points(
        type='created' if created else 'updated',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_invoices=full_selection_invoices
    )
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
    event = signal_events.event_reward_points(
        type='deleted',
        document=document,
        full_selection_user=full_selection_user,
        full_selection_invoices=full_selection_invoices
    )
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