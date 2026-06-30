import { useState } from 'react';
import { Plus, Bike, Trash2 } from 'lucide-react';
import { useBikes, useCreateBike, useDeleteBike } from '@/hooks/useBikes';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BikesPage() {
  const { data: bikes, isLoading } = useBikes();
  const createBike = useCreateBike();
  const deleteBike = useDeleteBike();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', make: '', model: '', year: '', plate_number: '' });

  if (isLoading) return <LoadingSpinner />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBike.mutate(
      { ...form, year: form.year ? parseInt(form.year) : undefined },
      { onSuccess: () => { setShowForm(false); setForm({ name: '', make: '', model: '', year: '', plate_number: '' }); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bikes</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Bike
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">New Bike</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name',         label: 'Name *',      placeholder: 'My Yamaha' },
              { key: 'make',         label: 'Make',         placeholder: 'Yamaha' },
              { key: 'model',        label: 'Model',        placeholder: 'R15 V4' },
              { key: 'year',         label: 'Year',         placeholder: '2023' },
              { key: 'plate_number', label: 'Plate Number', placeholder: 'DH-1234' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={key === 'name'}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createBike.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {createBike.isPending ? 'Saving…' : 'Save Bike'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!bikes?.length ? (
        <EmptyState title="No bikes yet" description="Add your first bike to start tracking maintenance costs." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bikes.map((bike) => (
            <div key={bike.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2.5">
                    <Bike className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{bike.name}</p>
                    <p className="text-xs text-gray-500">
                      {[bike.make, bike.model, bike.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteBike.mutate(bike.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                {bike.plate_number && <span>🪪 {bike.plate_number}</span>}
                <span>📏 {bike.odometer_unit.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
