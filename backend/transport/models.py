"""
Models for transport domain including City, Route, Stop, RouteStop, Bus, Driver, Schedule, and ServiceAlert.
"""

from django.db import models


class City(models.Model):
    """
    Represents a city covered by the transport tracking system.
    """
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Cities'

    def __str__(self):
        """Returns string representation of City."""
        return f"{self.name}, {self.state}"


class Route(models.Model):
    """
    Represents a public transit route within a city.
    """
    name = models.CharField(max_length=150)
    route_code = models.CharField(max_length=50)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='routes')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of Route."""
        return f"{self.route_code} - {self.name}"


class Stop(models.Model):
    """
    Represents a bus stop location.
    """
    name = models.CharField(max_length=150)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='stops')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of Stop."""
        return self.name


class RouteStop(models.Model):
    """
    Defines ordered stops belonging to a route with travel metrics.
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='route_stops')
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE, related_name='route_stops')
    stop_order = models.PositiveIntegerField()
    distance_from_previous_stop = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    expected_travel_time = models.IntegerField(
        null=True, blank=True, help_text="Expected travel time from previous stop in seconds"
    )

    class Meta:
        ordering = ['stop_order']
        unique_together = ('route', 'stop_order')

    def __str__(self):
        """Returns string representation of RouteStop relationship."""
        return f"{self.route.route_code} - Stop #{self.stop_order}: {self.stop.name}"


class Bus(models.Model):
    """
    Represents a transit bus vehicle.
    """
    registration_number = models.CharField(max_length=50, unique=True)
    fleet_number = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Buses'

    def __str__(self):
        """Returns string representation of Bus."""
        return f"Bus {self.fleet_number} ({self.registration_number})"


class Driver(models.Model):
    """
    Represents a bus driver.
    """
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of Driver."""
        return self.name


class Schedule(models.Model):
    """
    Represents scheduled arrival and departure times for a route at a stop.
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='schedules')
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE, related_name='schedules')
    arrival_time = models.TimeField()
    departure_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of Schedule."""
        return f"{self.route.route_code} at {self.stop.name} - {self.arrival_time}"


class ServiceAlert(models.Model):
    """
    Represents delay or service disruption alerts.
    """
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    route = models.ForeignKey(
        Route, on_delete=models.SET_NULL, null=True, blank=True, related_name='service_alerts'
    )
    bus = models.ForeignKey(
        Bus, on_delete=models.SET_NULL, null=True, blank=True, related_name='service_alerts'
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        """Returns string representation of ServiceAlert."""
        return f"[{self.severity.upper()}] {self.title}"
