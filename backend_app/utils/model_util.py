from api_reward_points.models import (
    RewardInvoiceTax, 
    RewardInvoiceLineItem, 
    RewardInvoice,
    RewardSalesOrder,
)
from utils.data_util import (
    to_dt,
)

from mongoengine.errors import NotUniqueError, ValidationError

def money(x):
    return float(str(x or 0))

def safe_save_or_refetch(doc, refilter_kwargs: dict):
    """
    Intenta guardar 'doc'. Si hay NotUniqueError (condición de carrera),
    reconsulta según 'refilter_kwargs' y devuelve el persistido.
    """
    try:
        doc.save()
        return doc
    except NotUniqueError:
        existing = doc.__class__.objects(**refilter_kwargs).first()
        if not existing:
            # Relevanta si hay un índice único distinto al filtro
            raise
        return existing

# ---------------- TAX ----------------

def create_reward_invoice_tax_instance(json_data):
    tax_name = json_data.get('tax_name', '') or ''
    tax_amount = money(json_data.get('tax_amount', 0))

    # Clave única (ajusta a tu schema si tienes un índice diferente)
    query = dict(tax_name=tax_name, tax_amount=tax_amount)

    tax = RewardInvoiceTax.objects(**query).first()
    if tax:
        # Actualiza si quieres mantener “upsert” semántico
        tax.tax_name = tax_name
        tax.tax_amount = tax_amount
        return safe_save_or_refetch(tax, query)

    tax = RewardInvoiceTax(**query)
    return safe_save_or_refetch(tax, query)

# --------------- LINE ITEM ------------

def create_reward_invoice_line_item_instance(json_data):
    line_item_id = json_data.get('line_item_id') or json_data.get('id') or ''
    # Si tu modelo tiene unique en line_item_id, úsalo; si NO, define otro compuesto.
    if line_item_id:
        query = dict(line_item_id=line_item_id)
    else:
        query = dict(
            item_id=json_data.get('item_id', '') or '',
            quantity=json_data.get('quantity', 1) or 1,
            rate=money(json_data.get('rate', 0)),
        )

    li = RewardInvoiceLineItem.objects(**query).first()
    if not li:
        li = RewardInvoiceLineItem(**query)

    li.item_id = json_data.get('item_id', '') or ''
    li.sku = json_data.get('sku', '') or ''
    li.name = json_data.get('name', '') or ''
    li.description = json_data.get('description', '') or ''
    li.rate = money(json_data.get('rate', 0))
    li.quantity = json_data.get('quantity', 1) or 1
    li.item_total = money(json_data.get('item_total', 0))
    if line_item_id:
        li.line_item_id = line_item_id

    return safe_save_or_refetch(li, query)

# -------------- SALES ORDER ------------

def create_sales_order_instance(json_data, user):
    so_id = json_data.get('salesorder_id', '') or ''
    if not so_id:
        return None  # o raise

    query = dict(salesorder_id=so_id)
    order = RewardSalesOrder.objects(**query).first()
    if not order:
        order = RewardSalesOrder(**query)

    # Normaliza fechas
    order.date = to_dt(json_data.get('date'))
    order.last_modified_time = to_dt(json_data.get('last_modified_time'))

    order.salesorder_number = json_data.get('salesorder_number', '') or ''
    order.status = json_data.get('status')
    order.total_quantity = json_data.get('total_quantity', 0) or 0
    order.sub_total = money(json_data.get('sub_total', 0))
    order.tax_total = money(json_data.get('tax_total', 0))
    order.total = money(json_data.get('total', 0))

    # Line items: siempre documentos ya guardados
    order.line_items = [create_reward_invoice_line_item_instance(item)
                        for item in (json_data.get('line_items') or [])]

    order.customer_id = json_data.get('customer_id')
    order.customer_name = json_data.get('customer_name')
    order.salesperson_id = json_data.get('salesperson_id')
    order.salesperson_name = json_data.get('salesperson_name')
    order.created_by_email = json_data.get('created_by_email')
    order.created_by_name = json_data.get('created_by_name')
    order.checked_for_rewards = False  # Resetea para re-chequeo
    order.user = user

    return safe_save_or_refetch(order, query)

# --------------- INVOICE ----------------

def create_reward_invoice_instance(json_data, user):
    inv_id = json_data.get('invoice_id', '') or ''
    if not inv_id:
        return None  # o raise

    # Vincula SO si existe
    existing_order = None
    salesorder_id = json_data.get('salesorder_id')
    if salesorder_id:
        existing_order = RewardSalesOrder.objects(
            salesorder_id=salesorder_id
        ).first()

    query = dict(invoice_id=inv_id)
    inv = RewardInvoice.objects(**query).first()
    if not inv:
        inv = RewardInvoice(**query)

    inv.invoice_number = json_data.get('invoice_number', '') or ''
    inv.status = json_data.get('status')
    inv.date = to_dt(json_data.get('date'))
    inv.sub_total = money(json_data.get('sub_total', 0))
    inv.payment_made = money(json_data.get('payment_made', 0))
    inv.tax_total = money(json_data.get('tax_total', 0))
    inv.balance = money(json_data.get('balance', 0))
    inv.taxes = [create_reward_invoice_tax_instance(t)
                 for t in (json_data.get('taxes') or [])]
    inv.line_items = [create_reward_invoice_line_item_instance(it)
                      for it in (json_data.get('line_items') or [])]
    inv.salesorder = existing_order
    inv.last_modified_time = to_dt(json_data.get('last_modified_time'))
    inv.user = user
    inv.customer_id = json_data.get('customer_id')

    return safe_save_or_refetch(inv, query)
