# api_zoho/routing.py
from django.urls import path
from .consumers import (
    PointsSettingsConsumer,
    RewardPointsConsumer,
    RewardPointsByIdConsumer,
    StoreProductConsumer,
    RewardStoreProductByIdConsumer,
    RewardStoreProductSelectionCartByUsernameConsumer,
)

websocket_urlpatterns = [
    path(
        'api/reward-points/ws/points-settings/', 
        PointsSettingsConsumer.as_asgi(), 
        name='ws_points_settings'
    ),
    path(
        'api/reward-points/ws/reward-points/', 
        RewardPointsConsumer.as_asgi(), 
        name='ws_reward_points'
    ),
    path(
        'api/reward-points/ws/reward-points/<str:reward_points_id>/', 
        RewardPointsByIdConsumer.as_asgi(), 
        name='ws_reward_points_by_id'
    ),
    path(
        'api/reward-points/ws/store-product/', 
        StoreProductConsumer.as_asgi(), 
        name='ws_store_product'
    ),
    path(
        'api/reward-points/ws/store-product/<str:store_product_id>/', 
        RewardStoreProductByIdConsumer.as_asgi(), 
        name='ws_store_product_by_id'
    ),
    path(
        'api/reward-points/ws/store-product-selection-cart/<str:username>/', 
        RewardStoreProductSelectionCartByUsernameConsumer.as_asgi(), 
        name='ws_store_product_selection_cart_by_username'
    ),
]
