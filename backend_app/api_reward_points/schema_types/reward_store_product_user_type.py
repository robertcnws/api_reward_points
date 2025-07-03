import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProductUser,
)
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_store_product_type import RewardStoreProductType
from api_users.schema import LoginUserType
    
class RewardStoreProductUserType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user = graphene.Field(LoginUserType)
    product = graphene.Field(RewardStoreProductType)
    
    class Meta:
        model = RewardStoreProductUser
        
    def resolve_user(self, info):
        return self.user
    
    def resolve_product(self, info):
        return self.product
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None