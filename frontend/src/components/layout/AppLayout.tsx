import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import QuickAddModal from '@/components/shared/QuickAddModal';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex">
        <Sidebar onQuickAdd={() => setQuickAddOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} onQuickAdd={() => { setSidebarOpen(false); setQuickAddOpen(true); }} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg tracking-tight">🏍 BikeTrack</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* Extra bottom padding on mobile so FAB doesn't cover content */}
          <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile FAB — fixed bottom-center */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Quick add"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Quick-add modal */}
      {quickAddOpen && (
        <QuickAddModal onClose={() => setQuickAddOpen(false)} />
      )}
    </div>
  );
}
