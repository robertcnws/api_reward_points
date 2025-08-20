from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .repository import (
    repository_store_products,
    repository_point_settings,
    repository_store_product_reviews,
    repository_store_product_review_reactions,
    repository_store_product_selections,
    repository_points,
    repository_db
)


#*******************************************#
#*******************************************#   
# REWARD STORE PRODUCTS API
#*******************************************#
#*******************************************#


#############################################
# DELETE STORE PRODUCT FILE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product_file(request, id, folder, file):
    return repository_store_products.delete_store_product_file(request, id, folder, file)


#############################################
# DELETE ALL STORE PRODUCT FILES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_all_store_product_files(request, id, folder):
    return repository_store_products.delete_all_store_product_files(request, id, folder)


#############################################
# CREATE STORE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product(request):
    return repository_store_products.create_store_product(request)



#############################################
# UPDATE STORE PRODUCT
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_store_product(request, id):
    return repository_store_products.update_store_product(request, id)


#############################################
# DELETE STORE PRODUCT
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product(request, id):
    return repository_store_products.delete_store_product(request, id)


#############################################
# DELETE STORE PRODUCT LIST
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_list_store_products(request):
    return repository_store_products.delete_list_store_products(request)


###############################################
# MANAGE ACTIVE STORE PRODUCT
###############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_active_store_product(request, id):
    return repository_store_products.manage_active_store_product(request, id)


#############################################
# GET FILE URL
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_file_url(request):
    return repository_store_products.get_default_file_url(request)



#*******************************************#   
#*******************************************#   
# REWARD POINTS SETTINGS API
#*******************************************#
#*******************************************#


#############################################
# CREATE POINTS SETTINGS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_points_settings(request):
    return repository_point_settings.create_points_settings(request)


#############################################
# UPDATE POINTS SETTINGS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def update_points_settings(request, id):
    return repository_point_settings.update_points_settings(request, id)


#############################################
# DELETE POINTS SETTINGS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_points_settings(request, id):
    return repository_point_settings.delete_points_settings(request, id)


#############################################
# DELETE LIST OF POINTS SETTINGS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_list_points_settings(request):
    return repository_point_settings.delete_list_points_settings(request)



#*******************************************#   
#*******************************************#   
# REWARD STORE PRODUCT REVIEWS API
#*******************************************#
#*******************************************#


#############################################
# CREATE STORE PRODUCT REVIEW
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product_review(request, id):
    return repository_store_product_reviews.create_store_product_review(request, id)


#############################################
# DELETE STORE PRODUCT REVIEW
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product_review(request, id):
    return repository_store_product_reviews.delete_store_product_review(request, id)


#############################################
# CREATE STORE PRODUCT REVIEW REACTION
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_store_product_review_reaction(request, review_id):
    return repository_store_product_review_reactions.manage_store_product_review_reaction(request, review_id)


#*******************************************#   
#*******************************************#   
# REWARD STORE PRODUCT SELECTIONS API
#*******************************************#
#*******************************************#


#############################################
# CREATE STORE PRODUCT SELECTION CART
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product_selection_cart(request, id):
    return repository_store_product_selections.create_store_product_selection_cart(request, id)


#############################################
# DELETE STORE PRODUCT SELECTION CART
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product_selection_cart(request, id):
    return repository_store_product_selections.delete_store_product_selection_cart(request, id)


#############################################
# DELETE ALL STORE PRODUCT SELECTION CARTS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_all_store_product_selection_carts(request):
    return repository_store_product_selections.delete_all_store_product_selection_carts(request)


#############################################
# CREATE STORE PRODUCT SELECTION BUY FROM CART
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product_selection_cart_buy(request, id):
    return repository_store_product_selections.create_store_product_selection_cart_buy(request, id)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_all_store_product_selection_cart_buy(request):
    return repository_store_product_selections.create_all_store_product_selection_cart_buy(request)


#############################################
# CREATE STORE PRODUCT SELECTION BUY
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_store_product_selection_buy(request, id):
    return repository_store_product_selections.create_store_product_selection_buy(request, id)


#############################################
# DELETE STORE PRODUCT SELECTION BUY
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_store_product_selection_buy(request, id):
    return repository_store_product_selections.delete_store_product_selection_buy(request, id)


#############################################
# DELETE LIST OF STORE PRODUCT SELECTION BUY
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_list_store_product_selection_buys(request):
    return repository_store_product_selections.delete_list_store_product_selection_buys(request)


#############################################
# MANAGE STORE PRODUCT SELECTION BUY REMOVE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_remove_store_product_selection_buy(request, id):
    return repository_store_product_selections.manage_remove_store_product_selection_buy(request, id)


#############################################
# MANAGE STORE PRODUCT SELECTION BUY REFUND
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_refund_store_product_selection_buy(request, id):
    return repository_store_product_selections.manage_refund_store_product_selection_buy(request, id)


#############################################
# MANAGE STORE PRODUCT SELECTION BUY USE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_use_store_product_selection_buy(request, id):
    return repository_store_product_selections.manage_use_store_product_selection_buy(request, id)


#*******************************************#   
#*******************************************#   
# REWARD POINTS API
#*******************************************#
#*******************************************#


#############################################
# MANAGE REWARD POINTS
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def manage_points(request, user_id):
    return repository_points.manage_points(request, user_id)


#*******************************************#   
#*******************************************#   
# DATABASE
#*******************************************#
#*******************************************#


#############################################
# DOWNLOAD MONGO DB
#############################################


@api_view(['GET'])
@permission_classes([AllowAny])
def download_mongo_db(request):
    return repository_db.download_mongo_db(request)