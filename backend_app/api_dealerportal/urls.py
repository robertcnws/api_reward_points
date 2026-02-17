from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers 
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
import graphene  
import api_dealerportal.schema as schema
from . import views

urlpatterns = [
    path(
        "graphql/", 
        csrf_exempt(GraphQLView.as_view(schema=graphene.Schema(query=schema.Query), graphiql=True)), 
        name="graphql"
    ),
    path(
        'create/quote/',
        views.create_dealerportal_quote,
        name='create_dealerportal_quote'
    ),
    path(
        'edit/quote/<str:quote_id>/',
        views.edit_dealerportal_quote,
        name='edit_dealerportal_quote'
    ),
    path(
        'delete/quote/<str:quote_id>/',
        views.delete_dealerportal_quote,
        name='delete_dealerportal_quote'
    ),
    path(
        'clone/quote/<str:quote_id>/',
        views.clone_dealerportal_quote,
        name='clone_dealerportal_quote'
    ),
    path(
        'manage/quote/<str:quote_id>/product/',
        views.manage_dealerportal_quote_product,
        name='manage_dealerportal_quote_product'
    ),
    path(
        'manage/quote/<str:quote_id>/products/',
        views.manage_all_dealerportal_quote_products,
        name='manage_all_dealerportal_quote_products'
    ),
    path(
        'quote/<str:quote_id>/<str:report_type>/',
        views.get_dealerportal_quote_pdf,
        name='get_dealerportal_quote_pdf'
    ),
    path(
        'place-order/quote/<str:quote_id>/',
        views.place_dealerportal_order,
        name='place_dealerportal_order'
    ),
    path(
        'manage/order/<str:order_id>/status/',
        views.manage_dealerportal_order_status,
        name='api_dealerportal_manage_order_status'
    ),
    path(
        'delete/order/<str:order_id>/',
        views.delete_dealerportal_order,
        name='api_dealerportal_delete_order'
    ),
]