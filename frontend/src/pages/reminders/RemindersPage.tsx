import { useState } from 'react';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/useReminders';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { type ReminderType } from '@/types/reminder';
import { formatDate } from '@/lib/utils';

const today = new Date().toISOString().split('T')[0];

export default function RemindersPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: reminders, isLoading } = useReminders(activeBikeId);
  const createReminder = useCreateReminder(activeBikeId);
  const updateReminder = useUpdateReminder(activeBikeId);
  const deleteReminder = useDeleteReminder(activeBikeId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'service' as ReminderType, title: '', trigger_km: '', trigger_date: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReminder.mutate(
      { type: form.type, title: form.title, trigger_km: form.trigger_km ? parseFloat(form.trigger_km) : undefined, trigger_date: form.trigger_date || undefined },
      { onSuccess: () => { setShowForm(false); setForm({ type: 'service', title: '', trigger_km: '', trigger_date: '' }); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">New Reminder</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReminderType }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="service">Service</option>
                <option value="insurance">Insurance</option>
                <option value="tax">Tax</option>
                <option value="custom">Custom</option>
              </select></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Oil Change Due" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">At km</label>
              <input type="number" value={form.trigger_km} onChange={(e) => setForm((f) => ({ ...f, trigger_km: e.target.value }))} placeholder="15000" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">By date</label>
              <input type="date" value={form.trigger_date} onChange={(e) => setForm((f) => ({ ...f, trigger_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createReminder.isPending} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50">
              {createReminder.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <LoadingSpinner /> : !reminders?.length ? (
        <EmptyState title="No reminders set" description="Set km or date-based reminders for service, insurance, and more." />
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${!r.is_active ? 'opacity-50' : ''}`}>
              <div className={`rounded-lg p-2 ${r.is_active ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                {r.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{r.title}</p>
                <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                  {r.trigger_km && <span>At {r.trigger_km.toLocaleString()} km</span>}
                  {r.trigger_date && <span>By {formatDate(r.trigger_date)}</span>}
                  <span className="capitalize">{r.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateReminder.mutate({ id: r.id, data: { is_active: !r.is_active } })}
                  className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded border hover:border-blue-300">
                  {r.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteReminder.mutate(r.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
