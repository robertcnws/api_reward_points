from django.http import JsonResponse
from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes, throttle_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    MyTokenObtainPairSerializer,
    MyTokenObtainTransferPairSerializer,
    RevocationCheckTokenRefreshSerializer,
)
from api_authorization.repository import repository_authorization

import logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


# ======================
#  Throttles por endpoint
# ======================
class PublicThrottle(AnonRateThrottle):
    scope = "public"

class LoginThrottle(AnonRateThrottle):
    scope = "login"

class ResetPwdThrottle(AnonRateThrottle):
    scope = "reset_password"

class RegisterThrottle(AnonRateThrottle):
    scope = "register"

class VerifyThrottle(AnonRateThrottle):
    scope = "verify"


# ======================
#  Token Views (JWT)
# ======================
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class MyTokenObtainTransferPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainTransferPairSerializer

class MyTokenRefreshView(TokenRefreshView):
    serializer_class = RevocationCheckTokenRefreshSerializer


# ======================
#  Public endpoints (sin cookies → sin CSRF)
#  Quitamos SessionAuthentication con @authentication_classes([])
# ======================

@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])              
@throttle_classes([PublicThrottle])
def health_check(request):
    return Response({"status": "ok"})

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([PublicThrottle])
def is_user_verified(request):
    return repository_authorization.is_user_verified(request)


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginThrottle])
def transfer_login(request):
    return repository_authorization.transfer_login(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginThrottle])
def login(request):
    return repository_authorization.login(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([PublicThrottle])
def logout(request):
    return repository_authorization.logout(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([RegisterThrottle])
def register(request):
    return repository_authorization.register(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([VerifyThrottle])
def verify_user(request):
    return repository_authorization.verify_user(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([VerifyThrottle])
def send_verification_code(request):
    return repository_authorization.send_verification_code(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([ResetPwdThrottle])
def reset_password(request):
    return repository_authorization.reset_password(request)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([ResetPwdThrottle])
def update_password(request):
    return repository_authorization.update_password(request)

@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([PublicThrottle])
def get_refetch_rewards_points(request, id):
    return repository_authorization.get_refetch_rewards_points(id)