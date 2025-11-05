# helpers_batch.py
from bson import ObjectId, DBRef
from api_reward_points.models import RewardPoints, RewardInvoice, RewardSalesOrder

RP_KEY = "rp_by_user_id"
INV_KEY = "invoice_by_id"
SO_KEY  = "salesorder_by_id"

def _ensure_ctx_maps(ctx):
    if not hasattr(ctx, "_gql_cache"):
        setattr(ctx, "_gql_cache", {})
    cache = ctx._gql_cache
    cache.setdefault(RP_KEY, {})  # -> { user_id: RewardPoints | None }
    cache.setdefault(INV_KEY, {}) # -> { invoice_id: RewardInvoice | None }
    cache.setdefault(SO_KEY, {})  # -> { so_id: RewardSalesOrder | None }
    return cache[RP_KEY], cache[INV_KEY], cache[SO_KEY]

def warmup_rewardpoints_for_users(users, ctx, only_fields=None):
    rp_map, _, _ = _ensure_ctx_maps(ctx)
    missing_users = [u for u in users if str(u.id) not in rp_map]
    if not missing_users:
        return rp_map
    qs = RewardPoints.objects(user__in=missing_users)
    if only_fields:
        qs = qs.only(*only_fields)
    qs = qs.no_dereference()
    for rp in qs:
        rp_map[str(rp.user.id)] = rp
    for u in users:
        rp_map.setdefault(str(u.id), None)
    return rp_map

def _has_all_fields(doc, fields):
    # Si no pediste con .only(), doc._loaded_fields es None -> lo consideramos completo
    loaded = getattr(doc, "_loaded_fields", None)
    if loaded is None:
        return True
    # En MongoEngine, _loaded_fields guarda los nombres incluidos.
    return all(f in loaded.fields for f in fields)

def _refetch_rp_with_fields(user, required_fields):
    qs = RewardPoints.objects(user=user)
    if required_fields:
        qs = qs.only(*required_fields)
    return qs.no_dereference().first()

def get_rp_for_user(user, ctx, only_fields=None):
    rp_map, _, _ = _ensure_ctx_maps(ctx)
    key = str(user.id)
    rp = rp_map.get(key, None)

    if rp is None:
        # No había nada en cache: carga con lo que piden
        rp = _refetch_rp_with_fields(user, only_fields)
        rp_map[key] = rp
        return rp

    # Si el doc cacheado no tiene los campos necesarios, re-fetchea con el superset
    if only_fields and rp and not _has_all_fields(rp, only_fields):
        # Determina superset de lo ya cargado + lo requerido
        loaded = getattr(rp, "_loaded_fields", None)
        current = set(loaded.fields) if loaded else set()
        superset = sorted(current.union(set(only_fields)))
        rp = _refetch_rp_with_fields(user, superset)
        rp_map[key] = rp

    return rp

def _normalize_ids(ref_list):
    ids = []
    for x in ref_list or []:
        if hasattr(x, "id"):
            ids.append(getattr(x, "id"))
        elif isinstance(x, DBRef):
            ids.append(x.id)
        elif isinstance(x, ObjectId):
            ids.append(x)
        else:
            ids.append(getattr(x, "id", None))
    return [i for i in ids if i]

def batch_load_invoices(ids, ctx):
    _, inv_map, _ = _ensure_ctx_maps(ctx)
    missing = [i for i in ids if str(i) not in inv_map]
    if missing:
        for inv in RewardInvoice.objects(id__in=missing):
            inv_map[str(inv.id)] = inv
        for i in missing:
            inv_map.setdefault(str(i), None)
    return [inv_map.get(str(i)) for i in ids if str(i) in inv_map]

def batch_load_sales_orders(ids, ctx):
    _, _, so_map = _ensure_ctx_maps(ctx)
    missing = [i for i in ids if str(i) not in so_map]
    if missing:
        for so in RewardSalesOrder.objects(id__in=missing):
            so_map[str(so.id)] = so
        for i in missing:
            so_map.setdefault(str(i), None)
    return [so_map.get(str(i)) for i in ids if str(i) in so_map]
