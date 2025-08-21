from celery import shared_task, chain
from api_authorization.tasks import (
    task_get_rewards_points
)

from api_users.tasks import (
    task_delete_old_notifications,
    task_delete_old_trackings,
)

from api_reward_points.tasks import (
    task_download_backup_mongo_db
)

@shared_task
def task_sequence_get_rewards_points_min():
    workflow = chain(
        task_get_rewards_points.si(),
    )
    workflow.apply_async()
    
    
@shared_task
def task_sequence_download_backup_mongo_db_min():
    workflow = chain(
        task_download_backup_mongo_db.si(),
    )
    workflow.apply_async()
    
    
@shared_task
def task_sequence_daily():
    workflow = chain(
        task_delete_old_notifications.si(),
        task_delete_old_trackings.si(),
    )
    workflow.apply_async()
