from celery import shared_task
from asgiref.sync import async_to_sync
from api_reward_points.repository.repository_db import download_mongo_db
from api_authorization.repo_util.authorization_utils import send_generic_email
from django.utils import timezone
from django.template.loader import render_to_string
from utils.data_util import create_notification, create_tracking, to_aware
from api_authorization.models import LoginUser
from api_reward_points.models import RewardStoreProductSelectionBuy
from utils.s3_utils import generate_default_file_url

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