# api_zoho/routing.py
from django.urls import path
from .consumers import (
    UserRoleConsumer,
    UserConsumer,
    NotificationUserConsumer,
    ExternalUserConsumer,
    SystemPermissionConsumer,
)

websocket_urlpatterns = [
    path('api/users/ws/user-roles/', UserRoleConsumer.as_asgi(), name='ws_user_roles'),
    path('api/users/ws/users/', UserConsumer.as_asgi(), name='ws_users'),
    path('api/users/ws/external-users/', ExternalUserConsumer.as_asgi(), name='ws_external_users'),
    path('api/users/ws/notification-users/', NotificationUserConsumer.as_asgi(), name='ws_notification_users'),
    path('api/users/ws/permissions/', SystemPermissionConsumer.as_asgi(), name='ws_system_permissions'),
]
