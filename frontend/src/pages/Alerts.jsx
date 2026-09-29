import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import AlertPanel from '../components/AlertPanel/AlertPanel';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Alerts() {
  const [searchParams] = useSearchParams();
  const [wells, setWells] = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [depth, setDepth] = useState(2860);
  const [radius, setRadius] = useState(10);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWells().then(data => {
      setWells(data);
      const active = data.find(w => w.status === 'ACTIVE') || data[0];
      if (active) setActiveWell(active);
    });
  }, []);

  const fetchAlerts = () => {
    if (!activeWell) return;
    setLoading(true);
    api.getAlerts(activeWell.id, depth, radius)
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, [activeWell]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-risk-high" />
          <h1 className="text-xl font-bold text-slate-100">Alert Centre</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={activeWell?.id || ''} onChange={e => setActiveWell(wells.find(w => w.id === parseInt(e.target.value)))}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            {wells.map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-surface-700 border border-surface-500 rounded-lg px-3 py-2">
            <span className="label">Depth:</span>
            <input
              type="number" value={depth} step={5}
              onChange={e => setDepth(parseFloat(e.target.value))}
              className="bg-transparent font-mono text-sm text-slate-200 w-20 focus:outline-none"
            />
            <span className="text-xs text-slate-500">m</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-700 border border-surface-500 rounded-lg px-3 py-2">
            <span className="label">Radius:</span>
            <input
              type="number" value={radius} step={1}
              onChange={e => setRadius(parseFloat(e.target.value))}
              className="bg-transparent font-mono text-sm text-slate-200 w-14 focus:outline-none"
            />
            <span className="text-xs text-slate-500">km</span>
          </div>
          <button onClick={fetchAlerts} className="btn-primary" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Run Alert Engine
          </button>
        </div>
      </div>

      {/* Engine explanation */}
      <div className="card border-l-2 border-brand-500/50 bg-brand-500/5">
        <div className="label mb-1">Deterministic Alert Engine</div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Four rule-based rules evaluate the current drilling state against historical data from nearby wells.
          No AI or ML is used — all scoring is deterministic and fully explainable.
          Rules: <span className="text-slate-300">Historical Proximity · Formation Risk · Multi-Well Correlation · Parameter Threshold</span>
        </p>
      </div>

      {loading && <div className="text-slate-500 text-sm animate-pulse text-center py-8">Running alert engine…</div>}

      {!loading && (
        <AlertPanel alerts={alerts} />
      )}
    </div>
  );
}
