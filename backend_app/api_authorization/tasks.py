from celery import shared_task
from datetime import datetime
from django.http import HttpRequest
from django.utils import timezone
from django.conf import settings
from api_authorization.repo_util.authorization_utils import (
    get_rewards_points
)
from .models import LoginUser, UserRole
from math import ceil
import random
import json
import logging

logger = logging.getLogger(__name__)

BATCH_SIZE = 100        
WINDOW_SEC = settings.CELERY_TASK_REVIEW_USER_POINTS_TO_SECONDS        
RATE_LIMIT = '180/m'

def _list_user_ids_for_window():
    role_client = UserRole.objects(name='client').only('id').first()
    if not role_client:
        return []
    qs = (LoginUser.objects(is_verified=True, user_role=role_client, is_active=True)
          .only('id').no_dereference())
    return [str(uid) for uid in qs.scalar('id')]
    
@shared_task(soft_time_limit=60, time_limit=90)
def task_get_rewards_points():
    user_ids = _list_user_ids_for_window()
    total = len(user_ids)
    if total == 0:
        return 'no-users'
    num_batches = ceil(total / BATCH_SIZE)
    logger.info(f'This task will be executed within {WINDOW_SEC} seconds window.')
    logger.info(f'Scheduling rewards points tasks for {total} users in {num_batches} batches.')
    for i in range(num_batches):
        start = i * BATCH_SIZE
        end = min(start + BATCH_SIZE, total)
        batch = user_ids[start:end]
        
        logger.info(f'Scheduling rewards points task for batch {i+1}/{num_batches} with {len(batch)} users.')
        
        base = i * (WINDOW_SEC / max(1, num_batches - 1)) if num_batches > 1 else 0
        countdown = int(min(WINDOW_SEC, max(0, base + random.uniform(-2, 2))))

        task_get_rewards_points_batch.apply_async(args=[batch], countdown=countdown)

    return {'total_users': total, 'batches': num_batches}


@shared_task(
    rate_limit=RATE_LIMIT,
    soft_time_limit=540, time_limit=590,
    autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=2,
)
def task_get_rewards_points_batch(user_ids: list[str]):
    for uid in user_ids:
        user = (LoginUser.objects(id=uid)
                .only('id','username','email','is_verified','is_active', 'password')
                .no_dereference().first())
        if not user or not user.is_verified or not user.is_active:
            continue
        get_rewards_points(user)
    return {'processed': len(user_ids)}