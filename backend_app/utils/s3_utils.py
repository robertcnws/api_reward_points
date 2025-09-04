# s3_utils.py
import boto3
import os
import sys
import subprocess
import io
import zipfile
import tarfile
import re
from pathlib import Path
from PIL import Image, ImageOps
from botocore.exceptions import ClientError
from django.conf import settings
from datetime import datetime

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

def key_exists_in_s3(key):
    try:
        s3_client.head_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME, 
            Key=key,
            ExpectedBucketOwner=settings.AWS_ACCOUNT_ID
        )
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == "404":
            return False
        else:
            raise e
        
        
def compress_file(file_obj, max_width=2000, quality=85, format="JPEG"):
    upload_buffer = io.BytesIO()
    content_type = file_obj.content_type
    
    if content_type.startswith("image/"):
        img = Image.open(file_obj)
        img = ImageOps.exif_transpose(img)
        
        if format.upper() == "JPEG" and img.mode in ("RGBA", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        
        if img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
        
        img.save(upload_buffer, format=format, optimize=True, quality=quality)
        content_type = f"image/{format.lower()}"
        upload_buffer.seek(0)
    else:
        file_obj.seek(0)
        upload_buffer = file_obj
    return upload_buffer, content_type
    

def upload_attachment_to_s3(file_obj, folder=settings.AWS_S3_FOLDER_STORE_PRODUCTS):
    import uuid
    extension = file_obj.name.split('.')[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    key = folder + filename
    
    if key_exists_in_s3(key):
        key = folder + f"{uuid.uuid4()}.{extension}"

    try:
        file_obj, content_type = compress_file(file_obj)
        file_obj.content_type = content_type
        
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={
                'ContentType': file_obj.content_type
            }
        )
        return key
    except ClientError as e:
        print("Error uploading file to S3:", e)
        return None
    
    
def manage_backup_to_s3(logger, s3_key, s3_prefix, fileobj, keep=5):
    s3 = boto3.client('s3', region_name=getattr(settings, 'AWS_REGION', None))
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    account = settings.AWS_ACCOUNT_ID
    extra_args = {}
    if account:
        extra_args['ExpectedBucketOwner'] = account

    try:
        s3.upload_fileobj(fileobj, bucket, s3_key, ExtraArgs=extra_args)
    except ClientError as e:
        logger.exception("Error subiendo backup a S3: %s", e)
    
    try:
        paginate_kwargs = {"Bucket": bucket, "Prefix": s3_prefix}
        if account:
            paginate_kwargs["ExpectedBucketOwner"] = account

        paginator = s3.get_paginator('list_objects_v2')
        objs = []
        for page in paginator.paginate(**paginate_kwargs):
            for o in page.get('Contents', []) or []:
                if o.get('Key', '').endswith('.zip'):
                    objs.append(o)
        
        objs.sort(key=lambda o: o['LastModified'])

        excess = len(objs) - int(keep or 0)
        if excess > 0:
            to_delete = [{'Key': o['Key']} for o in objs[:excess]]
            delete_kwargs = {
                "Bucket": bucket,
                "Delete": {"Objects": to_delete, "Quiet": True},
            }
            if account:
                delete_kwargs["ExpectedBucketOwner"] = account

            s3.delete_objects(**delete_kwargs)
    except ClientError as e:
        logger.exception("Error deleting old backups in S3: %s", e)
        

def download_and_compress_s3(keys, number):
    s3 = boto3.client('s3', region_name=getattr(settings, 'AWS_REGION', None))
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    account = getattr(settings, 'AWS_ACCOUNT_ID', None)

    extra_args = {"ExpectedBucketOwner": account} if account else None

    downloads_dir = Path.home() / "Downloads"
    downloads_dir.mkdir(exist_ok=True)
    
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    if sys.platform.startswith("win"):
        archive_name = f"files_{number}_{ts}.zip"
        archive_path = downloads_dir / archive_name
        with zipfile.ZipFile(archive_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for key in keys:
                buf = io.BytesIO()
                try:
                    s3.download_fileobj(
                        Bucket=bucket,
                        Key=key,
                        Fileobj=buf,
                        ExtraArgs=extra_args,
                    )
                    buf.seek(0)
                    zf.writestr(os.path.basename(key), buf.read())
                except ClientError as e:
                    print(f"Error descargando {key}: {e}")
    else:
        archive_name = f"files_{number}_{ts}.tar.gz"
        archive_path = downloads_dir / archive_name
        
        with tarfile.open(archive_path, mode="w:gz") as tf:
            for key in keys:
                buf = io.BytesIO()
                try:
                    s3.download_fileobj(
                        Bucket=bucket,
                        Key=key,
                        Fileobj=buf,
                        ExtraArgs=extra_args, 
                    )
                    buf.seek(0)
                    info = tarfile.TarInfo(name=os.path.basename(key))
                    data = buf.getvalue()
                    info.size = len(data)
                    tf.addfile(tarinfo=info, fileobj=io.BytesIO(data))
                except ClientError as e:
                    print(f"Error descargando {key}: {e}")
    
    return archive_path


def make_s3_archive_stream(keys, number, stage, task):
    s3 = boto3.client('s3', region_name=getattr(settings, 'AWS_REGION', None))
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    account = getattr(settings, 'AWS_ACCOUNT_ID', None)
    extra_args = {"ExpectedBucketOwner": account} if account else None
    
    buf = io.BytesIO()
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"files_{number}_{ts}"
    if stage:
        filename += f"_{stage}"
    if task:
        filename += f"_{task}"
    filename += ".zip"
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for key in keys:
            file_buf = io.BytesIO()
            s3.download_fileobj(
                Bucket=bucket,
                Key=key,
                Fileobj=file_buf,
                ExtraArgs=extra_args,
            )
            file_buf.seek(0)
            zf.writestr(os.path.basename(key), file_buf.read())
    buf.seek(0)
    content_type = "application/zip"
    return buf, filename, content_type
    
    
def generate_default_file_url(object_key):
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': object_key,
        },
        ExpiresIn=3600
    )
    return url


def delete_attachment_from_s3(key):
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    account = getattr(settings, 'AWS_ACCOUNT_ID', None)
    kwargs = {"Bucket": bucket, "Key": key}
    if account:
        if re.fullmatch(r"\d{12}", str(account)):
            kwargs["ExpectedBucketOwner"] = str(account)
    try:
        s3_client.delete_object(**kwargs)
        return True
    except ClientError as e:
        print("Error deleting file from S3:", e)
        return False
    
    
def backup_mongo_to_s3(logger, mongo_uri, db_name, s3_bucket, s3_prefix):
    account = getattr(settings, 'AWS_ACCOUNT_ID', None)
    backup_folder = '/tmp/mongo_backup'
    if os.path.exists(backup_folder):
        subprocess.run(["rm", "-rf", backup_folder], check=True)
    os.makedirs(backup_folder, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"{db_name}_backup_{timestamp}.gz"
    backup_filepath = os.path.join(backup_folder, backup_filename)
    
    dump_cmd = [
        "mongodump",
        f"--uri={mongo_uri}",
        f"--db={db_name}",
        f"--archive={backup_filepath}",
        "--gzip"
    ]
    try:
        logger.info("Executing command: %s", " ".join(dump_cmd))
        result = subprocess.run(dump_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("mongodump stdout: %s", result.stdout.decode())
        logger.info("mongodump stderr: %s", result.stderr.decode())
        logger.info("Backup created at: %s", backup_filepath)
    except subprocess.CalledProcessError as e:
        logger.error("Error executing mongodump: %s", e.stderr.decode())
        raise
    try:
        kwargs = {"Bucket": s3_bucket, "Prefix": s3_prefix}
        if account:
            if re.fullmatch(r"\d{12}", str(account)):
                kwargs["ExpectedBucketOwner"] = str(account)
        resp = s3_client.list_objects_v2(**kwargs)
        if 'Contents' in resp:
            kwargs = {"Bucket": s3_bucket}
            if account:
                if re.fullmatch(r"\d{12}", str(account)):
                    kwargs["ExpectedBucketOwner"] = str(account)
            for obj in resp['Contents']:
                kwargs["Key"] = obj['Key']
                logger.info("Deleting object in S3: %s", obj['Key'])
                s3_client.delete_object(**kwargs)
    except Exception as e:
        logger.error("Error deleting objects in S3: %s", e)
        raise
    try:
        s3_key = os.path.join(s3_prefix, backup_filename)
        extra_args = {'ExpectedBucketOwner': str(account)} if account else {}
        s3_client.upload_file(
            backup_filepath, 
            s3_bucket, 
            s3_key,
            ExtraArgs=extra_args
        )
        logger.info("Backup uploaded to S3 in: %s", s3_key)
    except Exception as e:
        logger.error("Error uploading backup to S3: %s", e)
        raise
    try:
        os.remove(backup_filepath)
        logger.info("Local backup file deleted.")
    except Exception as e:
        logger.warning("Could not delete local backup file: %s", e)
