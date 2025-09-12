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
    PULL,
)

# Create your models here.
class Tracking(Document):
    user_reporter = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    object_id = StringField(required=True, null=True, blank=True)  # Optional field for object ID
    object_type = StringField(required=True, null=True, blank=True)  # Optional field
    object_name = StringField(required=True, null=True, blank=True)  # Optional field for object name
    action = StringField(required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    managed_data = DynamicField(null=True)
    
    meta = {
        'collection': 'tracking',
        'indexes': [
            'user_reporter', 'action', 'created_time', 'object_id', 'object_type', 'object_name'
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


class RewardSalesOrder(Document):
    salesorder_id = StringField(required=True, unique=True)
    salesorder_number = StringField(required=True, unique=True)
    date = DateTimeField(default=timezone.now, null=True)
    status = StringField(null=True, blank=True)
    total_quantity = IntField(required=True, default=0)
    sub_total = FloatField(required=True, default=0.0)
    tax_total = FloatField(required=True, default=0.0)
    total = FloatField(required=True, default=0.0)
    line_items = ListField(ReferenceField(RewardInvoiceLineItem, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    customer_id = StringField(null=True, blank=True)
    customer_name = StringField(null=True, blank=True)
    salesperson_id = StringField(null=True, blank=True)
    salesperson_name = StringField(null=True, blank=True)
    created_by_email = StringField(null=True, blank=True)
    created_by_name = StringField(null=True, blank=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE

    meta = {
        'collection': 'reward_sales_orders',
        'indexes': [
            'salesorder_id', 'salesorder_number', 'date'
        ],
        'verbose_name': 'Reward Sales Order',
        'verbose_name_plural': 'Reward Sales Orders'
    }
    

class RewardInvoice(Document):
    invoice_id = StringField(required=True, unique=True)
    invoice_number = StringField(required=True, unique=True)
    status = StringField(null=True, blank=True)
    date = DateTimeField(default=timezone.now, null=True)
    sub_total = FloatField(required=True, default=0.0)
    payment_made = FloatField(required=True, default=0.0)
    tax_total = FloatField(required=True, default=0.0)
    balance = FloatField(required=True, default=0.0)
    line_items = ListField(ReferenceField(RewardInvoiceLineItem, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    taxes = ListField(ReferenceField(RewardInvoiceTax, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    salesorder = ReferenceField(RewardSalesOrder, null=True, blank=True, reverse_delete_rule=2)  # CASCADE
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE

    meta = {
        'collection': 'reward_invoices',
        'indexes': [
            'invoice_id', 'invoice_number', 'date', 'salesorder'
        ],
        'verbose_name': 'Reward Invoice',
        'verbose_name_plural': 'Reward Invoices'
    }
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username} - {self.status}"
    
class RewardPoints(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2, unique=True)  # CASCADE
    total_gained_points = IntField(default=0)
    total_spent_points = IntField(default=0)
    total_assigned_points = IntField(default=0)
    total_substracted_points = IntField(default=0)
    total_refunded_points = IntField(default=0)
    total_amount_invoices = FloatField(default=0.0)
    total_paid_amount_invoices = FloatField(default=0.0)
    total_opened_balance_invoices = FloatField(default=0.0)
    total_tax_amount_invoices = FloatField(default=0.0)
    qty_pending_orders = IntField(default=0)
    invoices = ListField(ReferenceField(RewardInvoice, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    sales_orders = ListField(ReferenceField(RewardSalesOrder, reverse_delete_rule=2), null=True, blank=True, default=list)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)

    meta = {
        'collection': 'reward_points',
        'indexes': [
            'user', 
            'total_gained_points', 
            'total_spent_points', 
            'total_assigned_points', 
            'total_substracted_points', 
            'total_refunded_points', 
            'total_amount_invoices'
        ],
        'verbose_name': 'Reward Points',
        'verbose_name_plural': 'Reward Points'
    }
    
    def __str__(self):
        return f"Reward Points for {self.user.username} - Total Earned: {self.total_gained_points}, Total Spent: {self.total_spent_points}"
    
class RewardPointsHistory(Document):
    created_time = DateTimeField(default=timezone.now, null=True)
    reward_points = ReferenceField(RewardPoints, required=True, reverse_delete_rule=2)  # CASCADE
    action = StringField(
        default='gained', choices=['gained', 'spent', 'refunded', 'assigned', 'substracted'], 
        required=True
    )
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
        return f"{self.action.capitalize()} - {self.gained_points} points earned, {self.spent_points} points spent on {self.created_time.strftime('%Y-%m-%d %H:%M:%S')}"
    
    
class RewardPointsSettings(Document):
    amount = FloatField(default=0.0)
    points = IntField(default=0)
    description = StringField(null=True, blank=True)
    is_active = BooleanField(default=True)
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
    

class RewardAttachment(Document):
    name = StringField(max_length=255, required=True)
    description = StringField(max_length=255, null=True)
    file = StringField(max_length=255, null=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    user_upload = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'reward_attachment',
        'indexes': [
            'name', 'file', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Reward Attachment',
        'verbose_name_plural': 'Reward Attachments'
    }

    def __str__(self):
        return self.name
    
    
class RewardStoreProduct(Document):
    name = StringField(required=True)
    description = StringField(null=True, blank=True)
    assigned_points = IntField(required=True, default=0)
    attachments = ListField(ReferenceField(RewardAttachment, reverse_delete_rule=PULL), null=True, blank=True, default=list)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    is_active = BooleanField(default=True)

    meta = {
        'collection': 'reward_store_products',
        'indexes': [
            'name', 'assigned_points', 'created_time', 'last_modified_time', 'is_active'
        ],
        'verbose_name': 'Reward Store Product',
        'verbose_name_plural': 'Reward Store Products'
    }
    
    def __str__(self):
        return f"{self.name} - {self.assigned_points} points required"
    
    
class RewardStoreProductUser(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    product = ReferenceField(RewardStoreProduct, required=True, reverse_delete_rule=2)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    status = StringField(default='pending', choices=['pending', 'approved', 'rejected'], required=True)
    used = BooleanField(default=False)

    meta = {
        'collection': 'reward_store_product_users',
        'indexes': [
            'user', 'product'
        ],
        'verbose_name': 'Reward Store Product User',
        'verbose_name_plural': 'Reward Store Product Users'
    }
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
    
    
class RewardStoreProductUserHistory(Document):
    user_product = ReferenceField(RewardStoreProductUser, required=True, reverse_delete_rule=2)  # CASCADE
    action = StringField(default='created', choices=['created', 'approved', 'used'], required=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)

    meta = {
        'collection': 'reward_store_product_user_history',
        'indexes': [
            'user_product', 'action'
        ],
        'verbose_name': 'Reward Store Product User History',
        'verbose_name_plural': 'Reward Store Product User Histories'
    }
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} - {self.status}"
    
    
class RewardStoreProductReview(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=PULL)  # CASCADE
    store_product = ReferenceField(RewardStoreProduct, required=True, reverse_delete_rule=PULL)  # CASCADE
    rating = IntField(required=True, default=0)
    comment = StringField(null=True, blank=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)

    meta = {
        'collection': 'reward_store_product_review',
        'indexes': [
            'user', 'store_product', 'rating'
        ],
        'verbose_name': 'Reward Store Product Review',
        'verbose_name_plural': 'Reward Store Product Reviews'
    }
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} - {self.rating} stars"
    
    
class RewardStoreProductReviewReaction(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=PULL)  # CASCADE
    store_product_review = ReferenceField(RewardStoreProductReview, required=True, reverse_delete_rule=PULL)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    reaction_type = StringField(
        required=True,
        choices=['like', 'dislike', 'love', 'angry', 'sad', 'funny', 'care'],
        default='like'
    )

    meta = {
        'collection': 'reward_store_product_review_reaction',
        'indexes': [
            'user', 'store_product_review'
        ],
        'verbose_name': 'Reward Store Product Review Reaction',
        'verbose_name_plural': 'Reward Store Product Review Reactions'
    }

    def __str__(self):
        return f"{self.user.username} - {self.store_product_review.store_product.name} - {self.reaction_type}"
    

class RewardStoreProductSelection(Document):
    store_product = ReferenceField(RewardStoreProduct, required=True, reverse_delete_rule=PULL)  # CASCADE
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=PULL)  # CASCADE
    quantity = IntField(default=1)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    
    meta = {
        'collection': 'reward_store_product_selection',
        'indexes': [
            'store_product', 'user'
        ],
        'verbose_name': 'Reward Store Product Selection',
        'verbose_name_plural': 'Reward Store Product Selections'
    }

    def __str__(self):
        return f"{self.user.username} - {self.store_product.name} - {self.quantity}"    
    
    
class RewardStoreProductSelectionCart(Document):
    store_product_selection = ReferenceField(RewardStoreProductSelection, required=True, reverse_delete_rule=PULL)  # CASCADE
    is_bought = BooleanField(default=False)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)

    meta = {
        'collection': 'reward_store_product_selection_cart',
        'indexes': [
            'store_product_selection', 'is_bought'
        ],
        'verbose_name': 'Reward Store Product Selection Cart',
        'verbose_name_plural': 'Reward Store Product Selection Carts'
    }

    def __str__(self):
        return f"{self.store_product_selection.user.username} - {self.store_product_selection.store_product.name} - {self.is_bought}"
    
    @property
    def username(self):
        return self.store_product_selection.user.username
    
class RewardStoreProductSelectionBuy(Document):
    store_product_selection = ReferenceField(RewardStoreProductSelection, required=True, reverse_delete_rule=PULL)  # CASCADE
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    expiration_time = DateTimeField(null=True, blank=True)
    has_been_used = BooleanField(default=False)
    has_requested_refund = BooleanField(default=False)
    quantity_used = IntField(default=0)
    order_number = IntField(default=0)
    confirmation_number = StringField(null=True, blank=True)
    pin_number = StringField(null=True, blank=True)
    notes = StringField(null=True, blank=True)
    redeemed_time = DateTimeField(null=True, blank=True)
    is_removed = BooleanField(default=False)
    purchase_type = StringField(
        default='gained_points', 
        choices=[
            'gained_points', 
            'assigned_points', 
            'mixed_points',
        ], 
        required=False,
        null=True,
    )
    purchase_fraction = ListField(
        FloatField(),
        default=list,
        null=True,
    )
    salesorder_person = ReferenceField(LoginUser, null=True, blank=True, reverse_delete_rule=PULL)  # CASCADE

    meta = {
        'collection': 'reward_store_product_selection_buy',
        'indexes': [
            'store_product_selection', 
            'created_time', 
            'has_been_used', 
            'has_requested_refund',
            'order_number', 
            'confirmation_number',
            'pin_number',
        ],
        'verbose_name': 'Reward Store Product Selection Buy',
        'verbose_name_plural': 'Reward Store Product Selection Buys'
    }
    
    def __str__(self):
        return f"{self.store_product_selection.user.username} - {self.store_product_selection.store_product.name} - {self.created_time.strftime('%Y-%m-%d %H:%M:%S')}"
    
    
class RewardJoyRide(Document):
    title = StringField(null=True, blank=True)
    description = StringField(null=True, blank=True)
    translation = DynamicField(null=True, blank=True)
    component_id = StringField(null=True, blank=True)
    created_time = DateTimeField(default=timezone.now, null=True)
    last_modified_time = DateTimeField(default=timezone.now, null=True)
    module = StringField(null=True, blank=True)
    related_image_name = StringField(null=True, blank=True)
    role = StringField(null=True, blank=True)

    meta = {
        'collection': 'reward_joy_ride',
        'indexes': [
            'title', 'created_time', 'last_modified_time', 'component_id', 'module'
        ],
        'verbose_name': 'Reward Joy Ride',
        'verbose_name_plural': 'Reward Joy Rides'
    }

    def __str__(self):
        return f"{self.title} - {self.created_time.strftime('%Y-%m-%d')} - {self.points_earned} points"