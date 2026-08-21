"""
Unit and integration tests for driver shift management, bus location tracking, and ETA calculations.
"""

from django.utils import timezone
from datetime import timedelta, time
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from transport.models import City, Route, Stop, RouteStop, Bus, Driver, Schedule, ServiceAlert
from tracking.models import Shift, BusLocation
from tracking.eta_service import ETAService


class AdminMonitoringAPITests(APITestCase):
    """
    Test suite for admin fleet status monitoring, trip history, and delay history endpoints.
    Verifies authentication restrictions and accurate status calculations.
    """

    def setUp(self):
        """Sets up admin user, regular user, city, route, bus, driver, shift, location, and alert."""
        self.admin_user = User.objects.create_superuser(
            username='adminuser', password='password123', email='admin@example.com'
        )
        self.regular_user = User.objects.create_user(
            username='passengeruser', password='password123'
        )

        self.city = City.objects.create(name='Vadodara', state='Gujarat')
        self.route = Route.objects.create(
            name='Central Circle', route_code='CC1', city=self.city
        )
        self.bus = Bus.objects.create(
            registration_number='GJ06XY9999', fleet_number='BUS-50'
        )
        self.driver = Driver.objects.create(
            name='Mahesh Patel', phone_number='9898000000'
        )

        now = timezone.now()
        self.shift = Shift.objects.create(
            driver=self.driver,
            bus=self.bus,
            route=self.route,
            started_at=now - timedelta(hours=1),
            is_active=True
        )

        self.location = BusLocation.objects.create(
            bus=self.bus,
            latitude='22.300000',
            longitude='73.180000',
            recorded_at=now - timedelta(seconds=60),
            speed=30.0,
            heading=90.0
        )

        self.alert = ServiceAlert.objects.create(
            title='Central Line Delay',
            message='Heavy traffic near station',
            route=self.route,
            bus=self.bus,
            severity='warning',
            starts_at=now - timedelta(hours=2),
            is_active=True
        )

    def test_admin_fleet_unauthorized(self):
        """Tests that unauthenticated and non-admin users cannot access fleet status endpoint."""
        response = self.client.get('/api/admin/fleet/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        self.client.force_authenticate(user=self.regular_user)
        response_user = self.client.get('/api/admin/fleet/')
        self.assertEqual(response_user.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_fleet_success(self):
        """Tests that admin user receives fleet status with correct tracking status."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/fleet/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        item = response.data[0]
        self.assertEqual(item['bus_id'], self.bus.id)
        self.assertEqual(item['status'], 'live')
        self.assertEqual(item['shift_id'], self.shift.id)
        self.assertIsNotNone(item['last_location'])

    def test_admin_trips_unauthorized_and_success(self):
        """Tests trip history endpoint authentication protection and successful output."""
        response_unauth = self.client.get('/api/admin/trips/')
        self.assertIn(response_unauth.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/trips/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['driver_name'], 'Mahesh Patel')
        self.assertEqual(response.data[0]['status'], 'active')

    def test_admin_delays_unauthorized_and_success(self):
        """Tests delay history endpoint authentication protection and filtered output."""
        response_unauth = self.client.get('/api/admin/delays/')
        self.assertIn(response_unauth.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/delays/?severity=warning')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Central Line Delay')



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

        BusLocation.objects.create(
            bus=self.bus1,
            latitude='22.300000',
            longitude='73.180000',
            recorded_at=now - timedelta(minutes=5)
        )
        BusLocation.objects.create(
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


class ETAServiceTests(APITestCase):
    """
    Test suite for ETA calculation logic including live data, recent data fallback, and scheduled fallback.
    """

    def setUp(self):
        """Sets up city, route, stops, bus, active shift, and schedule."""
        self.city = City.objects.create(name='Vadodara', state='Gujarat')
        self.route = Route.objects.create(
            name='Station to Sama', route_code='R101', city=self.city
        )
        self.stop1 = Stop.objects.create(
            name='Station', latitude='22.307159', longitude='73.181219', city=self.city
        )
        self.stop2 = Stop.objects.create(
            name='Sama', latitude='22.335000', longitude='73.198000', city=self.city
        )

        RouteStop.objects.create(route=self.route, stop=self.stop1, stop_order=1)
        RouteStop.objects.create(route=self.route, stop=self.stop2, stop_order=2)

        self.bus = Bus.objects.create(
            registration_number='GJ06AB9999', fleet_number='BUS-99'
        )
        self.driver = Driver.objects.create(
            name='Suresh Patel', phone_number='9123456789'
        )
        self.shift = Shift.objects.create(
            driver=self.driver, bus=self.bus, route=self.route,
            started_at=timezone.now(), is_active=True
        )
        self.schedule = Schedule.objects.create(
            route=self.route, stop=self.stop2, arrival_time=time(18, 30)
        )

    def test_live_eta(self):
        """Tests that location data recorded <= 3 minutes ago produces a 'live' ETA source."""
        now = timezone.now()
        BusLocation.objects.create(
            bus=self.bus,
            latitude='22.310000',
            longitude='73.182000',
            recorded_at=now - timedelta(seconds=60),
            speed=25.0
        )

        eta_info = ETAService.calculate_bus_eta(self.bus, stop=self.stop2)
        self.assertIsNotNone(eta_info)
        self.assertEqual(eta_info['source'], 'live')
        self.assertIsNotNone(eta_info['last_location_at'])

        response = self.client.get(f'/api/buses/{self.bus.id}/eta/?stop_id={self.stop2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'live')

    def test_recent_data_fallback(self):
        """Tests that location data recorded 5 minutes ago produces a 'recent' ETA source."""
        now = timezone.now()
        BusLocation.objects.create(
            bus=self.bus,
            latitude='22.310000',
            longitude='73.182000',
            recorded_at=now - timedelta(minutes=5),
            speed=20.0
        )

        eta_info = ETAService.calculate_bus_eta(self.bus, stop=self.stop2)
        self.assertIsNotNone(eta_info)
        self.assertEqual(eta_info['source'], 'recent')
        self.assertIsNotNone(eta_info['last_location_at'])

    def test_scheduled_fallback(self):
        """Tests that location data > 15 minutes old falls back to a 'scheduled' ETA source."""
        now = timezone.now()
        BusLocation.objects.create(
            bus=self.bus,
            latitude='22.310000',
            longitude='73.182000',
            recorded_at=now - timedelta(minutes=30)
        )

        eta_info = ETAService.calculate_bus_eta(self.bus, stop=self.stop2)
        self.assertIsNotNone(eta_info)
        self.assertEqual(eta_info['source'], 'scheduled')
        self.assertIsNone(eta_info['last_location_at'])

    def test_missing_location_fallback(self):
        """Tests that when no location records exist for a bus, ETA falls back to 'scheduled'."""
        eta_info = ETAService.calculate_bus_eta(self.bus, stop=self.stop2)
        self.assertIsNotNone(eta_info)
        self.assertEqual(eta_info['source'], 'scheduled')
        self.assertIsNone(eta_info['last_location_at'])

        # Test stop arrivals endpoint
        response = self.client.get(f'/api/stops/{self.stop2.id}/arrivals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
