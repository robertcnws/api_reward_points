from rest_framework.response import Response
from django.utils import timezone
from api_authorization.models import LoginUser
from api_reward_points.models import (
     RewardStoreProduct,
     RewardAttachment,
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
    create_tracking,
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
        file_name = attachment.name if attachment else None
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete file attachment ({file_name}) in store product',
                object_id=obj.id,
                object_type='RewardStoreProduct',
                object_name=obj.name,
                managed_data={
                    'data': tracking_info
                }
            )
                
            module='store_products'
            info=f'has deleted file attachment ({file_name}) in store product ({obj.name})'
            info_id=obj.id
            type='delete_store_product_file'
            create_notification(module, info_id, info, type, user_reporter.username)
                
            return Response({'message': 'Project file deleted successfully'})
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
#############################################
# DELETE STORE PRODUCT ALL FILES
#############################################

def delete_all_store_product_files(request, id, folder):
    data = request.data
    user_reporter = data.get('userReporter', None)
    try: 
        obj = RewardStoreProduct.objects(id=id).first()
        attachments = obj.attachments if obj.attachments else []
        if not attachments:
            return Response({'error': 'No attachments found for this product'}, status=404)
        list_tracking_info = []
        list_files_names = []
        for attachment in attachments:
            file_to_delete = attachment.file
            list_files_names.append(attachment.name)
            print(f"Deleting file: {file_to_delete}")
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
            list_tracking_info.append(tracking_info)
            attachment.delete()
        
        user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
        
        if user_reporter:
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete all files attachments ({", ".join(list_files_names)}) in store product',
                object_id=obj.id,
                object_type='RewardStoreProduct',
                object_name=obj.name,
                managed_data={
                    'data': list_tracking_info
                }
            )
                
            module='store_products'
            info=f'has deleted all files attachments ({", ".join(list_files_names)}) in store product ({obj.name})'
            info_id=obj.id
            type='delete_all_store_product_files'
            create_notification(module, info_id, info, type, user_reporter.username)
                
            return Response({'message': 'Files deleted successfully'})
        
        return Response({'error': 'User reporter not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

#############################################
# UPDATE PROJECT
#############################################

def update_store_product(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    attachments = []
    # tracking_attachments = []
    # tracking_user_reporter = user_reporter
    files = request.FILES.getlist('attachments')
    
    store_product = RewardStoreProduct.objects(id=id).first()
    if not store_product:
        return Response({'error': 'Store product not found'}, status=404)
    
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
            
            list_attachments = store_product.attachments if store_product.attachments else []
            list_attachments += attachments
            
            store_product.name = name
            store_product.description = description
            store_product.assigned_points = assigned_points
            store_product.attachments = list_attachments
            store_product.last_modified_time = timezone.now()
            
            store_product.save()
            
            tracking_info = transform_data_to_mongo(
                store_product, 
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'update store product',
                object_id=store_product.id,
                object_type='RewardStoreProduct',
                object_name=store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_products'
            info=f'has updated store product ({store_product.name})'
            info_id=store_product.id
            type='update_store_product'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product updated successfully',
                'data': json.loads(store_product.to_json())
            }, status=201)
        
        except Exception as e:
            logger.error(f"Error updating store product: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# CREATE STORE PRODUCT
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'create store product',
                object_id=product.id,
                object_type='RewardStoreProduct',
                object_name=product.name,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_products'
            info=f'has created new store product ({product.name})'
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
# DELETE STORE PRODUCT
#############################################

def delete_store_product(request, id):
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    store_product = RewardStoreProduct.objects(id=id).first()
    if not store_product:
        return Response({'error': 'Store product not found'}, status=404)
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            tracking_info = transform_data_to_mongo(
                store_product, 
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
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete store product',
                object_id=store_product.id,
                object_type='RewardStoreProduct',
                object_name=store_product.name,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_products'
            info=f'has deleted store product ({store_product.name})'
            info_id=store_product.id
            type='delete_store_product'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            attachments = store_product.attachments if store_product.attachments else []
            for attachment in attachments:
                file_to_delete = attachment.file
                delete_attachment_from_s3(file_to_delete)
                attachment.delete()
            
            store_product.delete()
                        
            return Response({'message': 'Store product deleted successfully'}, status=200)
        
        except Exception as e:
            logger.error(f"Error deleting store product: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)


#############################################
# DELETE LIST OF STORE PRODUCTS
#############################################

def delete_list_store_products(request):
    data = request.data
    user_reporter = json.loads(data.get('userReporter', None))
    store_product_ids = data.get('ids', [])
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        
        list_tracking_info = []
        list_names = []
        
        try:
            for product_id in store_product_ids:
                store_product = RewardStoreProduct.objects(id=product_id).first()
                if not store_product:
                    continue
                
                list_names.append(store_product.name)
                
                attachments = store_product.attachments if store_product.attachments else []
                
                tracking_info = transform_data_to_mongo(
                    store_product, 
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
                        
                list_tracking_info.append(tracking_info)
                
                for attachment in attachments:
                    file_to_delete = attachment.file
                    delete_attachment_from_s3(file_to_delete)
                    attachment.delete()
                
                store_product.delete()
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(list_names)} store products',
                object_id=",".join(store_product_ids),
                object_type='RewardStoreProduct',
                object_name=','.join(list_names),
                managed_data={
                    'data': list_tracking_info,
                }
            )
                                
            module='store_products'
            info=f'has deleted list of {len(list_names)} store products ({", ".join(list_names)})'
            info_id='list'
            type='delete_store_product_list'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({'message': 'Store products deleted successfully'}, status=200)
        
        except Exception as e:
            logger.error(f"Error deleting list of store products: {str(e)}")
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