from django.urls import re_path
from api_dealerportal.consumers import (
    DealerportalQuoteConsumer,
    DealerportalQuoteByOwnerConsumer,
    DealerportalQuoteByIdConsumer,
    DealerportalOrderConsumer,
    DealerportalOrderByOwnerConsumer,
    DealerportalOrderByQuoteConsumer,
    DealerportalOrderByIdConsumer,
)

websocket_urlpatterns = [
    re_path(
        r"api/dealerportal/ws/quotes/$", 
        DealerportalQuoteConsumer.as_asgi(), 
        name="ws_dealerportal_quotes"
    ),
    re_path(
        r"api/dealerportal/ws/quotes-owner/(?P<owner_id>[0-9a-fA-F]+)/$", 
        DealerportalQuoteByOwnerConsumer.as_asgi(),
        name="ws_dealerportal_quotes_by_owner"
    ),
    re_path(
        r"api/dealerportal/ws/quotes/(?P<quote_id>[0-9a-fA-F]+)/$", 
        DealerportalQuoteByIdConsumer.as_asgi(),
        name="ws_dealerportal_quotes_by_id"
    ),
    re_path(
        r"api/dealerportal/ws/orders/$", 
        DealerportalOrderConsumer.as_asgi(), 
        name="ws_dealerportal_orders"
    ),
    re_path(
        r"api/dealerportal/ws/orders-owner/(?P<owner_id>[0-9a-fA-F]+)/$", 
        DealerportalOrderByOwnerConsumer.as_asgi(), 
        name="ws_dealerportal_orders_by_owner"
    ),
    re_path(
        r"api/dealerportal/ws/orders-quote/(?P<quote_id>[0-9a-fA-F]+)/$", 
        DealerportalOrderByQuoteConsumer.as_asgi(), 
        name="ws_dealerportal_orders_by_quote"
    ),
    re_path(
        r"api/dealerportal/ws/orders/(?P<order_id>[0-9a-fA-F]+)/$", 
        DealerportalOrderByIdConsumer.as_asgi(), 
        name="ws_dealerportal_orders_by_id"
    ),
]
