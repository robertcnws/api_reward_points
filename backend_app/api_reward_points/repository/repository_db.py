
from pymongo import MongoClient
from bson import json_util
from django.utils import timezone
from django.conf import settings
from utils.s3_utils import (
    manage_backup_to_s3,
)
import zipstream
import tempfile
import asyncio
from django.http import StreamingHttpResponse
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# DOWNLOAD MONGO DB
#############################################

def download_mongo_db(is_downloaded_local=False):
    client = MongoClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)

    for info in db.list_collections():
        name = info['name']
        if name == 'system.views':
            continue
        def gen_collection(coll_name):
            cursor = db[coll_name].find()
            yield b'['
            first = True
            for doc in cursor:
                if not first:
                    yield b','
                first = False
                yield json_util.dumps(doc).encode('utf-8')
            yield b']'
        z.write_iter(f'{name}.json', gen_collection(name))

    dt_local = timezone.localtime()
    timestamp = dt_local.strftime('%Y%m%d_%H%M%S')
    filename = f'mongo_export_{settings.MONGO_DB}_{timestamp}.zip'

    s3_prefix = settings.AWS_S3_FOLDER_BACKUPS
    if not s3_prefix.endswith('/'):
        s3_prefix += '/'
    s3_key = f'{s3_prefix}{filename}'
    
    async def stream_and_upload_async():
        tmp = tempfile.SpooledTemporaryFile(max_size=200 * 1024 * 1024, mode='w+b')
        try:
            it = iter(z) 
            while True:
                chunk = await asyncio.to_thread(next, it, None)
                if chunk is None:
                    break
                tmp.write(chunk)
                yield chunk
            tmp.seek(0)
            await asyncio.to_thread(manage_backup_to_s3, logger, s3_key, s3_prefix, tmp)
        finally:
            try:
                tmp.close()
            except Exception:
                pass
            
    if is_downloaded_local:
        response = StreamingHttpResponse(
            streaming_content=stream_and_upload_async(), 
            content_type='application/zip'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response
    return stream_and_upload_async()