# utils/mongo_coerce.py
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from datetime import datetime
import mongoengine as me

# ==== helpers de parseo ====

def _to_str(v):
    if v is None:
        return None
    # Acepta números y bools -> str
    return str(v)

def _to_int(v):
    if v is None or v == "":
        return None
    try:
        # si viene "0012" lo respeta como 12
        return int(v)
    except (ValueError, TypeError):
        return None

def _to_decimal(v):
    if v is None or v == "":
        return None
    try:
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return None

def _to_bool(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v != 0
    # strings típicos
    s = str(v).strip().lower()
    if s in {"true","1","yes","y","si","sí"}:
        return True
    if s in {"false","0","no","n"}:
        return False
    return None

def _to_datetime(v):
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v
    s = str(v).strip()
    # intenta formatos ISO comunes
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    # último intento: timestamp numérico
    try:
        return datetime.fromtimestamp(float(s))
    except Exception:
        return None

# ==== coerción principal según tipo de campo de MongoEngine ====

def _coerce_for_field(field: me.base.fields.BaseField, value):
    # None siempre permitido (si el campo lo acepta)
    if value is None:
        return None

    # StringField: convierte numérico/bool a str
    if isinstance(field, me.StringField):
        return _to_str(value)

    # Int/Long
    if isinstance(field, (me.IntField, me.LongField)):
        return _to_int(value)

    # Decimal
    if isinstance(field, me.DecimalField):
        return _to_decimal(value)

    # Float
    if isinstance(field, me.FloatField):
        try:
            return float(value) if value != "" else None
        except (ValueError, TypeError):
            return None

    # Boolean
    if isinstance(field, me.BooleanField):
        b = _to_bool(value)
        # si no reconocible, intenta coerción Python por verdad
        return bool(value) if b is None else b

    # DateTime
    if isinstance(field, me.DateTimeField):
        return _to_datetime(value)

    # ListField / DictField: deja tal cual si es compatible
    if isinstance(field, me.ListField):
        return list(value) if isinstance(value, (list, tuple)) else None
    if isinstance(field, me.DictField):
        return dict(value) if isinstance(value, dict) else None

    # ReferenceField/EmbeddedDocumentField: asume ya viene instancia/PK -> lo dejamos
    return value


def coerce_payload_to_model(payload: dict, ModelCls) -> dict:
    """
    Devuelve un dict con los campos del payload convertidos
    a los tipos esperados por ModelCls (MongoEngine).
    - Ignora claves que no existen en el modelo
    - Convierte tipos básicos (str/int/decimal/bool/datetime)
    - No pisa _id/id
    """
    if not isinstance(payload, dict):
        return {}

    fields = getattr(ModelCls, "_fields", {})
    out = {}

    for key, raw in payload.items():
        if key in {"id", "_id"}:
            continue
        field = fields.get(key)
        if not field:
            # clave desconocida para el modelo -> ignora
            continue
        out[key] = _coerce_for_field(field, raw)

    return out
