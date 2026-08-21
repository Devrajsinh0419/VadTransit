import { useState, useEffect } from 'react';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { endShift } from '../../services/api';

/**
 * Driver Dashboard component during an active shift.
 * Displays high-visibility tracking status, shift details, and a single End Shift action.
 * Minimal interaction required while driving.
 * 
 * @param {Object} props
 * @param {Object} props.activeShift - Active shift data.
 * @param {Function} props.onShiftEnded - Callback invoked when the shift is ended.
 */
export function DriverDashboard({ activeShift, onShiftEnded }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [endingShift, setEndingShift] = useState(false);
  const [error, setError] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const { trackingStatus, updateCount, lastLocation, lastError } = useLocationTracking(
    activeShift,
    true
  );

  /**
   * Timer effect to update elapsed shift duration every minute.
   */
  useEffect(() => {
    const startTime = activeShift.started_at
      ? new Date(activeShift.started_at).getTime()
      : Date.now();

    const updateDuration = () => {
      const now = Date.now();
      const diffMs = Math.max(0, now - startTime);
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 30000);
    return () => clearInterval(interval);
  }, [activeShift]);

  /**
   * Handles ending the active driver shift.
   */
  const handleEndShift = async () => {
    try {
      setEndingShift(true);
      setError(null);
      await endShift(activeShift.id);
      setShowConfirmModal(false);
      onShiftEnded();
    } catch (err) {
      setError(err.message || 'Failed to end shift.');
      setEndingShift(false);
    }
  };

  /**
   * Formats ISO timestamp into local time string (HH:MM:SS AM/PM).
   * @param {string} isoString - ISO date string.
   * @returns {string} Formatted local time.
   */
  const formatTime = (isoString) => {
    if (!isoString) return 'Waiting for GPS...';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  /**
   * Renders the current tracking status badge based on hook state.
   */
  const renderStatusBadge = () => {
    if (trackingStatus === 'tracking') {
      return (
        <span className="driver-status-badge status-live">
          <span className="status-dot pulse"></span>
          LIVE TRACKING ACTIVE
        </span>
      );
    }
    if (trackingStatus === 'reconnecting') {
      return (
        <span className="driver-status-badge status-reconnecting">
          <span className="status-dot pulse"></span>
          RECONNECTING...
        </span>
      );
    }
    return (
      <span className="driver-status-badge status-error">
        <span className="status-dot"></span>
        GPS/NETWORK ERROR
      </span>
    );
  };

  const routeName = activeShift.route
    ? `${activeShift.route.route_code} - ${activeShift.route.name}`
    : `Route #${activeShift.route_id}`;

  const busInfo = activeShift.bus
    ? `Bus #${activeShift.bus.fleet_number} (${activeShift.bus.registration_number})`
    : `Bus #${activeShift.bus_id}`;

  return (
    <div>
      {/* Driving Banner */}
      <div className="driving-mode-banner">
        ON SHIFT • NO INTERACTION REQUIRED WHILE DRIVING
      </div>

      {error && (
        <div className="driver-alert driver-alert-error">
          {error}
        </div>
      )}

      {lastError && (
        <div className="driver-alert driver-alert-error">
          {lastError}
        </div>
      )}

      {/* Main Shift Status Card */}
      <div className="driver-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Current Shift Status</h2>
          {renderStatusBadge()}
        </div>

        <div className="driver-info-grid">
          <div className="driver-info-item">
            <div className="driver-info-label">Assigned Route</div>
            <div className="driver-info-value">{routeName}</div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">Bus Vehicle</div>
            <div className="driver-info-value">{busInfo}</div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">Driver ID</div>
            <div className="driver-info-value">#{activeShift.driver_id}</div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">Shift Duration</div>
            <div className="driver-info-value">{elapsedMinutes} min</div>
          </div>
        </div>
      </div>

      {/* GPS Tracking Metrics Card */}
      <div className="driver-card">
        <h2>Live Location Metrics</h2>
        <div className="driver-info-grid">
          <div className="driver-info-item">
            <div className="driver-info-label">Updates Sent</div>
            <div className="driver-info-value" style={{ fontSize: '1.4rem', color: '#38bdf8' }}>
              {updateCount}
            </div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">Last Transmission</div>
            <div className="driver-info-value">
              {formatTime(lastLocation?.recorded_at)}
            </div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">Current Position</div>
            <div className="driver-info-value" style={{ fontSize: '0.9rem' }}>
              {lastLocation
                ? `${lastLocation.latitude}, ${lastLocation.longitude}`
                : 'Acquiring GPS...'}
            </div>
          </div>

          <div className="driver-info-item">
            <div className="driver-info-label">GPS Accuracy</div>
            <div className="driver-info-value">
              {lastLocation?.accuracy ? `± ${lastLocation.accuracy} m` : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button
            type="button"
            className="driver-btn driver-btn-danger"
            onClick={() => setShowConfirmModal(true)}
          >
            END SHIFT
          </button>
        </div>
      </div>

      {/* End Shift Confirmation Modal */}
      {showConfirmModal && (
        <div className="driver-modal-overlay">
          <div className="driver-modal-content">
            <h2>End Shift?</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
              Are you sure you want to end your shift? Location tracking for Bus #{activeShift.bus_id} will stop.
            </p>
            <div className="driver-modal-actions">
              <button
                type="button"
                className="driver-btn driver-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={endingShift}
              >
                Cancel
              </button>
              <button
                type="button"
                className="driver-btn driver-btn-danger"
                onClick={handleEndShift}
                disabled={endingShift}
              >
                {endingShift ? 'Ending...' : 'Yes, End Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
