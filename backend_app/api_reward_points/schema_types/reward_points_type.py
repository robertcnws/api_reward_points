import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardPoints,
)
from api_users.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
    
class RewardPointsType(MongoengineObjectType):
    user = graphene.Field(LoginUserType)
    invoices = graphene.List(RewardInvoiceType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = RewardPoints
        
    def resolve_user(self, info):
        return self.user
    
    def resolve_invoices(self, info):
        return self.invoices
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None