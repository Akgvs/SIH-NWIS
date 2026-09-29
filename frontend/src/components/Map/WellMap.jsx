import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StatusBadge } from '../Badges';

// Fix Leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color, size = 28) => L.divIcon({
  html: `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};border:2px solid rgba(255,255,255,0.8);
    box-shadow:0 0 12px ${color}88;
    display:flex;align-items:center;justify-content:center;
  "></div>`,
  className: '',
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -(size / 2) - 4],
});

const STATUS_COLOUR = {
  ACTIVE:    '#f59e0b',
  COMPLETED: '#3b82f6',
  SUSPENDED: '#eab308',
  ABANDONED: '#6b7280',
};

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

export default function WellMap({
  activeWell,
  nearbyWells = [],
  radius = 10,
  onWellClick,
  trajectories = {},
  height = '100%',
}) {
  if (!activeWell) return (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
      Select an active well to view the map.
    </div>
  );

  const center = [activeWell.latitude, activeWell.longitude];

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      zoomControl={true}
    >
      <TileLayer
        url={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
        attribution=""
      />

      <RecenterMap lat={activeWell.latitude} lng={activeWell.longitude} />

      {/* Radius circle */}
      <Circle
        center={center}
        radius={radius * 1000}
        pathOptions={{ color: '#f59e0b', weight: 1, fillOpacity: 0.04, dashArray: '6,4' }}
      />

      {/* Active well */}
      <Marker
        position={center}
        icon={makeIcon('#f59e0b', 32)}
        zIndexOffset={1000}
      >
        <Popup>
          <div className="p-1 min-w-[160px]">
            <div className="font-bold text-base text-yellow-400 mb-1">★ {activeWell.well_name}</div>
            <div className="text-xs text-slate-400 mb-1">{activeWell.field}</div>
            <StatusBadge status={activeWell.status} />
            {activeWell.total_depth && (
              <div className="mt-1 text-xs text-slate-300">TD: {activeWell.total_depth}m</div>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Nearby wells */}
      {nearbyWells.map((w) => (
        <Marker
          key={w.id}
          position={[w.latitude, w.longitude]}
          icon={makeIcon(STATUS_COLOUR[w.status] || '#3b82f6')}
        >
          <Popup>
            <div className="p-1 min-w-[180px]">
              <div className="font-bold text-sm text-slate-100 mb-1">{w.well_name}</div>
              <div className="text-xs text-slate-400 mb-1">{w.field}</div>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={w.status} />
                <span className="text-xs text-cyan-400">{w.distance_km} km</span>
              </div>
              {w.total_depth && (
                <div className="text-xs text-slate-300 mb-2">TD: {w.total_depth}m</div>
              )}
              {onWellClick && (
                <button
                  onClick={() => onWellClick(w)}
                  className="text-xs bg-brand-500 hover:bg-brand-400 text-surface-900 font-semibold px-2 py-1 rounded w-full mt-1"
                >
                  View / Compare
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
