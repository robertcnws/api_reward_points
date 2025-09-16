from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from api_authorization.models import LoginUser
from api_authorization.repo_util.authorization_utils import send_generic_email
from api_reward_points.models import (
     RewardStoreProduct,
     RewardAttachment,
     RewardStoreProductSelection,
     RewardStoreProductSelectionCart,
     RewardStoreProductSelectionBuy,
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
from datetime import timedelta

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
            logger.error("No attachments found for this product")
            return Response({'error': 'No attachments found for this product'}, status=404)
        attachment = RewardAttachment.objects(file=file_to_delete).first()
        file_name = attachment.name if attachment else None
        if not attachment:
            logger.error("Attachment not found")
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
            info=f'has deleted file attachment ({file_name}) in product ({obj.name})'
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
            logger.error("No attachments found for this product")
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
            info=f'has deleted all files attachments ({", ".join(list_files_names)}) in product ({obj.name})'
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
        logger.error("Store product not found")
        return Response({'error': 'Store product not found'}, status=404)
    
    last_store_product = transform_data_to_mongo(
        store_product, 
        exclude_fields=[
            'password', 
            'is_staff',
            'is_verified', 
            'last_login', 
            'date_joined',
        ]
    )
    
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
            status = data.get('status', False)
            
            list_attachments = store_product.attachments if store_product.attachments else []
            list_attachments += attachments
            
            store_product.name = name
            store_product.description = description
            store_product.assigned_points = assigned_points
            store_product.attachments = list_attachments
            store_product.last_modified_time = timezone.now()
            store_product.is_active = status == 'true' if status else False
            
            store_product.save()
                
            file = store_product.attachments[0].file if \
                    len(store_product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
            default_url = generate_default_file_url(file)
            set_expiration_to_related_buys(product=store_product, default_url=default_url)

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
            
            number_changes = 0
            info = f'has updated product ({store_product.name}) with'
            if last_store_product['assigned_points'] != store_product.assigned_points:
                info += f' new assigned points ({store_product.assigned_points})'
                number_changes += 1
            if last_store_product['description'] != store_product.description:
                info += f'{', ' if number_changes > 0 else ' '}new description ({store_product.description})'
                number_changes += 1
            if last_store_product['name'] != store_product.name:
                info += f'{', ' if number_changes > 0 else ' '}new name ({store_product.name}) '
                number_changes += 1
            if last_store_product['attachments']:
                if len(last_store_product['attachments']) != len(attachments):
                    info += f'{', ' if number_changes > 0 else ' '}changes in attachments'
                    number_changes += 1
            if last_store_product['is_active'] != store_product.is_active:
                new_status = 'active' if store_product.is_active else 'inactive'
                info += f'{', ' if number_changes > 0 else ' '}new status {new_status}'

            module='store_products'
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
            status = data.get('status', False)
            
            product = RewardStoreProduct(
                name=name,
                description=description,
                assigned_points=assigned_points,
                attachments=attachments,
                is_active=status == 'true' if status else False,
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
            info=f'has created new product ({product.name.upper()}) with assigned points ({product.assigned_points})'
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
        logger.error("Store product not found")
        return Response({'error': 'Store product not found'}, status=404)
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:

            selections = RewardStoreProductSelection.objects(store_product=store_product).all()
            
            if selections:
                carts = RewardStoreProductSelectionCart.objects(store_product_selection__in=selections).all()
                buys = RewardStoreProductSelectionBuy.objects(store_product_selection__in=selections).all()
                if carts:
                    logger.error(f"Cannot delete store product with active selections in {carts.count()} carts")
                    return Response({
                        'error': f'Cannot delete store product with active selections in {carts.count()} carts'
                    }, status=400)
                    
                if buys:
                    logger.error(f"Cannot delete store product with active selections in {buys.count()} buys")
                    return Response({
                        'error': f'Cannot delete store product with active selections in {buys.count()} buys'
                    }, status=400)

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
            info=f'has deleted product ({store_product.name}) with assigned points ({store_product.assigned_points})'
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
        list_store_products = []
        
        try:
            for product_id in store_product_ids:
                store_product = RewardStoreProduct.objects(id=product_id).first()
                if store_product:
                    selections = RewardStoreProductSelection.objects(store_product=store_product).all()
                
                    if selections:
                        carts = RewardStoreProductSelectionCart.objects(store_product_selection__in=selections).all()
                        buys = RewardStoreProductSelectionBuy.objects(store_product_selection__in=selections).all()
                        if carts:
                            logger.error(f'Cannot delete store products with active selections in carts')
                            return Response({
                                'error': f'Cannot delete store products with active selections in carts'
                            }, status=400)
                            
                        if buys:
                            logger.error(f'Cannot delete store products with active selections in buys')
                            return Response({
                                'error': f'Cannot delete store products with active selections in buys'
                            }, status=400)
                    
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
                    
                    list_store_products.append(store_product)
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'delete list of {len(list_names)} products',
                object_id=",".join(store_product_ids),
                object_type='RewardStoreProduct',
                object_name=','.join(list_names),
                managed_data={
                    'data': list_tracking_info,
                }
            )
                                
            module='store_products'
            info=f'has deleted list of {len(list_names)} products ({", ".join(list_names)})'
            info_id='list'
            type='delete_store_product_list'
            create_notification(module, info_id, info, type, user_reporter.username)
            
            for store_product in list_store_products:
                store_product.delete()
                        
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
    
    
#############################################
# MANAGE ACTIVE STORE PRODUCT
#############################################

def manage_active_store_product(request, id):         
    data = request.data
    
    user_reporter = json.loads(data.get('userReporter', None))
    
    user_reporter = LoginUser.objects(username=user_reporter['username']).first() if user_reporter else None
    
    if user_reporter:
        try:
            
            product = RewardStoreProduct.objects(id=id).first()
            if not product:
                logger.error("Store product not found")
                return Response({'error': 'Store product not found'}, status=404)
            product.is_active = not product.is_active
            product.save()
            
            file = product.attachments[0].file if \
                    len(product.attachments) > 0 else 'store_products/nws_reward_points_preview.png'
            default_url = generate_default_file_url(file)
            set_expiration_to_related_buys(product=product, default_url=default_url)

            tracking_info = transform_data_to_mongo(
                product, 
                include_fields=[
                    'id',
                    'name',
                    'assigned_points',
                    'is_active',
                    'created_time',
                    'last_modified_time'
                ]
            )
            
            create_tracking(
                user_reporter=user_reporter,
                action=f'manage active store product',
                object_id=product.id,
                object_type='RewardStoreProduct',
                object_name=product.name,
                managed_data={
                    'data': tracking_info
                }
            )
                            
            module='store_products'
            info=f'has {"activated" if product.is_active else "deactivated"} product ({product.name})'
            info_id=product.id
            type='manage_store_product'
            create_notification(module, info_id, info, type, user_reporter.username)
                        
            return Response({
                'message': 'Store product managed successfully',
                'data': json.loads(product.to_json())
            }, status=200)

        except Exception as e:
            logger.error(f"Error managing store product: {str(e)}")
            return Response({'error': str(e)}, status=500)
    
    return Response({'error': 'User reporter not found'}, status=404)

# EXTRAS

def set_expiration_to_related_buys(product, default_url):
    selections = RewardStoreProductSelection.objects(store_product=product).all()
    if selections:
        buys = RewardStoreProductSelectionBuy.objects(store_product_selection__in=selections).all()
        if buys:
            for buy in buys:
                today = timezone.now()
                next_date_30_days = today + timedelta(days=30)
                buy.expiration_time = next_date_30_days if not product.is_active else None
                buy.save()  
            
            if not product.is_active:
                list_receivers = [buy.store_product_selection.user.email, settings.EMAIL_SUPPORT] if \
                                 settings.ENVIRONMENT == 'prod' else [settings.DJANGO_LIST_ADMIN_EMAIL_RECEIPTS]
                send_email_expire_confirmation(
                    user=buy.store_product_selection.user,
                    purchases=buys,
                    default_url=default_url,
                    # list_receivers=[buy.store_product_selection.user.email]
                    list_receivers=list_receivers
                )
                
                

def send_email_expire_confirmation(user, purchases, default_url, list_receivers):
    current_year = timezone.now().year
    email_html_message = render_to_string(
            f"api_reward_points/email_send_expire_confirmation.html",  
            {
             "username": user.username, 
             "first_name": user.first_name, 
             "last_name": user.last_name,
             "list_purchases": purchases,
             "default_url": default_url,
             "current_year": current_year
            }, 
    )
    message = f"Hello {user.first_name} {user.last_name},\n\nThe following products are set to expire soon (within 30 days):\n"
    today = to_aware(timezone.now())
    today_str = today.strftime("%Y-%m-%d %H:%M:%S")
    return send_generic_email(
        list_receivers,
        email_html_message,
        f"Expiration Confirmation - {today_str}",
        message_response=message
    )