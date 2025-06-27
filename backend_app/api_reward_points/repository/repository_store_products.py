from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProduct,
     RewardAttachment,
     Tracking,
)
from utils.s3_utils import (
    upload_attachment_to_s3, 
    generate_default_file_url,
    delete_attachment_from_s3,
)
from utils.data_util import (
    transform_data_to_mongo,
    parse_custom_date,
    create_notification,
    to_aware,
    transform_dict_to_camelcase,
)
import json
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

#############################################
# DELETE STORE PRODUCT FILE
#############################################

def delete_store_product_file(request, id, folder, file):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try: 
        obj = RewardStoreProduct.objects(id=id).first()
        file_to_delete = folder + '/' + file
        attachments = obj.attachments if obj.attachments else []
        if not attachments:
            return Response({'error': 'No attachments found for this product'}, status=404)
        attachment = RewardAttachment.objects(file=file_to_delete).first()
        if not attachment:
            return Response({'error': 'Attachment not found'}, status=404)
        attachments = [a for a in attachments if a.file != file_to_delete]
        attachments = sorted(attachments, key=lambda x: to_aware(x['created_time']), reverse=True)
        obj.attachments = attachments
        obj.save()
        delete_attachment_from_s3(file_to_delete)
        tracking_info = transform_data_to_mongo(
                attachment, 
                exclude_fields=[
                    'password', 
                    'is_staff', 
                    'is_active', 
                    'is_verified', 
                    'last_login', 
                    'date_joined',
                    'last_modified_time', 
                    'created_time'
                ]
            )
        attachment.delete()  
        
        user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            tracking = Tracking(
                user_reporter=user_reporter,
                action=f'delete store product ({obj.id} - {obj.name}) file attachment',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info
                },
            )
            tracking.save()
                
            module='store_products'
            info=f'has deleted file attachment in store product {obj.name}'
            info_id=obj.id
            type='delete_store_product_file'
            create_notification(module, info_id, info, type, user_reporter.username)
                
            return Response({'message': 'Project file deleted successfully'})
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# CREATE PROJECT
#############################################

def create_store_product(request):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    attachments = []
    # tracking_attachments = []
    # tracking_user_reporter = user_reporter
    files = request.FILES.getlist('attachments')
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            for file_obj in files:
                key = upload_attachment_to_s3(file_obj)
                if key:
                    # Ejemplo: url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}"
                    attachment = RewardAttachment(
                        name=file_obj.name,
                        file=key,
                        user_upload=user_reporter,
                        created_time=timezone.now(),
                        last_modified_time=timezone.now(),
                    )
                    attachment.save()
                    attachments.append(attachment)
                    # tracking_attachments.append({
                    #     'id': str(attachment.id),
                    #     'name': attachment.name,
                    #     'file': attachment.file,
                    #     'created_time': attachment.created_time.isoformat(),
                    #     'last_modified_time': attachment.last_modified_time.isoformat(),
                    #     'user_upload': tracking_user_reporter
                    # })
                    
            attachments = sorted(attachments, key=lambda x: x.name, reverse=True)
            # tracking_attachments = sorted(tracking_attachments, key=lambda x: x['name'], reverse=True)
            
            name = data.get('name', '')
            description = data.get('description', '')
            assigned_points = data.get('assignedPoints', 0)
            
            product = RewardStoreProduct(
                name=name,
                description=description,
                assigned_points=assigned_points,
                attachments=attachments,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
            )
            product.save()
            
            tracking_info = transform_data_to_mongo(
                product, 
                exclude_fields=[
                    'password', 
                    'is_staff', 
                    'is_active', 
                    'is_verified', 
                    'last_login', 
                    'date_joined',
                    'last_modified_time', 
                    'created_time'
                ]
            )
                    
            tracking = Tracking(
                user_reporter=user_reporter,
                action=f'create store product ({product.id} - {product.name})',
                created_time=timezone.now(),
                managed_data={
                    'data': tracking_info,
                },
            )
            tracking.save()
                            
            module='store_products'
            info=f'has created new store product {product.name}'
            info_id=product.id
            type='create_store_product'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product created successfully',
                'data': json.loads(product.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error creating store product: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# GET FILE URL
#############################################

def get_default_file_url(request):
    object_key = request.query_params.get('key')
    if not object_key:
        return Response({'error': 'A key was not sended'}, status=400)
    try:
        url = generate_default_file_url(object_key)
        return Response({'url': url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)