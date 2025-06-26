from django.utils import timezone
from api_authorization.models import LoginUser
from mongoengine import (
    Document, 
    DynamicField, 
    StringField, 
    DateTimeField, 
    ListField, 
    ReferenceField,
    IntField,
    FloatField,
    BooleanField,
)

# Create your models here.
class RewardItem(Document):
    item = DynamicField(required=True)
    item_attachments = ListField(DynamicField(), null=True, blank=True, default=list)
    assigned_points = IntField(default=0, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    can_be_bought = BooleanField(default=True, null=True)
    
    meta = {
        'collection': 'reward_item',
        'indexes': [
            'created_time',
            'last_modified_time',
        ],
        'ordering': ['-created_time'],
    }
    
    def __str__(self):
        return f"RewardItem(item={self.item}, created_time={self.created_time})"