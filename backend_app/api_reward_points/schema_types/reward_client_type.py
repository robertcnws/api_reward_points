import graphene
import api_reward_points.schema_types.converters
from graphene_mongo import MongoengineObjectType
from bson import ObjectId
from bson.dbref import DBRef
from mongoengine.errors import DoesNotExist, ValidationError
from api_authorization.models import LoginUser
from api_reward_points.models import (
    RewardPoints,
    RewardInvoice,
    RewardSalesOrder,
)
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_sales_order_type import RewardSalesOrderType

def get_reward_points_doc(user, only_fields=None):
    qs = RewardPoints.objects(user=user)
    if only_fields:
        qs = qs.only(*only_fields)
    return qs.first() 
    
class RewardClientsType(MongoengineObjectType):
    invoices = graphene.List(RewardInvoiceType)
    sales_orders = graphene.List(RewardSalesOrderType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    total_available_points = graphene.Int()
    reward_points_id = graphene.String()
    is_sync_with_zoho = graphene.Boolean()

    class Meta:
        model = LoginUser

    def resolve_invoices(self, info):
        rp = get_reward_points_doc(self, only_fields=["invoices"])
        items = rp.invoices if (rp and rp.invoices) else []
        docs = []
        for x in items:
            if hasattr(x, "fetch"):           # LazyReferenceField
                docs.append(x.fetch())
            elif isinstance(x, DBRef):        # DBRef crudo
                docs.append(RewardInvoice.objects.with_id(x.id))
            elif isinstance(x, ObjectId):     # guardaste solo el ObjectId
                docs.append(RewardInvoice.objects.with_id(x))
            else:                              # ya es Document
                docs.append(x)
        return [d for d in docs if d is not None]

    def resolve_sales_orders(self, info):
        rp = get_reward_points_doc(self, only_fields=["sales_orders"])
        items = rp.sales_orders if (rp and rp.sales_orders) else []
        docs = []
        for x in items:
            if hasattr(x, "fetch"):
                docs.append(x.fetch())
            elif isinstance(x, DBRef):
                docs.append(RewardSalesOrder.objects.with_id(x.id))
            elif isinstance(x, ObjectId):
                docs.append(RewardSalesOrder.objects.with_id(x))
            else:
                docs.append(x)
        return [d for d in docs if d is not None]

    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_total_available_points(self, info):
        rp = get_reward_points_doc(
            self,
            only_fields=["total_assigned_points", "total_gained_points", "total_substracted_points"]
        )
        if not rp:
            return 0
        total_assigned_points = rp.total_assigned_points or 0
        total_gained_points = rp.total_gained_points or 0
        total_substracted_points = rp.total_substracted_points or 0
        return int(total_assigned_points + total_gained_points - total_substracted_points)

    def resolve_reward_points_id(self, info):
        rp = get_reward_points_doc(self, only_fields=["id"])
        return str(rp.id) if rp else None

    def resolve_is_sync_with_zoho(self, info):
        rp = get_reward_points_doc(self, only_fields=["is_sync_with_zoho"])
        return rp.is_sync_with_zoho if rp else False