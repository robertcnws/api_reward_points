# api_zoho/routing.py
from django.urls import path
from .consumers import (
    UserRoleConsumer,
    UserConsumer,
    NotificationUserConsumer,
)

websocket_urlpatterns = [
    path('api/users/ws/user-roles/', UserRoleConsumer.as_asgi(), name='ws_user_roles'),
    path('api/users/ws/users/', UserConsumer.as_asgi(), name='ws_users'),
    path('api/users/ws/notification-users/', NotificationUserConsumer.as_asgi(), name='ws_notification_users'),
]
