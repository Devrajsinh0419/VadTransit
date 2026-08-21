import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Bus, MapPin, Map } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { fetchStopArrivals } from '../../services/api';

/**
 * StopDetail component presenting approaching buses and live/projected ETAs for a selected stop.
 * 
 * @param {Object} props - Component properties.
 * @param {Object} props.stop - Stop data object.
 * @param {Function} props.onBack - Callback to return to stop list.
 * @param {Function} props.onSelectBus - Callback to open detailed live bus tracking view.
 * @param {Function} props.onViewOnMap - Callback to locate stop on map.
 * @param {Array<number|string>} props.favoriteStopIds - Saved stop IDs.
 * @param {Function} props.onToggleFavorite - Callback to toggle favorite state.
 * @returns {JSX.Element|null} Rendered stop detail view.
 */
export default function StopDetail({
  stop,
  onBack,
  onSelectBus,
  onViewOnMap,
  favoriteStopIds = [],
  onToggleFavorite,
}) {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Loads approaching buses and calculated ETAs for this stop.
   */
  const loadArrivals = async () => {
    if (!stop || !stop.id) return;
    setLoading(true);
    try {
      const data = await fetchStopArrivals(stop.id);
      setArrivals(data);
    } catch (err) {
      console.error('Failed fetching stop arrivals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArrivals();
  }, [stop]);

  if (!stop) return null;

  const isFav = favoriteStopIds.includes(stop.id);

  return (
    <div className="passenger-view stop-detail-view">
      <div className="detail-top-bar">
        <button type="button" className="icon-back-btn" onClick={onBack} title="Back to Stops">
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
          <MapPin size={16} />
          <span>Stop Details</span>
        </div>
        <button
          type="button"
          className={`fav-btn ${isFav ? 'fav-active' : ''}`}
          onClick={() => onToggleFavorite && onToggleFavorite(stop.id)}
          title={isFav ? 'Remove favorite' : 'Save favorite'}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="detail-header-card">
        <h2 className="detail-title">{stop.name}</h2>
        <div className="detail-actions-row">
          <button
            type="button"
            className="action-btn primary-action"
            onClick={() => onViewOnMap && onViewOnMap(stop)}
          >
            <Map size={16} />
            <span>Locate Stop on Map</span>
          </button>
        </div>
      </div>

      <div className="arrivals-section">
        <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '10px' }}>
          Approaching Buses ({arrivals.length})
        </h3>

        {loading ? (
          <div className="loading-state">Checking live bus arrival times...</div>
        ) : arrivals.length === 0 ? (
          <div className="empty-state">No buses currently approaching this stop.</div>
        ) : (
          <div className="card-list">
            {arrivals.map((item, idx) => (
              <div
                key={idx}
                className="eta-display-card card-hover"
                onClick={() => onSelectBus && onSelectBus({ id: item.bus_id, registration_number: item.registration_number, fleet_number: item.fleet_number })}
              >
                <div className="eta-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="route-code-badge">{item.route_code}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.fleet_number}</span>
                  </div>
                  <StatusBadge type={item.source} />
                </div>

                <div className="eta-card-body" style={{ padding: '10px 14px' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.route_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.registration_number}</div>
                  </div>
                  <div className="eta-digit-container">
                    <span className="eta-big-val" style={{ fontSize: '1.8rem' }}>~{item.eta_minutes}</span>
                    <span className="eta-min-unit">MIN</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
