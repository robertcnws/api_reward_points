import os
from celery import Celery
# from celery.signals import worker_process_init
# from django.conf import settings
# from .mongo_setup import connect_mongo

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_reward_points.settings')

app = Celery('system_reward_points')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.beat_scheduler = 'celery.beat.PersistentScheduler' 

app.autodiscover_tasks()
