import graphene
from graphene_mongo import MongoengineObjectType
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField
from bson import ObjectId
from bson.dbref import DBRef
from api_authorization.models import (
    UserRole,
    LoginUser,
    ExternalUsers,
    LoginUserRecoverPasswordCode,
    SystemPermission
)
from utils.json_datetime import JSONDateTime, datetime_to_timezone


@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
    
class SystemPermissionType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = SystemPermission
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
class UserRoleType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    
    class Meta:
        model = UserRole
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
class LoginUserType(MongoengineObjectType):
    user_role = graphene.Field(UserRoleType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    last_login = graphene.String()
    date_joined = graphene.String()
    approved_time = graphene.String()
    customerportal_permissions = graphene.List(SystemPermissionType)

    class Meta:
        model = LoginUser
        exclude_fields = ("password",)

    def resolve_user_role(self, info):
        return self.user_role
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_last_login(self, info):
        return datetime_to_timezone(self.last_login) if self.last_login else None
    
    def resolve_date_joined(self, info):
        return datetime_to_timezone(self.date_joined) if self.date_joined else None

    def resolve_approved_time(self, info):
        return datetime_to_timezone(self.approved_time) if self.approved_time else None

    def resolve_customerportal_permissions(self, info):
        items = self.customerportal_permissions or []
        docs = []
        for x in items:
            if hasattr(x, 'fetch'):          
                docs.append(x.fetch())
            elif isinstance(x, DBRef):       
                docs.append(SystemPermission.objects.with_id(x.id))
            elif isinstance(x, ObjectId):    
                docs.append(SystemPermission.objects.with_id(x))
            else:                            
                docs.append(x)
        return [d for d in docs if d is not None]



class LoginUserRecoverPasswordCodeRoleType(MongoengineObjectType):
    created_at = graphene.String()
    expired_at = graphene.String()
    user = graphene.Field(LoginUserType)
    is_expired = graphene.Boolean()

    class Meta:
        model = LoginUserRecoverPasswordCode

    def resolve_created_at(self, info):
        return datetime_to_timezone(self.created_at) if self.created_at else None

    def resolve_expired_at(self, info):
        return datetime_to_timezone(self.expired_at) if self.expired_at else None

    def resolve_user(self, info):
        return self.user

    def resolve_is_expired(self, info):
        return self.is_expired()

class ExternalUserType(MongoengineObjectType):
    user = graphene.Field(LoginUserType)
    created_time = graphene.String()
    last_modified_time = graphene.String()
    last_login = graphene.String()

    class Meta:
        model = ExternalUsers
        exclude_fields = ("password",)

    def resolve_user(self, info):
        return self.user
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None
    
    def resolve_last_login(self, info):
        return datetime_to_timezone(self.last_login) if self.last_login else None
        
        
class Query(graphene.ObjectType):
    all_user_roles = graphene.List(UserRoleType)
    all_login_users = graphene.List(LoginUserType)
    all_customerportal_permissions = graphene.List(SystemPermissionType)
    user_role_by_id = graphene.Field(UserRoleType, id=graphene.String(required=True))
    login_user_by_id = graphene.Field(LoginUserType, id=graphene.String(required=True))
    login_user_by_username = graphene.Field(LoginUserType, username=graphene.String(required=True))
    login_users_by_user_role = graphene.List(LoginUserType, user_role_id=graphene.String(required=True))
    external_user_by_username = graphene.Field(ExternalUserType, username=graphene.String(required=True))
    last_logged_external_users = graphene.List(ExternalUserType)
    recovery_code_by_email = graphene.Field(LoginUserRecoverPasswordCodeRoleType, email=graphene.String(required=True))
    customerportal_permission_by_key = graphene.Field(SystemPermissionType, key=graphene.String(required=True))

    def resolve_all_user_roles(self, info):
        return UserRole.objects.all()
    
    def resolve_all_login_users(self, info):
        return LoginUser.objects.all()

    def resolve_all_customerportal_permissions(self, info):
        return SystemPermission.objects.all()

    def resolve_user_role_by_id(self, info, id):
        try:
            return UserRole.objects(id=ObjectId(id)).first()
        except UserRole.DoesNotExist:
            return None
        
    def resolve_login_user_by_id(self, info, id):
        try:
            return LoginUser.objects(id=ObjectId(id)).first()
        except LoginUser.DoesNotExist:
            return None
        
    def resolve_login_user_by_username(self, info, username):
        try:
            return LoginUser.objects(username=username).first()
        except LoginUser.DoesNotExist:
            return None
        
    def resolve_login_users_by_user_role(self, info, user_role_id):
        try:
            user_role = UserRole.objects(id=ObjectId(user_role_id)).first()
            if user_role:
                return LoginUser.objects(user_role=user_role)
            return []
        except UserRole.DoesNotExist:
            return []
        
    def resolve_external_user_by_username(self, info, username):
        try:
            user = LoginUser.objects(username=username).first()
            if user:
                return ExternalUsers.objects(user=user).first()
            return None
        except ExternalUsers.DoesNotExist:
            return None
        
    def resolve_last_logged_external_users(self, info):
        return ExternalUsers.objects(is_logged_in=True).order_by('-last_login')[:10]
    

    def resolve_recovery_code_by_email(self, info, email):
        try:
            user = LoginUser.objects(email=email).first()
            if user:
                return LoginUserRecoverPasswordCode.objects(user=user).first()
            return None
        except LoginUserRecoverPasswordCode.DoesNotExist:
            return None
        
    def resolve_customerportal_permission_by_key(self, info, key):
        try:
            return SystemPermission.objects(key=key).first()
        except SystemPermission.DoesNotExist:
            return None