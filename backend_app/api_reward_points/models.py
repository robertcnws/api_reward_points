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
)

# Create your models here.
class Tracking(Document):
    user_reporter = DynamicField(required=True)
    action = StringField(required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    managed_data = DynamicField(null=True)
    
    meta = {
        'collection': 'tracking',
        'indexes': [
            'user_reporter', 'action', 'created_time'
        ],
        'verbose_name': 'Tracking',
        'verbose_name_plural': 'Trackings'
    }
    
    def __str__(self):
        return self.action
    

class RewardInvoiceTax(Document):
    tax_name = StringField(required=True)
    tax_amount = FloatField(required=True, default=0.0)
    
    meta = {
        'collection': 'reward_invoice_tax',
        'indexes': [
            'tax_name'
        ],
        'verbose_name': 'Reward Invoice Tax',
        'verbose_name_plural': 'Reward Invoice Taxes'
    }
    
    def __str__(self):
        return f"{self.tax_name} - {self.tax_amount}"
    

class RewardInvoiceLineItem(Document):
    line_item_id = StringField(required=True)
    item_id = StringField(required=True)
    sku = StringField(null=True, blank=True)
    name = StringField(required=True)
    description = StringField(null=True, blank=True)
    rate = FloatField(required=True, default=0.0)
    quantity = IntField(required=True, default=1)
    item_total = FloatField(required=True, default=0.0)
    
    meta = {
        'collection': 'reward_invoice_line_item',
        'indexes': [
            'line_item_id', 'item_id', 'sku', 'name'
        ],
        'verbose_name': 'Reward Invoice Line Item',
        'verbose_name_plural': 'Reward Invoice Line Items'
    }


class RewardInvoice(Document):
    invoice_id = StringField(required=True, unique=True)
    invoice_number = StringField(required=True, unique=True)
    date = DateTimeField(default=timezone.now, null=True)
    sub_total = FloatField(required=True, default=0.0)
    payment_made = FloatField(required=True, default=0.0)
    line_items = ListField(ReferenceField(RewardInvoiceLineItem, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    taxes = ListField(ReferenceField(RewardInvoiceTax, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE

    meta = {
        'collection': 'reward_invoices',
        'indexes': [
            'invoice_id', 'invoice_number', 'date'
        ],
        'verbose_name': 'Reward Invoice',
        'verbose_name_plural': 'Reward Invoices'
    }
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username} - {self.status}"
    
class RewardPoints(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    total_gained_points = IntField(default=0)
    total_spent_points = IntField(default=0)
    total_amount_invoices = FloatField(default=0.0)
    invoices = ListField(ReferenceField(RewardInvoice, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)

    meta = {
        'collection': 'reward_points',
        'indexes': [
            'user', 'total_gained_points', 'total_spent_points', 'total_amount_invoices'
        ],
        'verbose_name': 'Reward Points',
        'verbose_name_plural': 'Reward Points'
    }
    
    def __str__(self):
        return f"Reward Points for {self.user.username} - Total Gained: {self.total_gained_points}, Total Spent: {self.total_spent_points}"
    
class RewardPointsHistory(Document):
    created_time = DateTimeField(default=timezone.now, null=True)
    reward_points = ReferenceField(RewardPoints, required=True, reverse_delete_rule=2)  # CASCADE
    action = StringField(required=True)  # e.g., 'gained', 'spent
    gained_points = IntField(default=0)
    spent_points = IntField(default=0)
    info = DynamicField(null=True, blank=True)
    description = StringField(null=True, blank=True)
    
    meta = {
        'collection': 'reward_points_history',
        'indexes': [
            'created_time', 'reward_points', 'action', 'gained_points', 'spent_points'
        ],
        'verbose_name': 'Reward Points History',
        'verbose_name_plural': 'Reward Points History'
    }
    
    def __str__(self):
        return f"{self.action.capitalize()} - {self.gained_points} points gained, {self.spent_points} points spent on {self.created_time.strftime('%Y-%m-%d %H:%M:%S')}"
    
    
class RewardPointsSettings(Document):
    amount = FloatField(default=0.0)
    points = IntField(default=0)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'reward_points_settings',
        'indexes': [
            'amount', 'points', 'created_time', 'last_modified_time'
        ],
        'verbose_name': 'Reward Points Settings',
        'verbose_name_plural': 'Reward Points Settings'
    }
    
    def __str__(self):
        return f"Reward Points Settings - Amount: {self.amount}, Points: {self.points}, Created: {self.created_time.strftime('%Y-%m-%d %H:%M:%S')}"
    