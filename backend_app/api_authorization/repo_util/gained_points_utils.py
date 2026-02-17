from django.utils import timezone
from django.test import RequestFactory
from django.conf import settings
from api_integration.repository.repository_integration import fetch_customer_by_email
from bson import ObjectId
from bson.dbref import DBRef
from mongoengine.errors import DoesNotExist, ValidationError
from api_reward_points.models import (
    RewardPoints, 
    RewardPointsHistory,
    RewardInvoice,
    RewardSalesOrder
)
from api_integration.repository.repository_integration import (
    fetch_client_invoices,
    fetch_sales_orders,
    fetch_client_sync_with_zoho,
)
from utils.data_util import (
    transform_data_to_mongo, 
    calculate_reward_points,
    to_dt,
    build_fetch_payload,
    build_fetch_payload_by_list_ids_and_type_field,
)
from utils.model_util import (
    create_reward_invoice_instance,
    create_sales_order_instance,
    money,
)
import logging

logger = logging.getLogger(__name__)


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

def compute_invoice_metrics(invoices, cutoff_dt, existing_invoice_ids, existing_invoices=None, existing_assigned_points=0):
    eligible = []
    real_invoices = [inv for inv in invoices if str(inv.invoice_id) not in existing_invoice_ids]
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

    if existing_invoices and len(existing_invoices) > 0:
        existing_paid_amount_invoices = sum(
            money(inv.payment_made) for inv in existing_invoices
            if (getattr(inv, "status", None) or "").lower() == "paid" and \
                to_dt(getattr(inv, "date", None)) and \
                    to_dt(getattr(inv, "date", None)) >= cutoff_dt
        )
        difference_new_existing_amount = existing_paid_amount_invoices - existing_assigned_points

    return {
        "total_amount_invoices": total_amount_invoices,
        "total_paid_amount_invoices": total_paid_amount_invoices,
        "total_opened_balance_invoices": total_opened_balance_invoices,
        "total_tax_amount_invoices": total_tax_amount_invoices,
        "total_amount_to_rewards": total_amount_to_rewards,
        "difference_new_existing_amount": difference_new_existing_amount if existing_invoices else 0,
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

def _fetch_remote_payloads_by_ids(salesorder_ids):
    payload_invoices_by_salesorder_ids = build_fetch_payload_by_list_ids_and_type_field(
        list_ids=salesorder_ids, type_field="salesordersIds"
    )
    logger.debug(f"Built payload for fetching invoices by salesorder_ids: {payload_invoices_by_salesorder_ids}")
    return payload_invoices_by_salesorder_ids


def _fetch_remote_data(payload_invoices, payload_sales_orders=None):
    response_inv = fetch_client_invoices(payload_invoices) or {}
    if 'count' not in response_inv or 'results' not in response_inv:
        return None, None  # early return → baja complejidad
    response_so = {}
    if payload_sales_orders:
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
    return new_invoices or []


def _load_sorted_local_collections(user, all_invoices):
    all_sales_orders = list(RewardSalesOrder.objects(user=user).all())
    sorted_invoices = sort_by_date(all_invoices)
    sorted_sales_orders = sort_by_date(all_sales_orders)
    return sorted_invoices, sorted_sales_orders


# =========================
# Helpers de métricas y puntos
# =========================

def _build_cutoff_dt(user):
    # starting_sum_date = user.approved_time if user.approved_time else timezone.now()
    # base = starting_sum_date.strftime("%Y-%m-%d")
    base = settings.REWARDS_START_DATE
    cutoff = to_dt(f"{base}T00:00:00Z")
    if cutoff is None:
        raise ValueError(f"starting_sum_date inválido para user={user.id if hasattr(user,'id') else user}")
    return cutoff


def _compute_metrics_and_points(
    sorted_invoices, 
    sorted_sales_orders, 
    cutoff, 
    existing_invoice_ids,
    existing_invoices=None,
    existing_assigned_points=0,
):
    pendings = compute_sales_orders_pending(sorted_sales_orders)
    metrics = compute_invoice_metrics(
        sorted_invoices, 
        cutoff_dt=cutoff, 
        existing_invoice_ids=existing_invoice_ids,
        existing_invoices=existing_invoices,
        existing_assigned_points=existing_assigned_points
    )
    total_gained_points_new = calculate_reward_points(metrics["total_amount_to_rewards"])
    difference_new_existing_amount = calculate_reward_points(metrics["difference_new_existing_amount"])
    return pendings, metrics, total_gained_points_new, difference_new_existing_amount

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


def _create_reward_points(
    now, 
    user, 
    metrics, 
    pendings, 
    sorted_invoices, 
    sorted_sales_orders, 
    total_gained_points_new, 
    difference_new_existing_amount, 
    description
):
    real_total_gained_points = total_gained_points_new + difference_new_existing_amount if difference_new_existing_amount > 0 else total_gained_points_new
    rp = RewardPoints(
        user=user,
        total_gained_points=real_total_gained_points,
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
    if real_total_gained_points != 0:
        history = _make_history(now, rp, "gained", real_total_gained_points, description, sorted_invoices)
    return rp, history


def _update_reward_points(now, rp, metrics, pendings, sorted_invoices, sorted_sales_orders, total_gained_points_new, difference_new_existing_amount, description):
    # old_total = rp.total_gained_points + rp.total_spent_points + rp.total_assigned_points
    # delta_points = total_gained_points_new - old_total

    real_total_gained_points = total_gained_points_new + difference_new_existing_amount if difference_new_existing_amount > 0 else total_gained_points_new

    spent_points = rp.total_spent_points or 0
    
    rp.total_gained_points = real_total_gained_points + rp.total_gained_points
    rp.total_amount_invoices = metrics["total_amount_invoices"]
    rp.total_paid_amount_invoices = metrics["total_paid_amount_invoices"]
    rp.total_opened_balance_invoices = metrics["total_opened_balance_invoices"]
    rp.total_tax_amount_invoices = metrics["total_tax_amount_invoices"]
    rp.qty_pending_orders = len(pendings)
    rp.invoices = sorted_invoices
    rp.sales_orders = sorted_sales_orders
    rp.last_modified_time = now

    history = None
    if total_gained_points_new > 0:
        history = _make_history(now, rp, "gained", total_gained_points_new, description, sorted_invoices)
    if difference_new_existing_amount - spent_points > 0:
        extra_history = _make_history(now, rp, "gained", difference_new_existing_amount - spent_points, description, sorted_invoices)
        if history:
            # Combinar info de ambos historiales
            history.gained_points += extra_history.gained_points
            history.description += f" .Additionally, {extra_history.gained_points} point(s) were added due to adjustment."
            history.info.extend(extra_history.info)
        else:
            history = extra_history
    # elif delta_points < 0:
    #     history = _make_history(now, rp, "substracted", delta_points, description, sorted_invoices)

    return rp, history


def _fetch_doc(ref, Model):
    """Devuelve el Document o None desde ref que puede ser Document, LazyReference, DBRef u ObjectId."""
    if ref is None:
        return None
    try:
        # Ya es Document
        if hasattr(ref, "id") and not isinstance(ref, DBRef):
            return ref
        # LazyReferenceField
        if hasattr(ref, "fetch"):
            return ref.fetch()
        # DBRef crudo
        if isinstance(ref, DBRef):
            return Model.objects.with_id(ref.id)
        # Solo ObjectId
        if isinstance(ref, ObjectId):
            return Model.objects.with_id(ref)
    except (DoesNotExist, ValidationError):
        return None
    return None


# =========================
# API de integración (complejidad media)
# =========================

def _update_customer_id_for_user(user):
    customer_id = getattr(user, "customer_id", None)
    email = getattr(user, "email", None)
    if customer_id:
        return True
    payload = {'email': email}
    response = fetch_customer_by_email(payload)
    if response and 'results' in response and len(response['results']) > 0:
        customer = response['results'][0]
        customer_id = customer.get('contact_id', None)
        if customer_id:
            user.customer_id = customer_id
            user.save()
            return True
    return False


# =========================
# API principal (complejidad baja)
# =========================

from concurrent.futures import ThreadPoolExecutor, as_completed

def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i+size]

def _fetch_invoices_for_salesorders_ids_chunk(ids_chunk):
    # ids_chunk: list[str]
    payload = _fetch_remote_payloads_by_ids(",".join(map(str, ids_chunk)))
    if not payload:
        return []
    logger.info(f"Fetching invoices for salesorder_ids chunk: {ids_chunk}")
    try:
        data, _meta = _fetch_remote_data(payload)
        logger.info(f"Has Response data for salesorder_ids chunk {ids_chunk}? : {'results' in data}")
        
        if isinstance(data, dict):
            return data.get("results") or []

        # si ya viene lista, devuélvela
        if isinstance(data, list):
            return data

        # return data or {}
    except Exception as e:
        logger.error(f"Error fetching invoices for salesorder_ids chunk {ids_chunk}: {e}")
        return {}

def fetch_invoices_by_salesorder_ids(
    so_salesorder_ids,
    chunk_size=20,       # 5 es seguro pero lento; 20-50 suele ir bien
    max_workers=5,       # concurrencia real (no pases de 8-10)
):
    # normaliza: strings únicas
    ids = [str(x).strip() for x in so_salesorder_ids if x]
    ids = list(dict.fromkeys(ids))  # dedupe preservando orden

    results = []
    chunks = list(chunked(ids, chunk_size))
    
    logger.info(f"Fetching invoices for {len(ids)} salesorder_ids in {len(chunks)} chunks (chunk_size={chunk_size}, max_workers={max_workers})")

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = [ex.submit(_fetch_invoices_for_salesorders_ids_chunk, ch) for ch in chunks]
        for fut in as_completed(futures):
            results.extend(fut.result())
            
            
    logger.info(f"Finished fetching invoices for salesorder_ids. Total invoices fetched: {len(results)}")

    return {'count': len(results), 'results': results}

def get_rewards_points(user, description=None):
    _validate_user(user)

    _update_customer_id_for_user(user)
    
    if user.customer_id:
        logger.info(f"User {user.username} has customer_id {user.customer_id} for rewards points sync.")
        
        local_sales_orders = list(RewardSalesOrder.objects(user=user, checked_for_rewards=False).all())
        local_sales_orders = list(RewardSalesOrder.objects(user=user).all())
        local_invoices_ini = list(RewardInvoice.objects(customer_id=user.customer_id).all())
        so_ids = [so.id for so in local_sales_orders]
        so_salesorder_ids = [str(so.salesorder_id) for so in local_sales_orders if so.salesorder_id]
        local_invoices_fin = list(RewardInvoice.objects(salesorder__in=so_ids).all())
        local_invoices = merge_unique_by(local_invoices_ini, local_invoices_fin, key="invoice_id")
        
        payload_inv, payload_so = _fetch_remote_payloads(user, local_invoices, local_sales_orders)
        # payload_inv_by_so_ids = _fetch_remote_payloads_by_ids(",".join(so_salesorder_ids))
        response_inv_by_so_ids = None
        if so_salesorder_ids:
            logger.info(f"Fetching invoices by salesorder_ids: {so_salesorder_ids}")
            try:
                response_inv_by_so_ids = fetch_invoices_by_salesorder_ids(
                    so_salesorder_ids,
                    chunk_size=10,
                    max_workers=5
                )
                # logger.info(f"Payload for fetching invoices by salesorder_ids: {response_inv_by_so_ids}")
                logger.info(f"Finished Fetched {len(response_inv_by_so_ids)} invoices by salesorder_ids.")
            except Exception as e:
                logger.error(f"Error finished fetching invoices by salesorder_ids: {e}")
                response_inv_by_so_ids = {}
                
        new_invoices_by_so_ids = []
        old_invoices = local_invoices
        if response_inv_by_so_ids:
            logger.info("Response from salesorder_ids fetch has %d invoices.", response_inv_by_so_ids.get('count', 0))
            new_invoices_by_so_ids = _build_invoices_from_remote(response_inv_by_so_ids, user)
            logger.info("Built %d new invoices from salesorder_ids fetch.", len(new_invoices_by_so_ids))
        if new_invoices_by_so_ids:
            # Evitar duplicados entre new_invoices y new_invoices_by_so_ids
            old_invoices = _merge_invoices(local_invoices, new_invoices_by_so_ids)
            for so in local_sales_orders:
                so.checked_for_rewards = True
                so.save()        
        
        response_inv, response_so = _fetch_remote_data(payload_inv, payload_sales_orders=payload_so)
        if response_inv is None:
            return None
        
        if 'results' in response_so:
            logger.info("Fetched %d sales orders to process.", len(response_so.get('results', [])))
            _upsert_sales_orders_from_response(response_so, user)

        new_invoices = _build_invoices_from_remote(response_inv, user)
        logger.info("Built %d new invoices from remote.", len(new_invoices))
        
        all_invoices = _merge_invoices(old_invoices, new_invoices)
        sorted_invoices, sorted_sales_orders = _load_sorted_local_collections(user, all_invoices)
        
        rp = RewardPoints.objects(user=user).first()
        existing_invoice_ids = []
        
        if rp and rp.invoices:
            existing_invoice_ids = []
            for inv_ref in rp.invoices:
                inv_doc = _fetch_doc(inv_ref, RewardInvoice)
                if inv_doc is not None:
                    existing_invoice_ids.append(str(inv_doc.invoice_id))

        cutoff = _build_cutoff_dt(user)
        pendings, metrics, total_gained_points_new, difference_new_existing_amount = _compute_metrics_and_points(
            sorted_invoices, 
            sorted_sales_orders, 
            cutoff,
            existing_invoice_ids,
            existing_invoices=rp.invoices if rp else None,
            existing_assigned_points=rp.total_gained_points if rp else 0,
        )

        now = timezone.now()
        
        if not rp:
            rp, history = _create_reward_points(now, user, metrics, pendings, sorted_invoices, sorted_sales_orders,
                                                total_gained_points_new, difference_new_existing_amount,description)
        else:
            rp, history = _update_reward_points(now, rp, metrics, pendings, sorted_invoices, sorted_sales_orders,
                                                total_gained_points_new, difference_new_existing_amount, description)
        is_sync_with_zoho = False
        payload_sync = build_fetch_payload(user, has_local_data=False)
        response_sync = fetch_client_sync_with_zoho(payload_sync)
        
        if response_sync and 'results' in response_sync and len(response_sync['results']) > 0:
            is_sync_with_zoho = True
        
        rp.is_sync_with_zoho = is_sync_with_zoho

        rp.save()
        if history:
            history.save()

        return rp