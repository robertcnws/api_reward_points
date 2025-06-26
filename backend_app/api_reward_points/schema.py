import graphene
from api_reward_points.models import (
    RewardInvoice,
    RewardPointsHistory,
    RewardPoints,
    RewardStoreProduct,
    RewardStoreProductUser,
    RewardStoreProductUserHistory
)
from api_authorization.models import LoginUser
from api_reward_points.schema_types.reward_points_type import RewardPointsType
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_points_history_type import RewardPointsHistoryType
from api_reward_points.schema_types.reward_store_product_user_history_type import RewardStoreProductUserHistoryType
from api_reward_points.schema_types.reward_store_product_user_type import RewardStoreProductUserType
from api_reward_points.schema_types.reward_store_product_type import RewardStoreProductType   
     
class Query(graphene.ObjectType):
    all_reward_points = graphene.List(
        RewardPointsType
    )
    reward_points_by_user_id = graphene.Field(
        RewardPointsType, 
        user_id=graphene.String(required=True)
    )
    reward_points_by_username = graphene.Field(
        RewardPointsType, 
        username=graphene.String(required=True)
    )
    all_reward_invoices = graphene.List(
        RewardInvoiceType
    )
    reward_invoice_by_id = graphene.Field(
        RewardInvoiceType, 
        invoice_id=graphene.String(required=True)
    )
    all_reward_points_history = graphene.List(
        RewardPointsHistoryType
    )
    reward_points_history_by_id = graphene.List(
        RewardPointsHistoryType, 
        reward_points_id=graphene.String(required=True)
    )
    all_reward_store_products = graphene.List(
        RewardStoreProductType
    )
    reward_store_product_by_id = graphene.Field(
        RewardStoreProductType, 
        store_product_id=graphene.String(required=True)
    )
    all_reward_store_products_users = graphene.List(
        RewardStoreProductUserType
    )
    reward_store_product_user_by_id = graphene.Field(
        RewardStoreProductUserType, 
        user_product_id=graphene.String(required=True)
    )
    reward_store_products_user_by_username = graphene.Field(
        RewardStoreProductUserType, 
        username=graphene.String(required=True)
    )
    all_reward_store_product_user_history = graphene.List(
        RewardStoreProductUserHistoryType
    )
    reward_store_product_user_history_by_id = graphene.Field(
        RewardStoreProductUserHistoryType, 
        user_product_id=graphene.String(required=True)
    )
    reward_store_products_user_history_by_username = graphene.List(
        RewardStoreProductUserHistoryType, 
        username=graphene.String(required=True)
    )
    reward_store_products_user_history_by_username_and_product = graphene.List(
        RewardStoreProductUserHistoryType, 
        username=graphene.String(required=True), 
        product_id=graphene.String(required=True)
    )

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
    
    def resolve_all_reward_points_history(self, info):
        return RewardPointsHistory.objects.all()
    
    def resolve_reward_points_history_by_id(self, info, reward_points_id):
        reward_points = RewardPoints.objects(id=reward_points_id).first()
        if reward_points:
            return RewardPointsHistory.objects(reward_points=reward_points).all()
        return None
    
    def resolve_all_reward_store_products(self, info):
        return RewardStoreProduct.objects.all()
    
    def resolve_reward_store_product_by_id(self, info, store_product_id):
        return RewardStoreProduct.objects(id=store_product_id).first()
    
    def resolve_all_reward_store_product_users(self, info):
        return RewardStoreProductUser.objects.all()
    
    def resolve_reward_store_product_user_by_id(self, info, user_product_id):
        return RewardStoreProductUser.objects(id=user_product_id).first()
    
    def resolve_reward_store_product_user_by_username(self, info, username):
        user = LoginUser.objects(username=username).first()
        if user:
            return RewardStoreProductUser.objects(user=user).all()
        return None
    
    def resolve_all_reward_store_product_user_history(self, info):
        return RewardStoreProductUserHistory.objects.all()
    
    def resolve_reward_store_product_user_history_by_id(self, info, user_product_id):
        user_product = RewardStoreProductUser.objects(id=user_product_id).first()
        if user_product:
            return RewardStoreProductUserHistory.objects(user_product=user_product).all()
        return None
    
    def resolve_reward_store_products_user_history_by_username(self, info, username):
        user = LoginUser.objects(username=username).first()
        if user:
            user_products = RewardStoreProductUser.objects(user=user).all()
            return RewardStoreProductUserHistory.objects(user_product__in=user_products).all()
        return None
    
    def resolve_reward_store_products_user_history_by_username_and_product(self, info, username, product_id):
        user = LoginUser.objects(username=username).first()
        if user:
            user_product = RewardStoreProductUser.objects(user=user, product__id=product_id).first()
            if user_product:
                return RewardStoreProductUserHistory.objects(user_product=user_product).all()
        return None