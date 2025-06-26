from celery import shared_task
from .views import (
    update_items_to_rewards,
)
import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_update_items_to_rewards():
    logger.info(f"Updating items to rewards.")
    update_items_to_rewards()