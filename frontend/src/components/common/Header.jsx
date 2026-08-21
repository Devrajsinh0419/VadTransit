import React from 'react';
import { Bus, Bell, RefreshCw, Route, MapPin, Map, Star, AlertTriangle } from 'lucide-react';

/**
 * Top navigation header component for VadTransit passenger interface.
 * Displays brand identity, service alert badge counter, desktop navigation tabs, and data refresh trigger.
 * 
 * @param {Object} props - Header component properties.
 * @param {Function} props.onRefresh - Callback function to refresh active view data.
 * @param {number} [props.activeAlertCount=0] - Count of active service alerts.
 * @param {Function} props.onOpenAlerts - Callback to switch to alerts view.
 * @param {string} [props.activeTab='routes'] - Currently active navigation tab identifier.
 * @param {Function} [props.onTabChange] - Callback to switch active navigation tab.
 * @returns {JSX.Element} The rendered header bar element.
 */
export default function Header({
  onRefresh,
  activeAlertCount = 0,
  onOpenAlerts,
  activeTab = 'routes',
  onTabChange,
}) {
  /**
   * Handles tab button selection on desktop header navigation bar.
   * @param {string} tabId - Selected navigation tab identifier.
   */
  const handleTabClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const desktopTabs = [
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'stops', label: 'Stops', icon: MapPin },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'favorites', label: 'Saved', icon: Star },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertCount },
  ];

  return (
    <header className="app-header">
      <div className="header-brand" onClick={() => handleTabClick('routes')}>
        <div className="brand-icon-wrapper">
          <Bus size={18} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">VadTransit</h1>
          <span className="brand-subtitle">Vadodara Transit</span>
        </div>
      </div>

      {/* Desktop Top Navigation Tabs */}
      <nav className="desktop-nav-tabs" aria-label="Desktop main navigation">
        {desktopTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`desktop-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && tab.badge > 0 && (
                <span className="alert-badge" style={{ position: 'static', marginLeft: '4px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenAlerts}
          title="Service Alerts"
          aria-label="Service Alerts"
        >
          <Bell size={17} />
          {activeAlertCount > 0 && <span className="alert-badge">{activeAlertCount}</span>}
        </button>
        <button
          type="button"
          className="header-icon-btn"
          onClick={onRefresh}
          title="Refresh Transport Data"
          aria-label="Refresh Transport Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
}
