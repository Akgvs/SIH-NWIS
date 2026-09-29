import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PARAM_CONFIG = {
  rop:        { label: 'ROP',       unit: 'm/hr',  color: '#3b82f6', domain: [0, 25] },
  wob:        { label: 'WOB',       unit: 't',     color: '#f59e0b', domain: [0, 30] },
  rpm:        { label: 'RPM',       unit: 'rpm',   color: '#06b6d4', domain: [80, 150] },
  torque:     { label: 'Torque',    unit: 'kN·m',  color: '#f97316', domain: [40, 120] },
  spp:        { label: 'SPP',       unit: 'psi',   color: '#8b5cf6', domain: [1500, 2800] },
  flow_rate:  { label: 'Flow Rate', unit: 'l/min', color: '#10b981', domain: [400, 500] },
  mud_weight: { label: 'MW',        unit: 'SG',    color: '#64748b', domain: [1.05, 1.30] },
  ecd:        { label: 'ECD',       unit: 'SG',    color: '#ef4444', domain: [1.10, 1.35] },
};

function MiniSparkline({ data, param, height = 48 }) {
  const cfg = PARAM_CONFIG[param];
  if (!data?.length || !cfg) return null;
  const chartData = data.map(d => ({ depth: parseFloat(d.depth).toFixed(0), value: d[param] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${param}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="value"
          stroke={cfg.color} strokeWidth={1.5}
          fill={`url(#grad-${param})`} dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ParameterGauge({ label, value, unit, color = '#3b82f6', threshold = null, sparkData = [], sparkParam = null }) {
  const over = threshold != null && value > threshold;
  return (
    <div className="bg-surface-800 rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {over && <span className="text-[9px] font-bold text-risk-high bg-risk-high/10 px-1.5 py-0.5 rounded">ELEVATED</span>}
      </div>
      <div className="flex items-end gap-1">
        <span className="font-mono font-bold text-xl text-slate-100">{value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '—'}</span>
        <span className="text-xs text-slate-500 mb-0.5">{unit}</span>
      </div>
      {sparkData.length > 0 && sparkParam && (
        <MiniSparkline data={sparkData} param={sparkParam} height={32} />
      )}
    </div>
  );
}

export function ParameterPanel({ liveData, history = [] }) {
  if (!liveData) return (
    <div className="flex items-center justify-center h-24 text-slate-600 text-xs">
      Waiting for drilling data…
    </div>
  );

  const params = [
    { key: 'rop',        label: 'ROP',       unit: 'm/hr',  threshold: null },
    { key: 'wob',        label: 'WOB',       unit: 'kN',    threshold: null },
    { key: 'rpm',        label: 'RPM',       unit: 'rpm',   threshold: null },
    { key: 'torque',     label: 'Torque',    unit: 'kN·m',  threshold: 95 },
    { key: 'spp',        label: 'SPP',       unit: 'psi',   threshold: null },
    { key: 'flow_rate',  label: 'Flow Rate', unit: 'l/min', threshold: null },
    { key: 'mud_weight', label: 'Mud Wt',    unit: 'SG',    threshold: null },
    { key: 'ecd',        label: 'ECD',       unit: 'SG',    threshold: 1.25 },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {params.map(p => (
        <ParameterGauge
          key={p.key}
          label={p.label}
          value={liveData[p.key]}
          unit={p.unit}
          threshold={p.threshold}
          sparkData={history}
          sparkParam={p.key}
          color={PARAM_CONFIG[p.key]?.color}
        />
      ))}
    </div>
  );
}

export function ParameterChart({ data = [], params = ['rop', 'torque', 'ecd'], height = 240 }) {
  if (!data.length) return null;
  const chartData = data.map(d => ({
    depth: parseFloat(d.depth).toFixed(0),
    ...params.reduce((acc, p) => ({ ...acc, [p]: d[p] }), {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="depth" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} label={{ value: 'Depth (m)', fill: '#64748b', fontSize: 10, position: 'insideBottomRight', offset: -4 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ background: '#141d30', border: '1px solid #253659', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <defs>
          {params.map(p => (
            <linearGradient key={p} id={`gc-${p}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PARAM_CONFIG[p]?.color || '#3b82f6'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={PARAM_CONFIG[p]?.color || '#3b82f6'} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {params.map(p => (
          <Area
            key={p}
            type="monotone"
            dataKey={p}
            stroke={PARAM_CONFIG[p]?.color || '#3b82f6'}
            strokeWidth={1.5}
            fill={`url(#gc-${p})`}
            dot={false}
            name={PARAM_CONFIG[p]?.label || p}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
