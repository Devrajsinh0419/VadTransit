# Implementation Checklist

## Project Foundation

-   [ ] Create project repository and base structure
-   [x] Set up Django backend
-   [ ] Set up React frontend
-   [x] Set up PostgreSQL database
-   [x] Configure development environment
-   [x] Define project settings and environment variables

## Transport Data

-   [x] Add Vadodara city
-   [x] Add initial bus routes
-   [x] Add route stops in the correct order
-   [x] Add stop coordinates
-   [ ] Add initial buses
-   [ ] Add drivers
-   [ ] Add schedules
-   [x] Add sample/test transport data

## Passenger Experience

-   [ ] Create mobile-first passenger interface
-   [ ] Show available routes
-   [ ] Show bus stops
-   [ ] Add route search
-   [ ] Add stop search
-   [ ] Show nearby stops
-   [ ] Show buses operating on a route
-   [ ] Show live bus location
-   [ ] Show ETA
-   [ ] Show last-updated time
-   [ ] Show live/offline/scheduled ETA status
-   [ ] Add favorite routes/stops
-   [ ] Add service and delay alerts
-   [ ] Test passenger flow on a phone

## Driver Experience

-   [ ] Create simple driver interface
-   [ ] Add driver login/access
-   [x] Add route selection
-   [x] Add start shift
-   [ ] Start automatic location updates after shift begins
-   [x] Add end shift
-   [ ] Prevent unnecessary interaction while driving
-   [ ] Handle temporary network loss
-   [ ] Test location tracking on a real phone

## ETA and Reliability

-   [ ] Define ETA calculation rules
-   [ ] Use fresh location data for live ETA
-   [x] Store the latest known location and timestamp
-   [ ] Add recent-data ETA fallback
-   [ ] Add scheduled ETA fallback
-   [ ] Show when information is not live
-   [ ] Handle stale location data
-   [ ] Handle delayed location updates
-   [ ] Test ETA behaviour during network loss
-   [ ] Verify time and timestamps across the system

## Real-Time Tracking

-   [x] Receive driver location updates
-   [x] Store required location information
-   [ ] Send current bus information to passengers
-   [ ] Update bus position on the map
-   [ ] Update ETA when new location data arrives
-   [ ] Detect unavailable/offline buses
-   [ ] Test frequent location updates
-   [ ] Test reconnect behaviour

## Admin

-   [x] Create admin authentication
-   [ ] Create admin dashboard
-   [ ] View active buses
-   [ ] View bus status
-   [ ] Manage buses
-   [ ] Manage routes
-   [ ] Manage stops
-   [ ] Manage schedules
-   [ ] View basic trip history
-   [ ] View basic delay history

## Maps

-   [ ] Add MapLibre
-   [ ] Connect selected OpenStreetMap-based map provider
-   [ ] Display Vadodara map
-   [ ] Display stops
-   [ ] Display routes
-   [ ] Display bus locations
-   [ ] Test map performance on mobile
-   [ ] Confirm map provider usage limits for MVP

## Testing

-   [ ] Test passenger flow from start to ETA
-   [ ] Test driver flow from shift start to tracking
-   [ ] Test admin flow
-   [ ] Test with multiple buses
-   [ ] Test with multiple routes
-   [ ] Test poor network conditions
-   [ ] Test complete network loss
-   [ ] Test stale location data
-   [ ] Test incorrect route selection
-   [ ] Test app on different phone sizes
-   [ ] Test real-world Vadodara route
-   [ ] Fix issues found during field testing

## MVP Validation

-   [ ] Track at least one real bus successfully
-   [ ] Display its location to a passenger
-   [ ] Calculate a useful ETA
-   [ ] Break the internet and verify fallback ETA
-   [ ] Restore the connection and verify fresh data
-   [ ] Validate the full passenger journey
-   [ ] Validate the full driver journey
-   [ ] Validate basic admin monitoring

## Future / Not Required for Initial MVP

-   [ ] Expand to more Vadodara routes
-   [ ] Add more buses
-   [ ] Add additional cities
-   [ ] Consider dedicated GPS hardware
-   [ ] Consider production-grade map infrastructure
-   [ ] Add advanced analytics if actually needed
