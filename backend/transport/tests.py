"""
API tests for transport endpoints: Routes, Stops, Buses, Schedules, and Service Alerts.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import City, Route, Stop, RouteStop, Bus, Schedule, ServiceAlert


class TransportAPITests(APITestCase):
    """
    Test suite for transport REST APIs covering public access and admin-only write operations.
    """

    def setUp(self):
        """Sets up test data: admin user, city, stops, route, bus, schedule, alert."""
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='adminpassword',
            email='admin@example.com'
        )
        self.regular_user = User.objects.create_user(
            username='passenger',
            password='passengerpassword'
        )

        self.city = City.objects.create(name='Vadodara', state='Gujarat')
        self.stop1 = Stop.objects.create(
            name='Station Stop',
            latitude='22.307159',
            longitude='73.181219',
            city=self.city
        )
        self.stop2 = Stop.objects.create(
            name='Alkaturi Stop',
            latitude='22.310000',
            longitude='73.190000',
            city=self.city
        )

        self.route = Route.objects.create(
            name='City Center Line',
            route_code='R101',
            city=self.city
        )
        self.route_stop = RouteStop.objects.create(
            route=self.route,
            stop=self.stop1,
            stop_order=1
        )

        self.bus = Bus.objects.create(
            registration_number='GJ06AB1234',
            fleet_number='BUS-10'
        )

        self.schedule = Schedule.objects.create(
            route=self.route,
            stop=self.stop1,
            arrival_time='10:00:00',
            departure_time='10:05:00'
        )

        self.alert = ServiceAlert.objects.create(
            title='Route 101 Delay',
            message='Traffic delay of 15 mins.',
            route=self.route,
            severity='warning',
            starts_at='2026-08-20T10:00:00Z'
        )

    def test_list_routes_public(self):
        """Tests that any user can list routes without authentication."""
        response = self.client.get('/api/routes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_route_detail_public(self):
        """Tests that route details include nested ordered stops."""
        response = self.client.get(f'/api/routes/{self.route.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['route_code'], 'R101')
        self.assertEqual(len(response.data['stops']), 1)

    def test_create_route_unauthorized(self):
        """Tests that unauthenticated user cannot create a route."""
        data = {'name': 'Express Line', 'route_code': 'EX1', 'city_id': self.city.id}
        response = self.client.post('/api/routes/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_route_admin(self):
        """Tests that admin user can successfully create a route."""
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'Express Line', 'route_code': 'EX1', 'city_id': self.city.id, 'is_active': True}
        response = self.client.post('/api/routes/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['route_code'], 'EX1')

    def test_list_stops_and_nearby(self):
        """Tests listing stops and nearby stops calculation."""
        response = self.client.get('/api/stops/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Query nearby stops near Station Stop (22.307159, 73.181219)
        nearby_resp = self.client.get('/api/stops/nearby/?latitude=22.307000&longitude=73.181000')
        self.assertEqual(nearby_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(len(nearby_resp.data) >= 1)
        self.assertIn('distance_km', nearby_resp.data[0])

    def test_create_bus_validation(self):
        """Tests bus creation and empty registration number validation."""
        self.client.force_authenticate(user=self.admin_user)
        invalid_data = {'registration_number': '   ', 'fleet_number': 'BUS-99'}
        response = self.client.post('/api/buses/', invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        valid_data = {'registration_number': 'GJ06CD5678', 'fleet_number': 'BUS-99', 'is_active': True}
        response = self.client.post('/api/buses/', valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_schedule_filter(self):
        """Tests filtering schedules by route_id."""
        response = self.client.get(f'/api/schedules/?route_id={self.route.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_service_alert_date_validation(self):
        """Tests validation error when alert ends_at is before starts_at."""
        self.client.force_authenticate(user=self.admin_user)
        invalid_alert = {
            'title': 'Test Disruption',
            'message': 'Error alert',
            'starts_at': '2026-08-20T12:00:00Z',
            'ends_at': '2026-08-20T10:00:00Z',
            'severity': 'critical'
        }
        response = self.client.post('/api/alerts/', invalid_alert)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ends_at', response.data)

    def test_favorites_create_list_delete(self):
        """Tests creating, listing (filtered by device_id), and deleting passenger favorites without auth."""
        fav_data = {
            'device_id': 'device-abc-123',
            'route_id': self.route.id
        }
        create_resp = self.client.post('/api/favorites/', fav_data)
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        favorite_id = create_resp.data['id']

        list_resp = self.client.get('/api/favorites/?device_id=device-abc-123')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data), 1)

        del_resp = self.client.delete(f'/api/favorites/{favorite_id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

