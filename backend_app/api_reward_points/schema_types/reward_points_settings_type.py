import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardPointsSettings,
)
from utils.json_datetime import datetime_to_timezone
    
class RewardPointsSettingsType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = RewardPointsSettings
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None