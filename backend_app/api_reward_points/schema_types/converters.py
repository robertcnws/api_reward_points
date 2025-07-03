import graphene
from graphene_mongo.converter import convert_mongoengine_field
from mongoengine.fields import DynamicField

@convert_mongoengine_field.register(DynamicField)
def convert_dynamic_field(field, registry=None, executor=None):
    return graphene.JSONString(
        description=getattr(field, 'help_text', ''),
        required=field.required
    )