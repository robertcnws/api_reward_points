# ./django/init_scripts.py
import os
import django
from mongoengine import connection as mongo_connection
from datetime import datetime
from api_authorization.models import LoginUser, UserRole
from api_reward_points.models import RewardPointsSettings, RewardStoreProduct, RewardJoyRide
from api_users.models import IntroStep
from steps_joyride import array_of_steps_joyride
from steps_intro import array_of_steps_intro

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
            approved_time=datetime.now(),
            disapproval_count=0,
        )
        superuser.set_password(password)
        superuser.save()
        print("Superuser created!")
        

def create_reward_points_settings():
    if not RewardPointsSettings.objects().first():
        print("Creating default reward points settings...")
        settings = RewardPointsSettings(
            amount=1.0,
            points=1,
            created_time=datetime.now(),
            last_modified_time=datetime.now()
        )
        settings.save()
        print("Default reward points settings created.")
    else:
        print("Reward points settings already exist.")
        
        
def set_active_products():
    products = RewardStoreProduct.objects.all()
    if products:
        print(f"Setting {len(products)} inactive products to active...")
        for product in products:
            product.is_active = True
            product.save()
        print("Inactive products set to active.")
    else:
        print("No inactive products found.")
        

def create_reward_joyrides():
    print("Creating default reward joyrides...")
    for step in array_of_steps_joyride:
        joyride_step = RewardJoyRide.objects(component_id=step['component_id']).first()
        if not joyride_step:
            joyride_step = RewardJoyRide(
                title=step['title'],
                description=step['description'],
                translation=step['translation'],
                component_id=step['component_id'],
                created_time=step['created_time'],
                last_modified_time=step['last_modified_time'],
                module=step['module'],
                related_image_name=step['related_image_name'],
                role=step['role']
            )
        elif not joyride_step.title:
            joyride_step.title = step['title']
        elif not joyride_step.description:
            joyride_step.description = step['description']
        elif not joyride_step.translation:
            joyride_step.translation = step['translation']
        elif not joyride_step.related_image_name:
            joyride_step.related_image_name = step['related_image_name']
        elif not joyride_step.module:
            joyride_step.module = step['module']
        elif not joyride_step.role:
            joyride_step.role = step['role']
        joyride_step.save()
    print("Default reward joyrides created/updated.")
    
    
def create_intro_steps():
    print("Creating default intro steps...")
    for step in array_of_steps_intro:
        intro_step = IntroStep.objects(title=step['title']).first()
        if not intro_step:
            intro_step = IntroStep(
                title=step['title'],
                content=step['content'],
                translation=step['translation'],
                order=step['order'],
                related_image_name=step['related_image_name'],
            )
        elif not intro_step.content:
            intro_step.content = step['content']
        elif not intro_step.translation:
            intro_step.translation = step['translation']
        elif not intro_step.order:
            intro_step.order = step['order']
        elif not intro_step.related_image_name:
            intro_step.related_image_name = step['related_image_name']
        intro_step.save()
        
        print("Default intro steps created/updated.")


if __name__ == "__main__":
    print("Running initialization script...")
    create_initials_user_role()
    create_superuser()
    create_reward_points_settings()
    create_reward_joyrides()
    create_intro_steps()
    # set_active_products()
    print("Initialization script executed successfully.")
