import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardSalesOrder,
)
from utils.json_datetime import datetime_to_timezone
from api_users.schema import LoginUserType
from api_reward_points.schema_types.reward_invoice_line_item_type import RewardInvoiceLineItemType
from api_reward_points.schema_types.reward_invoice_tax_type import RewardInvoiceTaxType
    
class RewardSalesOrderType(MongoengineObjectType):
    line_items = graphene.List(RewardInvoiceLineItemType)
    last_modified_time = graphene.String()
    user = graphene.Field(LoginUserType)

    class Meta:
        model = RewardSalesOrder

    def resolve_line_items(self, info):
        return self.line_items
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_user(self, info):
        return self.user