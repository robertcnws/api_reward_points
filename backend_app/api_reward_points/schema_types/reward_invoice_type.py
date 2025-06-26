import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from api_reward_points.models import (
    RewardInvoice,
)
from api_reward_points.schema_types.reward_invoice_line_item_type import RewardInvoiceLineItemType
from api_reward_points.schema_types.reward_invoice_tax_type import RewardInvoiceTaxType


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class RewardInvoiceType(MongoengineObjectType):
    line_items = graphene.List(RewardInvoiceLineItemType)
    taxes = graphene.List(RewardInvoiceTaxType)

    class Meta:
        model = RewardInvoice

    def resolve_line_items(self, info):
        return self.line_items

    def resolve_taxes(self, info):
        return self.taxes