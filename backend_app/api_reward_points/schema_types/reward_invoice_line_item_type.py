import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from api_reward_points.models import (
    RewardInvoiceLineItem,
)
    

class RewardInvoiceLineItemType(MongoengineObjectType):
    class Meta:
        model = RewardInvoiceLineItem
    
