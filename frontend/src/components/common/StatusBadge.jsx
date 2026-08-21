import React from 'react';
import { Radio, Clock, Calendar, AlertCircle, Info, ShieldAlert } from 'lucide-react';

/**
 * Reusable StatusBadge component to indicate live/recent/scheduled ETA sources, bus tracking states, and alert severities.
 * @param {Object} props - StatusBadge props.
 * @param {'live'|'recent'|'scheduled'|'stale'|'offline'|'info'|'warning'|'critical'} props.type - Status or source key.
 * @param {string} [props.label] - Optional override text label.
 * @returns {JSX.Element} The status badge element.
 */
export default function StatusBadge({ type, label }) {
  /**
   * Helper to retrieve icon and CSS class configuration based on status type.
   * @param {string} statusType - Status type key.
   * @returns {Object} Config object with icon, defaultLabel, and className.
   */
  const getBadgeConfig = (statusType) => {
    switch (statusType) {
      case 'live':
        return { icon: Radio, defaultLabel: 'Live Tracked', className: 'badge-live' };
      case 'recent':
        return { icon: Clock, defaultLabel: 'Recent Projection', className: 'badge-recent' };
      case 'scheduled':
        return { icon: Calendar, defaultLabel: 'Scheduled ETA', className: 'badge-scheduled' };
      case 'stale':
        return { icon: Clock, defaultLabel: 'Location Stale', className: 'badge-stale' };
      case 'offline':
        return { icon: AlertCircle, defaultLabel: 'Bus Offline', className: 'badge-offline' };
      case 'critical':
        return { icon: ShieldAlert, defaultLabel: 'Critical Alert', className: 'badge-critical' };
      case 'warning':
        return { icon: AlertCircle, defaultLabel: 'Warning', className: 'badge-warning' };
      case 'info':
      default:
        return { icon: Info, defaultLabel: 'Information', className: 'badge-info' };
    }
  };

  const config = getBadgeConfig(type);
  const Icon = config.icon;
  const textLabel = label || config.defaultLabel;

  return (
    <span className={`status-badge ${config.className}`}>
      <Icon size={13} className="badge-icon" />
      <span>{textLabel}</span>
    </span>
  );
}
