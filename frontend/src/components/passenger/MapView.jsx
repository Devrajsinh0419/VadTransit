import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchStops, fetchBuses, fetchBusLocation, fetchRoutes } from '../../services/api';
import { RotateCcw, MapPin, Bus, Route as RouteIcon } from 'lucide-react';

// OpenFreeMap vector style URL (OpenStreetMap-based free basemap style)
const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Standard OpenStreetMap raster tile style fallback in case of vector tile network failure
const RASTER_OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * MapView component displaying Vadodara basemap, OpenStreetMap vector tiles, route polylines, stop markers, and directional live bus markers.
 * 
 * @param {Object} props - MapView props.
 * @param {Object} [props.selectedItem] - Item object to focus/center on map (route, stop, or bus).
 * @param {Function} [props.onSelectStop] - Callback when a stop marker is clicked.
 * @param {Function} [props.onSelectBus] - Callback when a bus marker is clicked.
 * @returns {JSX.Element} Rendered map view component.
 */
export default function MapView({ selectedItem, onSelectStop, onSelectBus }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Layer visibility state
  const [showStops, setShowStops] = useState(true);
  const [showBuses, setShowBuses] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  /**
   * Initializes MapLibre GL map instance using OpenFreeMap vector style with OpenStreetMap raster fallback.
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OPENFREEMAP_STYLE_URL,
        center: [73.1812, 22.3106],
        zoom: 12.8,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      /**
       * Handles successful map load event.
       */
      map.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        map.resize();
      });

      /**
       * Handles map error event and applies OpenStreetMap raster tiles fallback if primary vector style fails.
       */
      map.on('error', (e) => {
        console.warn('MapLibre style loading issue, switching to OpenStreetMap raster fallback:', e);
        if (!mapRef.current) return;
        
        // If map hasn't loaded yet due to primary style error, apply robust raster tile fallback
        try {
          mapRef.current.setStyle(RASTER_OSM_FALLBACK_STYLE);
        } catch (fallbackErr) {
          console.error('Failed applying raster map fallback:', fallbackErr);
          setMapError('Could not load basemap tiles. Please check your internet connection.');
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Error initializing MapLibre GL map instance', err);
      setMapError('Failed initializing map container.');
    }

    /**
     * Resizes map canvas on window resize.
     */
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /**
   * Loads stops, routes, and active bus locations from backend services.
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
      console.error('Failed loading transport data for map overlays', err);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  /**
   * Renders dual-casing polyline paths for bus routes on the MapLibre map layer.
   */
  const renderRoutePolylines = () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    routes.forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const casingLayerId = `route-casing-${route.id}`;
      const lineLayerId = `route-line-${route.id}`;

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

        // Outer casing layer for high contrast over map tiles
        map.addLayer({
          id: casingLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: showRoutes ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#0f172a',
            'line-width': 7,
            'line-opacity': 0.6,
          },
        });

        // Foreground transit line
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: showRoutes ? 'visible' : 'none',
          },
          paint: {
            'line-color': route.id === 101 ? '#1d4ed8' : '#16a34a',
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        });
      }
    });
  };

  useEffect(() => {
    renderRoutePolylines();
  }, [mapLoaded, routes, showRoutes]);

  /**
   * Clears and re-renders custom SVG markers for stops and directional buses.
   */
  const renderMarkers = () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render Stop Vector Pin Markers
    if (showStops) {
      stops.forEach((stop) => {
        if (!stop.latitude || !stop.longitude) return;

        const el = document.createElement('div');
        el.className = 'stop-marker-svg';
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#1d4ed8">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `;
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

    // Render Bus Markers with Directional Heading Arrow Rotation
    if (showBuses) {
      activeBuses.forEach((busItem) => {
        const loc = busItem.location;
        if (!loc || !loc.latitude || !loc.longitude) return;

        const isLive = loc.status === 'live';
        const headingDeg = loc.heading || 0;

        const el = document.createElement('div');
        el.className = `bus-marker-svg ${isLive ? 'bus-live' : 'bus-stale'}`;
        el.style.transform = `rotate(${headingDeg}deg)`;
        el.innerHTML = `
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="${isLive ? '#16a34a' : '#d97706'}" stroke="#ffffff" stroke-width="2.5"/>
            <path d="M16 6 L22 22 L16 18 L10 22 Z" fill="#ffffff"/>
          </svg>
        `;
        el.title = `${busItem.fleet_number || busItem.registration_number}`;

        el.addEventListener('click', () => {
          if (onSelectBus) onSelectBus(busItem);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 0.85rem;">
                <strong style="color: #0f172a;">${busItem.fleet_number || 'Bus'}</strong><br/>
                <span style="color: #64748b;">${busItem.registration_number}</span><br/>
                Status: <strong style="color: ${isLive ? '#16a34a' : '#d97706'};">${loc.status.toUpperCase()}</strong><br/>
                Speed: <strong>${loc.speed || 0} km/h</strong> • Heading: ${headingDeg}°
              </div>`
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
   * Resets map camera to default Vadodara center coordinates.
   */
  const handleResetCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [73.1812, 22.3106], zoom: 12.8, duration: 1200 });
  };

  /**
   * Centers map camera on selected target item (route, stop, or bus) if provided.
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
          <h2 className="view-title" style={{ fontSize: '1.1rem' }}>Vadodara Transit Map</h2>
          <div className="map-header-actions">
            <button
              type="button"
              className="icon-back-btn"
              onClick={handleResetCenter}
              title="Reset Map View"
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
        {!mapLoaded && !mapError && (
          <div className="map-loading-overlay">Initializing Vadodara Transit Map...</div>
        )}
        {mapError && (
          <div className="map-loading-overlay" style={{ color: '#b91c1c', backgroundColor: '#fee2e2' }}>
            {mapError}
          </div>
        )}
      </div>

      <div className="map-controls-bar">
        <div className="map-legend">
          <span className="legend-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d4ed8"><circle cx="12" cy="12" r="8"/></svg> Stop
          </span>
          <span className="legend-item">
            <svg width="14" height="14" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#16a34a"/></svg> Live Bus
          </span>
          <span className="legend-item">
            <svg width="14" height="14" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#d97706"/></svg> Recent / Stale
          </span>
        </div>
      </div>
    </div>
  );
}
