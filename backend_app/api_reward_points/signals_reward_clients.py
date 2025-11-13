# ... (tus imports existentes)
from api_authorization.models import LoginUser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from bson import ObjectId, DBRef
from api_authorization.models import SystemPermission

def _emit_reward_client_event_for_user(user: LoginUser, event_type: str):
    
    from api_reward_points.models import RewardPoints
    import api_reward_points.signal_events as signal_events
    from utils.data_util import transform_data_to_mongo, camelize, serialize_datetime

    channel_layer = get_channel_layer()
    
    rp = (
        RewardPoints.objects(user=user)
        .only(
            "total_assigned_points",
            "total_gained_points",
            "total_substracted_points",
            "invoices",
            "sales_orders",
            "is_sync_with_zoho"
        )
        .first()
    )
    
    def _total_available_points(rp_doc):
        if not rp_doc:
            return 0
        return int(
            (rp_doc.total_assigned_points or 0)
            + (rp_doc.total_gained_points or 0)
            - (rp_doc.total_substracted_points or 0)
        )
    
    user_role_cs = None
    if getattr(user, "user_role", None):
        user_role_cs = camelize(
            transform_data_to_mongo(user.user_role, exclude_fields=["password"])
        )

    invoices_cs = []
    if rp and rp.invoices:
        invoices_cs = camelize(
            transform_data_to_mongo(rp.invoices, exclude_fields=["password"])
        )

    sales_orders_cs = []
    if rp and rp.sales_orders:
        sales_orders_cs = camelize(
            transform_data_to_mongo(rp.sales_orders, exclude_fields=["password"])
        )
        
    customerportal_permissions_cs = []
    if getattr(user, "customerportal_permissions", []):
        items = user.customerportal_permissions or []
        ids = []
        for x in items:
            if hasattr(x, "id"):
                ids.append(x.id)
            elif isinstance(x, DBRef):
                ids.append(x.id)
            elif isinstance(x, ObjectId):
                ids.append(x)
            elif isinstance(x, str):
                try:
                    ids.append(ObjectId(x))
                except Exception:
                    pass
        perms = list(SystemPermission.objects(id__in=ids).only("id", "name", "key", "description", "created_time", "last_modified_time"))
        customerportal_permissions_cs = camelize(transform_data_to_mongo(perms, exclude_fields=["password"]))
    
    class _ClientProjection:
        def __init__(self, u, rp_doc):
            self.id = u.id
            self.username = u.username
            self.first_name = u.first_name
            self.last_name = u.last_name
            self.company_name = u.company_name
            self.email = u.email
            self.is_staff = u.is_staff
            self.is_active = u.is_active
            self.created_time = getattr(u, "created_time", None)
            self.last_modified_time = getattr(u, "last_modified_time", None)
            self.phone_number = getattr(u, "phone_number", None)
            self.password = None  # ¡Nunca!
            self.last_login = getattr(u, "last_login", None)
            self.date_joined = getattr(u, "date_joined", None)
            self.token = getattr(u, "token", None)
            self.user_role = getattr(u, "user_role", None)
            self.key_avatar = getattr(u, "key_avatar", None)
            self.avatar_url = getattr(u, "avatar_url", None)
            self.is_verified = getattr(u, "is_verified", False)
            self.is_approved = getattr(u, "is_approved", False)
            self.approved_time = getattr(u, "approved_time", None)
            self.disapproval_count = getattr(u, "disapproval_count", 0)
            self.show_tour_guide_modal = getattr(u, "show_tour_guide_modal", False)
            self.took_tour_guide = getattr(u, "took_tour_guide", False)
            self.show_intro_guide_modal = getattr(u, "show_intro_guide_modal", False)
            self.took_intro_guide = getattr(u, "took_intro_guide", False)
            self.country = getattr(u, "country", None)
            self.address = getattr(u, "address", None)
            self.zip_code = getattr(u, "zip_code", None)
            self.state = getattr(u, "state", None)
            self.city = getattr(u, "city", None)
            self.school = getattr(u, "school", None)
            self.about = getattr(u, "about", None)
            self.facebook_link = getattr(u, "facebook_link", None)
            self.instagram_link = getattr(u, "instagram_link", None)
            self.linkedin_link = getattr(u, "linkedin_link", None)
            self.twitter_link = getattr(u, "twitter_link", None)
            self.customerportal_permissions = getattr(u, "customerportal_permissions", [])
            
            self.total_available_points = _total_available_points(rp_doc)
            
            self.invoices = bool(rp_doc and rp_doc.invoices)
            self.sales_orders = bool(rp_doc and rp_doc.sales_orders)
            self.reward_points_id = getattr(rp_doc, "id", None)
            self.is_sync_with_zoho = getattr(rp_doc, "is_sync_with_zoho", False)

    client_doc = _ClientProjection(user, rp)
    
    event = signal_events.event_reward_clients(
        type=event_type,
        document=client_doc,
        full_selection_user_role=user_role_cs,
        full_selection_invoices=invoices_cs,
        full_selection_sales_orders=sales_orders_cs,
        full_selection_customerportal_permissions=customerportal_permissions_cs
    )

    async_to_sync(channel_layer.group_send)("reward_clients", serialize_datetime(event))
    async_to_sync(channel_layer.group_send)(
        f"reward_clients_{str(user.id)}", serialize_datetime(event)
    )
