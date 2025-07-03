import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProductReviewReaction,
)
from api_users.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
    
    
class RewardStoreProductReviewReactionDetailsType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user = graphene.Field(LoginUserType)
    
    class Meta:
        model = RewardStoreProductReviewReaction
        exclude_fields = ("store_product_review",)

    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_user(self, info):
        return self.user if self.user else None