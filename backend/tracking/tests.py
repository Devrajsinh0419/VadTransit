"""
Unit and integration tests for driver shift management and bus location tracking endpoints.
"""

from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase
from transport.models import City, Route, Bus, Driver
from tracking.models import Shift, BusLocation


class TrackingAPITests(APITestCase):
    """
    Test suite for driver shift creation, shift termination, location updates, and location retrieval.
    """

    def setUp(self):
        """Sets up test data including city, route, bus, and driver."""
        self.city = City.objects.create(name='Vadodara', state='Gujarat')
        self.route = Route.objects.create(
            name='Station to Sama', route_code='R101', city=self.city
        )
        self.bus1 = Bus.objects.create(
            registration_number='GJ06AB1001', fleet_number='BUS-1'
        )
        self.bus2 = Bus.objects.create(
            registration_number='GJ06AB1002', fleet_number='BUS-2'
        )
        self.driver1 = Driver.objects.create(
            name='Rajesh Kumar', phone_number='9876543210'
        )

    def test_start_shift_success(self):
        """Tests starting a new driver shift successfully."""
        data = {
            'driver_id': self.driver1.id,
            'bus_id': self.bus1.id,
            'route_id': self.route.id
        }
        response = self.client.post('/api/shifts/start/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])
        self.assertEqual(response.data['bus_id'], self.bus1.id)

    def test_start_shift_duplicate_bus_prevention(self):
        """Tests that a bus cannot have multiple active shifts at the same time."""
        Shift.objects.create(
            driver=self.driver1,
            bus=self.bus1,
            route=self.route,
            started_at=timezone.now(),
            is_active=True
        )

        data = {
            'driver_id': self.driver1.id,
            'bus_id': self.bus1.id,
            'route_id': self.route.id
        }
        response = self.client.post('/api/shifts/start/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('bus_id', response.data)

    def test_end_shift(self):
        """Tests ending an active driver shift."""
        shift = Shift.objects.create(
            driver=self.driver1,
            bus=self.bus1,
            route=self.route,
            started_at=timezone.now(),
            is_active=True
        )

        response = self.client.post(f'/api/shifts/{shift.id}/end/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        self.assertIsNotNone(response.data['ended_at'])

    def test_valid_location_update(self):
        """Tests recording a valid GPS location update for a bus with an active shift."""
        Shift.objects.create(
            driver=self.driver1,
            bus=self.bus1,
            route=self.route,
            started_at=timezone.now(),
            is_active=True
        )

        loc_data = {
            'bus_id': self.bus1.id,
            'latitude': '22.307159',
            'longitude': '73.181219',
            'recorded_at': timezone.now().isoformat(),
            'speed': 35.5,
            'heading': 180.0
        }
        response = self.client.post('/api/locations/', loc_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BusLocation.objects.count(), 1)

    def test_invalid_location_update_inactive_shift(self):
        """Tests rejecting location updates for a bus that does not have an active shift."""
        loc_data = {
            'bus_id': self.bus1.id,
            'latitude': '22.307159',
            'longitude': '73.181219',
            'recorded_at': timezone.now().isoformat()
        }
        response = self.client.post('/api/locations/', loc_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('bus_id', response.data)

    def test_latest_bus_location(self):
        """Tests retrieving the latest recorded location fix for a bus."""
        now = timezone.now()
        Shift.objects.create(
            driver=self.driver1,
            bus=self.bus1,
            route=self.route,
            started_at=now,
            is_active=True
        )

        loc1 = BusLocation.objects.create(
            bus=self.bus1,
            latitude='22.300000',
            longitude='73.180000',
            recorded_at=now - timedelta(minutes=5)
        )
        loc2 = BusLocation.objects.create(
            bus=self.bus1,
            latitude='22.310000',
            longitude='73.190000',
            recorded_at=now
        )

        response = self.client.get(f'/api/buses/{self.bus1.id}/location/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['latitude']), 22.31)

        # Test active bus locations list endpoint
        active_resp = self.client.get('/api/buses/active/locations/')
        self.assertEqual(active_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(active_resp.data), 1)
        self.assertEqual(active_resp.data[0]['bus_id'], self.bus1.id)
