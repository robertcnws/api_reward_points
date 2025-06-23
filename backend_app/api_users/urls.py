from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
import graphene
import api_users.schema as schema

urlpatterns = [
    path(
        "graphql/", 
        csrf_exempt(GraphQLView.as_view(schema=graphene.Schema(query=schema.Query), graphiql=True)), 
        name="graphql"
    ),
]