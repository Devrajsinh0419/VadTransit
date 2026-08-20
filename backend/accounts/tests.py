"""
API tests for admin authentication endpoints: Login and Logout.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AccountAPITests(APITestCase):
    """
    Test suite for Admin Login and Logout endpoints.
    """

    def setUp(self):
        """Creates staff admin user and non-staff regular user."""
        self.admin = User.objects.create_superuser(
            username='adminuser',
            password='secretadminpassword',
            email='admin@example.com'
        )
        self.regular_user = User.objects.create_user(
            username='regularuser',
            password='regularpassword'
        )

    def test_admin_login_success(self):
        """Tests successful admin login with correct credentials."""
        data = {'username': 'adminuser', 'password': 'secretadminpassword'}
        response = self.client.post('/api/auth/admin/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'adminuser')

    def test_admin_login_non_staff(self):
        """Tests that a non-staff user is denied access to admin login."""
        data = {'username': 'regularuser', 'password': 'regularpassword'}
        response = self.client.post('/api/auth/admin/login/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_login_invalid_password(self):
        """Tests login failure with wrong password."""
        data = {'username': 'adminuser', 'password': 'wrongpassword'}
        response = self.client.post('/api/auth/admin/login/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_logout(self):
        """Tests successful logout for authenticated admin."""
        self.client.login(username='adminuser', password='secretadminpassword')
        response = self.client.post('/api/auth/admin/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
