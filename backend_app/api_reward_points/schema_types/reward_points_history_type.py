import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardPointsHistory,
)
from api_reward_points.schema_types.reward_points_type import RewardPointsType
from utils.json_datetime import JSONDateTime, datetime_to_timezone
    
class RewardPointsHistoryType(MongoengineObjectType):
    info = JSONDateTime()
    created_time = graphene.String()
    reward_points = graphene.Field(RewardPointsType)

    class Meta:
        model = RewardPointsHistory
        
    def resolve_info(self, info):
        return self.info
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_reward_points(self, info):
        return self.reward_points if self.reward_points else None