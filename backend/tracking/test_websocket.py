"""
Unit and integration tests for Django Channels WebSocket bus tracking endpoints.
"""

from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from config.asgi import application
from transport.models import City, Route, Bus


class WebSocketTests(TransactionTestCase):
    """
    Test suite for WebSocket bus tracking connections, messaging, and disconnection.
    """

    def setUp(self):
        """Sets up test models synchronously before WebSocket async tests."""
        self.city = City.objects.create(name='Vadodara', state='Gujarat')
        self.route = Route.objects.create(name='Station Line', route_code='R101', city=self.city)
        self.bus = Bus.objects.create(registration_number='GJ06AB5555', fleet_number='BUS-55')

    async def test_websocket_connection_and_disconnect(self):
        """Tests that a client can successfully connect to and disconnect from the bus tracking WebSocket endpoint."""
        communicator = WebsocketCommunicator(application, f"/ws/buses/{self.bus.id}/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_websocket_receive_broadcast_update(self):
        """Tests that a connected WebSocket client receives location and ETA broadcast updates."""
        communicator = WebsocketCommunicator(application, f"/ws/buses/{self.bus.id}/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()

        update_payload = {
            "bus_id": self.bus.id,
            "latitude": 22.307159,
            "longitude": 73.181219,
            "speed": 30.0,
            "heading": 90.0,
            "eta": None
        }

        await channel_layer.group_send(
            f"bus_{self.bus.id}",
            {
                "type": "bus_update",
                "data": update_payload
            }
        )

        received_msg = await communicator.receive_json_from()
        self.assertEqual(received_msg['bus_id'], self.bus.id)
        self.assertEqual(received_msg['latitude'], 22.307159)
        self.assertEqual(received_msg['speed'], 30.0)

        await communicator.disconnect()

    async def test_admin_fleet_websocket_broadcast(self):
        """Tests connecting to /ws/admin/fleet/ and receiving real-time fleet broadcast updates."""
        communicator = WebsocketCommunicator(application, "/ws/admin/fleet/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()

        fleet_payload = {
            "bus_id": self.bus.id,
            "status": "live",
            "fleet_number": "BUS-55"
        }

        await channel_layer.group_send(
            "admin_fleet",
            {
                "type": "fleet_update",
                "data": fleet_payload
            }
        )

        received_msg = await communicator.receive_json_from()
        self.assertEqual(received_msg['bus_id'], self.bus.id)
        self.assertEqual(received_msg['status'], 'live')

        await communicator.disconnect()

