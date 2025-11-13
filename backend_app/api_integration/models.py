from django.utils import timezone
from api_authorization.models import LoginUser
from mongoengine import (
    Document, 
    DynamicField, 
    StringField, 
    DateTimeField, 
    ListField, 
    ReferenceField,
    IntField,
    FloatField,
    BooleanField,
)

# Create your models here.
class RewardItem(Document):
    item = DynamicField(required=True)
    item_attachments = ListField(DynamicField(), null=True, blank=True, default=list)
    assigned_points = IntField(default=0, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    can_be_bought = BooleanField(default=True, null=True)
    
    meta = {
        'collection': 'reward_item',
        'indexes': [
            'created_time',
            'last_modified_time',
        ],
        'ordering': ['-created_time'],
    }
    
    def __str__(self):
        return f"RewardItem(item={self.item}, created_time={self.created_time})"
    

class RewardFullItem(Document):
    group_id = StringField(null=True, blank=True)
    group_name = StringField(null=True, blank=True)
    item_id = StringField(required=True)
    name = StringField(required=True)
    status = StringField(null=True, blank=True)
    source = StringField(null=True, blank=True)
    is_linked_with_zohocrm = BooleanField(default=False, null=True)
    item_type = StringField(null=True, blank=True)
    description = StringField(null=True, blank=True)
    
    rate = FloatField(default=0.0, null=True)
    is_taxable = BooleanField(default=False, null=True)
    tax_id = StringField(null=True, blank=True)
    tax_name = StringField(null=True, blank=True)
    tax_percentage = FloatField(default=0.0, null=True)
    purchase_description = StringField(null=True, blank=True)
    purchase_rate = FloatField(default=0.0, null=True)
    
    is_combo_product = BooleanField(default=False, null=True)
    product_type = StringField(null=True, blank=True)
    attribute_id1 = StringField(null=True, blank=True)
    attribute_name1 = StringField(null=True, blank=True)
    
    reorder_level = IntField(default=0, null=True)
    stock_on_hand = IntField(default=0, null=True)
    available_stock = IntField(default=0, null=True)
    actual_available_stock = IntField(default=0, null=True)
    
    sku = StringField(null=True, blank=True)
    upc = StringField(null=True, blank=True)
    ean = StringField(null=True, blank=True)
    isbn = StringField(null=True, blank=True)
    part_number = StringField(null=True, blank=True)
    
    attribute_option_id1 = IntField(default=0, null=True)
    attribute_option_name1 = StringField(null=True, blank=True)
    
    image_type = StringField(null=True, blank=True)
    image_name = StringField(null=True, blank=True)
    dealerportal_image = StringField(null=True, blank=True)
    
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    hsn_or_sac = IntField(default=0, null=True)
    sat_item_key_code = StringField(null=True, blank=True)
    unitkey_code = StringField(null=True, blank=True)
    
    synced_with_senitron = BooleanField(default=False, null=True)
    ignore_errors = BooleanField(default=False, null=True)
    zoho_org_id = StringField(null=True, blank=True)
    
    meta = {
        "collection": "reward_full_item",
        "indexes": [
            {"fields": ["zoho_org_id", "item_id"], "unique": True, "sparse": True},
            "sku",
            "name",
            "group_id",
            "status",
            "ignore_errors",
            "synced_with_senitron",
        ],
    }
    
    
class RewardFullItemgroup(Document):
    group_id = StringField(null=True, blank=True)
    group_name = StringField(null=True, blank=True)
    product_type = StringField(null=True, blank=True)
    brand = StringField(null=True, blank=True)
    manufacturer = StringField(null=True, blank=True)
    unit = StringField(null=True, blank=True)
    description = StringField(null=True, blank=True)
    is_taxable = BooleanField(default=False, null=True)
    tax_id = StringField(null=True, blank=True)
    tax_name = StringField(null=True, blank=True)
    tax_percentage = FloatField(default=0.0, null=True)
    tax_type = StringField(null=True, blank=True)
    tax_exemption_id = StringField(null=True, blank=True)
    attribute_id1 = StringField(null=True, blank=True)
    attribute_name1 = StringField(null=True, blank=True)
    status = StringField(null=True, blank=True)
    source = StringField(null=True, blank=True)
    image_id = StringField(null=True, blank=True)
    image_name = StringField(null=True, blank=True)
    image_type = StringField(null=True, blank=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    zoho_org_id = StringField(null=True, blank=True)
    
    meta = {
        "collection": "reward_full_itemgroup",
        "indexes": [
            {"fields": ["zoho_org_id", "group_id"], "unique": True, "sparse": True},
            "group_name",
            "status",
        ],
    }