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
    path(
        'delete/file/<str:id>/store-product/<str:folder>/<str:file>/', 
        views.delete_store_product_file, 
        name='delete_store_product_file'
    ),
    path(
        'delete/files/<str:id>/store-product/<str:folder>/', 
        views.delete_all_store_product_files, 
        name='delete_all_store_product_files'
    ),
    path(
        'create/store-product/',
        views.create_store_product,
        name='create_store_product'
    ),
    path(
        'update/store-product/<str:id>/',
        views.update_store_product,
        name='update_store_product'
    ),
    path(
        'delete/store-product/<str:id>/',
        views.delete_store_product,
        name='delete_store_product'
    ),
    path(
        'delete/list/store-product/',
        views.delete_list_store_products,
        name='delete_list_store_products'
    ),
    path(
        'manage-active/store-product/<str:id>/',
        views.manage_active_store_product,
        name='manage_active_store_product'
    ),
    # POINTS SETTINGS
    path(
        'create/points-settings/',
        views.create_points_settings,
        name='create_points_settings'
    ),
    path(
        'update/points-settings/<str:id>/',
        views.update_points_settings,
        name='update_points_settings'
    ),
    path(
        'delete/points-settings/<str:id>/',
        views.delete_points_settings,
        name='delete_points_settings'
    ),
    path(
        'delete/list/points-settings/',
        views.delete_list_points_settings,
        name='delete_list_points_settings'
    ),
    # STORE PRODUCT REVIEWS
    path(
        'create/store-product-review/<str:id>/',
        views.create_store_product_review,
        name='create_store_product_review'
    ),
    path(
        'delete/store-product-review/<str:id>/',
        views.delete_store_product_review,
        name='delete_store_product_review'
    ),
    # STORE PRODUCT REVIEW REACTIONS
    path(
        'manage/store-product-review-reaction/<str:review_id>/',
        views.manage_store_product_review_reaction,
        name='manage_store_product_review_reaction'
    ),
    # STORE PRODUCT SELECTION CARTS
    path(
        'create/store-product-selection-cart/<str:id>/',
        views.create_store_product_selection_cart,
        name='create_store_product_selection_cart'
    ),
    path(
        'delete/store-product-selection-cart/<str:id>/',
        views.delete_store_product_selection_cart,
        name='delete_store_product_selection_cart'
    ),
    path(
        'delete/list/store-product-selection-carts/',
        views.delete_all_store_product_selection_carts,
        name='delete_all_store_product_selection_carts'
    ),
    # STORE PRODUCT SELECTION BUY
    path(
        'create/store-product-selection-cart-buy/<str:id>/',
        views.create_store_product_selection_cart_buy,
        name='create_store_product_selection_cart_buy'
    ),
    path(
        'create-all/store-product-selection-cart-buy/',
        views.create_all_store_product_selection_cart_buy,
        name='create_all_store_product_selection_cart_buy'
    ),
    path(
        'create/store-product-selection-buy/<str:id>/',
        views.create_store_product_selection_buy,
        name='create_store_product_selection_buy'
    ),
    path(
        'delete/store-product-selection-buy/<str:id>/',
        views.delete_store_product_selection_buy,
        name='delete_store_product_selection_buy'
    ),
    path(
        'delete/list/store-product-selection-buys/',
        views.delete_list_store_product_selection_buys,
        name='delete_list_store_product_selection_buys'
    ),
    # MANAGE STORE PRODUCT SELECTION BUY REFUND
    path(
        'manage-refund/store-product-selection-buy/<str:id>/',
        views.manage_refund_store_product_selection_buy,
        name='manage_refund_store_product_selection_buy'
    ),
    # MANAGE STORE PRODUCT SELECTION BUY USE
    path(
        'manage-use/store-product-selection-buy/<str:id>/',
        views.manage_use_store_product_selection_buy,
        name='manage_use_store_product_selection_buy'
    ),
    # MANAGE REWARD POINTS
    path(
        'manage-points/<str:user_id>/',
        views.manage_points,
        name='manage_points'
    ),
    # GET FILE URL FROM AWS S3
    path(
        'get-file-url/',
        views.get_default_file_url,
        name='get_file_url'
    ),
]