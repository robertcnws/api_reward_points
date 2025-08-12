import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardPoints,
)
from api_users.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_sales_order_type import RewardSalesOrderType
    
class RewardPointsType(MongoengineObjectType):
    user = graphene.Field(LoginUserType)
    invoices = graphene.List(RewardInvoiceType)
    sales_orders = graphene.List(RewardSalesOrderType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    total_available_points = graphene.Int()
    
    class Meta:
        model = RewardPoints
        
    def resolve_user(self, info):
        return self.user
    
    def resolve_invoices(self, info):
        return self.invoices
    
    def resolve_sales_orders(self, info):
        return self.sales_orders
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_total_available_points(self, info):
        total_assigned_points = self.total_assigned_points or 0.0
        total_gained_points = self.total_gained_points or 0.0
        total_substracted_points = self.total_substracted_points or 0.0
        
        return int(total_assigned_points + total_gained_points - total_substracted_points)