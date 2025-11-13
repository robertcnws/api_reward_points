
from api_integration.repository import repository_integration
from api_integration.models import RewardFullItem, RewardFullItemgroup
from api_integration.repo_util import mongo_coerce


def process_items(data):
    response = repository_integration.fetch_items(data)
    results = response.get("results", []) or []
    for item_data in results:
        item_id = item_data.get("item_id")
        if not item_id:
            continue
        
        coerced = mongo_coerce.coerce_payload_to_model(item_data, RewardFullItem)
        
        q = {"item_id": coerced.get("item_id")}
        if "zoho_org_id" in RewardFullItem._fields:
            q["zoho_org_id"] = coerced.get("zoho_org_id")

        existing = RewardFullItem.objects(**q).first()
        if existing:
            for k, v in coerced.items():
                setattr(existing, k, v)
            existing.save()
        else:
            new_item = RewardFullItem(**coerced)
            new_item.save()

    return f"{len(results)} Items processed successfully"


def process_itemgroups(data):
    response = repository_integration.fetch_itemgroups(data)
    results = response.get("results", []) or []
    for itemgroup_data in results:
        group_id = itemgroup_data.get("group_id")
        if not group_id:
            continue
        
        coerced = mongo_coerce.coerce_payload_to_model(itemgroup_data, RewardFullItemgroup)
        
        q = {"group_id": coerced.get("group_id")}
        if "zoho_org_id" in RewardFullItemgroup._fields:
            q["zoho_org_id"] = coerced.get("zoho_org_id")

        existing = RewardFullItemgroup.objects(**q).first()
        if existing:
            for k, v in coerced.items():
                setattr(existing, k, v)
            existing.save()
        else:
            new_itemgroup = RewardFullItemgroup(**coerced)
            new_itemgroup.save()
    return f"{len(results)} Item groups processed successfully"