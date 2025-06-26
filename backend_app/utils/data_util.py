from bson.objectid import ObjectId
from django.utils import timezone
from datetime import timezone as dt_timezone
from datetime import datetime
from dateutil import parser
from phonenumbers import NumberParseException
from api_users.models import Notification, NotificationUser
from api_authorization.models import LoginUser
from api_reward_points.models import RewardPointsSettings
import phonenumbers
import json

def transform_data_to_mongo(data, exclude_fields=None, include_fields=None):
    if isinstance(data, dict):
        for key, value in data.items():
            data[key] = transform_data_to_mongo(str(value) if isinstance(value, ObjectId) else value)
        if not 'id' in data and '_id' in data:
            data['id'] = data.get('_id', None)
    else:
        data = data.to_mongo().to_dict()
        if '_id' in data and isinstance(data['_id'], ObjectId):
            data['_id'] = str(data['_id'])
            data['id'] = data['_id']
    if exclude_fields:
        for field in exclude_fields:
            if field in data:
                del data[field]
    if include_fields:
        for field in list(data.keys()):
            if field not in include_fields:
                del data[field]
    return data


def transform_dict_to_camelcase(data):
    if isinstance(data, dict):
        new_data = {}
        for key, value in data.items():
            if '_' in key and key != '_id':
                words = key.split('_')
                new_key = words[0].lower() + ''.join(word.capitalize() for word in words[1:])
            else:
                new_key = key[0].lower() + key[1:] if key else key
            new_data[new_key] = transform_dict_to_camelcase(value)
        return new_data
    elif isinstance(data, list):
        return [transform_dict_to_camelcase(item) for item in data]
    else:
        return data


def serialize_datetime(value):
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            local_tz = timezone.get_current_timezone()
            # local_tz = dt_timezone.utc
            value = timezone.make_aware(value, local_tz) 
        local_dt = timezone.localtime(value)  
        return local_dt.isoformat()
    elif isinstance(value, dict):
        return {key: serialize_datetime(val) for key, val in value.items()}
    elif isinstance(value, list):
        return [serialize_datetime(item) for item in value]
    else:
        return value
    
    
def dynamic_field_to_json(data):
    if isinstance(data, str):
        try:
            return json.loads(data)
        except Exception:
            return data
    return data


def parse_custom_date(logger, date_str):
    try:
        if not date_str:
            return None
        if isinstance(date_str, datetime):
            return date_str
        return parser.parse(date_str)
    except Exception as e:
        if logger:
            logger.warning(f'Error parsing date: {e}')
        return None
    
    
def to_aware(dt):
    if isinstance(dt, str):
        dt = parse_custom_date(None, dt)
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return timezone.make_aware(dt, timezone.get_default_timezone())
    return dt


def create_notification(module, info_id, info, type, username):
    notification = Notification(
        module=module,
        info_id=str(info_id),
        info=info,
        type=type,
        created_time=timezone.now(),
        last_modified_time=timezone.now(),
    )
    
    notification.save()
    
    user = LoginUser.objects(username=username).first()
    
    username = user.username if user else 'System Job'
    
    all_users = LoginUser.objects(username__ne=username, is_active=True, is_verified=True).all()
    
    if notification:
        for user in all_users:
            user_notification = NotificationUser(
                notification=notification,
                username=username,
                user=user,
                created_time=timezone.now(),
                last_modified_time=timezone.now(),
            )
            user_notification.save()


def get_national_phone_number(raw_number: str) -> str:
    try:
        phone = phonenumbers.parse(raw_number, None)
        return str(phone.national_number)
    except NumberParseException as e:
        raise ValueError(f"Número inválido: {e}")
    
    
def calculate_reward_points(total_amount) -> int:
    all_settings = RewardPointsSettings.objects().order_by('-amount')
    points = 0
    for setting in all_settings:
        while total_amount >= setting.amount and total_amount >= 0:
            total_amount -= setting.amount
            points += setting.points
    return points


def assign_points_to_item(rate) -> int:
    lowest_setting = RewardPointsSettings.objects().order_by('amount').only('amount', 'points').first()
    points = 0
    if not lowest_setting:
        return 0
    if rate is None or rate <= 0:
        return 0
    if rate < lowest_setting.amount:
        return points + 1
    while rate >= lowest_setting.amount and rate >= 0:
        rate -= lowest_setting.amount
        points += lowest_setting.points
    if rate > 0:
        points += 1
    return points



class DateTimeJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            if timezone.is_naive(o):
                o = timezone.make_aware(o, dt_timezone.utc)
            return timezone.localtime(o).isoformat()
        return super().default(o)

def serializing_datetime(obj):
    return json.loads(json.dumps(obj, cls=DateTimeJSONEncoder))
