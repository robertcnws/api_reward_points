from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from api_users.repository import (
    repository_notifications, 
    repository_trackings, 
    repository_user_role,
    repository_users,
)

import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


#############################################
# CREATE USER ROLE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_role(request): 
    return repository_user_role.create_user_role(request)
    
    
#############################################
# EDIT USER ROLE
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_user_role(request, id): 
    return repository_user_role.edit_user_role(request, id)
    
    

#############################################
# DELETE USER ROLE
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user_role(request, id): 
    return repository_user_role.delete_user_role(request, id)
    
    
#############################################
# DELETE USER ROLES
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user_roles(request): 
    return repository_user_role.delete_user_roles(request)
    
    
#############################################
# CREATE USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user(request): 
    return repository_users.create_user(request)
    
    
#############################################
# EDIT USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def edit_user(request, id): 
    return repository_users.edit_user(request, id)
    
    

#############################################
# CHANGE PASSWORD
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request, id):
    return repository_users.change_password(request, id)


#############################################
# DELETE USER
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user(request, id):
    return repository_users.delete_user(request, id)
        
        
#############################################
# DELETE USERS
#############################################

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_users(request):
    return repository_users.delete_users(request)
        
#############################################
# CHANGE APPROVAL USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_approval_user(request, id):
    return repository_users.change_approval_user(request, id)
        
        
#############################################
# CHANGE VERIFY USER
#############################################

@api_view(['POST'])
@permission_classes([AllowAny])
def change_verify_user(request, id):
    return repository_users.change_verify_user(request, id)
        
        
#############################################
# NOTIFICATIONS
#############################################
#############################################
# REMOVE ALL NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_old_notifications(request):
    return repository_notifications.remove_old_notifications(request)



#############################################
# DELETE NOTIFICATIONS
#############################################

    
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notifications(request):
    return repository_notifications.delete_notifications(request)


#############################################
# MARK AS READ NOTIFICATIONS
#############################################

    
@api_view(['POST'])
@permission_classes([AllowAny])
def mark_as_read_notifications(request):
    return repository_notifications.mark_as_read_notifications(request)


#############################################
# DELETE OLD NOTIFICATIONS
#############################################

def delete_old_notifications():
    return repository_notifications.delete_old_notifications()


#############################################
# DELETE OLD TRACKINGS
#############################################

def delete_old_trackings():
    return repository_trackings.delete_old_trackings()
