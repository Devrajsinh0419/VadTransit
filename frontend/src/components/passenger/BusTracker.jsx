import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bus, Clock, Navigation, Gauge, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { fetchBusLocation, fetchBusEta, fetchRouteDetails } from '../../services/api';
import { subscribeBusTracking } from '../../services/websocket';

/**
 * BusTracker component providing real-time WebSocket tracking, telemetry, ETA indicators, and route progress.
 * 
 * @param {Object} props - BusTracker props.
 * @param {Object} props.bus - Target bus object.
 * @param {Function} props.onBack - Callback to return to previous view.
 * @param {Function} props.onViewOnMap - Callback to locate bus on map.
 * @returns {JSX.Element|null} Rendered live tracking view.
 */
export default function BusTracker({ bus, onBack, onViewOnMap }) {
  const [locationData, setLocationData] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);

  /**
   * Fetches initial GPS location, calculated ETA, and route stops for the bus.
   */
  const loadBusData = async () => {
    if (!bus || !bus.id) return;
    setLoading(true);
    try {
      const [loc, eta] = await Promise.all([
        fetchBusLocation(bus.id),
        fetchBusEta(bus.id),
      ]);

      setLocationData(loc);
      setEtaData(eta);

      if (eta && eta.route_id) {
        const rData = await fetchRouteDetails(eta.route_id);
        setRouteInfo(rData);
      }
    } catch (err) {
      console.error('Failed fetching bus tracking info', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Subscribes to WebSocket realtime bus tracking updates with polling fallback.
   */
  useEffect(() => {
    if (!bus || !bus.id) return;

    loadBusData();

    // 1. Subscribe to WebSocket /ws/buses/{bus_id}/
    const unsubscribe = subscribeBusTracking(
      bus.id,
      (data) => {
        setIsRealtime(true);
        if (data.latitude && data.longitude) {
          setLocationData((prev) => ({ ...prev, ...data, status: 'live' }));
        }
        if (data.eta) {
          setEtaData((prev) => ({ ...prev, ...data, source: 'live' }));
        }
      },
      () => {
        setIsRealtime(false);
      }
    );

    // 2. High-frequency polling backup (every 10 seconds)
    const pollInterval = setInterval(() => {
      if (!isRealtime) {
        loadBusData();
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [bus]);

  if (!bus) return null;

  /**
   * Formats ISO timestamp to relative duration or local time string.
   * @param {string} isoString - ISO date string.
   * @returns {string} Human readable formatted time.
   */
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const etaSource = etaData ? etaData.source : 'scheduled';
  const routeStops = routeInfo && routeInfo.stops ? routeInfo.stops : [];

  return (
    <div className="passenger-view bus-tracker-view">
      <div className="detail-top-bar">
        <button type="button" className="icon-back-btn" onClick={onBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.92rem' }}>
          <Bus size={18} />
          <span>{bus.fleet_number || `Bus #${bus.id}`}</span>
        </div>
        <button type="button" className="icon-back-btn" onClick={loadBusData} title="Refresh Tracking">
          <RefreshCw size={17} className={loading ? 'spin-icon' : ''} />
        </button>
      </div>

      <div className="tracker-hero-card">
        <div className="tracker-hero-header">
          <div>
            <h2 className="tracker-bus-name">{bus.registration_number || `GJ-06-VT-${bus.id}`}</h2>
            <span className="tracker-fleet">
              {bus.fleet_number || `Fleet Bus #${bus.id}`} {isRealtime && ' • (WebSocket Connected)'}
            </span>
          </div>
          <StatusBadge type={etaSource} />
        </div>

        {etaData && (
          <div className="tracker-eta-main">
            <div className="eta-big-box">
              <span className="eta-big-number">~{etaData.eta_minutes || 5}</span>
              <span className="eta-unit">MINUTES</span>
            </div>
            <div className="eta-details">
              <div className="eta-meta-item">
                <Clock size={14} />
                <span>Estimated Arrival: <strong>{new Date(etaData.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
              </div>
              <div className="eta-meta-item">
                <ShieldCheck size={14} />
                <span>Source: <strong>{etaSource.toUpperCase()}</strong></span>
              </div>
            </div>
          </div>
        )}

        {etaSource !== 'live' && (
          <div className="notice-banner warning-notice flex-notice">
            <AlertTriangle size={15} />
            <span>
              {etaSource === 'recent'
                ? 'Live GPS signal interrupted. Using recent bus trajectory.'
                : 'No recent live updates. Displaying fallback schedule timetable.'}
            </span>
          </div>
        )}
      </div>

      <div className="telemetry-grid">
        <div className="telemetry-card">
          <div className="telemetry-icon">
            <Gauge size={20} />
          </div>
          <div className="telemetry-info">
            <span className="telemetry-label">Current Speed</span>
            <span className="telemetry-value">
              {locationData && locationData.speed !== undefined ? `${locationData.speed} km/h` : '0.0 km/h'}
            </span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon">
            <Navigation size={20} />
          </div>
          <div className="telemetry-info">
            <span className="telemetry-label">Heading</span>
            <span className="telemetry-value">
              {locationData && locationData.heading !== undefined ? `${locationData.heading}°` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="telemetry-card full-width-card">
          <div className="telemetry-icon">
            <Clock size={20} />
          </div>
          <div className="telemetry-info">
            <span className="telemetry-label">Last GPS Location Fix</span>
            <span className="telemetry-value">
              {locationData ? formatTime(locationData.recorded_at) : 'Waiting for GPS signal...'}
            </span>
          </div>
        </div>
      </div>

      {routeStops.length > 0 && (
        <div className="route-progress-card">
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Route Progress</h4>
          <div className="progress-bar-container">
            <div className="progress-track" />
            <div className="progress-fill" style={{ width: '45%' }} />
            <div className="bus-progress-marker" style={{ left: '45%' }}>
              🚌
            </div>
          </div>
          <div className="progress-stops-labels">
            <span className="origin-label">{routeStops[0]?.stop?.name || routeStops[0]?.name || 'Origin'}</span>
            <span className="dest-label">{routeStops[routeStops.length - 1]?.stop?.name || routeStops[routeStops.length - 1]?.name || 'Destination'}</span>
          </div>
        </div>
      )}

      <div className="tracker-actions">
        <button
          type="button"
          className="action-btn primary-action wide-action"
          onClick={() => onViewOnMap && onViewOnMap({ bus, location: locationData })}
        >
          <Navigation size={17} />
          <span>Track Bus Position on Live Map</span>
        </button>
      </div>
    </div>
  );
}
