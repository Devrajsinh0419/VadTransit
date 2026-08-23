import React, { useState, useEffect } from 'react';
import { BellRing, Calendar } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { fetchAlerts } from '../../services/api';

/**
 * AlertsView component displaying active service disruptions, delays, and transit notices.
 * 
 * @param {Object} props - AlertsView props.
 * @param {Function} [props.onAlertCountChange] - Callback to report total active alert count.
 * @returns {JSX.Element} Rendered alerts view.
 */
export default function AlertsView({ onAlertCountChange }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Loads active service and delay alerts from API.
   */
  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
      if (onAlertCountChange) {
        onAlertCountChange(data.filter((a) => a.is_active).length);
      }
    } catch (err) {
      console.error('Failed loading service alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /**
   * Formats ISO date timestamp string into human readable alert date/time.
   * @param {string} isoString - Date string.
   * @returns {string} Human readable date string.
   */
  const formatDate = (isoString) => {
    if (!isoString) return 'Ongoing';
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="passenger-view alerts-view">
      <div className="view-header">
        <h2 className="view-title">Service & Delay Alerts</h2>
        <p className="view-subtitle">Live updates on Vadodara transit conditions and delays</p>
      </div>

      {loading ? (
        <div className="loading-state">Checking active service alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <BellRing size={36} className="empty-icon" />
          <h3>No Active Alerts</h3>
          <p style={{ marginTop: '4px' }}>All Vadodara transit routes are operating according to schedule.</p>
        </div>
      ) : (
        <div className="card-list">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-card-header">
                <StatusBadge type={alert.severity} />
                <span className="alert-time">
                  <Calendar size={13} />
                  {formatDate(alert.starts_at)}
                </span>
              </div>
              <h3 className="alert-title">{alert.title}</h3>
              <p className="alert-message">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
