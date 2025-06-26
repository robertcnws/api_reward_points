from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers 
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
import graphene  
import api_integration.schema as schema
from . import views

urlpatterns = [
    path(
        "graphql/", 
        csrf_exempt(GraphQLView.as_view(schema=graphene.Schema(query=schema.Query), graphiql=True)), 
        name="graphql"
    ),
    path("list_client_invoices/", views.list_client_invoices, name="list_client_invoices"),
    path("list_items/", views.list_items, name="list_items"),
]