import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardAttachment,
)
from api_authorization.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
    
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