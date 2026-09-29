import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Radio, BarChart2, GitCompare,
  BellDot, FileText, Settings, Droplets
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { to: '/',           label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/nearby',     label: 'Nearby Wells',       icon: Map },
  { to: '/well',       label: 'Well Details',       icon: Radio },
  { to: '/events',     label: 'Events Intelligence',icon: BarChart2 },
  { to: '/comparison', label: 'Well Comparison',    icon: GitCompare },
  { to: '/alerts',     label: 'Alert Centre',       icon: BellDot, badge: true },
  { to: '/documents',  label: 'Documents',          icon: FileText },
  { to: '/settings',   label: 'Settings',           icon: Settings },
];

export default function Sidebar({ alertCount = 0 }) {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 bg-surface-800 border-r border-surface-600 flex flex-col z-40"
      style={{ width: 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-600">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <Droplets size={16} className="text-surface-900" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100 leading-tight">NWIS</div>
          <div className="text-[9px] text-slate-500 leading-tight">Oil India Limited</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Operations</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto thin-scroll">
        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'nav-item',
              isActive && 'active'
            )}
          >
            <Icon size={15} className="shrink-0" />
            <span className="flex-1 text-sm">{label}</span>
            {badge && alertCount > 0 && (
              <span className="bg-risk-critical text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-600">
        <div className="text-[9px] text-slate-600 leading-loose">
          eRTMAC-NWIS v1.0<br />
          Assam Basin Asset Dock
        </div>
      </div>
    </aside>
  );
}
