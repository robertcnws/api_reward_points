from celery import shared_task, chain
from api_authorization.tasks import (
    task_get_rewards_points
)
from api_integration.tasks import (
    task_update_items_to_rewards,
)

from api_users.tasks import (
    task_delete_old_notifications,
    task_delete_old_trackings,
)

@shared_task
def task_sequence_every_10_min():
    workflow = chain(
        # task_update_items_to_rewards.si(),
        task_get_rewards_points.si(),
        # task_delete_old_trackings.si(),
        # task_generate_db_backup.si(),
        # task_delete_old_reminders.si(),
        # task_redefine_project_task_attachments.si(),
    )
    workflow.apply_async()
    
    
@shared_task
def task_sequence_daily():
    workflow = chain(
        task_delete_old_notifications.si(),
        task_delete_old_trackings.si(),
    )
    workflow.apply_async()
