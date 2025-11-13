from datetime import timedelta, datetime, timezone
from celery import shared_task
from api_integration.repository.repository_integration import (
    update_items_to_rewards,
)
import logging

logger = logging.getLogger(__name__)
    
@shared_task
def task_update_items_to_rewards():
    logger.info(f"Updating items to rewards.")
    update_items_to_rewards()
    
@shared_task
def task_process_items():
    from api_integration.service.service_integration import process_items
    logger.info(f"Processing items data.")
    today = datetime.now(timezone.utc)
    start_last_modified_time = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    end_last_modified_time = today.strftime("%Y-%m-%d")
    data = {
        "page": 1,
        "page_size": 100,
        "start_last_modified_time": start_last_modified_time,
        "end_last_modified_time": end_last_modified_time,
    }
    return process_items(data)


@shared_task
def task_process_itemgroups():
    from api_integration.service.service_integration import process_itemgroups
    logger.info(f"Processing item groups data.")
    today = datetime.now(timezone.utc)
    start_last_modified_time = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    end_last_modified_time = today.strftime("%Y-%m-%d")
    data = {
        "page": 1,
        "page_size": 100,
        "start_last_modified_time": start_last_modified_time,
        "end_last_modified_time": end_last_modified_time,
    }
    return process_itemgroups(data)