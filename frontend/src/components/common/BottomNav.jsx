import React from 'react';
import { Route, MapPin, Map, Star, AlertTriangle } from 'lucide-react';

/**
 * Mobile-first bottom navigation bar component for passenger views.
 * Enhanced with expressive interactions, submarine-style active state indicators,
 * and modern Indian transit aesthetic.
 * 
 * @param {Object} props - BottomNav props.
 * @param {string} props.activeTab - Currently active tab key ('routes', 'stops', 'map', 'favorites', 'alerts').
 * @param {Function} props.setActiveTab - Callback function to change active tab.
 * @param {number} [props.alertCount=0] - Active alert count badge.
 * @returns {JSX.Element} Bottom navigation bar UI element.
 */
export default function BottomNav({ activeTab, setActiveTab, alertCount = 0 }) {
  const tabs = [
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'stops', label: 'Stops', icon: MapPin },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'favorites', label: 'Saved', icon: Star },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alertCount },
  ];

  return (
    <nav className="bottom-nav" aria-label="Passenger navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={isActive}
          >
            <div className="nav-icon-container">
              <Icon size={20} />
            </div>
            <span className="nav-label">{tab.label}</span>
            {Boolean(tab.badge) && tab.badge > 0 && (
              <span className="nav-badge">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}