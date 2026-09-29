import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import EventTimeline from '../components/EventTimeline/EventTimeline';
import FormationBar from '../components/FormationBar/FormationBar';
import { ParameterChart } from '../components/ParameterPanel/ParameterPanel';
import { StatusBadge, EventTypeBadge, SeverityBadge } from '../components/Badges';
import { FileText, Layers, Activity, ChevronDown, X, Radio } from 'lucide-react';

const TABS = ['Overview', 'Events', 'Formations', 'Parameters', 'Documents'];

export default function WellDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [wells, setWells] = useState([]);
  const [well, setWell]   = useState(null);
  const [tab, setTab]     = useState('Overview');
  const [events, setEvents]         = useState([]);
  const [formations, setFormations] = useState([]);
  const [params, setParams]         = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const wellId = searchParams.get('id');

  useEffect(() => {
    api.getWells().then(data => {
      setWells(data);
      if (!wellId) {
        const active = data.find(w => w.status === 'ACTIVE') || data[0];
        if (active) navigate(`/well?id=${active.id}`, { replace: true });
      }
    });
  }, []);

  useEffect(() => {
    if (!wellId) return;
    setLoading(true);
    Promise.all([
      api.getWell(wellId),
      api.getEvents(wellId),
      api.getWellFormations(wellId),
      api.getParameters(wellId),
    ]).then(([w, evs, forms, ps]) => {
      setWell(w);
      setEvents(evs);
      setFormations(forms);
      setParams(ps);
    }).catch(console.error).finally(() => setLoading(false));
  }, [wellId]);

  if (loading) return <div className="text-slate-500 text-sm p-8">Loading well data…</div>;
  if (!well) return <div className="text-slate-500 text-sm p-8">Select a well below.</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <select
            value={well?.id || ''}
            onChange={e => navigate(`/well?id=${e.target.value}`)}
            className="bg-surface-700 border border-surface-500 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            {wells.map(w => <option key={w.id} value={w.id}>{w.well_name}</option>)}
          </select>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{well.well_name}</h1>
              <StatusBadge status={well.status} />
            </div>
            <p className="text-xs text-slate-500">{well.field} · {well.latitude.toFixed(4)}°N, {well.longitude.toFixed(4)}°E</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="card-sm text-center">
            <div className="label">Total Depth</div>
            <div className="font-mono font-bold text-slate-100">{well.total_depth ?? '—'}m</div>
          </div>
          <div className="card-sm text-center">
            <div className="label">Events</div>
            <div className="font-mono font-bold text-slate-100">{events.length}</div>
          </div>
          <div className="card-sm text-center">
            <div className="label">Formations</div>
            <div className="font-mono font-bold text-slate-100">{formations.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 p-1 rounded-xl w-fit border border-surface-600">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-brand-500 text-surface-900' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="label mb-3">Well Information</div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                {[
                  ['Well Name',       well.well_name],
                  ['Field',          well.field],
                  ['Status',         <StatusBadge key="s" status={well.status} />],
                  ['Total Depth',    well.total_depth ? `${well.total_depth}m` : '—'],
                  ['Spud Date',      well.spud_date ? new Date(well.spud_date).toLocaleDateString() : '—'],
                  ['Completion',     well.completion_date ? new Date(well.completion_date).toLocaleDateString() : 'Ongoing'],
                  ['Latitude',       `${well.latitude.toFixed(6)}°`],
                  ['Longitude',      `${well.longitude.toFixed(6)}°`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="label mb-0.5">{k}</div>
                    <div className="text-slate-200">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="label mb-3">Recent Events</div>
              <EventTimeline events={events.slice(0, 5)} onEventClick={setSelectedEvent} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <FormationBar formations={formations} totalDepth={well.total_depth || 3500} />
            </div>
          </div>
        </div>
      )}

      {tab === 'Events' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-slate-100">Historical Events ({events.length})</span>
          </div>
          <EventTimeline events={events} onEventClick={setSelectedEvent} />
        </div>
      )}

      {tab === 'Formations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <FormationBar formations={formations} totalDepth={well.total_depth || 3500} />
          </div>
          <div className="card">
            <div className="label mb-3">Formation Intervals</div>
            <div className="space-y-2">
              {formations.map((f, i) => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-surface-800 rounded-lg text-xs">
                  <span className="font-medium text-slate-200">{f.formation_name}</span>
                  <span className="font-mono text-slate-400">{f.top_depth}m – {f.bottom_depth}m</span>
                  <span className="text-slate-500">{(f.bottom_depth - f.top_depth).toFixed(0)}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Parameters' && (
        <div className="card">
          <div className="label mb-4">Drilling Parameters vs Depth</div>
          <ParameterChart data={params} params={['rop', 'torque', 'ecd']} height={300} />
          <div className="mt-4">
            <ParameterChart data={params} params={['wob', 'rpm', 'spp']} height={200} />
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card">
          <div className="label mb-3">Source Documents</div>
          <p className="text-xs text-slate-500 mb-4">Documents are linked to events for source traceability. Future: AI-assisted OCR extraction.</p>
          <div className="space-y-2">
            {events.flatMap(e => (e.documents || []).map((d, i) => ({ ...d, eventId: e.id, eventType: e.event_type, depth: e.start_depth }))).map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-800 rounded-lg text-xs">
                <FileText size={14} className="text-slate-500 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-slate-200">{d.document_name}</div>
                  <div className="text-slate-500">{d.document_type} · p.{d.page_number} · Linked to {d.eventType} @ {parseFloat(d.depth).toFixed(0)}m</div>
                </div>
                <span className="text-[10px] text-brand-400">{d.document_path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-surface-700 border border-surface-500 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto thin-scroll shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <EventTypeBadge type={selectedEvent.event_type} />
                <SeverityBadge severity={selectedEvent.severity} />
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
            </div>
            <div className="font-mono text-lg font-bold text-slate-100 mb-1">{parseFloat(selectedEvent.start_depth).toFixed(0)}m</div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{selectedEvent.description}</p>
            <div className="space-y-3">
              <div className="bg-surface-800 rounded-lg p-3">
                <div className="label mb-1">Previous Mitigation</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedEvent.mitigation || '—'}</p>
              </div>
              <div className="bg-surface-800 rounded-lg p-3">
                <div className="label mb-1">Outcome</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedEvent.outcome || '—'}</p>
              </div>
              {selectedEvent.documents?.length > 0 && (
                <div className="bg-surface-800 rounded-lg p-3">
                  <div className="label mb-1">Source Document</div>
                  {selectedEvent.documents.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <FileText size={12} className="text-slate-500" />
                      {d.document_name} · Page {d.page_number}
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
