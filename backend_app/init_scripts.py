# ./django/init_scripts.py
import os
import django
from mongoengine import connection as mongo_connection
from datetime import datetime
from api_authorization.models import LoginUser, UserRole
from api_reward_points.models import RewardPointsSettings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_reward_points.settings')
django.setup()

# connect_mongo()

db = mongo_connection.get_db()

def create_initials_user_role():
    role_names = os.getenv('DJANGO_INITIAL_USER_ROLES', 'superadmin,client').split(',')
    for role_name in role_names:
        if not UserRole.objects(name=role_name).first():
            print(f"Creating user role: {role_name}")
            user_role = UserRole(
                name=role_name.strip(),
                created_time=datetime.now(),
                last_modified_time=datetime.now()
            )
            user_role.save()
            print(f"User role '{role_name}' created successfully.")
        else:
            print(f"User role '{role_name}' already exists.")
        

def create_superuser():
    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
    user_role_name = os.getenv('DJANGO_SUPERUSER_ROLE', 'superadmin')

    if not LoginUser.objects(username=username).first():
        print("Creating superuser...")
        user_role = UserRole.objects(name=user_role_name).first()
        if not user_role:
            create_initials_user_role()
            user_role = UserRole.objects(name=user_role_name).first()
        superuser = LoginUser(
            username=username,
            email=email,
            is_staff=True,
            is_active=True,
            date_joined=datetime.now(),
            created_time=datetime.now(),
            last_modified_time=datetime.now(),
            user_role=user_role,
            first_name='Admin',
            last_name='NWS Reward Points',
            is_verified=True,
            is_approved=True,
        )
        superuser.set_password(password)
        superuser.save()
        print("Superuser created!")
        

def create_reward_points_settings():
    if not RewardPointsSettings.objects().first():
        print("Creating default reward points settings...")
        settings = RewardPointsSettings(
            amount=100.0,
            points=1,
            created_time=datetime.now(),
            last_modified_time=datetime.now()
        )
        settings.save()
        settings = RewardPointsSettings(
            amount=1000.0,
            points=11,
            created_time=datetime.now(),
            last_modified_time=datetime.now()
        )
        settings.save()
        print("Default reward points settings created.")
    else:
        print("Reward points settings already exist.")


if __name__ == "__main__":
    print("Running initialization script...")
    create_initials_user_role()
    create_superuser()
    create_reward_points_settings()
    print("Initialization script executed successfully.")
