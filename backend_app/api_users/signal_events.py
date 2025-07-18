def event_user_role(type, document):
    return {
        'type': 'user_role_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    

def event_user(type, document, full_selection):
    return {
        'type': 'user_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "username": document.username,
                "firstName": document.first_name,
                "lastName": document.last_name,
                "companyName": document.company_name,
                "email": document.email,
                "isStaff": document.is_staff,
                "isActive": document.is_active,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "phoneNumber": document.phone_number,
                "password": document.password,
                "lastLogin": document.last_login,
                "dateJoined": document.date_joined,
                "token": document.token,
                "userRole": full_selection if document.user_role else None,
                "avatarUrl": document.avatar_url,
                "isVerified": document.is_verified,
                "isApproved": document.is_approved,
            }
        }
    }
    
    
def event_notification_user(type, document, full_selection_notification, full_selection_user):
    return {
        'type': 'notification_user_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "notification": full_selection_notification if document.notification else None,
                "username": document.username,
                "user": full_selection_user if document.user else None,
                "read": document.read,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }