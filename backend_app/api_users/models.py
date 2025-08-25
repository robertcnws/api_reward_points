from mongoengine import (
    Document, 
    StringField, 
    DateTimeField, 
    DynamicField, 
    BooleanField,
    ReferenceField,
    IntField
)
from api_authorization.models import LoginUser 
from django.utils import timezone

# Create your models here.
class Notification(Document):
    module = StringField(max_length=255, null=True)
    info = StringField(null=True)
    info_id = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    type = StringField(max_length=255, null=True, default='load')
    meta = {
        'collection': 'notification',
        'indexes': [
            'module', 'info', 'created_time', 'last_modified_time', 'type', 'info_id'
        ],
        'verbose_name': 'Notification',
        'verbose_name_plural': 'Notifications'
    }
    def __str__(self):
        return self.info
    
class NotificationUser(Document):
    notification = ReferenceField(Notification, required=True, reverse_delete_rule=2)  # CASCADE
    username = StringField(max_length=255, required=True)
    user = ReferenceField(LoginUser, null=True, reverse_delete_rule=2)  # CASCADE
    read = BooleanField(default=False)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    meta = {
        'collection': 'notification_user',
        'indexes': [
            'username', 'read', 'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Notification User',
        'verbose_name_plural': 'Notification Users'
    }
    def __str__(self):
        return f'{self.username} - {self.notification.info}'
    
    
class IntroStep(Document):
    title = StringField(max_length=255, null=True)
    content = StringField(null=True)
    translation = DynamicField(null=True)
    order = IntField(null=True)
    meta = {
        'collection': 'intro_step',
        'indexes': [
            'title', 'order'
        ],
        'verbose_name': 'Intro Step',
        'verbose_name_plural': 'Intro Steps'
    }
    def __str__(self):
        return self.title