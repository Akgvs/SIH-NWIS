import clsx from 'clsx';
import { SeverityBadge, EventTypeBadge } from '../Badges';
import { FileText, Clock } from 'lucide-react';

export default function EventTimeline({ events = [], currentDepth = null, onEventClick }) {
  if (!events.length) return (
    <div className="text-center text-slate-600 text-xs py-6">No events recorded for this well.</div>
  );

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-surface-500" />

      <div className="space-y-3">
        {events.map((ev, i) => {
          const isNearCurrent = currentDepth != null &&
            Math.abs(ev.start_depth - currentDepth) <= 50;

          return (
            <div
              key={ev.id}
              className={clsx(
                'relative flex gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer',
                isNearCurrent
                  ? 'bg-risk-high/10 border border-risk-high/30 hover:bg-risk-high/15'
                  : 'bg-surface-800/50 border border-surface-600/30 hover:bg-surface-700/50',
              )}
              onClick={() => onEventClick?.(ev)}
            >
              {/* Dot */}
              <div className={clsx(
                'absolute -left-4 top-4 w-3 h-3 rounded-full border-2',
                isNearCurrent ? 'bg-risk-high border-risk-high animate-pulse' : 'bg-surface-500 border-surface-400',
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <EventTypeBadge type={ev.event_type} />
                  <SeverityBadge severity={ev.severity} />
                  <span className="font-mono text-xs text-slate-400">{parseFloat(ev.start_depth).toFixed(0)}m</span>
                  {isNearCurrent && (
                    <span className="text-[9px] font-bold text-risk-high bg-risk-high/10 px-1.5 py-0.5 rounded animate-pulse">
                      NEAR CURRENT
                    </span>
                  )}
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-1">{ev.description}</p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  {ev.event_time && (
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(ev.event_time).toLocaleDateString()}
                    </span>
                  )}
                  {ev.documents?.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <FileText size={9} />
                      {ev.documents[0].document_name} p.{ev.documents[0].page_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
