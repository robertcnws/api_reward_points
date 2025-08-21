from celery import shared_task
from asgiref.sync import async_to_sync
from api_reward_points.repository.repository_db import download_mongo_db

async def _consume(g):
    async for _ in g:
        pass

@shared_task
def task_download_backup_mongo_db():
    gen = download_mongo_db(is_downloaded_local=False)
    async_to_sync(_consume)(gen)