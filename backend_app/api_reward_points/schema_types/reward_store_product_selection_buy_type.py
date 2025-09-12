import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProductSelectionBuy,
)
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_store_product_selection_type import RewardStoreProductSelectionType
from api_users.schema import LoginUserType

class RewardStoreProductSelectionBuyType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    redeemed_time = graphene.String()
    store_product_selection = graphene.Field(RewardStoreProductSelectionType)
    salesorder_person = graphene.Field(LoginUserType)
    
    class Meta:
        model = RewardStoreProductSelectionBuy
    
    def resolve_store_product_selection(self, info):
        return self.store_product_selection if self.store_product_selection else None
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_redeemed_time(self, info):
        return datetime_to_timezone(self.redeemed_time) if self.redeemed_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_salesorder_person(self, info):
        return self.salesorder_person if self.salesorder_person else None