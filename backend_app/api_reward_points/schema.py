import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from api_reward_points.models import (
    RewardInvoice,
    RewardPointsHistory,
    RewardPoints,
    RewardInvoiceLineItem,
    RewardInvoiceTax,
    RewardPointsSettings,
    Tracking,
)
from api_users.schema import LoginUserType
from api_authorization.models import LoginUser
from utils.json_datetime import JSONDateTime, datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )


class RewardInvoiceLineItemType(MongoengineObjectType):
    class Meta:
        model = RewardInvoiceLineItem

class RewardInvoiceTaxType(MongoengineObjectType):
    class Meta:
        model = RewardInvoiceTax
        
class RewardInvoiceType(MongoengineObjectType):
    line_items = graphene.List(RewardInvoiceLineItemType)
    taxes = graphene.List(RewardInvoiceTaxType)

    class Meta:
        model = RewardInvoice

    def resolve_line_items(self, info):
        return self.line_items

    def resolve_taxes(self, info):
        return self.taxes
    
class RewardPointsHistoryType(MongoengineObjectType):
    info = JSONDateTime()
    created_time = graphene.String()
    
    class Meta:
        model = RewardPointsHistory
        
    def resolve_info(self, info):
        return self.info or {}
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
        
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
        
        
class Query(graphene.ObjectType):
    all_reward_points = graphene.List(RewardPointsType)
    reward_points_by_user_id = graphene.Field(RewardPointsType, user_id=graphene.String(required=True))
    reward_points_by_username = graphene.Field(RewardPointsType, username=graphene.String(required=True))
    all_reward_invoices = graphene.List(RewardInvoiceType)
    reward_invoice_by_id = graphene.Field(RewardInvoiceType, invoice_id=graphene.String(required=True))

    def resolve_all_reward_points(self, info):
        return RewardPoints.objects.all()

    def resolve_reward_points_by_user_id(self, info, user_id):
        user = LoginUser.objects(id=user_id).first()
        if user:
            return RewardPoints.objects(user=user).first()
        
    def resolve_reward_points_by_username(self, info, username):
        user = LoginUser.objects(username=username).first()
        if user:
            return RewardPoints.objects(user=user).first()

    def resolve_all_reward_invoices(self, info):
        return RewardInvoice.objects.all()

    def resolve_reward_invoice_by_id(self, info, invoice_id):
        return RewardInvoice.objects(id=invoice_id).first()