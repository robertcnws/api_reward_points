from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from api_reward_points.models import (
    RewardPoints, 
    RewardPointsHistory,
    RewardInvoice,
    RewardSalesOrder
)
from api_integration.views import (
    fetch_client_invoices,
    fetch_sales_orders
)
from utils.data_util import (
    transform_data_to_mongo, 
    get_national_phone_number, 
    calculate_reward_points,
    to_dt,
)
from utils.model_util import (
    create_reward_invoice_instance,
    create_sales_order_instance,
    money,
)
import logging
import boto3

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def send_sms_verification_code(phone_number, message):
    try:
        sns = boto3.client(
            'sns', 
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        sns.publish(
            PhoneNumber=phone_number,
            Message=message
        )
        logger.info(f'SMS sent to {phone_number}')
        print(f'SMS sent to {phone_number}')
    except Exception as e:
        logger.error(f'Error sending SMS: {e}')
        print(f'Error sending SMS: {e}')
        raise e
    
    
def send_email_verification_code(list_emails, code):
        email_html_message = render_to_string(
            "api_authorization/email_send_verification_code.html",  
            {"code": code}, 
        )
        message = "Verification code sent successfully."
        return send_generic_email(
            list_emails, 
            email_html_message, 
            "Verification Code for Reward Points System", 
            message_response=message
        )
        

def send_email_pending_approval(points, username, first_name, last_name, list_receivers):
    email_html_message = render_to_string(
            "api_authorization/email_send_pending_approval_user.html",  
            {"username": username, "first_name": first_name, "last_name": last_name, "points": points}, 
    )
    message = "Pending approval email sent successfully."
    return send_generic_email(
        list_receivers, 
        email_html_message, 
        f"Pending Approval (user: {username}) for Reward Points System",
        message_response=message
    )
    
    
def send_generic_email(list_receivers, email_html_message, subject, sender=settings.EMAIL_HOST_USER, message_response=None):
        email_msg = EmailMessage(
            subject,
            email_html_message,
            f'New Window System <{sender}>',
            list_receivers,
        )
        email_msg.content_subtype = "html"  
        email_msg.send(fail_silently=False)
        message = message_response or "Email sent successfully."
        return JsonResponse({"message": message}, status=200)

    
def generate_verification_code():
    import random
    return str(random.randint(100000, 999999)) 


# --- Helpers ---------------------------------------------------------------

def build_fetch_payload(user, has_local_data: bool):
    """Payload para los fetch remotos; si hay data local, pide solo recientes (ayer 00:00Z)."""
    data = {
        'companyName': user.company_name,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'phone': get_national_phone_number(user.phone_number) if user.phone_number else None,
        'email': user.email,
        # 'status': 'paid',
    }
    if has_local_data:
        # Ayer 00:00:00Z para evitar el '+' en querystring
        yesterday = timezone.now() - timezone.timedelta(days=1)
        data['lastModifiedTime'] = yesterday.strftime('%Y-%m-%dT00:00:00Z')
    return data

def merge_unique_by(items_a, items_b, key):
    """Une listas por clave sin duplicados, priorizando items_b (más recientes)."""
    idx = {getattr(x, key): x for x in items_a if getattr(x, key, None)}
    for y in items_b:
        k = getattr(y, key, None)
        if k:
            idx[k] = y
    return list(idx.values())

def sort_by_date(objs):
    return sorted(objs, key=lambda o: (to_dt(getattr(o, "date", None)) or timezone.make_aware(timezone.datetime.min)))

def compute_sales_orders_pending(sales_orders):
    return [
        so for so in sales_orders
        if so.status and so.status.lower() not in ('fulfilled', 'draft')
    ]

def compute_invoice_metrics(invoices, cutoff_dt):
    """Devuelve métricas ya normalizadas en Decimal."""
    # Filtra por cutoff para puntos
    eligible = []
    for inv in invoices:
        inv_dt = to_dt(getattr(inv, "date", None))
        if inv_dt and inv_dt >= cutoff_dt and money(inv.payment_made) > 0:
            eligible.append(inv)

    total_amount_invoices = sum(money(inv.payment_made) for inv in invoices)
    total_paid_amount_invoices = sum(
        money(inv.payment_made) for inv in invoices
        if (getattr(inv, "status", None) or "").lower() == "paid"
    )
    total_opened_balance_invoices = sum(money(inv.balance) for inv in invoices)
    total_tax_amount_invoices = sum(money(inv.tax_total) for inv in invoices)

    total_amount_to_rewards = sum(money(inv.payment_made) for inv in eligible)

    return {
        "total_amount_invoices": total_amount_invoices,
        "total_paid_amount_invoices": total_paid_amount_invoices,
        "total_opened_balance_invoices": total_opened_balance_invoices,
        "total_tax_amount_invoices": total_tax_amount_invoices,
        "total_amount_to_rewards": total_amount_to_rewards,
    }

# --- Función principal -----------------------------------------------------

def get_rewards_points(user, description=None):
    if not user:
        raise ValueError("User is required to create initial reward points")

    # 0) Datos locales y corte de consulta remota
    local_invoices = list(RewardInvoice.objects(user=user).all())
    local_sales_orders = list(RewardSalesOrder.objects(user=user).all())
    payload = build_fetch_payload(user, has_local_data=bool(local_invoices or local_sales_orders))

    # 1) Trae remoto (invoices / salesorders)
    response_inv = fetch_client_invoices(payload) or {}
    if 'count' not in response_inv or 'results' not in response_inv:
        return None

    response_so = fetch_sales_orders(payload) or {}
    if 'results' in response_so:
        logger.info(f"Fetched {len(response_so.get('results', []))} sales orders to process.")
        for so in response_so.get('results', []):
            create_sales_order_instance(so, user=user)

    # 2) Construye/actualiza invoices locales desde remoto
    invoices_in = response_inv.get('results', [])
    logger.info(f"Fetched {len(invoices_in)} invoices to process.")

    # Crea instancias y filtra solo las que tienen pago > 0 (para puntos)
    new_invoices = []
    for raw in invoices_in:
        inv = create_reward_invoice_instance(raw, user=user)
        if inv:
            new_invoices.append(inv)

    # Une con existentes por invoice_id (evita duplicados)
    if local_invoices:
        all_invoices = merge_unique_by(local_invoices, new_invoices, key="invoice_id")
    else:
        all_invoices = new_invoices

    # Sales orders (recargamos por si se insertaron arriba)
    all_sales_orders = list(RewardSalesOrder.objects(user=user).all())

    # Ordena por fecha para consistencia
    sorted_invoices = sort_by_date(all_invoices)
    sorted_sales_orders = sort_by_date(all_sales_orders)

    # 3) Cálculo de métricas y puntos
    #   Usa fecha de inicio configurable si existe; fallback a constante actual
    starting_sum_date_str = getattr(settings, "REWARDS_START_DATE", "2025-08-01T00:00:00Z")
    cutoff = to_dt(starting_sum_date_str)
    if cutoff is None:
        raise ValueError(f"starting_sum_date inválido: {starting_sum_date_str!r}")

    pendings = compute_sales_orders_pending(sorted_sales_orders)
    metrics = compute_invoice_metrics(sorted_invoices, cutoff_dt=cutoff)

    total_gained_points_new = calculate_reward_points(metrics["total_amount_to_rewards"])

    # 4) Upsert de RewardPoints
    rp = RewardPoints.objects(user=user).first()
    history = None
    now = timezone.now()

    if not rp:
        # Crear
        rp = RewardPoints(
            user=user,
            total_gained_points=total_gained_points_new,
            total_spent_points=0,
            total_amount_invoices=metrics["total_amount_invoices"],
            total_paid_amount_invoices=metrics["total_paid_amount_invoices"],
            total_opened_balance_invoices=metrics["total_opened_balance_invoices"],
            total_tax_amount_invoices=metrics["total_tax_amount_invoices"],
            qty_pending_orders=len(pendings),
            invoices=sorted_invoices,
            sales_orders=sorted_sales_orders,
            created_time=now,
            last_modified_time=now,
        )
        delta_points = total_gained_points_new
        if delta_points != 0:
            history = RewardPointsHistory(
                created_time=now,
                reward_points=rp,
                action='gained',
                gained_points=delta_points,
                spent_points=0,
                description=description or f'You have gained {delta_points} points based on order invoices',
                info=[transform_data_to_mongo(inv) for inv in sorted_invoices],
            )
    else:
        # Actualizar: recalcula y aplica delta solo sobre total_gained_points
        old_total = rp.total_gained_points
        delta_points = total_gained_points_new - old_total

        rp.total_gained_points = total_gained_points_new
        rp.total_amount_invoices = metrics["total_amount_invoices"]
        rp.total_paid_amount_invoices = metrics["total_paid_amount_invoices"]
        rp.total_opened_balance_invoices = metrics["total_opened_balance_invoices"]
        rp.total_tax_amount_invoices = metrics["total_tax_amount_invoices"]
        rp.qty_pending_orders = len(pendings)
        rp.invoices = sorted_invoices
        rp.sales_orders = sorted_sales_orders
        rp.last_modified_time = now  # <-- ojo: usar consistently *_time

        if delta_points > 0:
            history = RewardPointsHistory(
                created_time=now,
                reward_points=rp,
                action='gained',
                gained_points=delta_points,
                spent_points=0,
                description=description or f'You have gained {delta_points} points based on order invoices',
                info=[transform_data_to_mongo(inv) for inv in sorted_invoices],
            )
        elif delta_points < 0:
            history = RewardPointsHistory(
                created_time=now,
                reward_points=rp,
                action='substracted',  # si tu sistema ya usa este literal, mantenlo
                gained_points=0,
                spent_points=-delta_points,
                description=description or f'You have lost {-delta_points} points based on order invoices',
                info=[transform_data_to_mongo(inv) for inv in sorted_invoices],
            )

    rp.save()
    if history:
        history.save()

    return rp
