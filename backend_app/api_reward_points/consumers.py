from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
import json

##########################################################################
# StoreProduct
##########################################################################

class StoreProductConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "store_product", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "store_product",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def store_product_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))

##########################################################################
# PointsSettings
##########################################################################

class PointsSettingsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "points_settings", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "points_settings",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def points_settings_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
##########################################################################
# RewardPoints
##########################################################################

class RewardPointsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "reward_points", 
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "reward_points",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def reward_points_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# RewardPoints BY ID
######################################################


class RewardPointsByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.reward_points_id = self.scope["url_route"]["kwargs"]["reward_points_id"]
        self.group_name = f"reward_points_{self.reward_points_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            "message": "Connected to reward points",
            "reward_points_id": self.reward_points_id,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def reward_points_update(self, event):
        await self.send_json(event["message"])
        
######################################################
# RewardStoreProduct BY ID
######################################################

class RewardStoreProductByIdConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.store_product_id = self.scope["url_route"]["kwargs"]["store_product_id"]
        self.group_name = f"store_product_{self.store_product_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to store product {self.store_product_id}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass
    
    async def store_product_update(self, event):
        await self.send_json(event["message"])
    
    async def store_product_review_update(self, event):
        await self.send_json(event["message"])
    
    async def store_product_review_reaction_update(self, event):
        await self.send_json(event["message"])
        
######################################################
# RewardStoreProductSelectionCart BY username
######################################################

class RewardStoreProductSelectionCartByUsernameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.group_name = f"store_product_selection_cart_{self.username}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to store product selection cart for user {self.username}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def store_product_selection_cart_update(self, event):
        await self.send_json(event["message"])
        
        
######################################################
# RewardStoreProductSelectionBuy BY username
######################################################

class RewardStoreProductSelectionBuyByUsernameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.group_name = f"store_product_selection_buy_{self.username}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to store product selection buy for user {self.username}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def store_product_selection_buy_update(self, event):
        await self.send_json(event["message"])
        
##########################################################################
# StoreProductSelectionBuy
##########################################################################

class RewardStoreProductSelectionBuyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "store_product_selection_buy",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "store_product_selection_buy",
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def store_product_selection_buy_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))
        
        
######################################################
# RewardPointHistory BY username
######################################################

class RewardPointHistoryByUsernameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.group_name = f"point_history_{self.username}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": f"Connected to point history for user {self.username}"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def point_history_update(self, event):
        await self.send_json(event["message"])