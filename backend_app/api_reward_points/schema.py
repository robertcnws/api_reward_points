from api_reward_points.helper_batch import warmup_rewardpoints_for_users
import graphene
from django.utils import timezone
from mongoengine.queryset.visitor import Q
from api_reward_points.models import (
    RewardInvoice,
    RewardPointsHistory,
    RewardPoints,
    RewardStoreProduct,
    RewardStoreProductUser,
    RewardStoreProductUserHistory,
    RewardPointsSettings,
    RewardStoreProductSelection,
    RewardStoreProductSelectionCart,
    RewardStoreProductSelectionBuy,
    RewardJoyRide,
)
from api_authorization.models import LoginUser, UserRole
from api_reward_points.schema_types.reward_points_type import RewardPointsType
from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_points_history_type import RewardPointsHistoryType
from api_reward_points.schema_types.reward_store_product_user_history_type import RewardStoreProductUserHistoryType
from api_reward_points.schema_types.reward_store_product_user_type import RewardStoreProductUserType
from api_reward_points.schema_types.reward_store_product_type import RewardStoreProductType, RewardStoreProductDetailsType
from api_reward_points.schema_types.reward_points_settings_type import RewardPointsSettingsType  
from api_reward_points.schema_types.reward_store_product_selection_cart_type import RewardStoreProductSelectionCartType
from api_reward_points.schema_types.reward_store_product_selection_buy_type import RewardStoreProductSelectionBuyType
from api_reward_points.schema_types.reward_joy_ride_type import RewardJoyRideType
from api_reward_points.schema_types.reward_client_type import RewardClientsType
     
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
    reward_points_history_by_action = graphene.List(
        RewardPointsHistoryType, 
        action=graphene.String(required=True)
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
    
    all_reward_points_settings = graphene.List(
        RewardPointsSettingsType
    )
    
    reward_store_product_details_by_id = graphene.Field(
        RewardStoreProductDetailsType, 
        store_product_id=graphene.String(required=True)
    )
    
    all_reward_store_product_details = graphene.List(
        RewardStoreProductDetailsType
    )
    
    all_reward_store_product_selection_carts = graphene.List(
        RewardStoreProductSelectionCartType
    )
    
    reward_store_product_selection_cart_by_username = graphene.List(
        RewardStoreProductSelectionCartType, 
        username=graphene.String(required=True)
    )
    
    all_reward_store_product_selection_buys = graphene.List(
        RewardStoreProductSelectionBuyType
    )

    reward_store_product_selection_buy_by_username = graphene.List(
        RewardStoreProductSelectionBuyType,
        username=graphene.String(required=True)
    )

    reward_store_product_selection_buy_by_id = graphene.Field(
        RewardStoreProductSelectionBuyType,
        id=graphene.String(required=True)
    )
    
    all_reward_joyrides = graphene.List(
        RewardJoyRideType
    )

    all_reward_clients = graphene.List(
        RewardClientsType
    )

    reward_client_by_id = graphene.Field(
        RewardClientsType,
        client_id=graphene.String(required=True)
    )

    def resolve_all_reward_points(self, info):
        # approved_users = LoginUser.objects(is_approved=True).all()
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

    def resolve_reward_points_history_by_action(self, info, action):
        return RewardPointsHistory.objects(action=action).all()

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
    
    def resolve_all_reward_points_settings(self, info):
        return RewardPointsSettings.objects.order_by('-amount').all()
    
    def resolve_reward_store_product_details_by_id(self, info, store_product_id):
        return RewardStoreProduct.objects.get(id=store_product_id) if store_product_id else None
    
    def resolve_all_reward_store_product_details(self, info):
        return RewardStoreProduct.objects.all() if RewardStoreProduct.objects else []
    
    def resolve_all_reward_store_product_selection_carts(self, info):
        return RewardStoreProductSelectionCart.objects.all() if RewardStoreProductSelectionCart.objects else []
    
    def resolve_reward_store_product_selection_cart_by_username(self, info, username):
        user = LoginUser.objects(username=username).first()
        if not user:
            return None
        
        selections = RewardStoreProductSelection.objects(user=user).all()
        if not selections:
            return [] 
        
        carts = RewardStoreProductSelectionCart.objects(
            store_product_selection__in=selections
        ).all()

        return list(carts) if carts else []
    
    def resolve_all_reward_store_product_selection_buys(self, info):
        now = timezone.now()
        return (
            RewardStoreProductSelectionBuy
            .objects(is_removed=False)
            .filter(Q(expiration_time__gte=now) | Q(expiration_time=None))
            .all()
        ) if RewardStoreProductSelectionBuy.objects else []

    def resolve_reward_store_product_selection_buy_by_username(self, info, username):
        user = LoginUser.objects(username=username).first()
        if not user:
            return None
        selections = RewardStoreProductSelection.objects(user=user).all()
        if not selections:
            return [] 
        
        now = timezone.now()

        buys = RewardStoreProductSelectionBuy.objects(
            store_product_selection__in=selections,
            is_removed=False,
        ).filter(
            Q(expiration_time__gte=now) | Q(expiration_time=None)
        ).all()

        return list(buys) if buys else []
    
    def resolve_reward_store_product_selection_buy_by_id(self, info, id):
        return RewardStoreProductSelectionBuy.objects(id=id).first()
    
    def resolve_all_reward_joyrides(self, info):
        return RewardJoyRide.objects.all()

    def resolve_all_reward_clients(self, info, **kwargs):
        role = UserRole.objects(name="client").first()
        if not role:
            return []

        users = list(
            LoginUser.objects(user_role=role)
            .only(
                "id",
                "username",
                "first_name",
                "last_name",
                "company_name",
                "email",
                "phone_number",
                "is_staff",
                "is_active",
                "created_time",
                "last_modified_time",
                "user_role",
                "key_avatar",
                "avatar_url",
                "is_verified",
                "is_approved",
                "approved_time",
                "disapproval_count",
                "country",
                "address",
                "zip_code",
                "state",
                "city",
                "school",
                "about",
                "facebook_link",
                "instagram_link",
                "linkedin_link",
                "twitter_link"
            ).no_dereference()
        )
        
        warmup_rewardpoints_for_users(
            users, info.context,
            only_fields=[
                "id",
                "user",
                "total_assigned_points",
                "total_gained_points",
                "total_substracted_points",
                "is_sync_with_zoho",
                "invoices",
                "sales_orders",           
            ],
        )
        return users


    def resolve_reward_client_by_id(self, info, client_id):
        return LoginUser.objects(id=client_id).first()