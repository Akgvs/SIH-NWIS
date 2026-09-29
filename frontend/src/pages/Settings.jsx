import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon size={20} className="text-brand-500" />
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
      </div>

      <div className="card space-y-4">
        <div className="label">Alert Engine Thresholds</div>
        <p className="text-xs text-slate-500">Configure via backend <code className="text-brand-400">.env</code> file. Restart backend to apply.</p>
        {[
          { key: 'ALERT_TORQUE_THRESHOLD',   label: 'Torque Threshold', unit: 'kN·m',  default: 95 },
          { key: 'ALERT_ECD_THRESHOLD',      label: 'ECD Threshold',    unit: 'SG',    default: 1.25 },
          { key: 'ALERT_ROP_DROP_THRESHOLD', label: 'ROP Drop Alert',   unit: '%',     default: 30 },
          { key: 'ALERT_DEPTH_WINDOW',       label: 'Depth Window',     unit: 'm',     default: 50 },
        ].map(t => (
          <div key={t.key} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg text-xs">
            <div>
              <div className="font-medium text-slate-200">{t.label}</div>
              <div className="text-slate-500 font-mono">{t.key}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-brand-400">{t.default} {t.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <div className="label">Simulation Settings</div>
        {[
          { key: 'SIMULATION_INTERVAL_MS',     label: 'Interval',        default: '2000 ms' },
          { key: 'SIMULATION_DEPTH_INCREMENT', label: 'Depth Increment', default: '5 m' },
          { key: 'SIMULATION_START_DEPTH',     label: 'Start Depth',     default: '2800 m' },
          { key: 'SIMULATION_END_DEPTH',       label: 'End Depth',       default: '3200 m' },
        ].map(t => (
          <div key={t.key} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg text-xs">
            <div>
              <div className="font-medium text-slate-200">{t.label}</div>
              <div className="text-slate-500 font-mono">{t.key}</div>
            </div>
            <span className="font-mono text-cyan-400">{t.default}</span>
          </div>
        ))}
      </div>

      <div className="card border-l-2 border-brand-500/50">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-brand-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Future AI Integration Point.</span>
            <br />
            The correlation and alert engines expose a clean abstract interface ready for ML engine injection.
            Document processors currently store references only — OCR/NLP/LLM extraction can be added without changing the existing data model.
          </div>
        </div>
      </div>
    </div>
  );
}
