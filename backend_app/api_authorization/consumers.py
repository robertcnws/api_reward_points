from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

##########################################################################
# UserRole
##########################################################################

class FunctionalityConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "functionality", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "functionality",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def functionality_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))