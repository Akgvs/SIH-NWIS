import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ParameterChart } from '../components/ParameterPanel/ParameterPanel';
import FormationBar from '../components/FormationBar/FormationBar';
import { StatusBadge, EventTypeBadge, SeverityBadge } from '../components/Badges';
import { CheckCircle2, XCircle, GitCompare, ArrowRight } from 'lucide-react';

export default function Comparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [wells, setWells] = useState([]);
  const [activeId, setActiveId]   = useState(searchParams.get('active') || '');
  const [offsetId, setOffsetId]   = useState(searchParams.get('offset') || '');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { api.getWells().then(setWells); }, []);

  useEffect(() => {
    if (!activeId || !offsetId) return;
    setLoading(true); setError('');
    api.compareWells(activeId, offsetId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeId, offsetId]);

  const eventTypes = ['MUD_LOSS','KICK','STUCK_PIPE','FISHING','TORQUE_SPIKE','CEMENTING_ISSUE','FORMATION_PRESSURE','GAS_SHOW','NPT'];

  const activeEvents  = new Set(data?.active?.events?.map(e => e.event_type));
  const offsetEvents  = new Set(data?.offset?.events?.map(e => e.event_type));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <GitCompare size={20} className="text-brand-500" />
          <h1 className="text-xl font-bold text-slate-100">Well Comparison</h1>
        </div>

        <div className="flex items-center gap-3">
          <select value={activeId} onChange={e => setActiveId(e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            <option value="">Active Well</option>
            {wells.map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
          <ArrowRight size={16} className="text-slate-600" />
          <select value={offsetId} onChange={e => setOffsetId(e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            <option value="">Offset Well</option>
            {wells.filter(w => w.id !== parseInt(activeId)).map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="text-slate-500 text-sm p-8 text-center animate-pulse">Comparing wells…</div>}
      {error   && <div className="card border-risk-high/50 text-risk-high text-sm p-4">{error}</div>}

      {data && !loading && (
        <div className="space-y-4">
          {/* Summary header */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="label mb-1">Active Well</div>
              <div className="font-bold text-xl text-slate-100">{data.active_well.well_name}</div>
              <StatusBadge status={data.active_well.status} />
            </div>
            <div className="card text-center flex flex-col items-center justify-center">
              <div className="label mb-1">Distance</div>
              <div className="font-mono font-bold text-2xl text-cyan-400">{data.distance_km} km</div>
              <div className="text-[10px] text-slate-500">PostGIS ST_Distance</div>
            </div>
            <div className="card text-center">
              <div className="label mb-1">Offset Well</div>
              <div className="font-bold text-xl text-slate-100">{data.offset_well.well_name}</div>
              <StatusBadge status={data.offset_well.status} />
            </div>
          </div>

          {/* Side-by-side well info */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Active', well: data.active_well, formations: data.active.formations, events: data.active.events },
              { label: 'Offset', well: data.offset_well, formations: data.offset.formations, events: data.offset.events },
            ].map(({ label, well, formations, events }) => (
              <div key={label} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="label">{label}</span>
                  <span className="font-semibold text-slate-200">{well.well_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  {[
                    ['Total Depth', `${well.total_depth ?? '—'}m`],
                    ['Events', events.length],
                    ['Formations', formations.length],
                    ['Spud Date', well.spud_date ? new Date(well.spud_date).toLocaleDateString() : '—'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div className="label mb-0.5">{k}</div>
                      <div className="text-slate-200 font-mono">{v}</div>
                    </div>
                  ))}
                </div>
                <FormationBar formations={formations} totalDepth={well.total_depth || 3500} />
              </div>
            ))}
          </div>

          {/* Event matrix comparison */}
          <div className="card">
            <div className="label mb-3">Event Type Comparison</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-surface-600">
                    <th className="text-left py-2 pr-4">Event Type</th>
                    <th className="text-center py-2 px-4">{data.active_well.well_name}</th>
                    <th className="text-center py-2 px-4">{data.offset_well.well_name}</th>
                    <th className="text-center py-2">Risk Overlap</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTypes.map(type => {
                    const inActive  = activeEvents.has(type);
                    const inOffset  = offsetEvents.has(type);
                    const both      = inActive && inOffset;
                    return (
                      <tr key={type} className={`border-b border-surface-600/30 ${both ? 'bg-risk-high/5' : ''}`}>
                        <td className="py-2 pr-4">
                          <EventTypeBadge type={type} />
                        </td>
                        <td className="py-2 px-4 text-center">
                          {inActive
                            ? <CheckCircle2 size={14} className="text-accent-green mx-auto" />
                            : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {inOffset
                            ? <CheckCircle2 size={14} className="text-accent-green mx-auto" />
                            : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="py-2 text-center">
                          {both && (
                            <span className="badge badge-high text-[9px]">COMMON RISK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parameter charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { label: data.active_well.well_name, params: data.active.parameters },
              { label: data.offset_well.well_name, params: data.offset.parameters },
            ].map(({ label, params }) => (
              <div key={label} className="card">
                <div className="label mb-3">{label} — Parameters vs Depth</div>
                <ParameterChart data={params} params={['rop', 'torque']} height={200} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
