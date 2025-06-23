from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
import json
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
# LOAD CLIENT INVOICES TO REWARDS
#############################################
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_client_invoices(request):
    headers = config_headers()
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    company_name = data.get('companyName', None)
    first_name = data.get('firstName', None)
    last_name = data.get('lastName', None)
    phone = data.get('phone', None)
    email = data.get('email', None)
    status = data.get('status', None)
    
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
            return JsonResponse({'error': 'Failed to invoices to reward points'}, status=500)
    return JsonResponse({'count': len(items_to_get), 'results': items_to_get})


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
            return {'error': 'Failed to invoices to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}