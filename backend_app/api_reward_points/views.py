from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .repository import (
    repository_store_products
)

#############################################
# DELETE STORE PRODUCT FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product_file(request, id, folder, file):
    return repository_store_products.delete_store_product_file(request, id, folder, file)


#############################################
# CREATE STORE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product(request):
    return repository_store_products.create_store_product(request)


#############################################
# GET FILE URL
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_file_url(request):
    return repository_store_products.get_default_file_url(request)
