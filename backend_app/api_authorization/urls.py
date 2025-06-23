from django.urls import path
from . import views

urlpatterns = [
    path("is_user_verified/", views.is_user_verified, name="is_user_verified"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path('register/', views.register, name='register'),
    path('verify_user/', views.verify_user, name='verify_user'),
    path('send_verification_code/', views.send_verification_code, name='send_verification_code'),
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.MyTokenRefreshView.as_view(), name='token_refresh'),
]