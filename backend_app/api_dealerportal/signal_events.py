def event_dealerportal_quote(type, document, full_selection_owner):
    return {
        "type": "dealerportal_quote_update",
        "message": {
            "type": type,
            "item": {
                "id": str(document.id),
                "name": document.name,
                "number": document.number,
                "owner": full_selection_owner if document.owner else None,
                "createdBy": full_selection_owner if document.created_by else None,
                "markup": document.markup,
                "notes": document.notes,
                "totalSell": document.total_sell,
                "totalCost": document.total_cost,
                "markupTotal": document.markup_total,
                "status": document.status,
                "createdAt": document.created_at,
                "updatedAt": document.updated_at,
            }
        }
    }


def event_dealerportal_quote_product(type, document, full_selection_product):
    # quote_id = str(document.quote.id) if document.quote else None
    return {
        "type": "dealerportal_quote_product_update",
        "message": {
            "type": type,
            "item": {
                "id": str(document.id),
                # "quote": quote_id,
                "product": full_selection_product if document.product else None,
                "quantity": document.quantity,
                "createdAt": getattr(document, "created_at", None),
            }
        }
    }
    

def event_dealerportal_order(type, document, full_selection_owner, full_selection_quote):
    return {
        "type": "dealerportal_order_update",
        "message": {
            "type": type,
            "item": {
                "id": str(document.id),
                "number": document.number,
                "owner": full_selection_owner if document.owner else None,
                "createdBy": full_selection_owner if document.created_by else None,
                "quote": full_selection_quote if document.quote else None,
                "status": document.status,
                "createdAt": document.created_at,
                "updatedAt": document.updated_at,
            }
        }
    }
