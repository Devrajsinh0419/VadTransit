import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Map, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { fetchRouteEtas } from '../../services/api';

/**
 * RouteDetail component showing ordered stops timeline, distances, estimated travel times, and operating buses.
 * 
 * @param {Object} props - RouteDetail props.
 * @param {Object} props.route - Route data object.
 * @param {Function} props.onBack - Callback to return to route list.
 * @param {Function} props.onSelectStop - Callback to select a stop.
 * @param {Function} props.onViewOnMap - Callback to view route on map.
 * @param {Array<number|string>} props.favoriteRouteIds - Saved favorite route IDs.
 * @param {Function} props.onToggleFavorite - Callback to toggle favorite state.
 * @returns {JSX.Element|null} Rendered route detail view.
 */
export default function RouteDetail({
  route,
  onBack,
  onSelectStop,
  onViewOnMap,
  favoriteRouteIds = [],
  onToggleFavorite,
}) {
  const [etas, setEtas] = useState([]);

  /**
   * Loads active ETAs for buses currently operating on this route.
   */
  const loadEtas = async () => {
    if (!route || !route.id) return;
    try {
      const data = await fetchRouteEtas(route.id);
      setEtas(data);
    } catch (err) {
      console.error('Failed loading route ETAs', err);
    }
  };

  useEffect(() => {
    loadEtas();
  }, [route]);

  if (!route) return null;

  const isFav = favoriteRouteIds.includes(route.id);
  const orderedStops = route.stops ? [...route.stops].sort((a, b) => a.stop_order - b.stop_order) : [];

  return (
    <div className="passenger-view route-detail-view">
      <div className="detail-top-bar">
        <button type="button" className="icon-back-btn" onClick={onBack} title="Back to Routes">
          <ArrowLeft size={18} />
        </button>
        <span className="detail-route-badge">{route.route_code || `R-${route.id}`}</span>
        <button
          type="button"
          className={`fav-btn ${isFav ? 'fav-active' : ''}`}
          onClick={() => onToggleFavorite && onToggleFavorite(route.id)}
          title={isFav ? 'Remove favorite' : 'Save favorite'}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="detail-header-card">
        <h2 className="detail-title">{route.name}</h2>
        <div className="detail-actions-row">
          <button
            type="button"
            className="action-btn primary-action"
            onClick={() => onViewOnMap && onViewOnMap(route)}
          >
            <Map size={16} />
            <span>View Route on Map</span>
          </button>
        </div>
      </div>

      {etas.length > 0 && (
        <div className="active-buses-section">
          <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
            Operating Buses ({etas.length})
          </h3>
          <div className="card-list">
            {etas.map((etaItem, idx) => (
              <div key={idx} className="eta-display-card" style={{ padding: '12px 14px' }}>
                <div className="eta-card-top">
                  <span className="bus-meta-title">Bus #{etaItem.bus_id}</span>
                  <StatusBadge type={etaItem.source} />
                </div>
                <div className="eta-card-body" style={{ padding: '8px 12px' }}>
                  <div className="eta-digit-container">
                    <span className="eta-big-val" style={{ fontSize: '1.6rem' }}>~{etaItem.eta_minutes || 5}</span>
                    <span className="eta-min-unit">MIN</span>
                  </div>
                  <div className="eta-time-breakdown">
                    <div className="eta-sub-item">
                      <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      <span>ETA: <strong>{new Date(etaItem.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stops-timeline-section">
        <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '10px' }}>
          Stops Sequence ({orderedStops.length})
        </h3>

        <div className="timeline-container">
          {orderedStops.map((item, index) => {
            const stop = item.stop || item;
            const isFirst = index === 0;
            const isLast = index === orderedStops.length - 1;

            return (
              <div
                key={item.id || index}
                className="timeline-item"
                onClick={() => onSelectStop && onSelectStop(stop)}
              >
                <div className="timeline-marker-column">
                  <div className={`timeline-dot ${isFirst ? 'dot-start' : isLast ? 'dot-end' : ''}`} />
                  {!isLast && <div className="timeline-line" />}
                </div>

                <div className="timeline-content card-hover">
                  <div className="timeline-stop-info">
                    <span className="stop-order">#{item.stop_order}</span>
                    <h4 className="stop-name">{stop.name}</h4>
                  </div>
                  {item.distance_from_previous_stop > 0 && (
                    <div className="stop-metrics">
                      <span>{item.distance_from_previous_stop} km</span>
                      <span className="metric-dot">•</span>
                      <span>~{item.expected_travel_time} min travel time</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
