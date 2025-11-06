from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from api_users.repository.repository_notifications import (
    delete_old_notifications,
)
from api_users.repository.repository_trackings import (
    delete_old_trackings,
)
from api_authorization.repo_util import authorization_utils
from utils.data_util import (
    create_notification,
    create_tracking,
)
import json
import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_delete_old_notifications():
    delete_old_notifications()
    
@shared_task
def task_delete_old_trackings():
    delete_old_trackings()
    

@shared_task
def task_send_approved_email(username, first_name, last_name, email, login_url):
    authorization_utils.send_email_approved_user(
        username=username,
        first_name=first_name,
        last_name=last_name,
        email=email,
        login_url=login_url
    )
    
@shared_task
def task_create_tracking_async(user_reporter, action, user, object_type, tracking_info):
    create_tracking(
        user_reporter=user_reporter,
        action=action,
        object_id=user.id,
        object_type=object_type,
        object_name=user.username,
        managed_data=tracking_info
    )
    
@shared_task
def task_create_notification_async(module, info_id, info, type, username):
    create_notification(module, info_id, info, type, username)