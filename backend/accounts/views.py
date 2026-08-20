"""
Views for admin authentication: Login and Logout.
"""

from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import AdminLoginSerializer


class AdminLoginView(APIView):
    """
    API view for authenticating an administrator user and creating a session.
    Endpoint: POST /api/auth/admin/login/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Authenticates admin credentials and initiates user session."""
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not (user.is_staff or user.is_superuser):
            return Response(
                {"error": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )

        login(request, user)
        return Response({
            "message": "Admin login successful.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff
            }
        }, status=status.HTTP_200_OK)


class AdminLogoutView(APIView):
    """
    API view for terminating an active administrator session.
    Endpoint: POST /api/auth/admin/logout/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Terminates the active administrator session."""
        logout(request)
        return Response({"message": "Admin logout successful."}, status=status.HTTP_200_OK)
