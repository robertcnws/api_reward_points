import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
# from api_reward_points.ws_urls import websocket_urlpatterns as api_websocket_urlpatterns
# from api_users.ws_urls import websocket_urlpatterns as user_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_reward_points.settings')
django.setup()

# urlpatterns = api_websocket_urlpatterns + user_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # "websocket": AuthMiddlewareStack(
    #     URLRouter(
    #         urlpatterns
    #     )
    # ),
})