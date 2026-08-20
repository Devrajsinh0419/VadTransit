"""
Django Channels WebSocket consumer for bus real-time location and ETA tracking.
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class BusTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for streaming real-time location and ETA updates for a specific bus.
    Endpoint: /ws/buses/{bus_id}/
    """

    async def connect(self):
        """Extracts bus_id, subscribes client to bus group channel, and accepts connection."""
        self.bus_id = self.scope['url_route']['kwargs']['bus_id']
        self.group_name = f"bus_{self.bus_id}"

        # Join bus channel group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Unsubscribes client from bus group channel on disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def bus_update(self, event):
        """Handler for 'bus_update' event; forwards location and ETA data to connected client."""
        await self.send_json(event['data'])
