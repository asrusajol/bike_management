import { useState } from 'react';
import { Plus, Trash2, Fuel } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useFuelLogs, useCreateFuelLog, useDeleteFuelLog } from '@/hooks/useFuelLogs';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';

const today = new Date().toISOString().split('T')[0];

export default function FuelPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: logs, isLoading } = useFuelLogs(activeBikeId);
  const createLog = useCreateFuelLog(activeBikeId);
  const deleteLog = useDeleteFuelLog(activeBikeId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today, odometer_reading: '', fuel_quantity: '', fuel_price_per_unit: '', station_name: '', is_full_tank: true });

  const field = (key: string) => ({
    value: form[key as keyof typeof form] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate(
      {
        date: form.date,
        odometer_reading: parseFloat(form.odometer_reading),
        fuel_quantity: parseFloat(form.fuel_quantity),
        fuel_price_per_unit: parseFloat(form.fuel_price_per_unit),
        is_full_tank: form.is_full_tank,
        station_name: form.station_name || undefined,
      },
      { onSuccess: () => setShowForm(false) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fuel Logs</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Add Fill-up
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">New Fuel Log</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" {...field('date')} required className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Odometer (km)</label>
              <input type="number" step="0.1" {...field('odometer_reading')} required placeholder="12500" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Fuel (liters)</label>
              <input type="number" step="0.01" {...field('fuel_quantity')} required placeholder="8.5" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Price/liter</label>
              <input type="number" step="0.01" {...field('fuel_price_per_unit')} required placeholder="105.50" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Station</label>
              <input type="text" {...field('station_name')} placeholder="Optional" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_full_tank}
                  onChange={(e) => setForm((f) => ({ ...f, is_full_tank: e.target.checked }))}
                  className="rounded" />
                Full tank
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLog.isPending}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {createLog.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <LoadingSpinner /> : !logs?.length ? (
        <EmptyState title="No fuel logs yet" description="Log your first fill-up to track fuel efficiency." />
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Date', 'Odometer', 'Liters', 'Price/L', 'Total', 'Station', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(log.date)}</td>
                  <td className="px-4 py-3">{log.odometer_reading.toLocaleString()} km</td>
                  <td className="px-4 py-3">{log.fuel_quantity} L</td>
                  <td className="px-4 py-3">{formatCurrency(log.fuel_price_per_unit)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(log.total_cost)}</td>
                  <td className="px-4 py-3 text-gray-500">{log.station_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteLog.mutate(log.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
