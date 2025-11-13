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
    

def event_system_permission(type, document):
    return {
        'type': 'system_permission_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "key": document.key,
                "description": document.description,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    

def event_user(type, document, full_selection, full_selection_list_permissions):
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
                "keyAvatar": document.key_avatar,
                "avatarUrl": document.avatar_url,
                "isVerified": document.is_verified,
                "isApproved": document.is_approved,
                "approvedTime": document.approved_time,
                "disapprovalCount": document.disapproval_count,
                "showTourGuideModal": document.show_tour_guide_modal,
                "tookTourGuide": document.took_tour_guide,
                "showIntroGuideModal": document.show_intro_guide_modal,
                "tookIntroGuide": document.took_intro_guide,
                "country": document.country,
                "address": document.address,
                "zipCode": document.zip_code,
                "state": document.state,
                "city": document.city,
                "school": document.school,
                "about": document.about,
                "facebookLink": document.facebook_link,
                "instagramLink": document.instagram_link,
                "linkedinLink": document.linkedin_link,
                "twitterLink": document.twitter_link,
                "customerportalPermissions": full_selection_list_permissions if document.customerportal_permissions else []
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
    

def event_external_user(type, document, full_selection):
    return {
        'type': 'external_user_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "isLoggedIn": document.is_logged_in,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "lastLogin": document.last_login,
                "user": full_selection if document.user else None,
            }
        }
    }