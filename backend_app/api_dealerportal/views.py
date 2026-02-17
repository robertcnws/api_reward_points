from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes, throttle_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from api_dealerportal.repository import (
    repository_quotes,
    repository_print,
    repository_orders
)

# ======================
# Throttles
# ======================
class PublicReadThrottle(AnonRateThrottle):
    scope = "public_read"

class AuthWriteThrottle(UserRateThrottle):
    scope = "auth_write"

# *******************************************#
# DEALERPORTAL QUOTE API
# *******************************************#

# CREATE QUOTE
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def create_dealerportal_quote(request):
    return repository_quotes.api_dealerportal_create_quote(request)


# EDIT QUOTE
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def edit_dealerportal_quote(request, quote_id):
    return repository_quotes.api_dealerportal_edit_quote(request, quote_id)


# DELETE QUOTE
@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_dealerportal_quote(request, quote_id):
    return repository_quotes.api_dealerportal_delete_quote(request, quote_id)

# CLONE QUOTE
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def clone_dealerportal_quote(request, quote_id):
    return repository_quotes.api_dealerportal_clone_quote(request, quote_id)


# MANAGE QUOTE PRODUCTS
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def manage_dealerportal_quote_product(request, quote_id):
    return repository_quotes.api_dealerportal_manage_product_to_quote(request, quote_id)


# MANAGE ALL QUOTE PRODUCTS
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def manage_all_dealerportal_quote_products(request, quote_id):
    return repository_quotes.api_dealerportal_manage_all_products_to_quote(request, quote_id)


# GET QUOTE PDF
@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([PublicReadThrottle])
def get_dealerportal_quote_pdf(request, quote_id, report_type="pdf"):
    return repository_print.api_dealerportal_quote_render_pdf(request, quote_id, report_type)


# PLACE ORDER
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def place_dealerportal_order(request, quote_id):
    return repository_quotes.api_dealerportal_place_order(request, quote_id)

# MANAGE ORDER STATUS
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def manage_dealerportal_order_status(request, order_id):
    return repository_orders.api_dealerportal_manage_order_status(request, order_id)


# DELETE ORDER
@api_view(['DELETE'])
@permission_classes([AllowAny])
@throttle_classes([AuthWriteThrottle])
def delete_dealerportal_order(request, order_id):
    return repository_orders.api_dealerportal_delete_order(request, order_id)