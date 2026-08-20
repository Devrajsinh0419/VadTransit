"""
Models for tracking domain including Shift and BusLocation.
"""

from django.db import models
from transport.models import Bus, Driver, Route


class Shift(models.Model):
    """
    Represents an active or completed driver shift operating a bus on a route.
    """
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='shifts')
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='shifts')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='shifts')
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of Shift."""
        return f"Shift #{self.id} - Driver: {self.driver.name}, Bus: {self.bus.fleet_number}"


class BusLocation(models.Model):
    """
    Represents a recorded GPS location fix for a bus.
    """
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='locations')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    recorded_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
    accuracy = models.FloatField(null=True, blank=True)
    speed = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        """Returns string representation of BusLocation."""
        return f"Bus {self.bus.fleet_number} at {self.recorded_at}"
