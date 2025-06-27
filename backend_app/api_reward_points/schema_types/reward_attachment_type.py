import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from api_reward_points.models import (
    RewardAttachment,
)
from api_authorization.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class RewardAttachmentType(MongoengineObjectType):
    user_upload = graphene.Field(LoginUserType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = RewardAttachment
        
    def resolve_user_upload(self, info):
        return self.user_upload if self.user_upload else None
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None