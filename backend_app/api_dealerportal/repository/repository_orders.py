from api_dealerportal.models import (
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

def api_dealerportal_manage_order_status(request, order_id):
    data = request.data
    new_status = data.get("status")
    if not new_status:
        logger.error("No status provided in the request data.")
        return Response({"error": "Status is required."}, status=400)
    
    user_reporter = data.get("userReporter")
    if not user_reporter:
        logger.error("No user reporter provided in the request data.")
        return Response({"error": "user reporter is required."}, status=400)
    
    user_reporter = json.loads(user_reporter)
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first()
    if not user_reporter:
        logger.error("User reporter not found in the database.")
        return Response({"error": "User reporter not found."}, status=404)
        
    order = DealerportalOrder.objects(id=order_id).first()
    if not order:
        return Response({"error": "Order not found."}, status=404)
    order.status = new_status
    order.save()
    
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
        action=f'Change order {order.number} to status {new_status}',
        object_id=order.id,
        object_type='DealerportalOrder',
        object_name=f'{order.quote.number} - {order.quote.name}',
        managed_data={
            'data': tracking_info
        }
    )
    
    module='dealerportal'
    info=f'Order {order.number} status changed to {new_status} by {user_reporter.username}'
    info_id=order.id
    type='change_status_order'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    return Response({'message': 'Order status changed successfully', 'orderId': str(order.id)}, status=201)


def api_dealerportal_delete_order(request, order_id):
    user_reporter = json.loads(request.data.get('userReporter', None))
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if not user_reporter:
        logger.error("User reporter not found")
        return Response({'error': 'User reporter not found'}, status=404)
    
    user_reporter = LoginUser.objects(username=user_reporter.username).first()
    if not user_reporter:
        logger.error("User reporter not found in the database")
        return Response({'error': 'User reporter not found'}, status=404)
    
    order = DealerportalOrder.objects(id=order_id).first()
    if not order:
        logger.error("Order not found")
        return Response({'error': 'Order not found'}, status=404)
    
    create_tracking(
        user_reporter=user_reporter,
        action=f'Deleted quote {order.quote.name} with markup {order.quote.markup} for owner {order.quote.owner.company_name}',
        object_id=order.id,
        object_type='DealerportalOrder',
        object_name=f'{order.quote.name}',
        managed_data={}
    )
    
    module='dealerportal'
    info=f'Deleted order {order.quote.name} with markup {order.quote.markup} for owner {order.quote.owner.company_name}'
    info_id=order.id
    type='delete_order'
    create_notification(module, info_id, info, type, user_reporter.username)
    
    quote = order.quote
    quote.status = 'active'
    quote.save()
    
    order.delete()
    
    return Response({'message': 'Order deleted successfully'}, status=200)