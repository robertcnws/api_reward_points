# api_authorization/serializers.py
from datetime import datetime, timezone as dt_timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from django.conf import settings
from .models import LoginUser

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)
        
        remember = self.context['request'].data.get('rememberMe', False)
        
        if remember:
            access_life  = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME_REMEMBER']
            refresh_life = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME_REMEMBER']
        else:
            access_life  = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            refresh_life = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            
        now = datetime.now(dt_timezone.utc)
        
        orig_refresh = RefreshToken(data['refresh'])
        
        orig_refresh.set_exp(from_time=now, lifetime=refresh_life)
        
        new_access = orig_refresh.access_token
        
        new_access.set_exp(from_time=now, lifetime=access_life)
        
        data['refresh'] = str(orig_refresh)
        data['access']  = str(new_access)
        return data
    
    
class MyTokenObtainTransferPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    def validate(self, attrs):
        request = self.context['request']
        username = request.data.get(self.username_field)
        if not username:
            raise serializers.ValidationError({self.username_field: 'This field is required.'})
        
        login_user = LoginUser.objects(username=username).first()
        if not login_user:
            raise serializers.ValidationError({'detail': 'No user found with that username.'})
        
        if not getattr(login_user, 'is_active', True):
            raise serializers.ValidationError({'detail': 'User is not active.'})
        
        remember = request.data.get('rememberMe', False)
        if remember:
            access_life = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME_REMEMBER']
            refresh_life = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME_REMEMBER']
        else:
            access_life = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            refresh_life = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

        now = datetime.now(dt_timezone.utc)
        
        refresh = RefreshToken.for_user(login_user)
        refresh.set_exp(from_time=now, lifetime=refresh_life)

        access = refresh.access_token
        access.set_exp(from_time=now, lifetime=access_life)

        return {
            'refresh': str(refresh),
            'access': str(access),
        }
    
    
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import RevokedToken

class RevocationCheckTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh_token = attrs['refresh']
        from rest_framework_simplejwt.tokens import UntypedToken, TokenError

        try:
            token = UntypedToken(refresh_token)
            jti   = token['jti']
        except TokenError:
            raise AuthenticationFailed('Invalid refresh token')

        if RevokedToken.objects(jti=jti).first():
            raise AuthenticationFailed('Refresh token has been revoked')
        
        return super().validate(attrs)
