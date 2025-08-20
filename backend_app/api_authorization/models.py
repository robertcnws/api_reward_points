import mongoengine
from mongoengine import (
    Document, 
    StringField, 
    BooleanField, 
    DateTimeField, 
    DynamicField,
    ReferenceField,
    IntField,
)
from django.contrib.auth.hashers import (
    make_password, 
    check_password
)
from datetime import datetime, timezone

class UserRole(Document):
    name = StringField(max_length=50, unique=True, required=True)
    description = StringField(required=False)
    is_active = BooleanField(default=True, required=False)
    created_time = DateTimeField(default=lambda: datetime.now(timezone.utc), required=False)
    last_modified_time = DateTimeField(default=lambda: datetime.now(timezone.utc), required=False)

    meta = {
        'collection': 'user_role',
        'indexes': ['name'],
    }

    def __str__(self):
        return self.name
    
    
class LoginUser(Document):
    username = StringField(max_length=150, unique=True, required=True)
    first_name = StringField(max_length=30, required=False)
    last_name = StringField(max_length=30, required=False)
    company_name = StringField(max_length=100, required=False)
    email = StringField(max_length=254, required=False)
    is_staff = BooleanField(default=False, required=False)
    is_active = BooleanField(default=True, required=False)
    created_time = DateTimeField(default=mongoengine.fields.DateTimeField().default, required=False)
    last_modified_time = DateTimeField(default=mongoengine.fields.DateTimeField().default, required=False)
    phone_number = StringField(max_length=50, required=False)
    password = StringField(required=True)
    last_login = DateTimeField(default=mongoengine.fields.DateTimeField().default, required=False)
    date_joined = DateTimeField(default=mongoengine.fields.DateTimeField().default, required=False)
    token = StringField(max_length=255, required=False)
    user_role = ReferenceField(UserRole, required=False, reverse_delete_rule=2) 
    key_avatar = StringField(required=False)
    avatar_url = StringField(required=False)
    is_verified = BooleanField(default=False, required=False)
    is_approved = BooleanField(default=False, required=False)
    approved_time = DateTimeField(default=None, required=False, null=True, blank=True)
    disapproval_count = IntField(default=0, required=False)
    show_tour_guide_modal = BooleanField(default=True, required=False)
    took_tour_guide = BooleanField(default=False, required=False)
    country = StringField(max_length=100, required=False)
    address = StringField(required=False)
    zip_code = StringField(max_length=20, required=False)
    state = StringField(max_length=100, required=False)
    city = StringField(max_length=100, required=False)
    school = StringField(required=False)
    about = StringField(required=False)
    facebook_link = StringField(required=False)
    instagram_link = StringField(required=False)
    linkedin_link = StringField(required=False)
    twitter_link = StringField(required=False)

    meta = {
        'collection': 'login_users',
        'indexes': ['username', 'email', 'phone_number'],
    }

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.username
    

class LoginUserVerificationCode(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    code = StringField(required=True, max_length=6)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    expires_at = DateTimeField()

    def is_expired(self):
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return now > expires
    
    
class RevokedToken(Document):
    jti          = StringField(required=True, unique=True)
    revoked_at   = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'revoked_tokens',
        'indexes': ['jti']
    }
    

class ExternalUsers(Document):
    user = ReferenceField(LoginUser, required=True, reverse_delete_rule=2)  # CASCADE
    is_logged_in = BooleanField(default=False, required=False)
    last_login = DateTimeField(default=lambda: datetime.now(timezone.utc), required=False)
    created_time = DateTimeField(default=lambda: datetime.now(timezone.utc), required=False)
    last_modified_time = DateTimeField(default=lambda: datetime.now(timezone.utc), required=False)
    
    meta = {
        'collection': 'external_users',
        'indexes': ['user'],
    }
    
    def __str__(self):
        return f"ExternalUser({self.user.username})"
