from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from .views import (
    get_rewards_points
)
from .models import LoginUser, UserRole
import json
import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_get_rewards_points():
    role_client = UserRole.objects(name='client').first()
    if role_client is not None:
        users = LoginUser.objects(is_verified=True, user_role=role_client).all()
        if users:
            for user in users:
                get_rewards_points(user)