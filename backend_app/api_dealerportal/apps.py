from django.apps import AppConfig


class ApiDealerportalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_dealerportal'
    
    def ready(self):
        import api_dealerportal.signals