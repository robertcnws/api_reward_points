from django.contrib import admin
from django.urls import path, include
from rest_framework_mongoengine import routers   
from . import views

urlpatterns = [
    path("list_client_invoices/", views.list_client_invoices, name="list_client_invoices"),
]