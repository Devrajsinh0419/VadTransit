"""
Django management command to import VMC bus routes from PDF source document.
Usage: python manage.py import_vmc_routes <pdf_file_path> [--city Vadodara] [--state Gujarat] [--dry-run]
"""

import os
from django.core.management.base import BaseCommand, CommandError
from transport.vmc_importer import VMCDataImporter


class Command(BaseCommand):
    """
    Django management command wrapper for importing VMC route PDF data into PostgreSQL / SQLite models.
    """
    help = "Import Vadodara City Bus Routes (VMC) from PDF document into Django transport models."

    def add_arguments(self, parser):
        """
        Adds command-line arguments for input PDF file path, city, state, and dry-run flag.
        """
        parser.add_argument(
            'pdf_file',
            type=str,
            help="Path to the VMC PDF file containing bus routes data."
        )
        parser.add_argument(
            '--city',
            type=str,
            default="Vadodara",
            help="City name for imported routes (default: Vadodara)."
        )
        parser.add_argument(
            '--state',
            type=str,
            default="Gujarat",
            help="State name for imported routes (default: Gujarat)."
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Validate VMC PDF route data without writing changes to database."
        )

    def handle(self, *args, **options):
        """
        Executes PDF extraction and database import flow using VMCDataImporter.
        """
        pdf_file_path = options['pdf_file']
        city_name = options['city']
        state_name = options['state']
        dry_run = options['dry_run']

        if not os.path.exists(pdf_file_path):
            raise CommandError(f"PDF file does not exist at path: '{pdf_file_path}'")

        importer = VMCDataImporter(city_name=city_name, state=state_name)

        self.stdout.write(f"Extracting VMC routes from PDF: {pdf_file_path}...")
        extracted_data = importer.extract_routes_from_pdf(pdf_file_path)

        routes_count = len(extracted_data['routes'])
        duplicates = extracted_data['duplicates']
        invalid = extracted_data['invalid']

        self.stdout.write(self.style.SUCCESS(
            f"Extracted {routes_count} valid route records from PDF.\n"
            f"  - Duplicate route codes detected: {len(duplicates)} {duplicates if duplicates else ''}\n"
            f"  - Invalid route records: {len(invalid)}"
        ))

        result = importer.import_routes(extracted_data, dry_run=dry_run)

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"\n[DRY RUN COMPLETE] Validated {routes_count} routes cleanly without writing to database."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\n[IMPORT COMPLETE] Successfully imported VMC routes into database!\n"
                f"  - Total Routes Extracted: {result['extracted_count']}\n"
                f"  - Routes Created: {result['routes_created']}\n"
                f"  - Routes Updated: {result['routes_updated']}\n"
                f"  - New Stops Created: {result['stops_created']}\n"
                f"  - Existing Stops Reused: {result['stops_reused']}\n"
                f"  - Route-Stops Configured: {result['route_stops_created']}"
            ))
