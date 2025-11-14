import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from bson import ObjectId
from bson.dbref import DBRef
from api_integration.models import (
    RewardItem,
    RewardFullItem,
    RewardFullItemgroup,
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
    
    
class RewardFullItemType(MongoengineObjectType):
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    group_id = graphene.String()
    class Meta:
        model = RewardFullItem
        
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_group_id(self, info):
        return str(self.group_id) if self.group_id else None
    
class RewardFullItemgroupType(MongoengineObjectType):
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    list_items = graphene.List(RewardFullItemType)
    class Meta:
        model = RewardFullItemgroup
        
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_list_items(self, info):
        items = RewardFullItem.objects(group_id=self.group_id)
        docs = []
        for x in items:
            if hasattr(x, 'fetch'):          
                docs.append(x.fetch())
            elif isinstance(x, DBRef):       
                docs.append(RewardFullItem.objects.with_id(x.id))
            elif isinstance(x, ObjectId):    
                docs.append(RewardFullItem.objects.with_id(x))
            else:                            
                docs.append(x)
        return [d for d in docs if d is not None]
        
        
class Query(graphene.ObjectType):
    all_reward_items = graphene.List(RewardItemType)
    reward_item_by_id = graphene.Field(RewardItemType, item_id=graphene.String(required=True))
    
    all_reward_full_items = graphene.List(RewardFullItemType)
    reward_full_item_by_id = graphene.Field(RewardFullItemType, item_id=graphene.String(required=True))
    
    all_reward_full_itemgroups = graphene.List(RewardFullItemgroupType)
    reward_full_itemgroup_by_id = graphene.Field(RewardFullItemgroupType, group_id=graphene.String(required=True))
    reward_full_itemgroups_by_zoho_org_id = graphene.List(RewardFullItemgroupType, zoho_org_id=graphene.String(required=True))

    def resolve_all_reward_items(self, info):
        return RewardItem.objects.all()

    def resolve_reward_item_by_id(self, info, item_id):
        existing = RewardItem.objects(__raw__={'item._id': item_id}).first()
        if existing:
            return existing
        
    def resolve_all_reward_full_items(self, info):
        return RewardFullItem.objects.all()
    
    def resolve_reward_full_item_by_id(self, info, item_id):
        existing = RewardFullItem.objects(item_id=ObjectId(item_id)).first()
        if existing:
            return existing
        
    def resolve_all_reward_full_itemgroups(self, info):
        return RewardFullItemgroup.objects.all()
    
    def resolve_reward_full_itemgroup_by_id(self, info, group_id):
        existing = RewardFullItemgroup.objects(group_id=ObjectId(group_id)).first()
        if existing:
            return existing
        
    def resolve_reward_full_itemgroups_by_zoho_org_id(self, info, zoho_org_id=None):
        if zoho_org_id:
            existing = RewardFullItemgroup.objects(zoho_org_id=zoho_org_id)
        else:
            existing = RewardFullItemgroup.objects.all()
        return list(existing) if existing else []