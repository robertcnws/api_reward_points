import graphene
from decimal import Decimal
from graphene_mongo import MongoengineObjectType

from utils.json_datetime import JSONDateTime, datetime_to_timezone
from api_authorization.schema import LoginUserType
from api_authorization.models import LoginUser
from api_integration.schema import RewardFullItemType
from api_dealerportal.models import (
    DealerportalQuote,
    DealerportalQuoteProduct,
    DealerportalOrder,
)

class DecimalScalar(graphene.Scalar):
    """Mantiene Decimal como tipo (serializa a string en JSON pero en Python sigue siendo Decimal)."""

    @staticmethod
    def serialize(dec):
        if dec is None:
            return None
        if isinstance(dec, Decimal):
            return str(dec)  # JSON no soporta Decimal, pero el "tipo" lógico sigue siendo Decimal
        return str(Decimal(str(dec)))

    @staticmethod
    def parse_value(value):
        if value is None:
            return None
        return Decimal(str(value))

    @staticmethod
    def parse_literal(node):
        if node is None:
            return None
        # node.value llega como string/number según AST
        return Decimal(str(getattr(node, "value", None)))
    
class DealerportalQuoteType(MongoengineObjectType):
    owner = graphene.Field(LoginUserType)
    created_by = graphene.Field(LoginUserType)
    
    is_product_in_stock = graphene.JSONString()
    is_empty = graphene.Boolean()
    get_products = graphene.List(lambda: DealerportalQuoteProductType)
    created_at = graphene.String()
    updated_at = graphene.String()
    
    calculate_price = DecimalScalar()

    class Meta:
        model = DealerportalQuote

    def resolve_owner(self, info):
        return self.owner
    
    def resolve_created_by(self, info):
        return self.created_by

    def resolve_is_product_in_stock(self, info):
        return self.is_product_in_stock()

    def resolve_is_empty(self, info):
        return self.is_empty()

    def resolve_get_products(self, info):
        return self.get_products()

    def resolve_calculate_price(self, info):
        return self.calculate_price()
    
    def resolve_created_at(self, info):
        return datetime_to_timezone(self.created_at) if self.created_at else None
    
    def resolve_updated_at(self, info):
        return datetime_to_timezone(self.updated_at) if self.updated_at else None
    

class DealerportalQuoteProductType(MongoengineObjectType):
    
    quote = graphene.Field(DealerportalQuoteType) 
    product = graphene.Field(RewardFullItemType)
    
    total_price = DecimalScalar()
    product_line_price_with_markup = DecimalScalar()
    total_price_with_markup = DecimalScalar()
    
    created_at = graphene.String()
    updated_at = graphene.String()

    class Meta:
        model = DealerportalQuoteProduct

    def resolve_quote(self, info):
        return self.quote

    def resolve_product(self, info):
        return self.product

    def resolve_total_price(self, info):
        return self.total_price

    def resolve_product_line_price_with_markup(self, info):
        return self.product_line_price_with_markup

    def resolve_total_price_with_markup(self, info):
        return self.total_price_with_markup
    
    def resolve_created_at(self, info):
        return datetime_to_timezone(self.created_at) if self.created_at else None
    
    def resolve_updated_at(self, info):
        return datetime_to_timezone(self.updated_at) if self.updated_at else None
    
    
class DealerportalOrderType(MongoengineObjectType):
    quote = graphene.Field(DealerportalQuoteType)
    owner = graphene.Field(LoginUserType)
    created_by = graphene.Field(LoginUserType)
    created_at = graphene.String()
    updated_at = graphene.String()

    class Meta:
        model = DealerportalOrder

    def resolve_quote(self, info):
        return self.quote
    
    def resolve_owner(self, info):
        return self.owner
    
    def resolve_created_by(self, info):
        return self.created_by
    
    def resolve_created_at(self, info):
        return datetime_to_timezone(self.created_at) if self.created_at else None
    
    def resolve_updated_at(self, info):
        return datetime_to_timezone(self.updated_at) if self.updated_at else None
    
    
class Query(graphene.ObjectType):
    all_dealerportal_quotes = graphene.List(DealerportalQuoteType, owner_id=graphene.String(required=False))
    dealerportal_quote_by_id = graphene.Field(DealerportalQuoteType, quote_id=graphene.String(required=True))

    all_dealerportal_orders = graphene.List(DealerportalOrderType, owner_id=graphene.String(required=False))
    dealerportal_order_by_id = graphene.Field(DealerportalOrderType, order_id=graphene.String(required=True))
    dealerportal_order_by_quote = graphene.Field(DealerportalOrderType, quote_id=graphene.String(required=True))
    
    def resolve_all_dealerportal_quotes(self, info, owner_id=None):
        query = DealerportalQuote.objects.all().order_by("-updated_at")
        if owner_id:
            owner = LoginUser.objects(id=owner_id).first()
            query = query.filter(owner=owner)
        return query

    def resolve_dealerportal_quote_by_id(self, info, quote_id):
        return DealerportalQuote.objects(id=quote_id).first()

    def resolve_all_dealerportal_orders(self, info, owner_id=None):
        query = DealerportalOrder.objects.all().order_by("-created_at")
        if owner_id:
            owner = LoginUser.objects(id=owner_id).first()
            query = query.filter(owner=owner)
        return query

    def resolve_dealerportal_order_by_id(self, info, order_id):
        return DealerportalOrder.objects(id=order_id).first()

    def resolve_dealerportal_order_by_quote(self, info, quote_id):
        quote = DealerportalQuote.objects(id=quote_id).first()
        if not quote:
            return None
        return DealerportalOrder.objects(quote=quote).first()