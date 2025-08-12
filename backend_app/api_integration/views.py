from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import RewardItem
from utils.data_util import assign_points_to_item
import requests
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# HEADERS
#############################################

def config_headers():
    token = settings.API_MAIN_DATA_TOKEN
    headers = {
        "Authorization": f"Token {token}"
    }
    return headers


#############################################
# LOAD SALES ORDERS TO REWARDS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_sales_orders(request):
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    if not data:
        return JsonResponse({'error': 'No data provided'}, status=400)
    response = fetch_sales_orders(data)
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)   
    return JsonResponse(response, status=200)


#############################################
# FETCH SALES ORDERS TO REWARDS
#############################################

def fetch_sales_orders(data):
    print(f"Fetching sales orders with data: {data}")
    headers = config_headers()
    company_name = data.get('companyName', None)
    last_modified_time = data.get('lastModifiedTime', None)
    
    params = []
    url = f'{settings.API_MAIN_DATA_URL}/zoho/sales_orders_to_service/?'
    if company_name and company_name != '':
        params.append(f"company_name={company_name}")
    if last_modified_time and last_modified_time != '':
        params.append(f"last_modified_time={last_modified_time}")
    
    params.append("is_recent=true")
    
    if len(params) > 0:
        url = f"{url}{'&'.join(params)}"
    
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', [])]
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return {'error': 'Failed to fetch sales orders to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}


#############################################
# LOAD CLIENT INVOICES TO REWARDS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_client_invoices(request):
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    if not data:
        return JsonResponse({'error': 'No data provided'}, status=400)
    response = fetch_client_invoices(data)
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)   
    return JsonResponse(response, status=200)


#############################################
# FETCH CLIENT INVOICES TO REWARDS
#############################################
    
def fetch_client_invoices(data):
    print(f"Fetching client invoices with data: {data}")
    headers = config_headers()
    company_name = data.get('companyName', None)
    first_name = data.get('firstName', None)
    last_name = data.get('lastName', None)
    phone = data.get('phone', None)
    email = data.get('email', None)
    status = data.get('status', None)
    last_modified_time = data.get('lastModifiedTime', None)
    
    params = []
    url = f'{settings.API_MAIN_DATA_URL}/zoho/invoices_to_rewards_points/?'
    if company_name and company_name != '':
        params.append(f"company_name={company_name}")
    if first_name and first_name != '':
        params.append(f"first_name={first_name}")
    if last_name and last_name != '':
        params.append(f"last_name={last_name}")
    if phone and phone != '':
        params.append(f"phone={phone}")
    if email and email != '':
        params.append(f"email={email}")
    if status and status != '':
        params.append(f"status={status}")  
    if last_modified_time and last_modified_time != '':
        params.append(f"last_modified_time={last_modified_time}")
    
    if len(params) > 0:
        url = f"{url}{'&'.join(params)}"
    
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = [item for item in items.get('results', [])]
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching invoices: {e}")
            return {'error': 'Failed to fetch invoices to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}


#############################################
# LOAD ITEMS TO REWARDS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_items(request):
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    # if not data:
    #     return JsonResponse({'error': 'No data provided'}, status=400)
    response = fetch_items(data)
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)   
    return JsonResponse(response, status=200)


#############################################
# FETCH ITEMS TO REWARDS
#############################################
    
def fetch_items(data=None):
    print(f"Fetching items: {data}")
    headers = config_headers()
    
    url = f'{settings.API_MAIN_DATA_URL}/zoho/items/?'
    
    page = data.get('page', 1) if data else 1
    page_size = data.get('page_size', 100) if data else 100
    # params.append(f"page={page if page else 1}")
    # params.append(f"page_size={page_size if page_size else 100}")
    
    # if len(params) > 0:
    #     url = f"{url}{'&'.join(params)}"
    
    params = {
        'page': int(page) if page else 1,
        'page_size': int(page_size) if page_size else 100
    }
    
    items_to_get = []
    session = requests.Session()
    while True:
        try:
            response = session.get(url, headers=headers, params=params)
            response.raise_for_status()
            items = response.json()
            # print(f"Items fetched: {items}")
            items_confirmed = [item for item in items.get('results', [])]
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            params['page'] += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching items: {e}")
            return {'error': 'Failed to fetch items to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}


##############################################
# UPDATE ITEMS TO REWARDS
##############################################

def update_items_to_rewards(items=None):
    items = fetch_items() if items is None else items
    if 'error' in items:
        logger.error(f"Error fetching items: {items['error']}")
        return
    
    docs = items.get('results', [])
    if not docs:
        logger.warning("No items found to update.")
        return

    for item in docs:
        item_id   = item.get('_id')
        item_rate = item.get('rate', 0)
        
        assigned_points = assign_points_to_item(item_rate)
        if not item_id:
            continue
        
        existing = RewardItem.objects(__raw__={'item._id': item_id}).first()

        if existing:
            existing.item               = item
            existing.assigned_points    = assigned_points
            existing.last_modified_time = timezone.now()
            existing.can_be_bought      = existing.can_be_bought if existing.can_be_bought is not None else True
            existing.save()
        else:
            RewardItem(
                item               = item,
                assigned_points    = assigned_points,
                created_time       = timezone.now(),
                last_modified_time = timezone.now(),
                can_be_bought      = True
            ).save()