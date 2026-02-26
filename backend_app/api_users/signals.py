from api_reward_points.signals_reward_clients import _emit_reward_client_event_for_user
from mongoengine import signals
from utils.data_util import (
    serialize_datetime,
    transform_data_to_mongo,
    camelize,
)
from api_authorization.models import (
    UserRole, 
    LoginUser,
    ExternalUsers,
    SystemPermission,
)
from api_users.models import (
    NotificationUser,
)
from api_authorization.models import LoginUser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import re
import api_users.signal_events as signal_events

# ----------------------------
# helpers
# ----------------------------
def _safe_group_username(username: str) -> str:
    # Channels group name: letras/números/._- (y <= 100 chars)
    u = (username or "").strip().lower()
    u = re.sub(r"[^a-z0-9_\-\.]", "_", u)
    return u[:80]

##########################################################################
# SystemPermission
##########################################################################

def system_permission_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = signal_events.event_system_permission(
        type='created' if created else 'updated',
        document=document
    )
    async_to_sync(channel_layer.group_send)('system_permission', serialize_datetime(event))
    
    
def system_permission_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = signal_events.event_system_permission(
        type='deleted',
        document=document
    )
    async_to_sync(channel_layer.group_send)('system_permission', serialize_datetime(event))

##########################################################################
# UserRole
##########################################################################

def user_role_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = signal_events.event_user_role(
        type='created' if created else 'updated',
        document=document
    )
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
def user_role_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = signal_events.event_user_role(
        type='deleted',
        document=document
    )
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
##########################################################################
# User
##########################################################################

def user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    
    full_selection = transform_data_to_mongo(
        document.user_role,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    
    full_selection_list_permissions = []
    for perm in (document.customerportal_permissions or []):
        perm_data = transform_data_to_mongo(
            perm,
            exclude_fields=[ 'password' ],
        )
        full_selection_list_permissions.append(camelize(perm_data))
        
    event = signal_events.event_user(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection,
        full_selection_list_permissions=full_selection_list_permissions
    )
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    _emit_reward_client_event_for_user(document, 'created' if created else 'updated')
    
    
def user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.user_role,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)

    full_selection_list_permissions = []
    for perm in (document.customerportal_permissions or []):
        perm_data = transform_data_to_mongo(
            perm,
            exclude_fields=[ 'password' ],
        )
        full_selection_list_permissions.append(camelize(perm_data))

    event = signal_events.event_user(
        type='deleted',
        document=document,
        full_selection=full_selection,
        full_selection_list_permissions=full_selection_list_permissions
    )
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    # _emit_reward_client_event_for_user(document, 'deleted')
    

# ----------------------------
# User by username (NEW)
# ----------------------------
def user_by_username_saved(sender, document, **kwargs):
    created = kwargs.get("created", False)
    channel_layer = get_channel_layer()

    username = getattr(document, "username", None)
    if not username:
        return

    # construye el mismo payload que ya usas para "user"
    full_selection = transform_data_to_mongo(document.user_role, exclude_fields=["password"])
    full_selection = camelize(full_selection)

    full_selection_list_permissions = []
    for perm in (document.customerportal_permissions or []):
        perm_data = transform_data_to_mongo(perm, exclude_fields=["password"])
        full_selection_list_permissions.append(camelize(perm_data))

    event = signal_events.event_user(
        type="created" if created else "updated",
        document=document,
        full_selection=full_selection,
        full_selection_list_permissions=full_selection_list_permissions,
    )

    group_name = f"user_by_username.{_safe_group_username(username)}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "user_by_username_update",
            "message": serialize_datetime(event),
        },
    )


def user_by_username_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()

    username = getattr(document, "username", None)
    if not username:
        return

    full_selection = transform_data_to_mongo(document.user_role, exclude_fields=["password"])
    full_selection = camelize(full_selection)

    full_selection_list_permissions = []
    for perm in (document.customerportal_permissions or []):
        perm_data = transform_data_to_mongo(perm, exclude_fields=["password"])
        full_selection_list_permissions.append(camelize(perm_data))

    event = signal_events.event_user(
        type="deleted",
        document=document,
        full_selection=full_selection,
        full_selection_list_permissions=full_selection_list_permissions,
    )

    group_name = f"user_by_username.{_safe_group_username(username)}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "user_by_username_update",
            "message": serialize_datetime(event),
        },
    )
    
    
##########################################################################    
# Notification User
##########################################################################

def notification_user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection_notification = transform_data_to_mongo(
        document.notification,
        exclude_fields=[ 'password' ],
    )
    full_selection_notification = camelize(full_selection_notification)
    
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    
    event = signal_events.event_notification_user(
        type='created' if created else 'updated',
        document=document,
        full_selection_notification=full_selection_notification,
        full_selection_user=full_selection_user
    )
    async_to_sync(channel_layer.group_send)('notification_user', serialize_datetime(event))


def notification_user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection_notification = transform_data_to_mongo(
        document.notification,
        exclude_fields=[ 'password' ],
    )
    full_selection_notification = camelize(full_selection_notification)
    
    full_selection_user = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection_user = camelize(full_selection_user)
    event = signal_events.event_notification_user(
        type='deleted',
        document=document,
        full_selection_notification=full_selection_notification,
        full_selection_user=full_selection_user
    )
    async_to_sync(channel_layer.group_send)('notification_user', serialize_datetime(event))
    
    
##########################################################################
# ExternalUser
##########################################################################

def external_user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_external_user(
        type='created' if created else 'updated',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)('external_user', serialize_datetime(event))


def external_user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection = transform_data_to_mongo(
        document.user,
        exclude_fields=[ 'password' ],
    )
    full_selection = camelize(full_selection)
    event = signal_events.event_external_user(
        type='deleted',
        document=document,
        full_selection=full_selection
    )
    async_to_sync(channel_layer.group_send)('external_user', serialize_datetime(event))
    


signals.post_save.connect(user_role_saved, sender=UserRole)
signals.post_delete.connect(user_role_deleted, sender=UserRole)
signals.post_save.connect(user_saved, sender=LoginUser)
signals.post_delete.connect(user_deleted, sender=LoginUser)
signals.post_save.connect(notification_user_saved, sender=NotificationUser)
signals.post_delete.connect(notification_user_deleted, sender=NotificationUser)
signals.post_save.connect(system_permission_saved, sender=SystemPermission)
signals.post_delete.connect(system_permission_deleted, sender=SystemPermission)
signals.post_save.connect(user_by_username_saved, sender=LoginUser)
signals.post_delete.connect(user_by_username_deleted, sender=LoginUser)
