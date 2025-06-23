from celery import shared_task, chain
from api_authorization.tasks import (
    task_get_rewards_points
)

@shared_task
def task_sequence_every_10_min():
    workflow = chain(
        task_get_rewards_points.si(),
        # task_delete_old_trackings.si(),
        # task_generate_db_backup.si(),
        # task_delete_old_reminders.si(),
        # task_redefine_project_task_attachments.si(),
    )
    workflow.apply_async()
