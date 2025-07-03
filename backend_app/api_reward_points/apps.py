from django.apps import AppConfig


class ApiRewardPointsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_reward_points'
    
    def ready(self):
        import api_reward_points.signals
