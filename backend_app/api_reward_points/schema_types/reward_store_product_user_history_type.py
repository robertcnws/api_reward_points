import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProductUserHistory,
)
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_store_product_user_type import RewardStoreProductUserType
    
class RewardStoreProductUserHistoryType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user_product = graphene.Field(RewardStoreProductUserType)
    
    class Meta:
        model = RewardStoreProductUserHistory
        
    def resolve_user_product(self, info):
        return self.user_product
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None