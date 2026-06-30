import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bike,
  Fuel,
  Wrench,
  Receipt,
  Bell,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/bikes',     label: 'My Bikes',   icon: Bike },
  { to: '/fuel',      label: 'Fuel Logs',  icon: Fuel },
  { to: '/services',  label: 'Services',   icon: Wrench },
  { to: '/expenses',  label: 'Expenses',   icon: Receipt },
  { to: '/reminders', label: 'Reminders',  icon: Bell },
  { to: '/stats',     label: 'Reports',    icon: BarChart3 },
];

export default function Sidebar() {
  const clearTokens = useAuthStore((s) => s.clearTokens);

  return (
    <aside className="w-56 bg-white border-r flex flex-col shrink-0">
      <div className="px-5 py-4 border-b">
        <span className="font-bold text-lg tracking-tight">🏍 BikeTrack</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t">
        <button
          onClick={clearTokens}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
