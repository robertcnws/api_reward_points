from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes, throttle_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

from api_users.repository import (
    repository_notifications,
    repository_trackings,
    repository_user_role,
    repository_users,
)

import logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


# ======================
# Throttles
# ======================
class AuthWriteThrottle(UserRateThrottle):
    scope = "auth_write"

class PublicThrottle(AnonRateThrottle):
    scope = "public"


# ======================
# Helpers
# ======================
def _ensure_json(request):
    """
    Rechaza si el POST no es JSON. Útil para justificar "unsafe methods are safe".
    No la uses en endpoints que aceptan multipart/form-data (p.ej. upload avatar).
    """
    if request.method == "POST" and request.content_type != "application/json":
        return Response({"detail": "Unsupported Media Type"}, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
    return None


# ============================================
# USER ROLE (estas deberían ser al menos auth)
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def create_user_role(request):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_user_role.create_user_role(request)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def edit_user_role(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_user_role.edit_user_role(request, id)

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_user_role(request, id):
    return repository_user_role.delete_user_role(request, id)

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_user_roles(request):
    return repository_user_role.delete_user_roles(request)


# ======================
# USERS
# ======================

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def create_user(request):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.create_user(request)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def edit_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.edit_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_password(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_password(request, id)

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_user(request, id):
    return repository_users.delete_user(request, id)

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_users(request):
    return repository_users.delete_users(request)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_approval_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_approval_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_verify_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_verify_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_show_tour_guide_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_show_tour_guide_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_show_intro_guide_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_show_intro_guide_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_about_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_about_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_school_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_school_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_address_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_address_user(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def change_social_user(request, id):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_users.change_social_user(request, id)

# Upload avatar: típicamente multipart/form-data → no usamos _ensure_json aquí
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def upload_avatar_user(request, id):
    return repository_users.upload_avatar_user(request, id)


# ======================
# NOTIFICATIONS
# ======================

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def remove_old_notifications(request):
    return repository_notifications.remove_old_notifications(request)

@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_notifications(request):
    return repository_notifications.delete_notifications(request)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def mark_as_read_notifications(request):
    bad = _ensure_json(request)
    if bad: return bad
    return repository_notifications.mark_as_read_notifications(request)


# ======================
# Tareas programadas (no vistas)
# ======================
def delete_old_notifications():
    return repository_notifications.delete_old_notifications()

def delete_old_trackings():
    return repository_trackings.delete_old_trackings()
