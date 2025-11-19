def event_functionality(type, document, full_selection_roles_allowed):
    return {
        'type': 'functionality_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "link": document.link,
                "key": document.key,
                "isActive": document.is_active,
                "rolesAllowed": full_selection_roles_allowed if document.roles_allowed else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }