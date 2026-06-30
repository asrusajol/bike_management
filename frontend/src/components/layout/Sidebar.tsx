import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Bike, Fuel, Wrench, Receipt,
  Bell, BarChart3, History, LogOut, X, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bikes',     label: 'My Bikes',  icon: Bike },
  { to: '/fuel',      label: 'Fuel Logs', icon: Fuel },
  { to: '/services',  label: 'Services',  icon: Wrench },
  { to: '/expenses',  label: 'Expenses',  icon: Receipt },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/stats',     label: 'Reports',   icon: BarChart3 },
  { to: '/history',   label: 'History',   icon: History },
];

interface SidebarProps {
  onClose?: () => void;
  onQuickAdd?: () => void;
}

export default function Sidebar({ onClose, onQuickAdd }: SidebarProps) {
  const clearTokens = useAuthStore((s) => s.clearTokens);

  return (
    <aside className="w-56 bg-white border-r flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
        <span className="font-bold text-lg tracking-tight">🏍 BikeTrack</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Add button */}
      {onQuickAdd && (
        <div className="px-3 pt-3 shrink-0">
          <button
            onClick={onQuickAdd}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t shrink-0">
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
