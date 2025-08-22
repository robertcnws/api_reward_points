from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import (
    MyTokenObtainPairSerializer, 
    MyTokenObtainTransferPairSerializer,
    RevocationCheckTokenRefreshSerializer,
)
from api_authorization.repository import (
    repository_authorization
)
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


####################################
# TOKEN AUTHENTICATION VIEW
####################################

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    
####################################
# TOKEN TRANSFER AUTHENTICATION VIEW
####################################

class MyTokenObtainTransferPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainTransferPairSerializer


####################################
# TOKEN REFRESH VIEW
####################################

class MyTokenRefreshView(TokenRefreshView):
    serializer_class = RevocationCheckTokenRefreshSerializer


# HEALTH CHECK VIEW

@csrf_exempt
def health_check(request):
    return JsonResponse({'status': 'ok'})


@csrf_exempt
def is_user_verified(request):
    return repository_authorization.is_user_verified(request)


@csrf_exempt
def transfer_login(request):
    return repository_authorization.transfer_login(request)


@csrf_exempt
def login(request):
    return repository_authorization.login(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    return repository_authorization.logout(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    return repository_authorization.register(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_user(request):
    return repository_authorization.verify_user(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_code(request):
    return repository_authorization.send_verification_code(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    return repository_authorization.reset_password(request)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def update_password(request):
    return repository_authorization.update_password(request)