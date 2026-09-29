import clsx from 'clsx';

const FORMATION_COLOURS = [
  '#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#10b981', '#ef4444', '#f97316', '#64748b',
];

export default function FormationBar({ formations = [], totalDepth = 3500, currentDepth = null, compact = false }) {
  if (!formations.length) return null;

  return (
    <div className="w-full">
      {!compact && <div className="label mb-2">Formation Column</div>}

      {/* Visual bar */}
      <div className="relative flex flex-col w-full rounded-lg overflow-hidden border border-surface-500" style={{ minHeight: compact ? 24 : 160 }}>
        {formations.map((f, i) => {
          const top = (f.top_depth / totalDepth) * 100;
          const height = ((f.bottom_depth - f.top_depth) / totalDepth) * 100;
          const color = FORMATION_COLOURS[i % FORMATION_COLOURS.length];
          return (
            <div
              key={f.id}
              title={`${f.formation_name}: ${f.top_depth}m – ${f.bottom_depth}m`}
              style={{ height: `${height}%`, minHeight: compact ? 8 : 20, background: `${color}22`, borderLeft: `3px solid ${color}` }}
              className="relative flex items-center px-2"
            >
              {!compact && (
                <span className="text-[10px] font-medium truncate" style={{ color }}>
                  {f.formation_name}
                  <span className="text-slate-500 ml-1">({f.top_depth}–{f.bottom_depth}m)</span>
                </span>
              )}
            </div>
          );
        })}

        {/* Current depth indicator */}
        {currentDepth != null && (
          <div
            className="absolute left-0 right-0 flex items-center gap-1 pointer-events-none"
            style={{ top: `${(currentDepth / totalDepth) * 100}%` }}
          >
            <div className="w-full h-px bg-brand-500 opacity-80" />
            <span className="text-[9px] text-brand-400 font-mono whitespace-nowrap pr-1">
              {currentDepth.toFixed(0)}m
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {formations.map((f, i) => (
            <div key={f.id} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: FORMATION_COLOURS[i % FORMATION_COLOURS.length] }} />
              <span className="text-[10px] text-slate-500">{f.formation_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
