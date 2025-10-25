from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes, throttle_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from api_integration.repository import repository_integration
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class IntegrationThrottle(AnonRateThrottle):
    scope = "integration_public"

#############################################
# LOAD SALES ORDERS TO REWARDS
#############################################
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])                 
@throttle_classes([IntegrationThrottle])   
def list_sales_orders(request):
    return repository_integration.list_sales_orders(request)

#############################################
# LOAD CLIENT INVOICES TO REWARDS
#############################################
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([IntegrationThrottle])
def list_client_invoices(request):
    return repository_integration.list_client_invoices(request)

#############################################
# LOAD ITEMS TO REWARDS
#############################################
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([IntegrationThrottle])
def list_items(request):
    return repository_integration.list_items(request)


#############################################
# FETCH CUSTOMER BY EMAIL
#############################################
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([IntegrationThrottle])
def fetch_customer_by_email(request):
    return repository_integration.fetch_customer_by_email(request)
