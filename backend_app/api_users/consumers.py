from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json
import re

def _safe_group_username(username: str) -> str:
    u = (username or "").strip().lower()
    u = re.sub(r"[^a-z0-9_\-\.]", "_", u)
    return u[:80]


##########################################################################
# SystemPermission
##########################################################################

class SystemPermissionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "system_permission", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "system_permission",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def system_permission_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

##########################################################################
# UserRole
##########################################################################

class UserRoleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "user_role", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "user_role",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def user_role_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
##########################################################################
# User
##########################################################################

class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "user", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "user",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def user_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        

class UserByUsernameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        username = self.scope["url_route"]["kwargs"].get("username", "")
        self.group_name = f"user_by_username.{_safe_group_username(username)}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def user_by_username_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# NOTIFICATION USER
######################################################

class NotificationUserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "notification_user", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "notification_user",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def notification_user_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
##########################################################################
# ExternalUser
##########################################################################

class ExternalUserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "external_user", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "external_user",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def external_user_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))