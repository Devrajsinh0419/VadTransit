import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * EtaDisplayCard component presenting backend ETA data, source fallback level, and data freshness details.
 * 
 * @param {Object} props - Component props.
 * @param {Object} props.eta - Backend ETA object ({ eta, source, calculated_at, last_location_at, eta_minutes, bus_id }).
 * @param {string} [props.busLabel] - Fleet/registration display label.
 * @param {Function} [props.onTap] - Optional click callback.
 * @returns {JSX.Element|null} Rendered ETA display element.
 */
export default function EtaDisplayCard({ eta, busLabel, onTap }) {
  if (!eta) return null;

  /**
   * Formats ISO date string into local HH:MM AM/PM time string.
   * @param {string} isoString - Date string.
   * @returns {string} Formatted time string.
   */
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Calculates relative duration string from now (e.g., "12 sec ago", "2 min ago").
   * @param {string} isoString - Date string.
   * @returns {string} Relative time string.
   */
  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'N/A';
    const diffSec = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} sec ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    return `${Math.floor(diffSec / 3600)} hr ago`;
  };

  // Freshness check: if last_location_at is older than 5 minutes (300 seconds), flag source as recent/projected
  const lastLocAgeSec = eta.last_location_at
    ? Math.floor((new Date() - new Date(eta.last_location_at)) / 1000)
    : 0;

  const isStaleLocation = lastLocAgeSec > 300;
  const effectiveSource = isStaleLocation && eta.source === 'live' ? 'recent' : eta.source || 'scheduled';
  const etaMinutes = eta.eta_minutes !== undefined ? eta.eta_minutes : 5;

  return (
    <div
      className={`eta-display-card ${onTap ? 'card-hover' : ''}`}
      onClick={onTap}
      role={onTap ? 'button' : 'region'}
    >
      <div className="eta-card-top">
        <div className="eta-bus-meta">
          <span className="bus-meta-title">{busLabel || `Bus #${eta.bus_id}`}</span>
        </div>
        <StatusBadge type={effectiveSource} />
      </div>

      <div className="eta-card-body">
        <div className="eta-digit-container">
          <span className="eta-big-val">~{etaMinutes}</span>
          <span className="eta-min-unit">MIN</span>
        </div>
        <div className="eta-time-breakdown">
          <div className="eta-sub-item">
            <span>Expected Arrival: <strong>{formatTime(eta.eta)}</strong></span>
          </div>
          <div className="eta-sub-item">
            <span>Source: <strong>{effectiveSource.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

      <div className="eta-card-timestamps">
        <div className="timestamp-item">
          <span>Server Calc: </span>
          <strong>{formatRelativeTime(eta.calculated_at)}</strong>
        </div>
        <div className="timestamp-item">
          <span>Last GPS Fix: </span>
          <strong>{formatRelativeTime(eta.last_location_at)}</strong>
        </div>
      </div>

      {effectiveSource === 'recent' && (
        <div className="notice-banner warning-notice flex-notice">
          <AlertTriangle size={13} />
          <span>PROJECTED · Live signal interrupted. Location estimated from last fix ({formatRelativeTime(eta.last_location_at)}).</span>
        </div>
      )}

      {effectiveSource === 'scheduled' && (
        <div className="notice-banner info-notice flex-notice" style={{ background: '#f0f9ff', color: '#075985', border: '1px solid #bae6fd' }}>
          <Calendar size={13} />
          <span>TIMETABLE · Based on scheduled timetable arrival.</span>
        </div>
      )}
    </div>
  );
}
