import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardInvoiceTax,
)
    
class RewardInvoiceTaxType(MongoengineObjectType):
    class Meta:
        model = RewardInvoiceTax