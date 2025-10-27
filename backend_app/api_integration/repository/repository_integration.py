from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from api_integration.models import RewardItem
from utils.data_util import assign_points_to_item
from utils.api_utils import config_headers
import requests
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# LOAD SALES ORDERS TO REWARDS
#############################################

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
    page = 1
    while True:
        try:
            paged_url = f"{url}&page={page}" if '?' in url else f"{url}?page={page}"
            response = session.get(paged_url, headers=headers)
            response.raise_for_status()
            items = response.json()
            items_confirmed = list(items.get('results', []))
            items_to_get.extend(items_confirmed)
            if not items.get('next', None):
                break
            page += 1
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching sales orders: {e}")
            return {'error': 'Failed to fetch sales orders to reward points'}
    return {'count': len(items_to_get), 'results': items_to_get}


#############################################
# LOAD CLIENT INVOICES TO REWARDS
#############################################

def list_client_invoices(request):
    data = request.query_params if hasattr(request, 'query_params') else request.GET
    if not data:
        return JsonResponse({'error': 'No data provided'}, status=400)
    response = fetch_client_invoices(data)
    if 'error' in response:
        return JsonResponse({'error': response['error']}, status=500)   
    return JsonResponse(response, status=200)


#############################################
# FETCH CLIENT SYNC WITH ZOHO
#############################################
    
def fetch_client_sync_with_zoho(data):
    headers = config_headers()
    base_url = f"{settings.API_MAIN_DATA_URL}/zoho/customers/"
    
    field_map = {
        "email": "email",
    }
    base_params = {
        api_key: data.get(src_key)
        for src_key, api_key in field_map.items()
        if data.get(src_key)
    }

    session = requests.Session()
    items = []
    next_url = base_url
    params = base_params  

    while next_url:
        try:
            resp = session.get(next_url, headers=headers, params=params, timeout=30)
            resp.raise_for_status()
            payload = resp.json()
        except requests.exceptions.RequestException as e:
            logger.error("Error fetching invoices: %s", e)
            return {"error": "Failed to fetch invoices to reward points"}

        items.extend(payload.get("results", []))
        next_url = payload.get("next")
        params = None 

    return {"count": len(items), "results": items}


#############################################
# FETCH CLIENT INVOICES TO REWARDS
#############################################
    
def fetch_client_invoices(data):
    headers = config_headers()
    base_url = f"{settings.API_MAIN_DATA_URL}/zoho/invoices_to_rewards_points/"
    
    field_map = {
        "companyName": "company_name",
        "firstName": "first_name",
        "lastName": "last_name",
        "phone": "phone",
        "email": "email",
        "status": "status",
        "lastModifiedTime": "last_modified_time",
    }
    base_params = {
        api_key: data.get(src_key)
        for src_key, api_key in field_map.items()
        if data.get(src_key)
    }

    session = requests.Session()
    items = []
    next_url = base_url
    params = base_params  

    while next_url:
        try:
            resp = session.get(next_url, headers=headers, params=params, timeout=30)
            resp.raise_for_status()
            payload = resp.json()
        except requests.exceptions.RequestException as e:
            logger.error("Error fetching invoices: %s", e)
            return {"error": "Failed to fetch invoices to reward points"}

        items.extend(payload.get("results", []))
        next_url = payload.get("next")
        params = None 

    return {"count": len(items), "results": items}


#############################################
# LOAD ITEMS TO REWARDS
#############################################

def list_items(request):
    data = request.query_params if hasattr(request, 'query_params') else request.GET
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
            items_confirmed = list(items.get('results', []))
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
            
#############################################
# FETCH CUSTOMERS BY EMAIL
#############################################
    
def _is_drf_request(obj):
    # DRF Request tiene .query_params
    return hasattr(obj, "query_params")

def _is_django_request(obj):
    # Django HttpRequest tiene .GET
    return hasattr(obj, "GET")

def _to_plain_params(obj):
    """
    Devuelve un dict plano con los parámetros independientemente de si:
    - viene de DRF Request (query_params)
    - Django HttpRequest (GET)
    - ya es un dict
    """
    if _is_drf_request(obj):
        return obj.query_params
    if _is_django_request(obj):
        return obj.GET
    if isinstance(obj, dict):
        return obj
    # fallback
    return {}

def _pick_scalar(d, key, default=None):
    """
    Extrae un valor escalar de un dict / QueryDict:
    - Si el valor es lista, toma el primero
    - Si falta, devuelve default
    """
    if d is None:
        return default
    val = d.get(key, default)
    if isinstance(val, (list, tuple)):
        return val[0] if val else default
    return val

def fetch_customer_by_email(request_or_params):
    """
    Puede usarse como view handler (pasando HttpRequest/DRF Request) o como función interna (pasando dict).
    - Si recibe request, responde JsonResponse
    - Si recibe dict, devuelve dict
    """
    raw = _to_plain_params(request_or_params)
    logger.debug(f"Fetching customer by email: {raw}")

    try:
        page = int(_pick_scalar(raw, "page", 1) or 1)
    except Exception:
        page = 1

    try:
        page_size = int(_pick_scalar(raw, "page_size", 100) or 100)
    except Exception:
        page_size = 100

    email = (_pick_scalar(raw, "email", "") or "").strip()

    headers = config_headers()  # asumes que ya existe
    base_url = f"{settings.API_MAIN_DATA_URL}/zoho/customers/"
    params = {"page": page, "page_size": page_size}
    if email:
        params["email"] = email

    items_to_get = []
    session = requests.Session()

    try:
        while True:
            resp = session.get(base_url, headers=headers, params=params, timeout=15)
            resp.raise_for_status()
            body = resp.json()

            # Soporta respuesta paginada estilo DRF ({results, next}) o lista simple
            if isinstance(body, dict):
                batch = list(body.get("results", []) or [])
                items_to_get.extend(batch)
                next_url = body.get("next")
                if not next_url:
                    break
                # Si el backend usa ?page=... en next, incrementamos localmente:
                params["page"] += 1
            elif isinstance(body, list):
                items_to_get.extend(body)
                break
            else:
                # formato inesperado
                logger.error(f"Unexpected customers response format: {type(body)}")
                break
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching customers: {e}")
        payload = {"error": "Failed to fetch customers by email"}
        # Si nos llamaron como view -> JsonResponse; si no, dict
        if _is_drf_request(request_or_params) or _is_django_request(request_or_params):
            return JsonResponse(payload, status=502)
        return payload

    payload = {"count": len(items_to_get), "results": items_to_get}

    # Si nos llamaron como view -> JsonResponse; si no, dict
    if _is_drf_request(request_or_params) or _is_django_request(request_or_params):
        return JsonResponse(payload, status=200)
    return payload