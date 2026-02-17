from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json


##########################################################################
# DealerportalQuote (ALL)
##########################################################################

class DealerportalQuoteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("dealerportal_quote", self.channel_name)
        await self.accept()
        # await self.send(text_data=json.dumps({"type":"hello","message":"connected"}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("dealerportal_quote", self.channel_name)

    async def receive(self, text_data):
        pass

    async def dealerportal_quote_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def dealerportal_quote_product_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))


##########################################################################
# DealerportalQuote BY OWNER ID
##########################################################################

class DealerportalQuoteByOwnerConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.owner_id = self.scope["url_route"]["kwargs"]["owner_id"]
        self.group_name = f"dealerportal_quote_{self.owner_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to dealerportal quotes for owner {self.owner_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def dealerportal_quote_update(self, event):
        await self.send_json(event["message"])

    async def dealerportal_quote_product_update(self, event):
        await self.send_json(event["message"])


##########################################################################
# DealerportalQuote BY QUOTE ID
##########################################################################

class DealerportalQuoteByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.quote_id = self.scope["url_route"]["kwargs"]["quote_id"]
        self.group_name = f"dealerportal_quote_{self.quote_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to dealerportal quote {self.quote_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def dealerportal_quote_update(self, event):
        await self.send_json(event["message"])

    async def dealerportal_quote_product_update(self, event):
        await self.send_json(event["message"])


from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

##########################################################################
# DealerportalOrder (ALL)
##########################################################################

class DealerportalOrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("dealerportal_order", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("dealerportal_order", self.channel_name)

    async def receive(self, text_data):
        pass

    async def dealerportal_order_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))


##########################################################################
# DealerportalOrder BY OWNER ID
##########################################################################

class DealerportalOrderByOwnerConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.owner_id = self.scope["url_route"]["kwargs"]["owner_id"]
        self.group_name = f"dealerportal_order_owner_{self.owner_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to dealerportal orders for owner {self.owner_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def dealerportal_order_update(self, event):
        await self.send_json(event["message"])


##########################################################################
# DealerportalOrder BY QUOTE ID (opcional, si quieres filtrar orders por quote)
##########################################################################

class DealerportalOrderByQuoteConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.quote_id = self.scope["url_route"]["kwargs"]["quote_id"]
        self.group_name = f"dealerportal_order_quote_{self.quote_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to dealerportal orders for quote {self.quote_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def dealerportal_order_update(self, event):
        await self.send_json(event["message"])


##########################################################################
# DealerportalOrder BY ORDER ID (detail)
##########################################################################

class DealerportalOrderByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.group_name = f"dealerportal_order_{self.order_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to dealerportal order {self.order_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def dealerportal_order_update(self, event):
        await self.send_json(event["message"])
