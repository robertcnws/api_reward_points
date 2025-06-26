import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from api_users.models import (
    Notification,
    NotificationUser,
)
from api_authorization.models import LoginUser
from api_authorization.schema import LoginUserType
from utils.json_datetime import JSONDateTime, datetime_to_timezone

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
        
class NotificationType(MongoengineObjectType):
    class Meta:
        model = Notification
    
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
        
class NotificationUserType(MongoengineObjectType):
    class Meta:
        model = NotificationUser
        
    notification = graphene.Field(NotificationType)
    user = graphene.Field(LoginUserType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    def resolve_created_time(self, info):
        dt = self.created_time
        return datetime_to_timezone(dt)
    
    def resolve_last_modified_time(self, info):
        dt = self.last_modified_time
        return datetime_to_timezone(dt)
    
    def resolve_notification(self, info):
        return self.notification or {}
    
    def resolve_user(self, info):
        return self.user or {}
        

class NotificationUsersPaginated(graphene.ObjectType):
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    results = graphene.List(NotificationUserType)
    
    
class Query(graphene.ObjectType):
    all_notification_users = graphene.Field(
        NotificationUsersPaginated,
        creator=graphene.String(required=False),
        user=graphene.String(required=False),
        page=graphene.Int(required=False, default_value=1), 
        pageSize=graphene.Int(required=False, default_value=100)
    )
    
    def resolve_all_notification_users(self, info, creator=None, user=None, page=1, pageSize=100):
        qs = NotificationUser.objects.all()
        if creator:
            qs = qs(username=creator)
        if user:
            user = LoginUser.objects(username=user).first()
            if not user:
                return NotificationUsersPaginated(
                    count=0,
                    page=page,
                    page_size=pageSize,
                    results=[]
                )
            qs = qs(user=user)
        qs = qs.order_by('-created_time')
        total = qs.count()
        skip = (page - 1) * pageSize
        paginated_qs = qs.skip(skip).limit(pageSize)
        return NotificationUsersPaginated(
            count=total,
            page=page,
            page_size=pageSize,
            results=list(paginated_qs)
        )
     
     