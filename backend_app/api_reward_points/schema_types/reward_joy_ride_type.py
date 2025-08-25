import graphene
from graphene_mongo import MongoengineObjectType
from mongoengine.fields import DynamicField
from graphene_mongo.converter import convert_mongoengine_field
from graphene.types.generic import GenericScalar
from api_reward_points.models import (
    RewardJoyRide,
)
from utils.json_datetime import datetime_to_timezone
from utils.data_util import dynamic_field_to_json

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )
    
class RewardJoyRideType(MongoengineObjectType):
    created_time = graphene.String()
    last_modified_time = graphene.String()
    translation = GenericScalar()

    class Meta:
        model = RewardJoyRide
    
    def resolve_created_time(self, info):
        return datetime_to_timezone(self.created_time) if self.created_time else None
    
    def resolve_last_modified_time(self, info):
        return datetime_to_timezone(self.last_modified_time) if self.last_modified_time else None

    def resolve_translation(self, info):
        translation = self.translation or {}
        return dynamic_field_to_json(translation)
