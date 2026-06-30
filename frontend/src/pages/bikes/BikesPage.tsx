import { useState } from 'react';
import { Plus, Bike, Trash2, Pencil, X } from 'lucide-react';
import { useBikes, useCreateBike, useUpdateBike, useDeleteBike } from '@/hooks/useBikes';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { Bike as BikeType } from '@/types/bike';

type FormState = {
  name: string;
  make: string;
  model: string;
  year: string;
  cc: string;
  colour: string;
  tank_capacity: string;
  plate_number: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  make: '',
  model: '',
  year: '',
  cc: '',
  colour: '',
  tank_capacity: '',
  plate_number: '',
};

const FIELDS: { key: keyof FormState; label: string; placeholder: string; required?: boolean }[] = [
  { key: 'name',          label: 'Bike Name',        placeholder: 'My Yamaha R15', required: true },
  { key: 'make',          label: 'Brand',             placeholder: 'Yamaha' },
  { key: 'model',         label: 'Model',             placeholder: 'R15 V4' },
  { key: 'year',          label: 'Model Year',        placeholder: '2023' },
  { key: 'cc',            label: 'CC',                placeholder: '155' },
  { key: 'colour',        label: 'Colour',            placeholder: 'Matte Black' },
  { key: 'tank_capacity', label: 'Tank Capacity (L)', placeholder: '12' },
  { key: 'plate_number',  label: 'Plate Number',      placeholder: 'DH-1234' },
];

function bikeToForm(bike: BikeType): FormState {
  return {
    name:          bike.name ?? '',
    make:          bike.make ?? '',
    model:         bike.model ?? '',
    year:          bike.year != null ? String(bike.year) : '',
    cc:            bike.cc != null ? String(bike.cc) : '',
    colour:        bike.colour ?? '',
    tank_capacity: bike.tank_capacity != null ? String(bike.tank_capacity) : '',
    plate_number:  bike.plate_number ?? '',
  };
}

function formToPayload(form: FormState) {
  return {
    name:          form.name,
    make:          form.make || undefined,
    model:         form.model || undefined,
    year:          form.year ? parseInt(form.year) : undefined,
    cc:            form.cc ? parseInt(form.cc) : undefined,
    colour:        form.colour || undefined,
    tank_capacity: form.tank_capacity ? parseFloat(form.tank_capacity) : undefined,
    plate_number:  form.plate_number || undefined,
  };
}

export default function BikesPage() {
  const { data: bikes, isLoading } = useBikes();
  const createBike = useCreateBike();
  const updateBike = useUpdateBike();
  const deleteBike = useDeleteBike();

  const [showCreate, setShowCreate] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  if (isLoading) return <LoadingSpinner />;

  const openCreate = () => {
    setEditingBike(null);
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const openEdit = (bike: BikeType) => {
    setShowCreate(false);
    setEditingBike(bike);
    setForm(bikeToForm(bike));
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingBike(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = formToPayload(form);

    if (editingBike) {
      updateBike.mutate(
        { id: editingBike.id, data: payload },
        { onSuccess: closeForm },
      );
    } else {
      createBike.mutate(payload, { onSuccess: closeForm });
    }
  };

  const isFormOpen = showCreate || editingBike != null;
  const isPending = createBike.isPending || updateBike.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bikes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Bike
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingBike ? 'Edit Bike' : 'New Bike'}</h2>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FIELDS.map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : editingBike ? 'Update Bike' : 'Save Bike'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!bikes?.length ? (
        <EmptyState
          title="No bikes yet"
          description="Add your first bike to start tracking maintenance costs."
        />
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(bike)}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                    title="Edit bike"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBike.mutate(bike.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Delete bike"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {bike.cc && <span>⚙️ {bike.cc} CC</span>}
                {bike.tank_capacity && <span>⛽ {bike.tank_capacity} L tank</span>}
                {bike.colour && <span>🎨 {bike.colour}</span>}
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
