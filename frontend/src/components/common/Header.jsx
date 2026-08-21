import React from 'react';
import { Bus, Bell, RefreshCw } from 'lucide-react';

/**
 * Top navigation header component for VadTransit passenger interface.
 * @param {Object} props - Header component properties.
 * @param {Function} props.onRefresh - Callback function to refresh active view data.
 * @param {number} props.activeAlertCount - Count of active service alerts.
 * @param {Function} props.onOpenAlerts - Callback to switch to alerts view.
 * @returns {JSX.Element} The rendered header element.
 */
export default function Header({ onRefresh, activeAlertCount = 0, onOpenAlerts }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <Bus className="brand-icon" size={22} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">VadTransit</h1>
          <span className="brand-subtitle">Vadodara Real-time Transit</span>
        </div>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenAlerts}
          title="Service Alerts"
          aria-label="Service Alerts"
        >
          <Bell size={20} />
          {activeAlertCount > 0 && <span className="alert-badge">{activeAlertCount}</span>}
        </button>
        <button
          type="button"
          className="header-icon-btn"
          onClick={onRefresh}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw size={19} />
        </button>
      </div>
    </header>
  );
}
