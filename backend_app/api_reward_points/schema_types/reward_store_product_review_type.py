import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProductReview,
    RewardStoreProductReviewReaction,
)
from api_users.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_store_product_review_reaction_type import RewardStoreProductReviewReactionDetailsType
    
class RewardStoreProductReviewType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user = graphene.Field(LoginUserType)
    
    class Meta:
        model = RewardStoreProductReview
        
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_user(self, info):
        return self.user if self.user else None
    

class RewardStoreProductReviewDetailsType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    user = graphene.Field(LoginUserType)
    reactions = graphene.List(RewardStoreProductReviewReactionDetailsType, description="List of reactions to the review")

    class Meta:
        model = RewardStoreProductReview
        exclude_fields = ("store_product",)
        
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_user(self, info):
        return self.user if self.user else None
    
    def resolve_reactions(self, info):
        return RewardStoreProductReviewReaction.objects(store_product_review=self).all() if self.id else []