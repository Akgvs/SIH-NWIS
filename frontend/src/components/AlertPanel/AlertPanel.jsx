import { AlertTriangle, X, ChevronDown, ChevronUp, FileText, Eye } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { SeverityBadge, AlertTypeBadge } from '../Badges';

const SEV_BORDER = {
  CRITICAL: 'border-risk-critical/60 bg-risk-critical/5',
  HIGH:     'border-risk-high/60     bg-risk-high/5',
  MEDIUM:   'border-risk-medium/60   bg-risk-medium/5',
  LOW:      'border-risk-low/60      bg-risk-low/5',
};
const SEV_ICON = {
  CRITICAL: 'text-risk-critical',
  HIGH:     'text-risk-high',
  MEDIUM:   'text-risk-medium',
  LOW:      'text-risk-low',
};

function AlertCard({ alert, onDismiss, onViewEvidence }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={clsx(
      'border rounded-xl p-4 animate-fade-in transition-all duration-300',
      SEV_BORDER[alert.severity] || 'border-surface-500 bg-surface-700'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={SEV_ICON[alert.severity]} />
          <span className="text-sm font-semibold text-slate-100">{alert.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={alert.severity} />
          <AlertTypeBadge type={alert.alert_type} />
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Depth */}
      <div className="flex items-center gap-3 mb-2 text-xs text-slate-400">
        <span>Depth: <span className="text-slate-200 font-mono font-semibold">{alert.current_depth?.toFixed(0)}m</span></span>
        {alert.formation && <span>Formation: <span className="text-cyan-400">{alert.formation}</span></span>}
      </div>

      {/* Message */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">{alert.message}</p>

      {/* Expand for detail */}
      {(alert.relevant_events?.length > 0 || alert.recommended_mitigation) && (
        <>
          <button
            onClick={() => setExpanded(x => !x)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide details' : `Show evidence (${alert.relevant_events?.length || 0} events)`}
          </button>

          {expanded && (
            <div className="space-y-2 border-t border-surface-600 pt-2 mt-1">
              {/* Mitigation */}
              {alert.recommended_mitigation && (
                <div className="bg-surface-800/60 rounded-lg p-3">
                  <div className="label mb-1">Previous Mitigation</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.recommended_mitigation}</p>
                </div>
              )}

              {/* Relevant events */}
              {alert.relevant_events?.slice(0, 3).map((ev, i) => (
                <div key={i} className="bg-surface-800/60 rounded-lg p-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-200">{ev.well_name}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] font-mono text-slate-400">{ev.depth?.toFixed(0)}m</span>
                      {ev.distance_km != null && (
                        <span className="text-[10px] text-cyan-400">{ev.distance_km?.toFixed(1)}km</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">{ev.description}</div>
                    {ev.document_name && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <FileText size={10} />
                        {ev.document_name}
                        {ev.page_number && <span>p.{ev.page_number}</span>}
                      </div>
                    )}
                  </div>
                  {onViewEvidence && (
                    <button
                      onClick={() => onViewEvidence(ev)}
                      className="shrink-0 flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <Eye size={10} /> View
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AlertPanel({ alerts = [], onDismiss, onViewEvidence, compact = false }) {
  if (!alerts.length) return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-sm gap-2">
      <AlertTriangle size={24} />
      <span>No active alerts</span>
    </div>
  );

  if (compact) {
    // Mini version for dashboard sidebar
    const top = alerts[0];
    return (
      <div className={clsx('border rounded-xl p-3 animate-slide-in', SEV_BORDER[top.severity])}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} className={SEV_ICON[top.severity]} />
          <span className="text-xs font-bold text-slate-100">{top.title}</span>
          <SeverityBadge severity={top.severity} />
        </div>
        <p className="text-xs text-slate-300 line-clamp-2">{top.message}</p>
        {alerts.length > 1 && (
          <div className="mt-1 text-[10px] text-slate-500">+{alerts.length - 1} more alerts</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <AlertCard
          key={i}
          alert={alert}
          onDismiss={onDismiss ? () => onDismiss(i) : null}
          onViewEvidence={onViewEvidence}
        />
      ))}
    </div>
  );
}
