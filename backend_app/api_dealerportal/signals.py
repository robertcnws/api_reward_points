from mongoengine import signals
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from utils.data_util import serialize_datetime, transform_data_to_mongo, camelize
from utils.model_util import to_msgpack_safe

import api_dealerportal.signal_events as signal_events

from api_dealerportal.models import (
    DealerportalQuote,
    DealerportalQuoteProduct,
    DealerportalOrder,
)


##########################################################################
# DealerportalQuote - ALL (list global)
##########################################################################

def dealerportal_quote_saved(sender, document, **kwargs):
    created = kwargs.get("created", False)
    channel_layer = get_channel_layer()

    # owner selection (NO IDs string si ya tienes LoginUserType)
    owner_payload = transform_data_to_mongo(document.owner, exclude_fields=["password"]) if document.owner else None
    owner_payload = camelize(owner_payload) if owner_payload else None

    event = signal_events.event_dealerportal_quote(
        type="created" if created else "updated",
        document=document,
        full_selection_owner=owner_payload
    )

    # global list group
    async_to_sync(channel_layer.group_send)(
        "dealerportal_quote",
        to_msgpack_safe(event)
    )

    # owner list group
    if document.owner:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_quote_{str(document.owner.id)}",
            to_msgpack_safe(event)
        )

    # quote detail group
    async_to_sync(channel_layer.group_send)(
        f"dealerportal_quote_{str(document.id)}",
        to_msgpack_safe(event)
    )


def dealerportal_quote_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()

    owner_payload = transform_data_to_mongo(document.owner, exclude_fields=["password"]) if document.owner else None
    owner_payload = camelize(owner_payload) if owner_payload else None

    event = signal_events.event_dealerportal_quote(
        type="deleted",
        document=document,
        full_selection_owner=owner_payload
    )

    async_to_sync(channel_layer.group_send)(
        "dealerportal_quote",
        to_msgpack_safe(event)
    )

    if document.owner:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_quote_{str(document.owner.id)}",
            to_msgpack_safe(event)
        )

    async_to_sync(channel_layer.group_send)(
        f"dealerportal_quote_{str(document.id)}",
        to_msgpack_safe(event)
    )

##########################################################################
# DealerportalQuoteProduct - emits to quote groups
##########################################################################

def dealerportal_quote_product_saved(sender, document, **kwargs):
    created = kwargs.get("created", False)
    channel_layer = get_channel_layer()

    quote = document.quote
    if not quote:
        return

    # product payload (RewardFullItemType ya existe)
    product_payload = transform_data_to_mongo(document.product, exclude_fields=["password"]) if document.product else None
    product_payload = camelize(product_payload) if product_payload else None

    event = signal_events.event_dealerportal_quote_product(
        type="created" if created else "updated",
        document=document,
        full_selection_product=product_payload
    )

    # quote detail group
    async_to_sync(channel_layer.group_send)(
        f"dealerportal_quote_{str(quote.id)}",
        to_msgpack_safe(event)
    )

    # owner list group (para refrescar fila/contador)
    if quote.owner:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_quote_{str(quote.owner.id)}",
            to_msgpack_safe(event)
        )

    # global list group (admin)
    async_to_sync(channel_layer.group_send)(
        "dealerportal_quote",
        to_msgpack_safe(event)
    )


def dealerportal_quote_product_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()

    quote = document.quote
    quote_id = str(quote.id) if quote else None
    owner_id = str(quote.owner.id) if quote and quote.owner else None

    product_payload = transform_data_to_mongo(document.product, exclude_fields=["password"]) if document.product else None
    product_payload = camelize(product_payload) if product_payload else None

    event = signal_events.event_dealerportal_quote_product(
        type="deleted",
        document=document,
        full_selection_product=product_payload
    )

    if quote_id:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_quote_{quote_id}",
            to_msgpack_safe(event)
        )

    if owner_id:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_quote_{owner_id}",
            to_msgpack_safe(event)
        )

    async_to_sync(channel_layer.group_send)(
        "dealerportal_quote",
        to_msgpack_safe(event)
    )
    
    
##########################################################################
# DealerportalOrder - ALL (list global)
##########################################################################

def dealerportal_order_saved(sender, document, **kwargs):
    created = kwargs.get("created", False)
    channel_layer = get_channel_layer()

    owner_payload = transform_data_to_mongo(document.owner, exclude_fields=["password"]) if document.owner else None
    owner_payload = camelize(owner_payload) if owner_payload else None

    quote_payload = transform_data_to_mongo(document.quote) if document.quote else None
    quote_payload = camelize(quote_payload) if quote_payload else None

    event = signal_events.event_dealerportal_order(
        type="created" if created else "updated",
        document=document,
        full_selection_owner=owner_payload,
        full_selection_quote=quote_payload
    )

    async_to_sync(channel_layer.group_send)(
        "dealerportal_order",
        to_msgpack_safe(event)
    )

    if document.owner:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_order_{str(document.owner.id)}",
            to_msgpack_safe(event)
        )
        
    if document.quote:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_order_{str(document.quote.id)}",
            to_msgpack_safe(event)
        )

    async_to_sync(channel_layer.group_send)(
        f"dealerportal_order_{str(document.id)}",
        to_msgpack_safe(event)
    )
    
    
def dealerportal_order_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()

    owner_payload = transform_data_to_mongo(document.owner, exclude_fields=["password"]) if document.owner else None
    owner_payload = camelize(owner_payload) if owner_payload else None

    quote_payload = transform_data_to_mongo(document.quote) if document.quote else None
    quote_payload = camelize(quote_payload) if quote_payload else None

    event = signal_events.event_dealerportal_order(
        type="deleted",
        document=document,
        full_selection_owner=owner_payload,
        full_selection_quote=quote_payload
    )

    async_to_sync(channel_layer.group_send)(
        "dealerportal_order",
        to_msgpack_safe(event)
    )

    if document.owner:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_order_{str(document.owner.id)}",
            to_msgpack_safe(event)
        )
        
    if document.quote:
        async_to_sync(channel_layer.group_send)(
            f"dealerportal_order_{str(document.quote.id)}",
            to_msgpack_safe(event)
        )

    async_to_sync(channel_layer.group_send)(
        f"dealerportal_order_{str(document.id)}",
        to_msgpack_safe(event)
    )


##########################################################################
# Connect signals
##########################################################################

signals.post_save.connect(dealerportal_quote_saved, sender=DealerportalQuote)
signals.post_delete.connect(dealerportal_quote_deleted, sender=DealerportalQuote)

signals.post_save.connect(dealerportal_quote_product_saved, sender=DealerportalQuoteProduct)
signals.post_delete.connect(dealerportal_quote_product_deleted, sender=DealerportalQuoteProduct)

signals.post_save.connect(dealerportal_order_saved, sender=DealerportalOrder)
signals.post_delete.connect(dealerportal_order_deleted, sender=DealerportalOrder)
