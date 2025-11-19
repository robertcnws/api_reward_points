from celery import shared_task, chain
from utils.data_util import create_notification, create_tracking
from api_authorization.models import LoginUser

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

from api_integration.tasks import (
    task_process_items,
    task_process_itemgroups,
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
    
@shared_task
def task_sequence_process_items_min():
    workflow = chain(
        task_process_itemgroups.si(),
        task_process_items.si(),
    )
    workflow.apply_async()
    

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
