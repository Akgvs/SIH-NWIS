import { Search, Bell, Wifi, WifiOff, User } from 'lucide-react';
import clsx from 'clsx';

export default function Topbar({ activeWell, wsStatus = 'disconnected', alertCount = 0 }) {
  const isLive = wsStatus === 'simulating' || wsStatus === 'connected';

  return (
    <header
      className="fixed top-0 right-0 bg-surface-800/95 backdrop-blur border-b border-surface-600 flex items-center gap-4 px-6 z-30"
      style={{ left: 220, height: 56 }}
    >
      {/* Active well chip */}
      {activeWell && (
        <div className="flex items-center gap-2 bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5">
          <div className={clsx('w-1.5 h-1.5 rounded-full', isLive ? 'bg-accent-green animate-pulse' : 'bg-slate-500')} />
          <span className="text-sm font-semibold text-slate-100">{activeWell.well_name}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">{activeWell.field}</span>
        </div>
      )}

      <div className="flex-1" />

      {/* eRTMAC connection status */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border',
        isLive
          ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
          : 'bg-surface-700 border-surface-500 text-slate-500'
      )}>
        {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
        {wsStatus === 'simulating' ? 'eRTMAC LIVE' :
         wsStatus === 'connected'  ? 'Connected'   :
         wsStatus === 'complete'   ? 'Sim Complete' : 'Offline'}
        {isLive && <span className="live-dot" />}
      </div>

      {/* Alerts bell */}
      <button className="relative p-2 rounded-lg hover:bg-surface-600 transition-colors">
        <Bell size={16} className={alertCount > 0 ? 'text-risk-high' : 'text-slate-400'} />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-risk-critical text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {alertCount}
          </span>
        )}
      </button>

      {/* User */}
      <div className="flex items-center gap-2 pl-2 border-l border-surface-600">
        <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center">
          <User size={14} className="text-slate-400" />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-slate-200">Chief Drilling Eng.</div>
          <div className="text-[9px] text-slate-500">Assam Basin</div>
        </div>
      </div>
    </header>
  );
}
