from celery import shared_task
from asgiref.sync import async_to_sync
from api_reward_points.repository.repository_db import download_mongo_db
from api_authorization.repo_util.authorization_utils import send_generic_email
from django.utils import timezone
from django.template.loader import render_to_string
from django.conf import settings
from utils.data_util import create_notification, create_tracking, to_aware
from api_authorization.models import LoginUser
from api_reward_points.models import (
    RewardStoreProductSelectionBuy, 
    RewardPoints, 
    RewardPointsHistory, 
    RewardStoreProductSelection, 
    RewardStoreProduct
)
from utils.s3_utils import generate_default_file_url
from datetime import datetime
from api_reward_points.repository.repo_util.store_product_selection_util import buy_single, bulk_save

import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

async def _consume(g):
    async for _ in g:
        pass

@shared_task
def task_download_backup_mongo_db():
    gen = download_mongo_db(is_downloaded_local=False)
    async_to_sync(_consume)(gen)
    
    
@shared_task
def task_send_email_confirmation_buy_async(type, points, user_id, purchase_ids, list_receivers):
    user = LoginUser.objects(id=user_id).first()
    purchases = list(RewardStoreProductSelectionBuy.objects(id__in=purchase_ids))
    
    for buy in purchases:
        sp = buy.store_product_selection.store_product
        file = sp.attachments[0].file if getattr(sp, 'attachments', []) else 'store_products/nws_reward_points_preview.png'
        buy.default_url = generate_default_file_url(file)

    current_year = timezone.now().year
    email_html_message = render_to_string(
        f"api_reward_points/email_send_{type}_confirmation.html",
        {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "purchase_total_points": points,
            "list_purchases": purchases,
            "current_year": current_year,
        },
    )
    message = (
        f"Thank you for your {type}! Your redeemed order has been successfully processed. "
        f"You can view your {type} details in your account."
    )
    today_str = to_aware(timezone.now()).strftime("%Y-%m-%d %H:%M:%S")
    custom_type = 'redeemed reward' if type == 'purchase' else type

    send_generic_email(
        list_receivers,
        email_html_message,
        f"{custom_type.capitalize()} Confirmation - {today_str} ({user.first_name} {user.last_name})",
        message_response=message,
    )
    
    return "Email sent successfully."


@shared_task
def task_create_tracking_async(user_reporter_id, action, id, type, name, tracking_info):
    user_reporter = LoginUser.objects(id=user_reporter_id).only('username', 'email', 'first_name', 'last_name').first()
    create_tracking(
        user_reporter=user_reporter,
        action=action,
        object_id=id if id else 'list',
        object_type=type,
        object_name=name,
        managed_data={
            'data': tracking_info
        }
    )
    

@shared_task
def task_create_notification_async(module, info_id, info, type, username):
    create_notification(module, info_id, info, type, username)
    
    
@shared_task(ignore_result=True, bind=True, max_retries=0)
def task_process_store_product_selection_buy(
    self,
    *,
    user_id: str,
    store_product_id: str,
    quantity: int,
    job_id: str,
    now_iso: str,
    reserved_points: int,
    user_reporter_username: str = "",
    expected_totals: dict | None = None,
):
    now = None
    try:
        now = to_aware(datetime.fromisoformat(now_iso)) if now_iso else to_aware(timezone.now())

        user = LoginUser.objects(id=user_id).only('id', 'username', 'email').first()
        if not user:
            _rollback_reservation(reserved_points, user_id=user_id)
            logger.error("User not found in task. Reservation rolled back.")
            return

        rp = RewardPoints.objects(user=user).only(
            'id', 'user', 'total_gained_points', 'total_assigned_points', 'total_spent_points'
        ).first()
        if not rp:
            _rollback_reservation(reserved_points, user_id=user_id)
            logger.error("RewardPoints not found in task. Reservation rolled back.")
            return

        sp = RewardStoreProduct.objects(id=store_product_id).only('id', 'name', 'assigned_points').first()
        if not sp:
            _rollback_reservation(reserved_points, user_id=user_id)
            logger.error("StoreProduct not found in task. Reservation rolled back.")
            return

        # (Opcional) Revalidación simple contra expected_totals
        if expected_totals:
            # No bloqueamos por esto, solo advertimos
            try:
                cur_gained = int(rp.total_gained_points or 0)
                cur_assigned = int(rp.total_assigned_points or 0)
                if cur_gained < 0 or cur_assigned < 0:
                    logger.warning("Negative totals detected on RewardPoints")

                exp_gained = int(expected_totals.get("gained", cur_gained))
                exp_assigned = int(expected_totals.get("assigned", cur_assigned))
                exp_cost = int(expected_totals.get("cost", 0))
                if exp_cost != reserved_points:
                    logger.warning("Mismatch reserved_points vs expected cost in task payload")
                # posible log de diferencias:
                if cur_gained != exp_gained or cur_assigned < (exp_assigned + reserved_points):
                    logger.info("RewardPoints changed since reservation (non-fatal)")
            except Exception:
                logger.exception("Error comparing expected_totals")

        # --- Crea las selections ---
        selections = [
            RewardStoreProductSelection(
                store_product=sp,
                user=user,
                quantity=1,
                created_time=now,
                last_modified_time=now,
            )
            for _ in range(int(quantity))
        ]
        # insert() no dispara signals
        RewardStoreProductSelection.objects.insert(selections, load_bulk=False)

        # --- Ejecuta buy_single y arma histories ---
        list_buys = []
        list_history = []
        total_effective_points = 0

        for sel in selections:
            # buy_single devuelve (buy_instance, purchased_points)
            result, purchased_points = buy_single(sel, rp, sp, logger, now)
            if not isinstance(result, RewardStoreProductSelectionBuy):
                # Si tu buy_single puede devolver Response, conviene que lance Exception.
                raise RuntimeError("buy_single did not return a RewardStoreProductSelectionBuy instance")

            buy = result
            list_buys.append(buy)
            total_effective_points += int(purchased_points or 0)

            list_history.append(RewardPointsHistory(
                created_time=now,
                reward_points=rp,
                action='spent',
                gained_points=0,
                spent_points=int(purchased_points or 0),
                description=f'You have used {purchased_points} points to redeem 1 {sp.name}',
                info={'jobId': job_id, 'buyId': str(buy.id), 'selectionId': str(sel.id)}
            ))

        # Histories con .save() (por signals)
        bulk_save(list_history)

        # --- Ajuste de reserva sobrante (si ocurrió) ---
        surplus = int(reserved_points) - int(total_effective_points)
        if surplus > 0:
            # Libera el sobrante de la reserva
            RewardPoints.objects(id=rp.id).update_one(dec__total_assigned_points=surplus)

        # --- Notificación global (async) ---
        info = f'has redeemed {len(list_buys)} orders of {sp.name.upper()} and total points {total_effective_points}'
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(list_buys[0].id) if list_buys else '',
            info=info,
            type='create_store_product_selection_buy',
            username=user_reporter_username or '',
        )

        # --- Email (async) ---
        list_receivers = list(settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS)
        if settings.ENVIRONMENT == 'prod' and user and user.email and user.email not in list_receivers:
            list_receivers.append(user.email)

        task_send_email_confirmation_buy_async.delay(
            type='purchase',
            points=int(total_effective_points),
            user_id=str(user.id),
            purchase_ids=[str(b.id) for b in list_buys],
            list_receivers=list_receivers
        )

        # --- Tracking por buy (async) ---
        for buy in list_buys:
            task_create_tracking_async.delay(
                user_reporter_id=str(user.id),
                action='create store product selection buy',
                id=str(buy.id),
                type='RewardStoreProductSelectionBuy',
                name=user.username,
                tracking_info={'jobId': job_id, 'buyId': str(buy.id), 'storeProductId': str(sp.id)},
            )

        # (Opcional) emitir WS de "completed" aquí si tienes canal

    except Exception as e:
        logger.exception("Error in task_process_store_product_selection_buy; rolling back reservation")
        # Si algo falla, revertimos la reserva completa
        _rollback_reservation(reserved_points, user_id=user_id)
        

@shared_task(ignore_result=True)
def task_delete_store_product_selection_buy(
    *,
    job_id: str,
    buy_id: str,
    user_reporter_id: str,
    user_reporter_username: str,
    send_email_to_user: bool = True,
):
    try:
        buy = RewardStoreProductSelectionBuy.objects(id=buy_id).first()
        if not buy:
            logger.warning("Buy not found in task; nothing to do")
            return
        if buy.has_been_used:
            logger.warning("Cannot delete a used redeemed order (task)")
            return

        purchased_points, sel, sp, user = _compute_purchase_points(buy)
        rp = RewardPoints.objects(user=user).only('id','user','total_spent_points').first()
        if not rp:
            logger.warning("RewardPoints not found for user; skipping points refund")
        else:
            refunded = _dec_spent_points_safe(rp, purchased_points)

            # History (refund)
            RewardPointsHistory(
                created_time=to_aware(timezone.now()),
                reward_points=rp,
                action='refunded',
                gained_points=int(refunded),
                spent_points=0,
                description=f'Refunded {refunded} points from redeem {sel.quantity} of {sp.name}',
                info={'jobId': job_id, 'buyId': str(buy.id)}
            ).save()

        # Tracking + Notification
        task_create_tracking_async.delay(
            user_reporter_id=user_reporter_id,
            action='delete store product selection buy',
            id=str(buy.id),
            type='RewardStoreProductSelectionBuy',
            name=user_reporter_username,
            tracking_info={
                'jobId': job_id,
                'buyId': str(buy.id),
                'selectionId': str(sel.id),
                'storeProductId': str(sp.id)
            }
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id=str(buy.id),
            info=f'has deleted a redeemed order # {getattr(buy, "order_number", "")} of {sp.name.upper()} with quantity {sel.quantity} and refunded {purchased_points} points to user {user.username}',
            type='delete_store_product_selection_buy',
            username=user_reporter_username,
        )

        # Email (opcional)
        if send_email_to_user:
            list_receivers = list(settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS)
            if settings.ENVIRONMENT == 'prod' and user.email and user.email not in list_receivers:
                list_receivers.append(user.email)
            task_send_email_confirmation_buy_async.delay(
                type='refund',
                points=int(purchased_points),
                user_id=str(user.id),
                purchase_ids=[str(buy.id)],
                list_receivers=list_receivers
            )

        # Borrados (disparan signals si tienes)
        buy.delete()
        sel.delete()

    except Exception:
        logger.exception("Error in task_delete_store_product_selection_buy")
        
        
@shared_task(ignore_result=True)
def task_delete_list_store_product_selection_buys(
    *,
    job_id: str,
    buy_ids: list[str],
    user_reporter_id: str,
    user_reporter_username: str,
    send_email_to_user: bool = True,
):
    try:
        buys = list(RewardStoreProductSelectionBuy.objects(id__in=buy_ids))
        if not buys:
            logger.warning("No buys found in bulk delete task")
            return

        # Mapa por usuario para emails consolidados
        per_user_refund = {}  # user_id -> {"user": user, "purchase_ids": [], "refunded_total": int}
        total_refunded_global = 0
        tracking_infos = []
        histories = []

        for buy in buys:
            if buy.has_been_used:
                # Saltamos usados (o podrías abortar todo el lote si prefieres)
                logger.warning(f"Skipping used buy {buy.id}")
                continue

            try:
                purchased_points, sel, sp, user = _compute_purchase_points(buy)
            except Exception:
                logger.exception(f"Skipping buy {getattr(buy,'id','?')} due to missing relations")
                continue

            rp = RewardPoints.objects(user=user).only('id','user','total_spent_points').first()
            if rp:
                refunded = _dec_spent_points_safe(rp, purchased_points)
                total_refunded_global += int(refunded)

                histories.append(RewardPointsHistory(
                    created_time=to_aware(timezone.now()),
                    reward_points=rp,
                    action='refunded',
                    gained_points=int(refunded),
                    spent_points=0,
                    description=f'Refunded {refunded} points from redeemed of {sel.quantity} {sp.name}',
                    info={'jobId': job_id, 'buyId': str(buy.id)}
                ))

                entry = per_user_refund.setdefault(str(user.id), {
                    "user": user, "purchase_ids": [], "refunded_total": 0
                })
                entry["purchase_ids"].append(str(buy.id))
                entry["refunded_total"] += int(refunded)
            else:
                logger.warning(f"No RewardPoints for user {getattr(user, 'username', '?')}")

            tracking_infos.append({
                'buyId': str(buy.id),
                'selectionId': str(sel.id),
                'storeProductId': str(sp.id),
            })

            # elimina al final, tras calcular puntos
            buy.delete()
            sel.delete()

        # bulk save histories
        if histories:
            bulk_save(histories)

        # Tracking + Notif global
        task_create_tracking_async.delay(
            user_reporter_id=user_reporter_id,
            action=f'delete list of {len(buys)} store product selection buys',
            id=",".join([str(b.id) for b in buys]),
            type='RewardStoreProductSelectionBuy',
            name=user_reporter_username,
            tracking_info={'jobId': job_id, 'data': tracking_infos}
        )
        task_create_notification_async.delay(
            module='store_product_selection_buys',
            info_id='list',
            info=f'has deleted a list of {len(buys)} redeemed orders and refunded {int(total_refunded_global)} points',
            type='delete_list_store_product_selection_buy',
            username=user_reporter_username,
        )

        # Emails por usuario
        if send_email_to_user:
            for user_id, entry in per_user_refund.items():
                user = entry["user"]
                refunded_points = int(entry["refunded_total"])
                purchase_ids = entry["purchase_ids"]
                if refunded_points <= 0:
                    continue
                list_receivers = list(settings.DJANGO_LIST_SUPPORT_EMAIL_RECEIPTS)
                if settings.ENVIRONMENT == 'prod' and user.email and user.email not in list_receivers:
                    list_receivers.append(user.email)
                task_send_email_confirmation_buy_async.delay(
                    type='refund',
                    points=refunded_points,
                    user_id=str(user.id),
                    purchase_ids=purchase_ids,
                    list_receivers=list_receivers
                )

    except Exception:
        logger.exception("Error in task_delete_list_store_product_selection_buys")


def _rollback_reservation(reserved_points: int, user_id: str | None = None):
    """Revierte la reserva de puntos si falló la task."""
    if reserved_points and reserved_points > 0:
        try:
            if user_id:
                user = LoginUser.objects(id=user_id).only('id').first()
                if not user:
                    return
                rp = RewardPoints.objects(user=user).only('id').first()
                if not rp:
                    return
                RewardPoints.objects(id=rp.id).update_one(dec__total_assigned_points=int(reserved_points))
        except Exception:
            logger.exception("Failed to rollback reservation on RewardPoints")
            
            
def _dec_spent_points_safe(rp: RewardPoints, dec_points: int) -> int:
    """
    Disminuye total_spent_points en 'dec_points' sin pasar de 0.
    Intenta vía actualización condicional para evitar carreras simples.
    Devuelve cuánto se disminuyó realmente.
    """
    if not rp or dec_points <= 0:
        return 0

    # Lectura actual
    cur = int(rp.total_spent_points or 0)
    if cur <= 0:
        return 0

    new_val = max(cur - dec_points, 0)

    # Intento 1: update condicional por valor previo (optimista)
    updated = RewardPoints.objects(id=rp.id, total_spent_points=cur).update_one(set__total_spent_points=new_val)
    if updated == 1:
        return cur - new_val  # puntos efectivamente devueltos

    # Reintento 2: relee y recalcula (una sola vez)
    rp2 = RewardPoints.objects(id=rp.id).only('id','total_spent_points').first()
    if not rp2:
        return 0
    cur2 = int(rp2.total_spent_points or 0)
    if cur2 <= 0:
        return 0
    new_val2 = max(cur2 - dec_points, 0)
    updated2 = RewardPoints.objects(id=rp2.id, total_spent_points=cur2).update_one(set__total_spent_points=new_val2)
    if updated2 == 1:
        return cur2 - new_val2

    # Si otra carrera ganó ambas veces, no insistimos más
    return 0


def _compute_purchase_points(buy: RewardStoreProductSelectionBuy) -> tuple[int, RewardStoreProductSelection, RewardStoreProduct, LoginUser]:
    """
    Devuelve (purchased_points, selection, product, user) para un buy dado.
    Lanza si falta algo esencial.
    """
    sel = RewardStoreProductSelection.objects(id=buy.store_product_selection.id).first()
    if not sel:
        raise ValueError("Selection not found")
    sp = RewardStoreProduct.objects(id=sel.store_product.id).only('id','name','assigned_points').first()
    if not sp:
        raise ValueError("Store product not found")
    user = sel.user
    if not user:
        raise ValueError("User not found for the store product selection")

    purchased_points = int((sp.assigned_points or 0) * (sel.quantity or 1))
    return purchased_points, sel, sp, user