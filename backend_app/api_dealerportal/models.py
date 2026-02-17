from decimal import Decimal
from mongoengine import (
    Document, StringField, ReferenceField, IntField, DecimalField,
    DateTimeField, CASCADE, NULLIFY, queryset_manager
)
from mongoengine.fields import ObjectIdField
from datetime import datetime
from django.utils import timezone  # si estás dentro de Django; si no, usa datetime.utcnow()

# === Importa tus Documents reales ===
from api_authorization.models import LoginUser
from api_integration.models import RewardFullItem


class GlobalCounter(Document):
    key = StringField(required=True, unique=True)   # ej: "dealerportal_quote_number"
    seq = IntField(default=0)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        "collection": "global_counters",
        "indexes": [{"fields": ["key"], "unique": True}],
    }
    

def next_global_sequence(key: str) -> int:
    doc = GlobalCounter.objects(key=key).modify(
        upsert=True,
        new=True,
        inc__seq=1,
        set__updated_at=timezone.now
    )
    return doc.seq


class DealerportalQuote(Document):
    name = StringField(max_length=255, required=True)
    owner = ReferenceField(LoginUser, required=True, reverse_delete_rule=CASCADE)
    created_by = ReferenceField(LoginUser, null=True, reverse_delete_rule=NULLIFY)

    markup = IntField(default=0)
    notes = StringField(null=True)

    total_sell = DecimalField(precision=2, default=Decimal("0.00"), null=True)
    total_cost = DecimalField(precision=2, default=Decimal("0.00"), null=True)
    markup_total = DecimalField(precision=2, default=Decimal("0.00"), null=True)
    
    number = IntField(default=0, null=True)  # número secuencial por owner, se asigna al guardar

    status = StringField(
        default="active",
        choices=("active", "inactive", "ordered"),
        max_length=255,
    )

    created_at = DateTimeField(default=timezone.now)  # o datetime.utcnow
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        "collection": "dealerportal_quotes",
        "indexes": [
            "-updated_at",
            "-created_at",
            "owner",
            "created_by",
            "status",
        ],
        "ordering": ["-updated_at", "-created_at"],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        if not self.id and (not self.number or self.number == 0):
            self.number = next_global_sequence("dealerportal_quote_number")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.owner}"

    def get_products(self):
        """
        Devuelve los QuoteProduct asociados (ordenado por created_at o _id).
        """
        return DealerportalQuoteProduct.objects(quote=self).order_by("created_at")

    def is_empty(self):
        return DealerportalQuoteProduct.objects(quote=self).count() == 0

    def is_product_in_stock(self):
        """
        Replica tu lógica usando QuoteProduct (en Mongo no hay quoteproduct_set).
        """
        in_stock = {}
        for qp in DealerportalQuoteProduct.objects(quote=self).select_related():
            product_name = getattr(qp.product, "name", str(qp.product.id))
            product_stock = getattr(qp.product, "stock", 0) or 0
            required_quantity = qp.quantity or 0

            if product_stock > 0:
                if required_quantity > product_stock:
                    in_stock[product_name] = "Insufficient stock for quote"
                else:
                    in_stock[product_name] = "In stock"
            else:
                in_stock[product_name] = "Out of stock"

        return in_stock

    def calculate_price(self):
        total_cost = Decimal("0.00")

        for qp in DealerportalQuoteProduct.objects(quote=self):
            total_cost += Decimal(str(qp.total_price))

        markup_total = total_cost * (Decimal(self.markup or 0) / Decimal("100"))
        total_sell = total_cost + markup_total

        # Solo guarda si cambió
        if (self.total_sell or Decimal("0.00")) != total_sell:
            self.total_cost = total_cost
            self.markup_total = markup_total
            self.total_sell = total_sell
            self.save()

        return self.total_sell

    def replace_product(self, quote_product_id, replacement_sku):
        """
        quote_product_id en MongoEngine es ObjectId normalmente (string/obj).
        """
        qp = DealerportalQuoteProduct.objects(id=quote_product_id, quote=self).first()
        if not qp:
            return False

        replacement_product = RewardFullItem.objects(sku=replacement_sku).first()
        if not replacement_product:
            return False

        qp.product = replacement_product
        qp.save()
        return True
    
    def get_last_number(self):
        last_quote = DealerportalQuote.objects(owner=self.owner).order_by("-number").first()
        return last_quote.number if last_quote else 0
    
    def clone_quote_with_products(self):
        # 1️⃣ Clonar quote
        quote_data = self.to_mongo().to_dict()
        quote_data.pop('_id', None)
        quote_data['number'] = next_global_sequence("dealerportal_quote_number")
        quote_data['name'] = f"{self.name} (Cloned)"

        new_quote = DealerportalQuote(**quote_data)
        new_quote.save()

        # 2️⃣ Clonar productos asociados
        products = DealerportalQuoteProduct.objects(quote=self)

        for qp in products:
            qp_data = qp.to_mongo().to_dict()
            qp_data.pop('_id', None)
            qp_data['quote'] = new_quote

            DealerportalQuoteProduct(**qp_data).save()

        # 3️⃣ recalcular precios
        new_quote.calculate_price()

        return new_quote


class DealerportalQuoteProduct(Document):
    quote = ReferenceField(DealerportalQuote, required=True, reverse_delete_rule=CASCADE)
    product = ReferenceField(RewardFullItem, required=True, reverse_delete_rule=CASCADE)
    quantity = IntField(default=1, min_value=0)

    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        "collection": "dealerportal_quote_products",
        "indexes": [
            "quote",
            "product",
            ("quote", "product"),
        ],
    }

    def __str__(self):
        return f"{self.quote} - {self.product}"

    @property
    def total_price(self):
        price = getattr(self.product, "rate", Decimal("0.00")) or Decimal("0.00")
        return Decimal(str(price)) * Decimal(self.quantity or 0)

    @property
    def product_line_price_with_markup(self):
        price = getattr(self.product, "rate", Decimal("0.00")) or Decimal("0.00")
        markup = Decimal(self.quote.markup or 0) / Decimal("100")
        return (Decimal(str(price)) + Decimal(str(price)) * markup).quantize(Decimal("0.01"))

    @property
    def total_price_with_markup(self):
        markup = Decimal(self.quote.markup or 0) / Decimal("100")
        total = Decimal(str(self.total_price))
        return (total + total * markup).quantize(Decimal("0.01"))


class DealerportalOrder(Document):
    number = IntField(default=0, unique=True, null=True)  
    
    quote = ReferenceField(DealerportalQuote, required=True, unique=True, reverse_delete_rule=CASCADE)
    owner = ReferenceField(LoginUser, required=True, reverse_delete_rule=CASCADE)
    created_by = ReferenceField(LoginUser, null=True, reverse_delete_rule=NULLIFY)

    status = StringField(
        default="pending",
        choices=("pending", "accepted", "paid", "ready to pickup", "cancelled", "completed"),
        max_length=255,
    )

    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        "collection": "dealerportal_orders",
        "indexes": [
            {"fields": ["number"], "unique": True, "sparse": True},
            "quote",
            "owner",
            "created_by",
            "-created_at",
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        if not self.id and (not self.number or self.number == 0):
            self.number = next_global_sequence("dealerportal_order_number")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.status}"