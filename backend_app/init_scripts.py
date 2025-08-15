# ./django/init_scripts.py
import os
import django
from mongoengine import connection as mongo_connection
from datetime import datetime
from api_authorization.models import LoginUser, UserRole
from api_reward_points.models import RewardPointsSettings, RewardStoreProduct, RewardJoyRide

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
    array_of_steps = [
            {
                "title": "Welcome to the Dashboard",
                "description": "This card shows your reward points, last login, and has a button to redeem rewards.",
                "component_id": "dashboard-overview",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Orders & Balances",
                "description": "Here you’ll see orders amount, opened balance, and other metrics.",
                "component_id": "orders-metrics",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Invoice History",
                "description": "Here you’ll see your invoice history and details.",
                "component_id": "invoice-history-chart",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Browse Rewards",
                "description": "Click here to browse and redeem available rewards in the store.",
                "component_id": "reward-store-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "My Sales Orders",
                "description": "See details of your sales orders and filter by status or salesperson.",
                "component_id": "my-sales-orders-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "My Rewards Orders",
                "description": "See your rewards orders made and its detailed info, such as CONFIRMATION CODE and PIN.",
                "component_id": "my-rewards-orders-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "Rewards Carrousel",
                "description": "You can see your available rewards in a carousel format, and clicking button Redeem now!, you can access the reward details, cart it, redeem it, rate it or write a review about this reward.",
                "component_id": "rewards-carrousel",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Reward Points History",
                "description": "Here you’ll see your reward points history list, what you earned and redeemed.",
                "component_id": "reward-points-history-list",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "My Cart",
                "description": "Here you’ll see your cart items and their details, just click on it.",
                "component_id": "my-cart",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
            {
                "title": "My Navigation Links",
                "description": "Here you’ll see your navigation links in all modules, just click on it.",
                "component_id": "my-navigation-links",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
            {
                "title": "My UI Settings",
                "description": "Here you’ll see your UI settings for the application, just click on it.",
                "component_id": "my-ui-settings",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
    ]
    for step in array_of_steps:
        joyride_step = RewardJoyRide.objects(component_id=step['component_id']).first()
        if not joyride_step:
            joyride_step = RewardJoyRide(
                title=step['title'],
                description=step['description'],
                component_id=step['component_id'],
                created_time=step['created_time'],
                last_modified_time=step['last_modified_time'],
                module=step['module']
            )
            joyride_step.save()
    print("Default reward joyrides created.")


if __name__ == "__main__":
    print("Running initialization script...")
    create_initials_user_role()
    create_superuser()
    create_reward_points_settings()
    create_reward_joyrides()
    # set_active_products()
    print("Initialization script executed successfully.")
