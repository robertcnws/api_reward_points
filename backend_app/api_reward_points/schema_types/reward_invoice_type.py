import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardInvoice,
)
from api_reward_points.schema_types.reward_invoice_line_item_type import RewardInvoiceLineItemType
from api_reward_points.schema_types.reward_invoice_tax_type import RewardInvoiceTaxType
    
class RewardInvoiceType(MongoengineObjectType):
    line_items = graphene.List(RewardInvoiceLineItemType)
    taxes = graphene.List(RewardInvoiceTaxType)

    class Meta:
        model = RewardInvoice

    def resolve_line_items(self, info):
        return self.line_items

    def resolve_taxes(self, info):
        return self.taxes