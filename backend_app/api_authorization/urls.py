from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from . import views
import api_authorization.schema as schema
import graphene

urlpatterns = [
    path(
        "graphql/", 
        csrf_exempt(GraphQLView.as_view(schema=graphene.Schema(query=schema.Query), graphiql=True)), 
        name="graphql"
    ),
    path("is_user_verified/", views.is_user_verified, name="is_user_verified"),
    path("login/", views.login, name="login"),
    path("transfer_login/", views.transfer_login, name="transfer_login"),
    path("logout/", views.logout, name="logout"),
    path('register/', views.register, name='register'),
    path('reset_password/', views.reset_password, name='reset_password'),
    path('update_password/', views.update_password, name='update_password'),
    path('verify_user/', views.verify_user, name='verify_user'),
    path('send_verification_code/', views.send_verification_code, name='send_verification_code'),
    path('get_refetch_rewards_points/<str:id>/', views.get_refetch_rewards_points, name='get_refetch_rewards_points'),
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/transfer/', views.MyTokenObtainTransferPairView.as_view(), name='token_obtain_transfer_pair'),
    path('token/refresh/', views.MyTokenRefreshView.as_view(), name='token_refresh'),
    # ======================
    #  Functionalities
    # ======================
    path('create/functionality/', views.create_functionality, name='create_functionality'),
    path('delete/functionalities/', views.delete_functionalities, name='delete_functionalities'),
    path('edit/functionality/<str:id>/', views.edit_functionality, name='edit_functionality'),
    path('delete/functionality/<str:id>/', views.delete_functionality, name='delete_functionality'),
]