import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from api_reward_points.models import (
    RewardPointsHistory,
)
from utils.json_datetime import JSONDateTime, datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class RewardPointsHistoryType(MongoengineObjectType):
    info = JSONDateTime()
    created_time = graphene.String()
    
    class Meta:
        model = RewardPointsHistory
        
    def resolve_info(self, info):
        return self.info
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None