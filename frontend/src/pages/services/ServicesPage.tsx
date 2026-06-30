import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useServiceLogs, useCreateServiceLog, useDeleteServiceLog } from '@/hooks/useServiceLogs';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { SERVICE_TYPE_LABELS, type ServiceType } from '@/types/service';
import { formatCurrency, formatDate } from '@/lib/utils';

const SERVICE_TYPES = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];
const today = new Date().toISOString().split('T')[0];

export default function ServicesPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: logs, isLoading } = useServiceLogs(activeBikeId);
  const createLog = useCreateServiceLog(activeBikeId);
  const deleteLog = useDeleteServiceLog(activeBikeId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today, service_type: 'oil_change' as ServiceType, cost: '', odometer_reading: '', workshop_name: '', next_service_km: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate(
      {
        date: form.date,
        service_type: form.service_type,
        cost: parseFloat(form.cost),
        odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : undefined,
        workshop_name: form.workshop_name || undefined,
        next_service_km: form.next_service_km ? parseFloat(form.next_service_km) : undefined,
        notes: form.notes || undefined,
      },
      { onSuccess: () => setShowForm(false) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Logs</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">New Service Record</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Service Type</label>
              <select value={form.service_type} onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as ServiceType }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {SERVICE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Cost</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} required placeholder="800" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Odometer</label>
              <input type="number" value={form.odometer_reading} onChange={(e) => setForm((f) => ({ ...f, odometer_reading: e.target.value }))} placeholder="12500" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Workshop</label>
              <input type="text" value={form.workshop_name} onChange={(e) => setForm((f) => ({ ...f, workshop_name: e.target.value }))} placeholder="Yamaha Service Center" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Next Service (km)</label>
              <input type="number" value={form.next_service_km} onChange={(e) => setForm((f) => ({ ...f, next_service_km: e.target.value }))} placeholder="15000" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLog.isPending} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {createLog.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <LoadingSpinner /> : !logs?.length ? (
        <EmptyState title="No service records yet" description="Log your first service to track maintenance history." />
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Date', 'Type', 'Cost', 'Odometer', 'Workshop', 'Next (km)', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(log.date)}</td>
                  <td className="px-4 py-3"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{SERVICE_TYPE_LABELS[log.service_type]}</span></td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(log.cost)}</td>
                  <td className="px-4 py-3 text-gray-500">{log.odometer_reading ? `${log.odometer_reading.toLocaleString()} km` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{log.workshop_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{log.next_service_km ? log.next_service_km.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteLog.mutate(log.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
