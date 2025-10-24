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
from api_users.schema import LoginUserType
from utils.json_datetime import datetime_to_timezone
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_sales_order_type import RewardSalesOrderType


def _fetch_doc(ref, Model):
    if ref is None:
        return None
    try:
        if hasattr(ref, "id") and not isinstance(ref, DBRef):  # ya es Document
            return ref
        if hasattr(ref, "fetch"):  # LazyReference
            return ref.fetch()
        if isinstance(ref, DBRef):  # DBRef crudo
            return Model.objects.with_id(ref.id)
        if isinstance(ref, ObjectId):  # solo ObjectId
            return Model.objects.with_id(ref)
    except (DoesNotExist, ValidationError):
        return None
    return None
    
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
        ref = getattr(self, "_data", {}).get("user", None) or getattr(self, "user", None)
        return _fetch_doc(ref, LoginUser)
    
    def resolve_invoices(self, info):
        # return self.invoices or []
        items = self.invoices or []
        docs = []
        for x in items:
            if hasattr(x, 'fetch'):           # LazyReferenceField
                docs.append(x.fetch())
            elif isinstance(x, DBRef):        # DBRef crudo
                docs.append(RewardInvoice.objects.with_id(x.id))
            elif isinstance(x, ObjectId):     # guardaste solo el ObjectId
                docs.append(RewardInvoice.objects.with_id(x))
            else:                              # ya es Document
                docs.append(x)
        return [d for d in docs if d is not None]
    
    def resolve_sales_orders(self, info):
        # return self.sales_orders or []
        items = self.sales_orders or []
        docs = []
        for x in items:
            if hasattr(x, 'fetch'):
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
        total_assigned_points = self.total_assigned_points or 0.0
        total_gained_points = self.total_gained_points or 0.0
        total_substracted_points = self.total_substracted_points or 0.0
        
        return int(total_assigned_points + total_gained_points - total_substracted_points)