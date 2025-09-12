from django.utils import timezone
from api_reward_points.models import (
    RewardPoints, 
    RewardPointsHistory,
    RewardInvoice,
    RewardSalesOrder
)
from api_integration.repository.repository_integration import (
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

logger = logging.getLogger(__name__)



def build_fetch_payload(user, has_local_data: bool):
    data = {
        'companyName': user.company_name,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'phone': get_national_phone_number(user.phone_number) if user.phone_number else None,
        'email': user.email,
        # 'status': 'paid',
    }
    if has_local_data:
        yesterday = timezone.now() - timezone.timedelta(days=1)
        data['lastModifiedTime'] = yesterday.strftime('%Y-%m-%dT00:00:00Z')
    return data


def merge_unique_by(items_a, items_b, key):
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

def compute_invoice_metrics(invoices, cutoff_dt, existing_invoice_ids):
    eligible = []
    real_invoices = [inv for inv in invoices if inv.invoice_id not in existing_invoice_ids]
    for inv in real_invoices:
        inv_dt = to_dt(getattr(inv, "date", None))
        if inv_dt and inv_dt >= cutoff_dt and \
             money(inv.payment_made) > 0 and \
                (getattr(inv, "status", None) or "").lower() == "paid":
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


# =========================
# Helpers de validación
# =========================

def _validate_user(user):
    if not user:
        raise ValueError("User is required to create initial reward points")


# =========================
# Helpers de sincronización remota
# =========================

def _fetch_remote_payloads(user, local_invoices, local_sales_orders):
    payload_invoices = build_fetch_payload(user, has_local_data=bool(local_invoices))
    payload_sales_orders = build_fetch_payload(user, has_local_data=bool(local_sales_orders))
    return payload_invoices, payload_sales_orders


def _fetch_remote_data(payload_invoices, payload_sales_orders):
    response_inv = fetch_client_invoices(payload_invoices) or {}
    if 'count' not in response_inv or 'results' not in response_inv:
        return None, None  # early return → baja complejidad

    response_so = fetch_sales_orders(payload_sales_orders) or {}
    return response_inv, response_so


def _upsert_sales_orders_from_response(response_so, user):
    for so in response_so.get('results', []):
        create_sales_order_instance(so, user=user)


def _build_invoices_from_remote(response_inv, user):
    invoices_in = response_inv.get('results', [])
    logger.info("Fetched %d invoices to process.", len(invoices_in))
    new_invoices = []
    for raw in invoices_in:
        inv = create_reward_invoice_instance(raw, user=user)
        if inv:
            new_invoices.append(inv)
    return new_invoices


def _merge_invoices(local_invoices, new_invoices):
    if local_invoices:
        return merge_unique_by(local_invoices, new_invoices, key="invoice_id")
    return new_invoices


def _load_sorted_local_collections(user, all_invoices):
    all_sales_orders = list(RewardSalesOrder.objects(user=user).all())
    sorted_invoices = sort_by_date(all_invoices)
    sorted_sales_orders = sort_by_date(all_sales_orders)
    return sorted_invoices, sorted_sales_orders


# =========================
# Helpers de métricas y puntos
# =========================

def _build_cutoff_dt(user):
    starting_sum_date = user.approved_time if user.approved_time else timezone.now()
    base = starting_sum_date.strftime("%Y-%m-%d")
    cutoff = to_dt(f"{base}T00:00:00Z")
    if cutoff is None:
        raise ValueError(f"starting_sum_date inválido para user={user.id if hasattr(user,'id') else user}")
    return cutoff


def _compute_metrics_and_points(sorted_invoices, sorted_sales_orders, cutoff, existing_invoice_ids):
    pendings = compute_sales_orders_pending(sorted_sales_orders)
    metrics = compute_invoice_metrics(sorted_invoices, cutoff_dt=cutoff, existing_invoice_ids=existing_invoice_ids)
    total_gained_points_new = calculate_reward_points(metrics["total_amount_to_rewards"])
    return pendings, metrics, total_gained_points_new

# =========================
# Helpers de upsert + historial
# =========================

def _make_history(now, rp, action, delta_points, description, sorted_invoices):
    if action not in ("gained", "substracted"):
        return None
    gained = delta_points if action == "gained" else 0
    spent = -delta_points if action == "substracted" else 0
    desc = description or (
        f"You have earned {gained} point(s) based on order invoices" if action == "gained"
        else f"You have lost {spent} point(s) based on order invoices"
    )
    return RewardPointsHistory(
        created_time=now,
        reward_points=rp,
        action=action,
        gained_points=gained,
        spent_points=spent,
        description=desc,
        info=[transform_data_to_mongo(inv) for inv in sorted_invoices],
    )


def _create_reward_points(now, user, metrics, pendings, sorted_invoices, sorted_sales_orders, total_gained_points_new, description):
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
    history = None
    if total_gained_points_new != 0:
        history = _make_history(now, rp, "gained", total_gained_points_new, description, sorted_invoices)
    return rp, history


def _update_reward_points(now, rp, metrics, pendings, sorted_invoices, sorted_sales_orders, total_gained_points_new, description):
    # old_total = rp.total_gained_points + rp.total_spent_points + rp.total_assigned_points
    # delta_points = total_gained_points_new - old_total

    rp.total_gained_points = total_gained_points_new + rp.total_gained_points
    rp.total_amount_invoices = metrics["total_amount_invoices"] + rp.total_amount_invoices
    rp.total_paid_amount_invoices = metrics["total_paid_amount_invoices"] + rp.total_paid_amount_invoices
    rp.total_opened_balance_invoices = metrics["total_opened_balance_invoices"] + rp.total_opened_balance_invoices
    rp.total_tax_amount_invoices = metrics["total_tax_amount_invoices"] + rp.total_tax_amount_invoices
    rp.qty_pending_orders = len(pendings)
    rp.invoices = sorted_invoices
    rp.sales_orders = sorted_sales_orders
    rp.last_modified_time = now

    history = None
    if total_gained_points_new > 0:
        history = _make_history(now, rp, "gained", total_gained_points_new, description, sorted_invoices)
    # elif delta_points < 0:
    #     history = _make_history(now, rp, "substracted", delta_points, description, sorted_invoices)

    return rp, history


# =========================
# API principal (complejidad baja)
# =========================

def get_rewards_points(user, description=None):
    _validate_user(user)
    
    local_invoices = list(RewardInvoice.objects(user=user).all())
    local_sales_orders = list(RewardSalesOrder.objects(user=user).all())
    
    payload_inv, payload_so = _fetch_remote_payloads(user, local_invoices, local_sales_orders)
    response_inv, response_so = _fetch_remote_data(payload_inv, payload_so)
    if response_inv is None:
        return None
    
    if 'results' in response_so:
        logger.info("Fetched %d sales orders to process.", len(response_so.get('results', [])))
        _upsert_sales_orders_from_response(response_so, user)

    new_invoices = _build_invoices_from_remote(response_inv, user)
    all_invoices = _merge_invoices(local_invoices, new_invoices)
    sorted_invoices, sorted_sales_orders = _load_sorted_local_collections(user, all_invoices)
    
    rp = RewardPoints.objects(user=user).first()
    
    existing_invoice_ids = [inv.invoice_id for inv in rp.invoices] if rp else []
    
    cutoff = _build_cutoff_dt(user)
    pendings, metrics, total_gained_points_new = _compute_metrics_and_points(
        sorted_invoices, 
        sorted_sales_orders, 
        cutoff,
        existing_invoice_ids
    )

    now = timezone.now()
    
    if not rp:
        rp, history = _create_reward_points(now, user, metrics, pendings, sorted_invoices, sorted_sales_orders,
                                            total_gained_points_new, description)
    else:
        rp, history = _update_reward_points(now, rp, metrics, pendings, sorted_invoices, sorted_sales_orders,
                                            total_gained_points_new, description)

    rp.save()
    if history:
        history.save()

    return rp