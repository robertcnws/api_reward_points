
from pymongo import MongoClient
from bson import json_util
from django.utils import timezone
from django.conf import settings
from utils.s3_utils import (
    backup_mongo_to_s3,
)
import zipstream
from django.http import StreamingHttpResponse
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# DOWNLOAD MONGO DB
#############################################

def download_mongo_db(request):
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
    
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    response = StreamingHttpResponse(
        streaming_content=z, 
        content_type='application/zip'
    )
    response['Content-Disposition'] = f'attachment; filename="mongo_export_{settings.MONGO_DB}_{timestamp}.zip"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response