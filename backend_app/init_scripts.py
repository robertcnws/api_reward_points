# ./django/init_scripts.py
import os
import django
from mongoengine import connection as mongo_connection
from datetime import datetime
from api_authorization.models import LoginUser, UserRole
from api_reward_points.models import RewardPointsSettings, RewardStoreProduct, RewardJoyRide
from api_users.models import IntroStep

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
    array_of_steps = [
            {
                "title": "Welcome to the Dashboard",
                "description": "This card shows your reward points, last login, and has a button to redeem rewards.",
                "translation": {
                    "es": {
                        "title": "Bienvenido al Panel",
                        "content": "Esta tarjeta muestra tus puntos de recompensa, el último inicio de sesión y tiene un botón para canjear recompensas."
                    }
                },
                "component_id": "dashboard-overview",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Orders & Balances",
                "description": "Here you’ll see orders amount, opened balance, and other metrics.",
                "translation": {
                    "es": {
                        "title": "Órdenes y Saldos",
                        "content": "Aquí verás la cantidad de órdenes, el saldo abierto y otras métricas."
                    }
                },
                "component_id": "orders-metrics",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Invoice History",
                "description": "Here you’ll see your invoice history and details.",
                "translation": {
                    "es": {
                        "title": "Historial de Facturas",
                        "content": "Aquí verás el historial de tus facturas y detalles."
                    }
                },
                "component_id": "invoice-history-chart",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Browse Rewards",
                "description": "Click here to browse and redeem available rewards in the store.",
                "translation": {
                    "es": {
                        "title": "Explorar Recompensas",
                        "content": "Haz clic aquí para explorar y canjear recompensas disponibles en la tienda."
                    }
                },
                "component_id": "reward-store-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "My Sales Orders",
                "description": "See details of your sales orders and filter by status or salesperson.",
                "translation": {
                    "es": {
                        "title": "Mis Órdenes de Venta",
                        "content": "Ve los detalles de tus órdenes de venta y filtra por estado o vendedor."
                    }
                },
                "component_id": "my-sales-orders-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "My Rewards Orders",
                "description": "See your rewards orders made and its detailed info, such as CONFIRMATION CODE and PIN.",
                "translation": {
                    "es": {
                        "title": "Mis Órdenes de Recompensas",
                        "content": "Ve tus órdenes de recompensas realizadas y su información detallada, como el CÓDIGO DE CONFIRMACIÓN y el PIN."
                    }
                },
                "component_id": "my-rewards-orders-link",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_vertical"
            },
            {
                "title": "Rewards Carrousel",
                "description": "You can see your available rewards in a carousel format, and clicking button Redeem now!, you can access the reward details, cart it, redeem it, rate it or write a review about this reward.",
                "translation": {
                    "es": {
                        "title": "Carrusel de Recompensas",
                        "content": "Puedes ver tus recompensas disponibles en un formato de carrusel, y al hacer clic en el botón ¡Canjear ahora!, puedes acceder a los detalles de la recompensa, agregarla al carrito, canjearla, calificarla o escribir una reseña sobre esta recompensa."
                    }
                },
                "component_id": "rewards-carrousel",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "Reward Points History",
                "description": "Here you’ll see your reward points history list, what you earned and redeemed.",
                "translation": {
                    "es": {
                        "title": "Historial de Puntos de Recompensa",
                        "content": "Aquí verás tu historial de puntos de recompensa, lo que has ganado y canjeado."
                    }
                },
                "component_id": "reward-points-history-list",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
            {
                "title": "My Cart",
                "description": "Here you’ll see your cart items and their details, just click on it.",
                "translation": {
                    "es": {
                        "title": "Mi Carrito",
                        "content": "Aquí verás los artículos de tu carrito y sus detalles, solo haz clic en ellos."
                    }
                },
                "component_id": "my-cart",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
            {
                "title": "My Navigation Links",
                "description": "Here you’ll see your navigation links in all modules, just click on it.",
                "translation": {
                    "es": {
                        "title": "Mis Enlaces de Navegación",
                        "content": "Aquí verás tus enlaces de navegación en todos los módulos, solo haz clic en ellos."
                    }
                },
                "component_id": "my-navigation-links",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
            {
                "title": "My UI Settings",
                "description": "Here you’ll see your UI settings for the application, just click on it.",
                "translation": {
                    "es": {
                        "title": "Mis Configuraciones de UI",
                        "content": "Aquí verás tus configuraciones de UI para la aplicación, solo haz clic en ellas."
                    }
                },
                "component_id": "my-ui-settings",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "nav_top"
            },
            {
                "title": "Chat with operator(s)",
                "description": "This card allows you to chat with our support operators.",
                "translation": {
                    "es": {
                        "title": "Chat con operador(es)",
                        "content": "Esta tarjeta te permite chatear con nuestros operadores de soporte."
                    }
                },
                "component_id": "chat-with-operators",
                "created_time": datetime.now(),
                "last_modified_time": datetime.now(),
                "module": "dashboard"
            },
    ]
    for step in array_of_steps:
        joyride_step = RewardJoyRide.objects(component_id=step['component_id']).first()
        if not joyride_step:
            joyride_step = RewardJoyRide(
                title=step['title'],
                description=step['description'],
                translation=step['translation'],
                component_id=step['component_id'],
                created_time=step['created_time'],
                last_modified_time=step['last_modified_time'],
                module=step['module']
            )
        elif not joyride_step.translation:
            joyride_step.translation = step['translation']
        joyride_step.save()
    print("Default reward joyrides created.")
    
    
def create_intro_steps():
    print("Creating default intro steps...")
    array_of_steps = [
            {
                "title": "Who it’s for and why",
                "content": "This portal serves New Window System customers who participate in the company’s loyalty scheme. When customers buy impact windows or doors from New Window System, they accrue points in the portal’s rewards programme. The site is intended for clients who want to track these points and turn them into discounts or free items.",
                "translation": {
                    "es": {
                        "title": "Para quién es y por qué",
                        "content": "Este portal sirve a los clientes de New Window System que participan en el esquema de lealtad de la empresa. Cuando los clientes compran ventanas o puertas de impacto de New Window System, acumulan puntos en el programa de recompensas del portal. El sitio está destinado a clientes que desean rastrear estos puntos y convertirlos en descuentos o artículos gratuitos."
                    }
                },
                "order": 1
            },
            {
                "title": "Reward accumulation and redemption",
                "content": "After signing in, users see a dashboard that prominently displays their total reward points and offers a button to redeem them. Each purchase adds points to their balance, and the Reward Points History shows recent point transactions, such as points earned or deducted. A dedicated Rewards Store lets users spend those points on eligible products or vouchers; available items appear here with a cart icon for redemption on this site. The My Reward Orders section records all reward redemptions, distinguishing between unused rewards, used rewards and any refund requests.",
                "translation": {
                    "es": {
                        "title": "Acumulación y canje de recompensas",
                        "content": "Después de iniciar sesión, los usuarios ven un panel que muestra de manera destacada sus puntos de recompensa totales y ofrece un botón para canjearlos. Cada compra agrega puntos a su saldo, y el Historial de Puntos de Recompensa muestra transacciones recientes de puntos, como puntos ganados o deducidos. Una Tienda de Recompensas dedicada permite a los usuarios gastar esos puntos en productos o vales elegibles; los artículos disponibles aparecen aquí con un ícono de carrito para el canje en este sitio. La sección Mis Pedidos de Recompensa registra todos los canjes de recompensas, distinguiendo entre recompensas no utilizadas, recompensas utilizadas y cualquier solicitud de reembolso."
                    }
                },
                "order": 2
            },
            {
                "title": "Transaction data as context",
                "content": "While the system includes an order history and financial metrics, these elements mainly provide context for the rewards programme. The dashboard summarises total spending and open balances, and an invoice history chart shows paid and unpaid totals over the year. This information helps users understand how their purchases translate into reward points but does not drive the rewards process itself.",
                "translation": {
                    "es": {
                        "title": "Datos de transacción como contexto",
                        "content": "Si bien el sistema incluye un historial de pedidos y métricas financieras, estos elementos principalmente proporcionan contexto para el programa de recompensas. El panel resume el gasto total y los saldos abiertos, y un gráfico de historial de facturas muestra los totales pagados y no pagados durante el año. Esta información ayuda a los usuarios a comprender cómo sus compras se traducen en puntos de recompensa, pero no impulsa el proceso de recompensas en sí."
                    }
                },
                "order": 3
            }
    ]
    for step in array_of_steps:
        intro_step = IntroStep.objects(title=step['title']).first()
        if not intro_step:
            intro_step = IntroStep(
                title=step['title'],
                content=step['content'],
                translation=step['translation'],
                order=step['order']
            )
            intro_step.save()
        print("Default intro steps created.")


if __name__ == "__main__":
    print("Running initialization script...")
    create_initials_user_role()
    create_superuser()
    create_reward_points_settings()
    create_reward_joyrides()
    create_intro_steps()
    # set_active_products()
    print("Initialization script executed successfully.")
