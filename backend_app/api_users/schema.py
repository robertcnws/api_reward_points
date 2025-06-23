import graphene
from graphene_mongo import MongoengineObjectType
from api_authorization.models import UserRole, LoginUser

class UserRoleType(MongoengineObjectType):
    class Meta:
        model = UserRole
        # opcional: sólo exponer estos campos
        exclude_fields = ("_id",)

class LoginUserType(MongoengineObjectType):
    class Meta:
        model = LoginUser
        exclude_fields = ("password",)
        
        
class Query(graphene.ObjectType):
    all_roles = graphene.List(UserRoleType)
    role_by_name = graphene.Field(UserRoleType, name=graphene.String(required=True))

    all_users = graphene.List(LoginUserType)
    user_by_username = graphene.Field(LoginUserType, username=graphene.String(required=True))

    def resolve_all_roles(self, info):
        return UserRole.objects.all()

    def resolve_role_by_name(self, info, name):
        return UserRole.objects(name=name).first()

    def resolve_all_users(self, info):
        return LoginUser.objects.all()

    def resolve_user_by_username(self, info, username):
        return LoginUser.objects(username=username).first()