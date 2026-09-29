import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import WellMap from '../components/Map/WellMap';
import { StatusBadge } from '../components/Badges';
import { GitCompare } from 'lucide-react';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function NearbyWells() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [wells, setWells]       = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [nearby, setNearby]     = useState([]);
  const [radius, setRadius]     = useState(10);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.getWells().then(data => {
      setWells(data);
      const active = data.find(w => w.status === 'ACTIVE') || data[0];
      if (active) setActiveWell(active);
    });
  }, []);

  useEffect(() => {
    if (!activeWell) return;
    setLoading(true);
    api.getNearbyWells(activeWell.id, radius)
      .then(setNearby)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeWell, radius]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Nearby Wells</h1>
          <p className="text-xs text-slate-500">PostGIS spatial query — ST_DWithin</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={activeWell?.id || ''}
            onChange={e => setActiveWell(wells.find(w => w.id === parseInt(e.target.value)))}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            {wells.map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${r === radius ? 'bg-brand-500 text-surface-900' : 'bg-surface-700 text-slate-400 hover:text-slate-200'}`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map — spans 2 cols */}
        <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ height: 520 }}>
          <WellMap
            activeWell={activeWell}
            nearbyWells={nearby}
            radius={radius}
            onWellClick={(w) => navigate(`/comparison?active=${activeWell?.id}&offset=${w.id}`)}
            height="100%"
          />
        </div>

        {/* List */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ height: 520 }}>
          <div className="px-4 py-3 border-b border-surface-600 flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-100">Results</span>
            <span className="badge bg-surface-600 text-slate-400">
              {loading ? '…' : `${nearby.length} wells`}
            </span>
          </div>
          <div className="overflow-y-auto thin-scroll flex-1">
            {nearby.length === 0 && !loading && (
              <div className="p-6 text-center text-slate-600 text-xs">No wells within {radius}km</div>
            )}
            {nearby.map(w => (
              <div key={w.id} className="p-3 border-b border-surface-600/40 hover:bg-surface-700/50 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-slate-200 text-sm">{w.well_name}</span>
                  <span className="font-mono text-xs text-cyan-400">{w.distance_km} km</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={w.status} />
                  <span className="text-[10px] text-slate-500">{w.field}</span>
                </div>
                {w.total_depth && (
                  <div className="text-[10px] text-slate-600 mb-2">TD: {w.total_depth}m</div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/comparison?active=${activeWell?.id}&offset=${w.id}`)}
                    className="btn-secondary text-[11px] py-1 flex-1"
                  >
                    <GitCompare size={11} /> Compare
                  </button>
                  <button
                    onClick={() => navigate(`/well?id=${w.id}`)}
                    className="btn-ghost text-[11px] py-1"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
