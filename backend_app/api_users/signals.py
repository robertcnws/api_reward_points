from mongoengine import signals
from utils.data_util import serialize_datetime
from api_authorization.models import (
    UserRole, 
    LoginUser,
)
from api_users.models import (
    NotificationUser,
)
from api_authorization.models import LoginUser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

##########################################################################
# UserRole
##########################################################################

def user_role_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_role_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
def user_role_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_role_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('user_role', serialize_datetime(event))
    
    
##########################################################################
# User
##########################################################################

def user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "username": document.username,
                "firstName": document.first_name,
                "lastName": document.last_name,
                "companyName": document.company_name,
                "email": document.email,
                "isStaff": document.is_staff,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "phoneNumber": document.phone_number,
                "password": document.password,
                "lastLogin": document.last_login,
                "dateJoined": document.date_joined,
                "token": document.token,
                "userRole": str(document.user_role.id) if document.user_role else None,
                "avatarUrl": document.avatar_url,
                "isVerified": document.is_verified,
                "isApproved": document.is_approved,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    
    
def user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'user_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "username": document.username,
                "firstName": document.first_name,
                "lastName": document.last_name,
                "companyName": document.company_name,
                "email": document.email,
                "isStaff": document.is_staff,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "phoneNumber": document.phone_number,
                "password": document.password,
                "lastLogin": document.last_login,
                "dateJoined": document.date_joined,
                "token": document.token,
                "userRole": str(document.user_role.id) if document.user_role else None,
                "avatarUrl": document.avatar_url,
                "isVerified": document.is_verified,
                "isApproved": document.is_approved,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('user', serialize_datetime(event))
    
    
##########################################################################    
# Notification User
##########################################################################

def notification_user_saved(sender, document, **kwargs):
    created = kwargs.get('created', False)
    channel_layer = get_channel_layer()
    event = {
        'type': 'notification_user_update',
        'message': {
            'type': 'created' if created else 'updated',
            "item": {
                "id": str(document.id),
                "notification": str(document.notification.id) if document.notification else None,
                "username": document.username,
                "user": str(document.user.id) if document.user else None,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    async_to_sync(channel_layer.group_send)('notification_user', serialize_datetime(event))


def notification_user_deleted(sender, document, **kwargs):
    channel_layer = get_channel_layer()
    event = {
        'type': 'notification_user_update',
        'message': {
            'type': 'deleted',
            "item": {
                "id": str(document.id),
                "notification": str(document.notification.id) if document.notification else None,
                "username": document.username,
                "user": str(document.user.id) if document.user else None,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    async_to_sync(channel_layer.group_send)('notification_user', serialize_datetime(event))
    


signals.post_save.connect(user_role_saved, sender=UserRole)
signals.post_delete.connect(user_role_deleted, sender=UserRole)
signals.post_save.connect(user_saved, sender=LoginUser)
signals.post_delete.connect(user_deleted, sender=LoginUser)
signals.post_save.connect(notification_user_saved, sender=NotificationUser)
signals.post_delete.connect(notification_user_deleted, sender=NotificationUser)
