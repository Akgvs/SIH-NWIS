import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, ChevronDown, TrendingUp, Layers, GitCompare, AlertTriangle, Activity } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import { useRealtimeWell } from '../hooks/useRealtimeWell';
import WellMap from '../components/Map/WellMap';
import AlertPanel from '../components/AlertPanel/AlertPanel';
import { ParameterPanel } from '../components/ParameterPanel/ParameterPanel';
import FormationBar from '../components/FormationBar/FormationBar';
import { StatusBadge } from '../components/Badges';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function Dashboard() {
  const navigate = useNavigate();
  const [wells, setWells]           = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [radius, setRadius]         = useState(10);
  const [nearbyWells, setNearbyWells] = useState([]);
  const [formations, setFormations]   = useState([]);
  const [currentFormation, setCurrentFormation] = useState(null);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const { liveData, alerts, wsStatus, startSim, stopSim, history } =
    useRealtimeWell(activeWell?.id);

  // Load wells on mount
  useEffect(() => {
    api.getWells().then(data => {
      setWells(data);
      // Auto-select first ACTIVE well
      const active = data.find(w => w.status === 'ACTIVE');
      if (active) setActiveWell(active);
    }).catch(console.error);
  }, []);

  // Load nearby wells when active well or radius changes
  useEffect(() => {
    if (!activeWell) return;
    setLoadingNearby(true);
    Promise.all([
      api.getNearbyWells(activeWell.id, radius),
      api.getWellFormations(activeWell.id),
    ]).then(([nearby, forms]) => {
      setNearbyWells(nearby);
      setFormations(forms);
    }).catch(console.error).finally(() => setLoadingNearby(false));
  }, [activeWell, radius]);

  // Track current formation from live depth
  useEffect(() => {
    if (!liveData || !formations.length) return;
    const f = formations.find(
      f => liveData.depth >= f.top_depth && liveData.depth <= f.bottom_depth
    );
    setCurrentFormation(f || null);
  }, [liveData?.depth, formations]);

  const currentDepth = liveData?.depth ?? (activeWell?.total_depth ? activeWell.total_depth - 540 : null);
  const isSimulating = wsStatus === 'simulating';

  const handleCompare = useCallback((offsetWell) => {
    navigate(`/comparison?active=${activeWell?.id}&offset=${offsetWell.id}`);
  }, [activeWell, navigate]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Top Status Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Operations Dashboard</h1>
          {activeWell && (
            <p className="text-xs text-slate-500 mt-0.5">
              Active Well: <span className="text-slate-300 font-medium">{activeWell.well_name}</span>
              {' · '} Field: <span className="text-slate-300">{activeWell.field}</span>
              {activeWell.spud_date && ` · Spud: ${new Date(activeWell.spud_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`}
            </p>
          )}
        </div>

        {/* Well selector */}
        <div className="flex items-center gap-3">
          <select
            value={activeWell?.id || ''}
            onChange={e => setActiveWell(wells.find(w => w.id === parseInt(e.target.value)))}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">Select Well</option>
            {wells.map(w => (
              <option key={w.id} value={w.id}>{w.well_name} ({w.status})</option>
            ))}
          </select>

          {/* Simulate button */}
          {activeWell && (
            isSimulating ? (
              <button onClick={stopSim} className="flex items-center gap-2 bg-risk-critical/20 hover:bg-risk-critical/30 text-risk-critical border border-risk-critical/40 font-semibold px-4 py-2 rounded-lg text-sm transition-all">
                <Square size={14} /> Stop Simulation
              </button>
            ) : (
              <button onClick={startSim} className="btn-primary">
                <Play size={14} /> {wsStatus === 'complete' ? 'Restart Simulation' : '▶ Start Drilling Simulation'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Current Depth */}
        <div className="card flex flex-col gap-1">
          <div className="label">Current Depth</div>
          <div className="flex items-end gap-2">
            <span className="value-lg">{currentDepth ? `${currentDepth.toFixed(0)}` : '—'}</span>
            <span className="text-slate-500 text-sm mb-1">m</span>
          </div>
          {activeWell?.total_depth && (
            <>
              <div className="text-[10px] text-slate-500">Target: {activeWell.total_depth}m</div>
              <div className="w-full bg-surface-600 rounded-full h-1 mt-1">
                <div
                  className="bg-brand-500 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((currentDepth || 0) / activeWell.total_depth) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Formation */}
        <div className="card flex flex-col gap-1">
          <div className="label">Geological Formation</div>
          <div className="text-lg font-bold text-cyan-400 leading-tight">
            {currentFormation?.formation_name ?? (formations[formations.length - 1]?.formation_name ?? 'Unknown')}
          </div>
          {currentFormation && (
            <div className="text-[10px] text-slate-500">
              {currentFormation.top_depth}m – {currentFormation.bottom_depth}m
            </div>
          )}
        </div>

        {/* ROP */}
        <div className="card flex flex-col gap-1">
          <div className="label">Rate of Penetration</div>
          <div className="flex items-end gap-2">
            <span className="value-lg">{liveData?.rop?.toFixed(1) ?? '—'}</span>
            <span className="text-slate-500 text-sm mb-1">m/hr</span>
          </div>
          {liveData && (
            <div className="flex items-center gap-1 text-[10px] text-accent-green">
              <TrendingUp size={10} />
              Avg: {(history.reduce((s, d) => s + d.rop, 0) / (history.length || 1)).toFixed(1)} m/hr
            </div>
          )}
        </div>

        {/* Risk */}
        <div className={clsx(
          'card flex flex-col gap-1',
          alerts.length > 0 ? 'border-risk-high/50 bg-risk-high/5' : ''
        )}>
          <div className="label">Risk Threshold</div>
          {alerts.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-risk-high" />
                <span className="text-lg font-bold text-risk-high">Elevated</span>
              </div>
              <div className="text-[10px] text-slate-400">{alerts.length} active alert{alerts.length > 1 ? 's' : ''}</div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-accent-green">Normal</div>
              <div className="text-[10px] text-slate-500">No alerts triggered</div>
            </>
          )}
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">

        {/* Map + Nearby ── spans 2 cols */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Map */}
          <div className="card flex flex-col flex-1 min-h-[380px] p-0 overflow-hidden">
            {/* Radius selector */}
            <div className="flex items-center gap-2 p-3 border-b border-surface-600 flex-wrap">
              <span className="label">Search Radius</span>
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                    r === radius
                      ? 'bg-brand-500 text-surface-900'
                      : 'bg-surface-600 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {r} km
                </button>
              ))}
              {loadingNearby && <span className="text-xs text-slate-500 animate-pulse">Updating…</span>}
            </div>

            <div className="flex-1">
              <WellMap
                activeWell={activeWell}
                nearbyWells={nearbyWells}
                radius={radius}
                onWellClick={handleCompare}
              />
            </div>
          </div>

          {/* Nearby Wells Table */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">Nearby Wells</span>
                <span className="badge bg-surface-600 text-slate-400">{nearbyWells.length} within {radius}km</span>
              </div>
            </div>

            {nearbyWells.length === 0 ? (
              <div className="p-6 text-center text-slate-600 text-xs">
                {loadingNearby ? 'Searching…' : 'No wells found in radius.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wider border-b border-surface-600">
                      <th className="px-4 py-2 text-left">Well ID</th>
                      <th className="px-4 py-2 text-left">Distance</th>
                      <th className="px-4 py-2 text-left">Total Depth</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyWells.map(w => (
                      <tr key={w.id} className="border-b border-surface-600/50 hover:bg-surface-700/40 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-slate-200">{w.well_name}</td>
                        <td className="px-4 py-2.5 font-mono text-cyan-400">{w.distance_km} km</td>
                        <td className="px-4 py-2.5 text-slate-400">{w.total_depth ? `${w.total_depth}m` : '—'}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={w.status} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/comparison?active=${activeWell?.id}&offset=${w.id}`)}
                              className="btn-secondary text-[11px] py-1"
                            >
                              <GitCompare size={11} /> Compare
                            </button>
                            <button
                              onClick={() => navigate(`/well?id=${w.id}`)}
                              className="btn-ghost text-[11px] py-1"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Alerts + Parameters */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Alerts */}
          <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: 420 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className={alerts.length ? 'text-risk-high' : 'text-slate-500'} />
                <span className="font-semibold text-sm text-slate-100">
                  {alerts.length > 0 ? 'Active Alerts' : 'Alert Centre'}
                </span>
                {alerts.length > 0 && (
                  <span className="badge bg-risk-high/20 text-risk-high border border-risk-high/30">{alerts.length}</span>
                )}
              </div>
              {isSimulating && <span className="text-[10px] text-accent-green animate-pulse">● LIVE</span>}
            </div>
            <div className="p-3 overflow-y-auto thin-scroll flex-1">
              <AlertPanel
                alerts={alerts}
                onViewEvidence={(ev) => navigate(`/events?well=${ev.well_id}&event=${ev.event_id}`)}
              />
            </div>
          </div>

          {/* Live Telemetry */}
          <div className="card p-0 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-slate-400" />
                <span className="font-semibold text-sm text-slate-100">Real-time Telemetry</span>
              </div>
              {liveData && (
                <span className="text-[10px] text-slate-500">
                  Updated {new Date(liveData.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="p-3 overflow-y-auto thin-scroll">
              <ParameterPanel liveData={liveData} history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
