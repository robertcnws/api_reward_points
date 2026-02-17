from api_dealerportal.models import (
    DealerportalQuote, 
    DealerportalQuoteProduct, 
    DealerportalOrder
)
from api_authorization.models import LoginUser
from api_integration.models import RewardFullItem
from rest_framework.response import Response
from datetime import datetime

from utils.data_util import (
    transform_data_to_mongo,
    create_notification,
    create_tracking,
    to_aware
)

import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def api_dealerportal_create_quote(request):
    data = request.data
    name = data.get('name')
    markup = data.get('markup')
    owner_id = data.get('ownerId')
    if not name or not owner_id or markup is None:
        logger.error("Missing required fields: name, markup, or ownerId")
        return Response({'error': 'Missing required fields: name, markup, or ownerId'}, status=400)
    
    owner = LoginUser.objects(id=owner_id).first()
    if not owner:
        logger.error("Owner not found")
        return Response({'error': 'Owner not found'}, status=404)
    
    user_reporter = json.loads(data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    quote = DealerportalQuote(
        name=name,
        markup=markup,
        owner=owner,
        created_by=user_reporter
    )
    
    quote.save()
    
    tracking_info = transform_data_to_mongo(
        quote,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Created quote {quote.name} with markup {quote.markup} for owner {owner.company_name}',
        object_id=quote.id,
        object_type='DealerportalQuote',
        object_name=f'{quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'Created quote {quote.name} with markup {quote.markup} for owner {owner.company_name}'
    info_id=quote.id
    type='create_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': 'Quote created successfully', 'quoteId': str(quote.id)}, status=201)


def api_dealerportal_edit_quote(request, quote_id):
    data = request.data
    name = data.get('name')
    markup = data.get('markup')
    if not name or not markup:
        logger.error("Missing required fields: name or markup")
        return Response({'error': 'Missing required fields: name or markup'}, status=400)
    
    user_reporter = json.loads(data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    
    quote.name = name
    quote.markup = markup
    quote.calculate_price()
    
    tracking_info = transform_data_to_mongo(
        quote,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Edit quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}',
        object_id=quote.id,
        object_type='DealerportalQuote',
        object_name=f'{quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'Edit quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}'
    info_id=quote.id
    type='edit_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': 'Quote edited successfully', 'quoteId': str(quote.id)}, status=201)


def api_dealerportal_delete_quote(request, quote_id):
    user_reporter = json.loads(request.data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Deleted quote {quote.name} with markup {quote.markup} for owner {quote.owner.company_name}',
        object_id=quote.id,
        object_type='DealerportalQuote',
        object_name=f'{quote.name}',
        managed_data={}
    )
    
    module='dealerportal'
    info=f'Deleted quote {quote.name} with markup {quote.markup} for owner {quote.owner.company_name}'
    info_id=quote.id
    type='delete_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    quote.delete()
    
    return Response({'message': 'Quote deleted successfully'}, status=200)


def api_dealerportal_clone_quote(request, quote_id):
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    user_reporter = json.loads(request.data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    clone_quote = quote.clone_quote_with_products()
    clone_quote.created_by = user_reporter
    clone_quote.status = quote.status if quote.status != 'ordered' else 'active'
    clone_quote.save()
    tracking_info = transform_data_to_mongo(
        clone_quote,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Clone quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}',
        object_id=clone_quote.id,
        object_type='DealerportalQuote',
        object_name=f'{clone_quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'Clone quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}'
    info_id=clone_quote.id
    type='clone_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': 'Quote cloned successfully', 'quoteId': str(clone_quote.id)}, status=201)


def api_dealerportal_manage_product_to_quote(request, quote_id):
    data = request.data
    product_id = data.get('productId')
    action = data.get('action')
    quantity = data.get('quantity', 1)
    user_reporter = LoginUser.objects(username=json.loads(data.get('userReporter', None))['username']).first() if data.get('userReporter', None) else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    if not quote_id or not product_id or not action:
        logger.error("Missing required fields: quoteId, productId, or action")
        return Response({'error': 'Missing required fields: quoteId, productId, or action'}, status=400)
    
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    
    # Implement logic to add or remove product from quote based on action
    # This is a placeholder and should be replaced with actual logic
    if action == 'add':
        product = RewardFullItem.objects(id=product_id).first()
        if not product:
            logger.error("Product not found")
            return Response({'error': 'Product not found'}, status=404)
        quote_product = DealerportalQuoteProduct(
            quote=quote,
            product=product,
            quantity=quantity
        )
        quote_product.save()
    elif action == 'update':
        product = RewardFullItem.objects(id=product_id).first()
        if not product:
            logger.error("Product not found")
            return Response({'error': 'Product not found'}, status=404)
        quote_product = DealerportalQuoteProduct.objects(quote=quote, product=product).first()
        if not quote_product:
            logger.error("Quote product not found for update")
            return Response({'error': 'Quote product not found for update'}, status=404)
        quote_product.quantity = quantity
        quote_product.updated_at = to_aware(datetime.now())
        quote_product.save()
    elif action == 'remove':
        product = RewardFullItem.objects(id=product_id).first()
        if not product:
            logger.error("Product not found")
            return Response({'error': 'Product not found'}, status=404)
        quote_product = DealerportalQuoteProduct.objects(quote=quote, product=product).first()
        if not quote_product:
            logger.error("Quote product not found for removal")
            return Response({'error': 'Quote product not found for removal'}, status=404)
        quote_product.delete()
    else:
        logger.error("Invalid action")
        return Response({'error': 'Invalid action'}, status=400)
    
    quote.calculate_price()
    
    tracking_info = transform_data_to_mongo(
        quote_product,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    operation = 'Added' if action == 'add' else 'Removed'
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'{operation} product {product.name} in quote {quote.name} with quantity {quantity} for owner {quote.owner.company_name}',
        object_id=quote_product.id,
        object_type='DealerportalQuoteProduct',
        object_name=f'{product.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'{operation} product {product.name} in quote {quote.name} with quantity {quantity} for owner {quote.owner.company_name}'
    info_id=quote.id
    type=f'{action}_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': f'Product {action}ed successfully to/from quote'}, status=200)


def api_dealerportal_place_order(request, quote_id):
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    user_reporter = json.loads(request.data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    order = DealerportalOrder(
        quote=quote,
        owner=quote.owner,
        created_by=user_reporter
    )
    order.save()
    quote.status = 'ordered'
    quote.save()
    
    tracking_info = transform_data_to_mongo(
        order,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Placed order for quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}',
        object_id=order.id,
        object_type='DealerportalOrder',
        object_name=f'Order for {quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'Placed order for quote {quote.name} with markup {quote.markup} and name {quote.name} for owner {quote.owner.company_name}'
    info_id=order.id    
    type='place_order'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': 'Order placed successfully'}, status=200)


def api_dealerportal_manage_all_products_to_quote(request, quote_id):
    data = request.data
    action = data.get('action')
    user_reporter = LoginUser.objects(username=json.loads(data.get('userReporter', None))['username']).first() if data.get('userReporter', None) else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    if not quote_id or not action:
        logger.error("Missing required fields: quoteId or action")
        return Response({'error': 'Missing required fields: quoteId or action'}, status=400)
    
    quote = DealerportalQuote.objects(id=quote_id).first()
    if not quote:
        logger.error("Quote not found")
        return Response({'error': 'Quote not found'}, status=404)
    
    if action != 'remove':
        logger.error("Invalid action")
        return Response({'error': 'Invalid action'}, status=400)
        
    quote_products = DealerportalQuoteProduct.objects(quote=quote).all()
    if not quote_products:
        logger.error("Quote products not found for removal")
        return Response({'error': 'Quote products not found for removal'}, status=404)
    
    tracking_info = transform_data_to_mongo(
        quote_products,
        exclude_fields=[
            'password', 
            'is_staff', 
            'is_active', 
            'is_verified', 
            'last_login', 
            'date_joined',
            'last_modified_time', 
            'created_time'
        ]
    )
    
    quote_products.delete()
    quote.calculate_price()
    operation = 'Removed'
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'{operation} products in quote {quote.name} for owner {quote.owner.company_name}',
        object_id='list',
        object_type='DealerportalQuoteProduct',
        object_name=f'{quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'{operation} products in quote for owner {quote.owner.company_name}'
    info_id=quote.id
    type=f'{action}_quote'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': f'Products {action}ed successfully to/from quote'}, status=200)