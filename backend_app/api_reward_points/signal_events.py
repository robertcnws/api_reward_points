def event_point_history(type, document, full_selection):
    return {
        'type': 'point_history_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "rewardPoints": full_selection if document.reward_points else None,
                "action": document.action,
                "gainedPoints": document.gained_points,
                "spentPoints": document.spent_points,
                "info": document.info,
                "description": document.description,
            }
        }
    }
    
def event_store_product_selection_buy(type, document, full_selection):
    return {
        'type': 'store_product_selection_buy_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "hasBeenUsed": document.has_been_used,
                "hasRequestedRefund": document.has_requested_refund,
                "quantityUsed": document.quantity_used,
                "orderNumber": document.order_number,
                "confirmationNumber": document.confirmation_number,
                "notes": document.notes,
                "purchaseType": document.purchase_type,
                "purchaseFraction": document.purchase_fraction,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "expirationTime": document.expiration_time,
                "pinNumber": document.pin_number,
                "redeemedTime": document.redeemed_time,
                "isRemoved": document.is_removed,
            }

        }
    }
    
def event_store_product_selection_cart(type, document, full_selection):
    return {
        'type': 'store_product_selection_cart_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "storeProductSelection": full_selection if document.store_product_selection else None,
                "isBought": document.is_bought,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    
    
def event_store_product(type, document, full_selection):
    return {
        'type': 'store_product_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "description": document.description,
                "assignedPoints": document.assigned_points,
                "attachments": full_selection if document.attachments else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isActive": document.is_active,
            }
        }
    }
    
    
def event_store_product_review(type, document, full_selection):
    return {
        'type': 'store_product_review_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "user": full_selection if document.user else None,
                "rating": document.rating,
                "comment": document.comment,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    

def event_store_product_review_reaction(type, document, full_selection_user, full_selection_review):
    return {
        'type': 'store_product_review_reaction_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "storeProductReview": full_selection_review if document.store_product_review else None,
                "reactionType": document.reaction_type,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }
        }
    }
    
def event_points_settings(type, document):
    return {
        'type': 'points_settings_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "amount": document.amount,
                "points": document.points,
                "description": document.description,
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
            }

        }
    }
    
    
def event_reward_points(
    type, 
    document, 
    full_selection_user, 
    full_selection_invoices,
    full_selection_sales_orders
):
    total_available_points = document.total_gained_points + \
                             document.total_assigned_points - \
                             document.total_substracted_points
    return {
        'type': 'reward_points_update',
        'message': {
            'type': type,
            "item": {
                "id": str(document.id),
                "user": full_selection_user if document.user else None,
                "totalGainedPoints": document.total_gained_points,
                "totalSpentPoints": document.total_spent_points,
                "totalAssignedPoints": document.total_assigned_points,
                "totalSubstractedPoints": document.total_substracted_points,
                "totalRefundedPoints": document.total_refunded_points,
                "totalAvailablePoints": total_available_points,
                "totalAmountInvoices": document.total_amount_invoices,
                "totalPaidAmountInvoices": document.total_paid_amount_invoices,
                "totalOpenedBalanceInvoices": document.total_opened_balance_invoices,
                "totalTaxAmountInvoices": document.total_tax_amount_invoices,
                "qtyPendingOrders": document.qty_pending_orders,
                "invoices": full_selection_invoices if document.invoices else [],
                "salesOrders": full_selection_sales_orders if document.sales_orders else [],
                "createdTime": document.created_time,
                "lastModifiedTime": document.last_modified_time,
                "isSyncWithZoho": document.is_sync_with_zoho,
            }

        }
    }

def event_reward_clients(
    type, 
    document, 
    full_selection_user_role,
    full_selection_invoices,
    full_selection_sales_orders,
    full_selection_customerportal_permissions
):
    return {
        'type': 'reward_clients_update',
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
                "userRole": full_selection_user_role if document.user_role else None,
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
                "totalAvailablePoints": document.total_available_points,
                "invoices": full_selection_invoices if document.invoices else [],
                "salesOrders": full_selection_sales_orders if document.sales_orders else [],
                "rewardPointsId": document.reward_points_id,
                "isSyncWithZoho": document.is_sync_with_zoho,
                "customerportalPermissions": full_selection_customerportal_permissions if document.customerportal_permissions else [],
            }
        }
    }