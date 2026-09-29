import clsx from 'clsx';

const SEV_MAP = {
  CRITICAL: 'badge-critical',
  HIGH:     'badge-high',
  MEDIUM:   'badge-medium',
  LOW:      'badge-low',
};

export function SeverityBadge({ severity }) {
  return (
    <span className={clsx('badge', SEV_MAP[severity] || 'badge-low')}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = {
    ACTIVE:    'bg-accent-green/20 text-accent-green border border-accent-green/30',
    COMPLETED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    ABANDONED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }[status] || 'bg-slate-500/20 text-slate-400';
  return <span className={clsx('badge', cls)}>{status}</span>;
}

export function EventTypeBadge({ type }) {
  const colour = {
    MUD_LOSS:          'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    KICK:              'bg-red-500/20 text-red-400 border border-red-500/30',
    STUCK_PIPE:        'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    FISHING:           'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    TORQUE_SPIKE:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    CEMENTING_ISSUE:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    FORMATION_PRESSURE:'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    GAS_SHOW:          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    NPT:               'bg-slate-600/20 text-slate-400 border border-slate-600/30',
  }[type] || 'bg-slate-500/20 text-slate-400';
  return <span className={clsx('badge text-[10px]', colour)}>{type.replace('_', ' ')}</span>;
}

export function AlertTypeBadge({ type }) {
  const cls = {
    HISTORICAL_RISK:      'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    FORMATION_RISK:       'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    MULTI_WELL_CORRELATION:'bg-red-500/20 text-red-400 border border-red-500/30',
    THRESHOLD_ALERT:      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }[type] || 'bg-slate-500/20 text-slate-400';
  return <span className={clsx('badge text-[10px]', cls)}>{type.replace(/_/g, ' ')}</span>;
}
