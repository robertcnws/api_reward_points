from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProduct,
     RewardStoreProductSelection,
     RewardStoreProductSelectionCart,
     RewardStoreProductSelectionBuy,
     RewardPoints,
     RewardPointsHistory,
)
from api_reward_points.repository.repo_util.store_product_selection_util import (
    bulk_save, 
    buy_single,
)
from utils.data_util import (
    to_aware,
)
from api_reward_points.tasks import (
    task_create_notification_async, 
    task_create_tracking_async, 
    task_send_email_confirmation_buy_async,
    task_process_store_product_selection_buy,
    task_delete_store_product_selection_buy,
    task_delete_list_store_product_selection_buys
)
import json
import logging
import uuid

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


##################################################
# CREATE STORE PRODUCT SELECTION CART
# ##################################################

def create_store_product_selection_cart(request, id):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','email','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        store_product = RewardStoreProduct.objects(id=id).only('id','name','assigned_points').first()
        if not store_product:
            return Response({'error': 'Store product not found'}, status=404)

        quantity = data.get('quantity')
        if not quantity or quantity <= 0:
            return Response({'error': 'Quantity is required'}, status=400)

        now = to_aware(timezone.now())
        default_qty = 1

        last_cart = None
        total_carts_points = 0
        for _ in range(quantity):
            sel = RewardStoreProductSelection(
                store_product=store_product,
                user=user_reporter,
                quantity=default_qty,
                created_time=now,
                last_modified_time=now,
            )
            sel.save()  # signals

            cart = RewardStoreProductSelectionCart(
                store_product_selection=sel,
                is_bought=False,
                created_time=now,
                last_modified_time=now,
            )
            cart.save()  # signals
            last_cart = cart
            total_carts_points += store_product.assigned_points * default_qty

        # tracking + notification ASYNC
        task_create_tracking_async.delay(          
            user_reporter_id=str(user_reporter.id),
            action='create store product selection cart',
            id=str(cart.id),
            type='RewardStoreProductSelectionCart',
            name=user_reporter.username,
            tracking_info={
                'storeProductId': str(store_product.id), 
                'quantity': quantity
            }
        )
        task_create_notification_async.delay(
            module='store_product_selection_carts',
            info_id=str(last_cart.id) if last_cart else '',
            info=f'has added {quantity} {store_product.name.upper()} to reward cart with total points {total_carts_points}',
            type='create_store_product_selection_cart',
            username=user_reporter.username,
        )

        return Response({
            'message': 'Store product selection cart created successfully',
            'data': json.loads(last_cart.to_json()) if last_cart else {},
        }, status=201)

    except Exception as e:
        logger.error(f"Error creating store product selection cart: {str(e)}")
        return Response({'error': str(e)}, status=500)

###################################################
# DELETE STORE PRODUCT SELECTION CART
# ###################################################

def delete_store_product_selection_cart(request, id):
    try:
        payload = request.data.get('userReporter')
        user_reporter = None
        if payload:
            u = json.loads(payload)
            user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','is_approved').first()
        if not user_reporter:
            return Response({'error': 'User reporter not found'}, status=404)
        if not user_reporter.is_approved:
            return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

        cart = RewardStoreProductSelectionCart.objects(id=id).first()
        if not cart:
            return Response({'error': 'Store product selection cart not found'}, status=404)

        sel = RewardStoreProductSelection.objects(id=cart.store_product_selection.id).first()
        if not sel:
            return Response({'error': 'Store product selection not found'}, status=404)

        sp = RewardStoreProduct.objects(id=sel.store_product.id).only('id','name','assigned_points').first()

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='delete store product selection cart',
            id=str(cart.id),
            type='RewardStoreProductSelectionCart',
            name=user_reporter.username,
            tracking_info={'cartId': str(cart.id), 'selectionId': str(sel.id)}
        )
        task_create_notification_async.delay(
            module='store_product_selection_carts',
            info_id=str(cart.id),
            info=f'has deleted {sp.name.upper()} from cart with quantity {sel.quantity} and total points {sp.assigned_points * sel.quantity}',
            type='delete_store_product_selection_cart',
            username=user_reporter.username,
        )

        cart.delete()      # signals
        sel.delete()       # signals

        return Response(status=204)

    except Exception as e:
        logger.error(f"Error deleting store product selection cart: {str(e)}")
        return Response({'error': str(e)}, status=500)
    
    
###################################################
# DELETE ALL STORE PRODUCT SELECTION CARTS
# ###################################################

def delete_all_store_product_selection_carts(request):
    try:
        payload = request.data.get('userReporter')
        user_reporter = None
        if payload:
            u = json.loads(payload)
            user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','is_approved').first()
        if not user_reporter:
            return Response({'error': 'User reporter not found'}, status=404)
        if not user_reporter.is_approved:
            return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

        selections = list(RewardStoreProductSelection.objects(user=user_reporter))
        if not selections:
            return Response({'error': 'No store product selections found for the user'}, status=404)

        carts = list(RewardStoreProductSelectionCart.objects(
            store_product_selection__in=selections, is_bought=False
        ))
        if not carts:
            return Response({'error': 'No store product selection carts found for the user'}, status=404)

        # nombres para notificación
        names = []
        for c in carts:
            sp = c.store_product_selection.store_product
            if sp:
                names.append(sp.name.upper())

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action=f'delete list of {len(carts)} store product selection cart',
            id='list',
            type='RewardStoreProductSelectionCart',
            name=user_reporter.username,
            tracking_info={'cartIds': [str(c.id) for c in carts]}
        )
        task_create_notification_async.delay(
            module='store_product_selection_carts',
            info_id='list',
            info=f'has deleted a list of {len(carts)} carts ({", ".join(names)})',
            type='delete_list_store_product_selection_cart',
            username=user_reporter.username,
        )

        # borrar con .delete() por doc para signals
        for c in carts:
            c.delete()
        sel_ids = {str(c.store_product_selection.id) for c in carts}
        for s in selections:
            if str(s.id) in sel_ids:
                s.delete()

        return Response(status=204)

    except Exception as e:
        logger.error(f"Error deleting store product selection carts: {str(e)}")
        return Response({'error': str(e)}, status=500)

####################################################
# CREATE STORE PRODUCT SELECTION BUY FROM CART
# ####################################################

def create_store_product_selection_cart_buy(request, id):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','email','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        reward_points = RewardPoints.objects(user=user_reporter).only(
            'id','user','total_gained_points','total_assigned_points','total_spent_points'
        ).first()
        if not reward_points:
            return Response({'error': 'Reward points not found for the user'}, status=404)

        cart = RewardStoreProductSelectionCart.objects(id=id, is_bought=False).first()
        if not cart:
            return Response({'error': 'Store product selection cart not found or already bought'}, status=404)

        sel = RewardStoreProductSelection.objects(id=cart.store_product_selection.id).first()
        sp = RewardStoreProduct.objects(id=sel.store_product.id).only('id','name','assigned_points','attachments').first()

        now = to_aware(timezone.now())
        buy, purchased_points = buy_single(sel, reward_points, sp, logger, now)
        if not isinstance(buy, RewardStoreProductSelectionBuy):
            return buy  # Response de error desde calculate_purchase_fraction

        # history + tracking + notif (async)
        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='create store product selection buy',
            id=str(buy.id), 
            type='RewardStoreProductSelectionBuy',
            name=user_reporter.username,
            tracking_info={
                'buyId': str(buy.id), 
                'selectionId': str(sel.id), 
                'storeProductId': str(sp.id)
            }
        )
        RewardPointsHistory(
            created_time=now,
            reward_points=reward_points,  # incluye user
            action='spent',
            gained_points=0,
            spent_points=purchased_points,
            description=f'You have used {purchased_points} points to redeem {sel.quantity} of {sp.name}',
            info={'buyId': str(buy.id)}
        ).save()

        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(buy.id),
            info=f'has redeemed order # {buy.order_number} of {sp.name.upper()} with total points {purchased_points}',
            type='create_store_product_selection_buy',
            username=user_reporter.username,
        )

        # email async
        list_receivers = settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS
        if settings.ENVIRONMENT == 'prod' and user_reporter.email and user_reporter.email not in list_receivers:
            list_receivers.append(user_reporter.email)
        task_send_email_confirmation_buy_async.delay(
            type='purchase',
            points=purchased_points,
            user_id=str(user_reporter.id),
            purchase_ids=[str(buy.id)],
            list_receivers=list_receivers
        )

        return Response({'message': 'Store product selection buy created successfully',
                         'data': json.loads(buy.to_json())}, status=201)

    except Exception as e:
        logger.error(f"Error creating store product selection buy: {str(e)}")
        return Response({'error': str(e)}, status=500)

######################################################
# CREATE ALL STORE PRODUCT SELECTION BUY FROM CARTS
# ######################################################

def create_all_store_product_selection_cart_buy(request):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','email','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        rp = RewardPoints.objects(user=user_reporter).only(
            'id','user','total_gained_points','total_assigned_points','total_spent_points'
        ).first()
        if not rp:
            return Response({'error': 'Reward points not found for the user'}, status=404)

        selections = list(RewardStoreProductSelection.objects(user=user_reporter))
        if not selections:
            return Response({'error': 'No store product selections found for the user'}, status=404)

        carts = list(RewardStoreProductSelectionCart.objects(is_bought=False, store_product_selection__in=selections))
        if not carts:
            return Response({'error': 'Store product selection carts not found or already bought'}, status=404)

        now = to_aware(timezone.now())
        list_buys = []
        total_points = 0

        for cart in carts:
            sel = cart.store_product_selection
            sp = sel.store_product
            sp = RewardStoreProduct.objects(id=sp.id).only('id','name','assigned_points').first()
            buy, purchased_points = buy_single(sel, rp, sp, logger, now)
            if not isinstance(buy, RewardStoreProductSelectionBuy):
                return buy
            list_buys.append(buy)
            total_points += purchased_points

        RewardPointsHistory(
            created_time=now,
            reward_points=rp,
            action='spent',
            gained_points=0,
            spent_points=total_points,
            description=f'You have used {total_points} points to redeem {len(carts)} products from cart',
            info={'count': len(list_buys)}
        ).save()

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='create all store product selection buy',
            id=",".join([str(b.id) for b in list_buys]),
            type='RewardStoreProductSelectionBuy',
            name=user_reporter.username,
            tracking_info={
                'buyIds': [str(b.id) for b in list_buys]
            }
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=",".join([str(b.id) for b in list_buys]),
            info=f'has redeemed orders of {len(carts)} products from cart with total points {total_points}',
            type='create_all_store_product_selection_buy',
            username=user_reporter.username,
        )

        list_receivers = settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS
        if settings.ENVIRONMENT == 'prod' and user_reporter.email and user_reporter.email not in list_receivers:
            list_receivers.append(user_reporter.email)
        task_send_email_confirmation_buy_async.delay(
            type='purchase',
            points=total_points,
            user_id=str(user_reporter.id),
            purchase_ids=[str(b.id) for b in list_buys],
            list_receivers=list_receivers
        )

        return Response({'message': 'Store products selection buy created successfully',
                         'data': json.loads(list_buys[-1].to_json())}, status=201)

    except Exception as e:
        logger.error(f"Error creating store products selection buy: {str(e)}")
        return Response({'error': str(e)}, status=500)

######################################################
# CREATE STORE PRODUCT SELECTION BUY
# ######################################################

def create_store_product_selection_buy(request, id):
    data = request.data

    client_id = data.get('clientId')
    user_reporter_payload = data.get('userReporter')

    # --- Resuelve el usuario comprador ---
    user_reporter = None
    if user_reporter_payload:
        try:
            payload = json.loads(user_reporter_payload)
        except Exception:
            payload = {}
        if payload:
            user_reporter = LoginUser.objects(
                username=payload.get('username')
            ).only('id', 'username', 'email', 'is_approved').first()

    client = (
        LoginUser.objects(id=client_id)
        .only('id', 'username', 'email', 'is_approved')
        .first()
        if client_id else None
    )
    user_buyer = client or user_reporter

    if not user_buyer:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_buyer.is_approved:
        logger.error("User buyer is not approved")
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        # --- Validaciones ligeras ---
        reward_points = RewardPoints.objects(user=user_buyer).only(
            'id', 'user', 'total_gained_points', 'total_assigned_points', 'total_spent_points'
        ).first()
        if not reward_points:
            logger.error("Reward points not found for the user")
            return Response({'error': 'Reward points not found for the user'}, status=404)

        store_product = RewardStoreProduct.objects(id=id).only(
            'id', 'name', 'assigned_points'
        ).first()
        if not store_product:
            logger.error("Store product not found")
            return Response({'error': 'Store product not found'}, status=404)

        quantity = data.get('quantity')
        if not quantity or quantity <= 0:
            logger.error(f"Quantity is required for store product: {store_product.name}")
            return Response({'error': 'Quantity is required'}, status=400)

        now = to_aware(timezone.now())

        unit_points = store_product.assigned_points or 0
        total_cost_points = int(unit_points * quantity)
        gained_points = int(reward_points.total_gained_points or 0)
        assigned_points = int(reward_points.total_assigned_points or 0)

        if (gained_points + assigned_points) < total_cost_points:
            logger.error(f"Not enough points to redeem this store product: {store_product.name}")
            return Response({'error': 'Not enough points to redeem this store product'}, status=400)

        # --- Encola task y responde YA ---
        job_id = str(uuid.uuid4())
        payload_task = {
            "user_id": str(user_buyer.id),
            "store_product_id": str(store_product.id),
            "quantity": int(quantity),
            "job_id": job_id,
            "now_iso": now.isoformat(),
            "reserved_points": total_cost_points,
            "user_reporter_username": user_reporter.username if user_reporter else "",
            "expected_totals": {
                "gained": gained_points,
                "assigned": assigned_points,
                "cost": total_cost_points,
            },
        }

        def _enqueue():
            task_process_store_product_selection_buy.delay(**payload_task)
        
        transaction.on_commit(_enqueue)

        return Response({
            "message": "Purchase is being processed",
            "status": "pending",
            "jobId": job_id,
            "product": {"id": str(store_product.id), "name": store_product.name},
            "quantity": int(quantity),
            "estimatedPoints": total_cost_points,
        }, status=202)

    except Exception as e:
        logger.exception("Error creating store product selection buy")
        return Response({'error': 'Internal error processing purchase'}, status=500)

# def create_store_product_selection_buy(request, id):
#     data = request.data

#     client_id = data.get('clientId')
#     user_reporter_payload = data.get('userReporter')

#     user_reporter = None
#     if user_reporter_payload:
#         payload = json.loads(user_reporter_payload)
#         user_reporter = LoginUser.objects(
#             username=payload.get('username')
#         ).only('id','username','email','is_approved').first()

#     client = LoginUser.objects(id=client_id).only('id','username','email','is_approved').first() if client_id else None
#     user_buyer = client or user_reporter

#     if not user_buyer:
#         return Response({'error': 'User reporter not found'}, status=404)
#     if not user_buyer.is_approved:
#         logger.error("User buyer is not approved")
#         return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

#     try:
#         # Siempre con user
#         reward_points = RewardPoints.objects(user=user_buyer).only(
#             'id','user','total_gained_points','total_assigned_points','total_spent_points'
#         ).first()
#         if not reward_points:
#             logger.error("Reward points not found for the user")
#             return Response({'error': 'Reward points not found for the user'}, status=404)

#         store_product = RewardStoreProduct.objects(id=id).only('id','name','assigned_points').first()
#         if not store_product:
#             logger.error("Store product not found")
#             return Response({'error': 'Store product not found'}, status=404)

#         quantity = data.get('quantity')
#         if not quantity or quantity <= 0:
#             logger.error(f"Quantity is required for store product: {store_product.name}")
#             return Response({'error': 'Quantity is required'}, status=400)

#         now_naive = timezone.now()
#         now = to_aware(now_naive)

#         # Verifica puntos una vez con costo total
#         unit_points = store_product.assigned_points or 0
#         total_cost_points = unit_points * quantity
#         gained_points = reward_points.total_gained_points or 0
#         assigned_points = reward_points.total_assigned_points or 0
#         if gained_points + assigned_points < total_cost_points:
#             logger.error(f"Not enough points to redeem this store product: {store_product.name}")
#             return Response({'error': 'Not enough points to redeem this store product'}, status=400)

#         # Crea las selections (insert no dispara signals; ok)
#         selections = [
#             RewardStoreProductSelection(
#                 store_product=store_product,
#                 user=user_buyer,
#                 quantity=1,
#                 created_time=now,
#                 last_modified_time=now,
#             )
#             for _ in range(quantity)
#         ]
#         RewardStoreProductSelection.objects.insert(selections, load_bulk=False)

#         # Usa buy_single por cada selection (buy.save + cart.save + rp.save)
#         list_buys = []
#         list_history = []
#         total_effective_points = 0

#         for sel in selections:
#             result, purchased_points = buy_single(sel, reward_points, store_product, logger, now)
#             if not isinstance(result, RewardStoreProductSelectionBuy):
#                 # Error de calculate_purchase_fraction (Response)
#                 return result

#             buy = result
#             list_buys.append(buy)
#             total_effective_points += purchased_points

#             # history ligero por cada buy (save para signals)
#             list_history.append(RewardPointsHistory(
#                 created_time=now,
#                 reward_points=reward_points,   # incluye user
#                 action='spent',
#                 gained_points=0,
#                 spent_points=purchased_points,
#                 description=f'You have used {purchased_points} points to redeem 1 {store_product.name}',
#                 info={'buyId': str(buy.id), 'selectionId': str(sel.id)}
#             ))

#         # Guarda histories con .save() (para signals). Si prefieres, en bucle:
#         bulk_save(list_history)

#         # Notificación global async
#         info = f'has redeemed {len(list_buys)} orders of {store_product.name.upper()} and total points {total_effective_points}'
#         task_create_notification_async.delay(
#             module='store_product_selection_buys',
#             info_id=str(list_buys[0].id),
#             info=info,
#             type='create_store_product_selection_buy',
#             username=user_reporter.username if user_reporter else '',
#         )

#         # Email async
#         list_receivers = settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS
#         if settings.ENVIRONMENT == 'prod':
#             if user_reporter and user_reporter.email and user_reporter.email not in list_receivers:
#                 list_receivers.append(user_reporter.email)

#         task_send_email_confirmation_buy_async.delay(
#             type='purchase',
#             points=total_effective_points,
#             user_id=str(user_buyer.id),
#             purchase_ids=[str(b.id) for b in list_buys],
#             list_receivers=list_receivers
#         )

#         # Tracking async por buy (mínimo)
#         for buy in list_buys:
#             task_create_tracking_async.delay(
#                 user_reporter_id=str(user_buyer.id) if user_buyer else None,
#                 action='create store product selection buy',
#                 id=str(buy.id),
#                 type='RewardStoreProductSelectionBuy',
#                 name=user_buyer.username,
#                 tracking_info={
#                     'buyId': str(buy.id), 
#                     'storeProductId': str(store_product.id)
#                 }
#             )

#         return Response({
#             'message': 'Store product selection buy created successfully',
#             'data': json.loads(list_buys[-1].to_json()),
#         }, status=201)

#     except Exception as e:
#         logger.error(f"Error creating store product selection buy: {str(e)}")
#         return Response({'error': str(e)}, status=500)


########################################################
# DELETE STORE PRODUCT SELECTION BUY
# ######################################################

def delete_store_product_selection_buy(request, id):
    data = request.data
    payload = data.get('userReporter')

    # Valida reportador mínimo (sin tocar puntos aún)
    user_reporter = None
    if payload:
        try:
            u = json.loads(payload)
        except Exception:
            u = {}
        if u:
            user_reporter = LoginUser.objects(
                username=u.get('username')
            ).only('id','username','is_approved','email').first()

    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    # Verificación ligera de existencia y estado (sin mutar nada)
    buy = RewardStoreProductSelectionBuy.objects(id=id).only('id','has_been_used','order_number').first()
    if not buy:
        return Response({'error': 'Order not found'}, status=404)
    if buy.has_been_used:
        return Response({'error': 'Cannot delete a used redeemed order'}, status=400)

    job_id = str(uuid.uuid4())
    task_payload = {
        "job_id": job_id,
        "buy_id": str(buy.id),
        "user_reporter_id": str(user_reporter.id),
        "user_reporter_username": user_reporter.username,
        "send_email_to_user": True,  # tu lógica interna decidirá si agrega el email del user
    }

    def _enqueue():
        task_delete_store_product_selection_buy.delay(**task_payload)

    transaction.on_commit(_enqueue)

    return Response({
        "message": "Delete is being processed",
        "status": "pending",
        "jobId": job_id,
        "buyId": str(buy.id),
        "orderNumber": getattr(buy, "order_number", None),
    }, status=202)

##########################################################
# DELETE LIST OF STORE PRODUCT SELECTION BUYS
# ######################################################

def delete_list_store_product_selection_buys(request):
    data = request.data
    payload = data.get('userReporter')

    user_reporter = None
    if payload:
        try:
            u = json.loads(payload)
        except Exception:
            u = {}
        if u:
            user_reporter = LoginUser.objects(
                username=u.get('username')
            ).only('id','username','is_approved','email').first()

    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    ids = data.get('ids')
    if not ids or not isinstance(ids, list):
        return Response({'error': 'IDs list is required'}, status=400)

    # Chequeo ligero: existen y no usados (si alguno está usado, corta)
    qs = RewardStoreProductSelectionBuy.objects(id__in=ids).only('id','has_been_used')
    found = list(qs)
    if not found:
        return Response({'error': 'No store product selection buys found'}, status=404)
    if any(b.has_been_used for b in found):
        return Response({'error': 'Cannot delete a used store product selection buy'}, status=400)

    job_id = str(uuid.uuid4())
    task_payload = {
        "job_id": job_id,
        "buy_ids": [str(b.id) for b in found],
        "user_reporter_id": str(user_reporter.id),
        "user_reporter_username": user_reporter.username,
        "send_email_to_user": True,
    }

    def _enqueue():
        task_delete_list_store_product_selection_buys.delay(**task_payload)

    transaction.on_commit(_enqueue)

    return Response({
        "message": "Bulk delete is being processed",
        "status": "pending",
        "jobId": job_id,
        "count": len(found),
        "ids": [str(b.id) for b in found],
    }, status=202)
    
    
##########################################################
# MANAGE STORE PRODUCT SELECTION BUY REFUND
# ######################################################

def manage_refund_store_product_selection_buy(request, id):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        refund_buy = RewardStoreProductSelectionBuy.objects(id=id).first()
        if not refund_buy:
            return Response({'error': 'Store product selection buy not found'}, status=404)

        refund_buy.has_requested_refund = not bool(refund_buy.has_requested_refund)
        refund_buy.last_modified_time = to_aware(timezone.now())
        refund_buy.save()  # signals

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='manage store product selection buy refund',
            id=str(refund_buy.id), 
            type='RewardStoreProductSelectionBuy',
            name=user_reporter.username,
            tracking_info={
                'hasRequestedRefund': refund_buy.has_requested_refund
            }
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(refund_buy.id),
            info=f'has {"requested" if refund_buy.has_requested_refund else "cancelled"} refund for redeemed order # {refund_buy.order_number}',
            type='manage_store_product_selection_buy_refund',
            username=user_reporter.username,
        )

        return Response({
            'message': 'Store product selection buy refund status updated successfully',
            'data': json.loads(refund_buy.to_json())
        }, status=201)

    except Exception as e:
        logger.error(f"Error creating store product selection buy: {str(e)}")
        return Response({'error': str(e)}, status=500)

###########################################################
# MANAGE STORE PRODUCT SELECTION BUY USE
# #######################################################

def manage_use_store_product_selection_buy(request, id):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        buy = RewardStoreProductSelectionBuy.objects(id=id).first()
        if not buy:
            return Response({'error': 'Store product selection buy not found'}, status=404)

        qty = int(data.get('quantityUsed', 0) or 0)
        if qty <= 0:
            return Response({'error': 'Invalid quantity used'}, status=400)
        notes = data.get('notes', '')

        buy.has_been_used = True
        buy.quantity_used = (buy.quantity_used or 0) + qty
        if notes:
            buy.notes = notes
        now = to_aware(timezone.now())
        buy.last_modified_time = now
        buy.redeemed_time = now
        buy.salesorder_person = user_reporter
        buy.save()  # signals

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='manage store product selection buy use',
            id=str(buy.id), 
            type='RewardStoreProductSelectionBuy',
            name=user_reporter.username,
            tracking_info={'quantityUsed': buy.quantity_used, 'notes': getattr(buy,'notes', '')}
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(buy.id),
            info=f'has completed use effectively with quantity {buy.quantity_used}',
            type='manage_store_product_selection_buy_use',
            username=user_reporter.username,
        )

        return Response({'message': 'Store product selection buy use status updated successfully',
                         'data': json.loads(buy.to_json())}, status=201)

    except Exception as e:
        logger.error(f"Error managing use in store product selection buy: {str(e)}")
        return Response({'error': str(e)}, status=500)

###########################################################
# MANAGE STORE PRODUCT SELECTION BUY REMOVE
# #######################################################

def manage_remove_store_product_selection_buy(request, id):
    data = request.data
    payload = data.get('userReporter')
    user_reporter = None
    if payload:
        u = json.loads(payload)
        user_reporter = LoginUser.objects(username=u.get('username')).only('id','username','is_approved').first()
    if not user_reporter:
        return Response({'error': 'User reporter not found'}, status=404)
    if not user_reporter.is_approved:
        return Response({'error': 'You are not currently as APPROVED USER anymore'}, status=403)

    try:
        buy = RewardStoreProductSelectionBuy.objects(id=id).first()
        if not buy:
            return Response({'error': 'Store product selection buy not found'}, status=404)

        buy.is_removed = not bool(buy.is_removed)
        buy.last_modified_time = to_aware(timezone.now())
        buy.save()  # signals

        task_create_tracking_async.delay(
            user_reporter_id=str(user_reporter.id),
            action='manage store product selection buy remove',
            id=str(buy.id), 
            type='RewardStoreProductSelectionBuy',
            name=user_reporter.username,
            tracking_info={'isRemoved': buy.is_removed}
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(buy.id),
            info=f'has {"removed" if buy.is_removed else "restored"} selection buy effectively',
            type='manage_store_product_selection_buy_remove',
            username=user_reporter.username,
        )

        return Response({'message': 'Store product selection buy remove status updated successfully',
                         'data': json.loads(buy.to_json())}, status=201)

    except Exception as e:
        logger.error(f"Error managing remove in store product selection buy: {str(e)}")
        return Response({'error': str(e)}, status=500)
