import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import EventTimeline from '../components/EventTimeline/EventTimeline';
import { EventTypeBadge, SeverityBadge } from '../components/Badges';
import { BarChart2, Filter, FileText, X } from 'lucide-react';

const EVENT_TYPES = ['MUD_LOSS','KICK','STUCK_PIPE','FISHING','TORQUE_SPIKE','CEMENTING_ISSUE','FORMATION_PRESSURE','GAS_SHOW','NPT'];
const SEVERITIES  = ['LOW','MEDIUM','HIGH','CRITICAL'];

export default function EventsIntelligence() {
  const [wells, setWells] = useState([]);
  const [wellId, setWellId]       = useState('');
  const [events, setEvents]       = useState([]);
  const [filters, setFilters]     = useState({});
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.getWells().then(data => {
      setWells(data);
      const active = data.find(w => w.status === 'ACTIVE') || data[0];
      if (active) setWellId(String(active.id));
    });
  }, []);

  useEffect(() => {
    if (!wellId) return;
    setLoading(true);
    api.getEvents(wellId, filters)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wellId, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => value ? { ...prev, [key]: value } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
  };

  const stats = EVENT_TYPES.map(type => ({
    type,
    count: events.filter(e => e.event_type === type).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-brand-500" />
          <h1 className="text-xl font-bold text-slate-100">Events Intelligence</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={wellId} onChange={e => setWellId(e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            {wells.map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
          <select onChange={e => updateFilter('event_type', e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-400 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select onChange={e => updateFilter('severity', e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-400 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500">
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.map(s => (
            <div key={s.type} className="flex items-center gap-2 bg-surface-700 border border-surface-600 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-surface-600"
              onClick={() => updateFilter('event_type', s.type)}>
              <EventTypeBadge type={s.type} />
              <span className="font-mono font-bold text-sm text-slate-200">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-slate-100">{loading ? 'Loading…' : `${events.length} events`}</span>
        </div>
        <EventTimeline events={events} onEventClick={setSelected} />
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface-700 border border-surface-500 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto thin-scroll shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <EventTypeBadge type={selected.event_type} />
                <SeverityBadge severity={selected.severity} />
                <span className="font-mono text-sm text-slate-400">{parseFloat(selected.start_depth).toFixed(0)}m</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-300 mb-4">{selected.description}</p>
            <div className="space-y-3">
              <div className="bg-surface-800 rounded-lg p-3">
                <div className="label mb-1">Previous Mitigation</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selected.mitigation || '—'}</p>
              </div>
              <div className="bg-surface-800 rounded-lg p-3">
                <div className="label mb-1">Outcome</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selected.outcome || '—'}</p>
              </div>
              {selected.documents?.length > 0 && (
                <div className="bg-surface-800 rounded-lg p-3">
                  <div className="label mb-1">Source Documents (Historical Evidence)</div>
                  {selected.documents.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                      <FileText size={12} className="text-brand-400" />
                      <span className="font-medium">{d.document_name}</span>
                      <span className="text-slate-500">· {d.document_type} · Page {d.page_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
