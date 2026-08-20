"""
Unit and integration tests for TransportDataImporter.
Tests valid import, invalid data rejection, duplicate handling, and route-stop ordering.
"""

from django.test import TestCase
from transport.models import City, Route, Stop, RouteStop
from transport.importer import TransportDataImporter


class TransportImporterTests(TestCase):
    """
    Test suite for TransportDataImporter covering validation, duplicate prevention, and ordering.
    """

    def setUp(self):
        """Initializes test importer instance."""
        self.importer = TransportDataImporter(default_city_name="Vadodara", default_state="Gujarat")

    def test_valid_import(self):
        """Tests that valid CSV data creates City, Route, Stop, and RouteStop records correctly."""
        csv_data = (
            "route_code,route_name,stop_name,latitude,longitude,stop_order,distance_from_previous_stop,expected_travel_time\n"
            "R101,Station to Sama,Station Stop,22.307159,73.181219,1,0.00,0\n"
            "R101,Station to Sama,Sayajigunj,22.312000,73.185000,2,0.80,180\n"
        )
        result = self.importer.import_csv(csv_data)

        self.assertTrue(result['success'])
        self.assertEqual(result['rows_processed'], 2)
        self.assertEqual(result['routes_created'], 1)
        self.assertEqual(result['stops_created'], 2)
        self.assertEqual(result['route_stops_created'], 2)

        city = City.objects.get(name="Vadodara")
        self.assertEqual(city.state, "Gujarat")
        self.assertEqual(Route.objects.count(), 1)
        self.assertEqual(Stop.objects.count(), 2)
        self.assertEqual(RouteStop.objects.count(), 2)

    def test_invalid_data_rejection(self):
        """Tests that invalid coordinates, empty fields, and bad integers are rejected with errors."""
        invalid_csv = (
            "route_code,route_name,stop_name,latitude,longitude,stop_order\n"
            "R101,Station to Sama,,22.307159,73.181219,1\n"  # Missing stop_name
            "R101,Station to Sama,Bad Stop,999.0,73.185000,2\n"  # Invalid latitude
            "R101,Station to Sama,Bad Order,22.310000,73.186000,-1\n"  # Invalid stop_order
        )
        result = self.importer.import_csv(invalid_csv)

        self.assertFalse(result['success'])
        self.assertTrue(len(result['errors']) >= 3)
        self.assertEqual(Route.objects.count(), 0)
        self.assertEqual(Stop.objects.count(), 0)

    def test_duplicate_handling(self):
        """Tests that re-importing identical CSV data does not duplicate City, Route, or Stop records."""
        csv_data = (
            "route_code,route_name,stop_name,latitude,longitude,stop_order\n"
            "R101,Station to Sama,Station Stop,22.307159,73.181219,1\n"
            "R101,Station to Sama,Sayajigunj,22.312000,73.185000,2\n"
        )

        first_res = self.importer.import_csv(csv_data)
        self.assertTrue(first_res['success'])
        self.assertEqual(Route.objects.count(), 1)
        self.assertEqual(Stop.objects.count(), 2)

        second_res = self.importer.import_csv(csv_data)
        self.assertTrue(second_res['success'])
        self.assertEqual(Route.objects.count(), 1)
        self.assertEqual(Stop.objects.count(), 2)
        self.assertEqual(second_res['routes_created'], 0)
        self.assertEqual(second_res['stops_created'], 0)

    def test_route_stop_ordering(self):
        """Tests that route stops are assigned and retrieved in exact stop_order sequence."""
        csv_data = (
            "route_code,route_name,stop_name,latitude,longitude,stop_order\n"
            "R101,Station to Sama,Third Stop,22.330000,73.190000,3\n"
            "R101,Station to Sama,First Stop,22.300000,73.180000,1\n"
            "R101,Station to Sama,Second Stop,22.315000,73.185000,2\n"
        )
        result = self.importer.import_csv(csv_data)
        self.assertTrue(result['success'])

        route = Route.objects.get(route_code='R101')
        route_stops = list(route.route_stops.order_by('stop_order'))

        self.assertEqual(len(route_stops), 3)
        self.assertEqual(route_stops[0].stop_order, 1)
        self.assertEqual(route_stops[0].stop.name, "First Stop")
        self.assertEqual(route_stops[1].stop_order, 2)
        self.assertEqual(route_stops[1].stop.name, "Second Stop")
        self.assertEqual(route_stops[2].stop_order, 3)
        self.assertEqual(route_stops[2].stop.name, "Third Stop")
