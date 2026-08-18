# Vadodara Transit

A simple and reliable real-time public transport tracking system for
small cities, starting with Vadodara as the MVP.

## Purpose

Vadodara Transit helps passengers find buses, routes and stops, view bus
locations, and get useful estimated arrival times.

> **Simple to use. Reliable in real-world conditions.**

## MVP Goals

-   Track selected Vadodara buses in real time.
-   Show routes and bus stops.
-   Provide estimated arrival times (ETA).
-   Provide useful ETA information when live updates are unavailable.
-   Give passengers a mobile-first experience.
-   Give transport authorities a simple way to monitor buses and manage
    transport data.
-   Keep the system ready for expansion to other cities.

## Main Users

### Passenger

-   No account required.
-   Find routes and stops.
-   View nearby buses.
-   Track a selected bus.
-   View ETA.
-   Receive service and delay information.

### Driver

-   Select the assigned route when starting a shift.
-   Allow location tracking to run automatically during the shift.
-   No interaction with the system while driving.

### Administrator

-   Manage buses, routes and stops.
-   Monitor active buses.
-   View delays and service status.
-   Review basic trip information.

## Core Features

1.  Live bus tracking
2.  Route and stop information
3.  Nearby stops
4.  Route/stop search
5.  Bus ETA
6.  Selected-bus tracking
7.  Favorite routes/stops
8.  Delay and service alerts
9.  Last-updated information
10. Offline ETA fallback
11. Scheduled ETA fallback
12. Driver shift start
13. Admin fleet monitoring
14. Route, stop and bus management
15. Basic trip and delay history

## ETA Reliability

The system should always show the best information currently available.

-   **Live:** Use the latest bus location and calculate a fresh ETA.
-   **Recent data available:** Project the ETA using the latest known
    information.
-   **No recent live data:** Fall back to the scheduled ETA.
-   Clearly show when information is not live.

The system must never present stale information as live information.

## MVP Scope

The first version will focus on a limited number of Vadodara routes,
stops and buses.

The system should be designed so that adding more routes, buses, stops
and cities later does not require rebuilding the core application.

## Technology Stack

-   **Frontend:** React
-   **Backend:** Django
-   **Database:** PostgreSQL
-   **Maps:** MapLibre with an OpenStreetMap-based map provider

## Development Principles

-   Keep the user experience simple.
-   Prefer reliability over unnecessary features.
-   Avoid unnecessary AI.
-   Keep driver interaction minimal.
-   Design for temporary network problems.
-   Keep passenger usage account-free.
-   Build and test the Vadodara MVP before expanding.
-   Keep the architecture flexible for future cities.

## Project Status

**Stage:** Initial development / MVP planning

## Future Direction

If the Vadodara MVP proves successful, the platform can be expanded to
additional routes, buses, cities and transport authorities.
