import React from 'react';
import { Clock, Calendar, AlertCircle, Info, ShieldAlert } from 'lucide-react';

/**
 * Reusable StatusBadge component indicating live, recent (projected), scheduled, stale, or offline data freshness.
 * 
 * @param {Object} props - StatusBadge props.
 * @param {'live'|'recent'|'scheduled'|'stale'|'offline'|'info'|'warning'|'critical'} props.type - Status or source key.
 * @param {string} [props.label] - Optional override text label.
 * @returns {JSX.Element} The rendered status badge.
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
        return { isLiveDot: true, defaultLabel: 'LIVE', className: 'badge-live' };
      case 'recent':
        return { icon: Clock, defaultLabel: 'PROJECTED', className: 'badge-recent' };
      case 'scheduled':
        return { icon: Calendar, defaultLabel: 'TIMETABLE', className: 'badge-scheduled' };
      case 'stale':
        return { icon: Clock, defaultLabel: 'STALE', className: 'badge-stale' };
      case 'offline':
        return { icon: AlertCircle, defaultLabel: 'OFFLINE', className: 'badge-offline' };
      case 'critical':
        return { icon: ShieldAlert, defaultLabel: 'CRITICAL', className: 'badge-critical' };
      case 'warning':
        return { icon: AlertCircle, defaultLabel: 'WARNING', className: 'badge-warning' };
      case 'info':
      default:
        return { icon: Info, defaultLabel: 'INFO', className: 'badge-info' };
    }
  };

  const config = getBadgeConfig(type);
  const Icon = config.icon;
  const textLabel = label || config.defaultLabel;

  return (
    <span className={`status-badge ${config.className}`}>
      {config.isLiveDot ? (
        <span className="status-dot-indicator" aria-hidden="true" />
      ) : (
        Icon && <Icon size={11} className="badge-icon" />
      )}
      <span>{textLabel}</span>
    </span>
  );
}
