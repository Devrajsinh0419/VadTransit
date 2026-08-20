"""
Custom permission classes for transport endpoints.
"""

from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission that allows read-only access for any request,
    but restricts write operations (create, update, delete) to admin/staff users.
    """

    def has_permission(self, request, view):
        """Checks if the request is read-only or initiated by an admin user."""
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
