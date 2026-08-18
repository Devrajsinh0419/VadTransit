# Field Names

This document defines the agreed naming convention for important data
fields used across Django, PostgreSQL, APIs and React.

## General Rules

-   Use `snake_case` for database fields and API JSON fields.
-   Use clear, descriptive names.
-   Use singular names for individual values.
-   Use plural names for collections/endpoints where appropriate.
-   Use `_id` for foreign-key identifier fields in API/data
    representations.
-   Use timezone-aware timestamps.
-   Do not use vague names such as `data`, `value`, `info`, `thing`, or
    `status_data`.

## Common Identifiers

  Field           Meaning
  --------------- --------------------------
  `id`            Unique record identifier
  `city_id`       City identifier
  `route_id`      Route identifier
  `stop_id`       Bus stop identifier
  `bus_id`        Bus identifier
  `driver_id`     Driver identifier
  `shift_id`      Driver shift identifier
  `trip_id`       Trip identifier
  `schedule_id`   Schedule identifier
  `alert_id`      Service alert identifier

## City

  Field         Meaning
  ------------- ----------------------------
  `id`          City identifier
  `name`        City name
  `state`       State name
  `is_active`   Whether the city is active

## Route

  Field          Meaning
  -------------- -------------------------------
  `id`           Route identifier
  `name`         Route display name
  `route_code`   Short/public route identifier
  `city_id`      City the route belongs to
  `is_active`    Whether the route is active

## Stop

  Field         Meaning
  ------------- ----------------------------
  `id`          Stop identifier
  `name`        Stop display name
  `latitude`    Stop latitude
  `longitude`   Stop longitude
  `city_id`     City the stop belongs to
  `is_active`   Whether the stop is active

## Route Stop

Used to define the ordered stops belonging to a route.

  Field                           Meaning
  ------------------------------- ---------------------------------------------
  `id`                            Route-stop record identifier
  `route_id`                      Route identifier
  `stop_id`                       Stop identifier
  `stop_order`                    Position of the stop in the route
  `distance_from_previous_stop`   Distance from the previous stop
  `expected_travel_time`          Expected travel time from the previous stop

## Bus

  Field                   Meaning
  ----------------------- ------------------------------
  `id`                    Bus identifier
  `registration_number`   Vehicle registration number
  `fleet_number`          Internal/public fleet number
  `is_active`             Whether the bus is active

## Driver

  Field            Meaning
  ---------------- ------------------------------
  `id`             Driver identifier
  `name`           Driver name
  `phone_number`   Driver contact number
  `is_active`      Whether the driver is active

## Shift

  Field          Meaning
  -------------- -----------------------------
  `id`           Shift identifier
  `driver_id`    Driver identifier
  `bus_id`       Bus being operated
  `route_id`     Route being driven
  `started_at`   Shift start timestamp
  `ended_at`     Shift end timestamp
  `is_active`    Whether the shift is active

## Bus Location

  Field           Meaning
  --------------- ---------------------------------------
  `id`            Location record identifier
  `bus_id`        Bus identifier
  `latitude`      Bus latitude
  `longitude`     Bus longitude
  `recorded_at`   Time the device recorded the location
  `received_at`   Time the server received the location
  `accuracy`      Reported GPS accuracy
  `speed`         Reported/estimated bus speed
  `heading`       Bus movement direction

## ETA

  Field                Meaning
  -------------------- --------------------------------
  `bus_id`             Bus identifier
  `route_id`           Route identifier
  `stop_id`            Destination stop
  `eta`                Estimated arrival timestamp
  `calculated_at`      Time the ETA was calculated
  `source`             Source of the ETA
  `last_location_at`   Timestamp of the location used

### ETA Source Values

Use a small, fixed set of values:

-   `live`
-   `recent`
-   `scheduled`

## Service Alert

  Field         Meaning
  ------------- ------------------------------
  `id`          Alert identifier
  `title`       Short alert title
  `message`     Alert message
  `route_id`    Related route, if applicable
  `bus_id`      Related bus, if applicable
  `severity`    Alert severity
  `starts_at`   Alert start timestamp
  `ends_at`     Alert end timestamp
  `is_active`   Whether the alert is active

## Passenger Favorites

Passenger accounts are not required. Favorites are associated with the
passenger's device/application.

  Field          Meaning
  -------------- -----------------------------------------
  `id`           Favorite identifier
  `device_id`    Anonymous application/device identifier
  `route_id`     Saved route, if applicable
  `stop_id`      Saved stop, if applicable
  `created_at`   Creation timestamp

## Status Values

Keep status values limited and predictable.

### Bus/Tracking Status

-   `live`
-   `stale`
-   `offline`

### Shift Status

-   `active`
-   `completed`

### Alert Severity

-   `info`
-   `warning`
-   `critical`

## Time Rules

Time is critical to this project.

-   Store timestamps as timezone-aware values.
-   Keep internal timestamps consistent.
-   Always record both `recorded_at` and `received_at` for GPS data.
-   Never use a client-side timestamp as the only source for determining
    data freshness.
-   ETA must include `calculated_at`.
-   Passenger-facing responses must provide enough information to
    determine how fresh the data is.

## Naming Consistency

Use the same field names across:

**PostgreSQL → Django → API → React**

Do not create alternate names for the same concept.

For example, use:

`latitude`

instead of mixing:

`lat`, `latitude_value`, `bus_latitude`

unless a specific external integration requires a different name.
