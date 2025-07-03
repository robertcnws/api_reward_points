import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardStoreProduct,
    RewardStoreProductReview,    
)
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_attachment_type import RewardAttachmentType
from api_reward_points.schema_types.reward_store_product_review_type import RewardStoreProductReviewDetailsType
    
class RewardStoreProductType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    attachments = graphene.List(RewardAttachmentType, description="List of attachments related to the store product")
    
    class Meta:
        model = RewardStoreProduct
        
    def resolve_attachments(self, info):
        return self.attachments if self.attachments else []
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
class RewardStoreProductDetailsType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    attachments = graphene.List(RewardAttachmentType, description="List of attachments related to the store product")
    reviews = graphene.List(RewardStoreProductReviewDetailsType, description="List of reviews for the store product")
    
    class Meta:
        model = RewardStoreProduct
        
    
    def resolve_attachments(self, info):
        return self.attachments if self.attachments else []
    
    def resolve_reviews(self, info):
        return RewardStoreProductReview.objects(store_product=self).all() if self.id else []
        
    
    