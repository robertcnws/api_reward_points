import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from bson import ObjectId
from api_integration.models import (
    RewardItem,
)
from utils.json_datetime import JSONDateTime, datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class RewardItemType(MongoengineObjectType):
    item = JSONDateTime()
    item_attachments = JSONDateTime()
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = RewardItem
        
    def resolve_item(self, info):
        return self.item or {}
    
    def resolve_item_attachments(self, info):
        return self.item_attachments or []
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
        
        
class Query(graphene.ObjectType):
    all_reward_items = graphene.List(RewardItemType)
    reward_item_by_id = graphene.Field(RewardItemType, item_id=graphene.String(required=True))

    def resolve_all_reward_items(self, info):
        return RewardItem.objects.all()

    def resolve_reward_item_by_id(self, info, item_id):
        existing = RewardItem.objects(__raw__={'item._id': item_id}).first()
        if existing:
            return existing