"""
URL routing configuration for transport domain endpoints using DRF DefaultRouter.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CityViewSet,
    RouteViewSet,
    StopViewSet,
    BusViewSet,
    ScheduleViewSet,
    ServiceAlertViewSet,
    FavoriteViewSet,
)

router = DefaultRouter()
router.register(r'cities', CityViewSet, basename='city')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'stops', StopViewSet, basename='stop')
router.register(r'buses', BusViewSet, basename='bus')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'alerts', ServiceAlertViewSet, basename='alert')
router.register(r'favorites', FavoriteViewSet, basename='favorite')


urlpatterns = [
    path('', include(router.urls)),
]
