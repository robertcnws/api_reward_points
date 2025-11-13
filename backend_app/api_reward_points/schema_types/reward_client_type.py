# reward_clients_type.py
from api_authorization.schema import SystemPermissionType
import graphene
from graphene_mongo import MongoengineObjectType
from bson import ObjectId, DBRef

from api_authorization.models import LoginUser, SystemPermission, UserRole
from api_reward_points.models import RewardPoints
from utils.json_datetime import datetime_to_timezone

from api_reward_points.schema_types.reward_invoice_type import RewardInvoiceType
from api_reward_points.schema_types.reward_sales_order_type import RewardSalesOrderType

from api_reward_points.helper_batch import (
    warmup_rewardpoints_for_users,
    get_rp_for_user,
    _normalize_ids,
    batch_load_invoices,
    batch_load_sales_orders,
)

def _extract_perm_ids(items):
    ids = []
    for x in items or []:
        if hasattr(x, 'id'):
            ids.append(x.id)
            continue
        if isinstance(x, DBRef):
            ids.append(x.id)
            continue
        if isinstance(x, ObjectId):
            ids.append(x)
            continue
        if isinstance(x, str):
            try:
                ids.append(ObjectId(x))
            except Exception:
                pass
    return ids

class RewardClientsType(MongoengineObjectType):
    invoices = graphene.List(RewardInvoiceType)
    sales_orders = graphene.List(RewardSalesOrderType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    total_available_points = graphene.Int()
    reward_points_id = graphene.String()
    is_sync_with_zoho = graphene.Boolean()
    customerportal_permissions = graphene.List(SystemPermissionType)

    class Meta:
        model = LoginUser

    # ======= Resolvers =======

    def resolve_invoices(self, info):
        rp = get_rp_for_user(
            self,
            info.context,
            only_fields=["invoices"],  # sólo lo necesario
        )
        if not (rp and rp.invoices):
            return []
        ids = _normalize_ids(rp.invoices)
        docs = batch_load_invoices(ids, info.context)
        return [d for d in docs if d is not None]

    def resolve_sales_orders(self, info):
        rp = get_rp_for_user(
            self,
            info.context,
            only_fields=["sales_orders"],
        )
        if not (rp and rp.sales_orders):
            return []
        ids = _normalize_ids(rp.sales_orders)
        docs = batch_load_sales_orders(ids, info.context)
        return [d for d in docs if d is not None]

    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None

    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_total_available_points(self, info):
        rp = get_rp_for_user(
            self,
            info.context,
            only_fields=[
                "total_assigned_points", 
                "total_gained_points", 
                "total_substracted_points",
                "total_spent_points"
            ],
        )
        if not rp:
            return 0
        return int((rp.total_assigned_points or 0)
                   + (rp.total_gained_points or 0)
                   - (rp.total_substracted_points or 0)
                   - (rp.total_spent_points or 0))

    def resolve_reward_points_id(self, info):
        rp = get_rp_for_user(self, info.context, only_fields=["id"])
        return str(rp.id) if rp else None

    def resolve_is_sync_with_zoho(self, info):
        rp = get_rp_for_user(self, info.context, only_fields=["is_sync_with_zoho"])
        return bool(rp and rp.is_sync_with_zoho)
    
    def resolve_customerportal_permissions(self, info):
        items = self.customerportal_permissions or []
        ids = _extract_perm_ids(items)
        if not ids:
            return []
        docs = list(
            SystemPermission.objects(id__in=ids)
            .only('id', 'name', 'key', 'description', 'created_time', 'last_modified_time')
        )
        by_id = {str(d.id): d for d in docs}
        ordered = [by_id.get(str(_id)) for _id in ids if str(_id) in by_id]
        return [d for d in ordered if d is not None]


# ======= Query con warmup + .only() =======

class Query(graphene.ObjectType):
    all_reward_clients = graphene.List(RewardClientsType)

    def resolve_all_reward_clients(self, info):
        role = UserRole.objects(name="client").first()
        if not role:
            return []

        # ✅ limita campos del LoginUser a los que realmente usas en la UI/Type
        users_qs = (
            LoginUser.objects(user_role=role)
            .only(
                "id", "username", "first_name", "last_name", "company_name",
                "email", "is_staff", "is_active", "created_time", "last_modified_time",
                "phone_number", "last_login", "date_joined", "user_role",
                "key_avatar", "avatar_url", "is_verified", "is_approved",
                "approved_time", "disapproval_count", "country", "address",
                "zip_code", "state", "city", "school", "about",
                "facebook_link", "instagram_link", "linkedin_link", "twitter_link", 
                "customerportal_permissions",
            )
            .no_dereference()   # evita dereferenciar user_role si es ReferenceField
        )

        users = list(users_qs)

        # ✅ warmup de RewardPoints para TODOS los usuarios en una sola query
        warmup_rewardpoints_for_users(
            users,
            info.context,
            only_fields=[
                "id",
                "user",
                "total_assigned_points", 
                "total_gained_points", 
                "total_substracted_points",
                "total_spent_points",
                "is_sync_with_zoho",
                # NO traemos invoices/sales_orders aquí si rara vez se piden en el listado
            ],
        )

        return users
