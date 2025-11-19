from django.urls import path
from .consumers import (
    FunctionalityConsumer,
)

websocket_urlpatterns = [
    path('api/authorization/ws/functionalities/', FunctionalityConsumer.as_asgi(), name='ws_functionality'),
]