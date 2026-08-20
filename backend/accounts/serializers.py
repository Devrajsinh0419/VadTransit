"""
Serializers for admin authentication endpoints.
"""

from rest_framework import serializers


class AdminLoginSerializer(serializers.Serializer):
    """
    Serializer for admin login credentials validation.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_username(self, value):
        """Validates that username is provided."""
        if not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")
        return value.strip()
