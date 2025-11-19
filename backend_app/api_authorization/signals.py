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
from api_authorization.models import Functionality
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import api_authorization.signal_events as signal_events

##########################################################################
# Functionality
##########################################################################

def functionality_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    full_selection_list_roles_allowed = []
    for perm in (document.roles_allowed or []):
        perm_data = transform_data_to_mongo(
            perm,
            exclude_fields=[ 'password' ],
        )
        full_selection_list_roles_allowed.append(camelize(perm_data))
    event = signal_events.event_functionality(
        type='created' if created else 'updated',
        document=document,
        full_selection_roles_allowed=full_selection_list_roles_allowed
    )
    async_to_sync(channel_layer.group_send)('functionality', serialize_datetime(event))
    
    
def functionality_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    full_selection_list_roles_allowed = []
    for perm in (document.roles_allowed or []):
        perm_data = transform_data_to_mongo(
            perm,
            exclude_fields=[ 'password' ],
        )
        full_selection_list_roles_allowed.append(camelize(perm_data))
    event = signal_events.event_functionality(
        type='deleted',
        document=document,
        full_selection_roles_allowed=full_selection_list_roles_allowed
    )
    async_to_sync(channel_layer.group_send)('functionality', serialize_datetime(event))
    
    
signals.post_save.connect(functionality_saved, sender=Functionality)
signals.post_delete.connect(functionality_deleted, sender=Functionality)