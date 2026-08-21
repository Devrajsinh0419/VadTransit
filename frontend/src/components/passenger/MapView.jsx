import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchStops, fetchBuses, fetchBusLocation, fetchRoutes } from '../../services/api';
import { Layers, RotateCcw, MapPin, Bus, Route as RouteIcon } from 'lucide-react';

/**
 * Enhanced MapView component displaying Vadodara map, route polylines, stop markers, and live bus markers.
 * @param {Object} props - MapView props.
 * @param {Object} [props.selectedItem] - Item object to focus/center on map (route, stop, or bus).
 * @param {Function} [props.onSelectStop] - Callback when a stop marker is clicked.
 * @param {Function} [props.onSelectBus] - Callback when a bus marker is clicked.
 * @returns {JSX.Element} Rendered map view.
 */
export default function MapView({ selectedItem, onSelectStop, onSelectBus }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Layer visibility state
  const [showStops, setShowStops] = useState(true);
  const [showBuses, setShowBuses] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  /**
   * Initializes MapLibre GL map instance centered on Vadodara.
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [73.1812, 22.3106],
        zoom: 12.5,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setMapLoaded(true);
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Error initializing MapLibre GL map', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /**
   * Loads stops, routes, and active bus locations.
   */
  const loadMapData = async () => {
    try {
      const [stopList, routeList, busList] = await Promise.all([
        fetchStops(),
        fetchRoutes(),
        fetchBuses(),
      ]);

      setStops(stopList);
      setRoutes(routeList);

      const busLocPromises = busList.map(async (bus) => {
        try {
          const loc = await fetchBusLocation(bus.id);
          return { ...bus, location: loc };
        } catch {
          return null;
        }
      });

      const busLocations = (await Promise.all(busLocPromises)).filter(Boolean);
      setActiveBuses(busLocations);
    } catch (err) {
      console.error('Failed loading map data', err);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  /**
   * Renders route polyline paths on the MapLibre map.
   */
  const renderRoutePolylines = () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    routes.forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;

      if (!route.stops || route.stops.length < 2) return;

      const coordinates = route.stops
        .map((s) => {
          const stopObj = s.stop || s;
          return stopObj.latitude && stopObj.longitude ? [stopObj.longitude, stopObj.latitude] : null;
        })
        .filter(Boolean);

      if (coordinates.length < 2) return;

      const geojson = {
        type: 'Feature',
        properties: { name: route.name, code: route.route_code },
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
      };

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: showRoutes ? 'visible' : 'none',
          },
          paint: {
            'line-color': route.id === 101 ? '#0ea5e9' : '#10b981',
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });
      }
    });
  };

  useEffect(() => {
    renderRoutePolylines();
  }, [mapLoaded, routes, showRoutes]);

  /**
   * Clears and re-renders HTML markers for stops and buses.
   */
  const renderMarkers = () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render Stop Markers
    if (showStops) {
      stops.forEach((stop) => {
        if (!stop.latitude || !stop.longitude) return;

        const el = document.createElement('div');
        el.className = 'custom-map-marker stop-marker';
        el.innerHTML = '📍';
        el.title = stop.name;

        el.addEventListener('click', () => {
          if (onSelectStop) onSelectStop(stop);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${stop.name}</strong>`))
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // Render Bus Markers
    if (showBuses) {
      activeBuses.forEach((busItem) => {
        const loc = busItem.location;
        if (!loc || !loc.latitude || !loc.longitude) return;

        const isLive = loc.status === 'live';
        const el = document.createElement('div');
        el.className = `custom-map-marker bus-marker ${isLive ? 'bus-live' : 'bus-stale'}`;
        el.innerHTML = '🚌';
        el.title = `${busItem.fleet_number || busItem.registration_number}`;

        el.addEventListener('click', () => {
          if (onSelectBus) onSelectBus(busItem);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div><strong>${busItem.fleet_number || 'Bus'}</strong><br/>${busItem.registration_number}<br/>Status: <em>${loc.status}</em><br/>Speed: <strong>${loc.speed || 0} km/h</strong></div>`
            )
          )
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  };

  useEffect(() => {
    renderMarkers();
  }, [mapLoaded, stops, activeBuses, showStops, showBuses]);

  /**
   * Resets map view to default Vadodara center coordinates.
   */
  const handleResetCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [73.1812, 22.3106], zoom: 12.5, duration: 1200 });
  };

  /**
   * Centers map camera on selected target item if provided.
   */
  useEffect(() => {
    if (!mapRef.current || !selectedItem) return;
    const map = mapRef.current;

    let coords = null;
    if (selectedItem.latitude && selectedItem.longitude) {
      coords = [selectedItem.longitude, selectedItem.latitude];
    } else if (selectedItem.location && selectedItem.location.latitude) {
      coords = [selectedItem.location.longitude, selectedItem.location.latitude];
    }

    if (coords) {
      map.flyTo({ center: coords, zoom: 15, duration: 1500 });
    }
  }, [selectedItem]);

  return (
    <div className="passenger-view map-view-container">
      <div className="map-view-header">
        <div className="map-title-row">
          <h2 className="view-title">Vadodara Live Transit Map</h2>
          <div className="map-header-actions">
            <button
              type="button"
              className="icon-back-btn"
              onClick={handleResetCenter}
              title="Reset Map Center"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="map-layer-toggles">
          <button
            type="button"
            className={`chip-btn ${showRoutes ? 'chip-active' : ''}`}
            onClick={() => setShowRoutes(!showRoutes)}
          >
            <RouteIcon size={13} /> Routes
          </button>
          <button
            type="button"
            className={`chip-btn ${showStops ? 'chip-active' : ''}`}
            onClick={() => setShowStops(!showStops)}
          >
            <MapPin size={13} /> Stops ({stops.length})
          </button>
          <button
            type="button"
            className={`chip-btn ${showBuses ? 'chip-active' : ''}`}
            onClick={() => setShowBuses(!showBuses)}
          >
            <Bus size={13} /> Buses ({activeBuses.length})
          </button>
        </div>
      </div>

      <div className="map-frame" ref={mapContainerRef}>
        {!mapLoaded && <div className="map-loading-overlay">Loading Vadodara Transit Map...</div>}
      </div>

      <div className="map-controls-bar">
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-icon stop-icon">📍</span> Bus Stop
          </span>
          <span className="legend-item">
            <span className="legend-icon bus-live-icon">🚌</span> Live Tracked
          </span>
          <span className="legend-item">
            <span className="legend-icon bus-stale-icon">🚌</span> Stale Location
          </span>
        </div>
      </div>
    </div>
  );
}
