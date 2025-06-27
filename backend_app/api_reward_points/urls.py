from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
import graphene
import api_reward_points.schema as schema
import api_reward_points.views as views

urlpatterns = [
    path(
        "graphql/", 
        csrf_exempt(GraphQLView.as_view(schema=graphene.Schema(query=schema.Query), graphiql=True)), 
        name="graphql"
    ),
    # STORE PRODUCTS
    path('delete/file/<str:id>/store-product/<str:folder>/<str:file>/', views.delete_store_product_file, name='delete_store_product_file'),
    path('create/store-product/', views.create_store_product, name='create_store_product'),
    # GET FILE URL FROM AWS S3
    path('get-file-url/', views.get_default_file_url, name='get_file_url'),
]