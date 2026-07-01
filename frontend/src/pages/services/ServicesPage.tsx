import { useState } from 'react';
import { Plus, Trash2, X, AlertCircle, MapPin } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useServiceLogs, useCreateServiceLog, useDeleteServiceLog } from '@/hooks/useServiceLogs';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { PREDEFINED_SERVICE_TYPES } from '@/types/service';
import { formatCurrency, nowLocalInput, localInputToUtcIso } from '@/lib/utils';

const CUSTOM_TYPES_KEY = 'custom_service_types';

function loadCustomTypes(): string[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY) ?? '[]'); } catch { return []; }
}
function saveCustomType(name: string, current: string[]): string[] {
  const t = name.trim(); if (!t) return current;
  const updated = Array.from(new Set([...current, t]));
  localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(updated));
  return updated;
}
function formatDatetime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type ItemDraft = { name: string; cost: string };
type FormState = { logged_at: string; odometer_reading: string; workshop_name: string; next_service_km: string; notes: string };
function makeEmpty(): FormState {
  return { logged_at: nowLocalInput(), odometer_reading: '', workshop_name: '', next_service_km: '', notes: '' };
}

export default function ServicesPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: logs, isLoading } = useServiceLogs(activeBikeId);
  const createLog = useCreateServiceLog(activeBikeId);
  const deleteLog = useDeleteServiceLog(activeBikeId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty);
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(loadCustomTypes);
  const [customInput, setCustomInput] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const allTypes = [...PREDEFINED_SERVICE_TYPES, ...customTypes];
  const selectedNames = items.map((i) => i.name);
  const totalCost = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
  const maxDatetime = nowLocalInput();

  const toggleType = (name: string) => {
    if (selectedNames.includes(name)) setItems((p) => p.filter((i) => i.name !== name));
    else setItems((p) => [...p, { name, cost: '' }]);
  };
  const updateCost = (idx: number, cost: string) => setItems((p) => p.map((item, i) => (i === idx ? { ...item, cost } : item)));
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));
  const addCustomType = () => {
    const t = customInput.trim(); if (!t) return;
    const updated = saveCustomType(t, customTypes); setCustomTypes(updated);
    if (!selectedNames.includes(t)) setItems((p) => [...p, { name: t, cost: '' }]);
    setCustomInput('');
  };
  const resetForm = () => { setShowForm(false); setForm(makeEmpty()); setItems([]); setCustomInput(''); setApiError(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setApiError('Please select at least one service type.'); return; }
    if (items.some((i) => !i.cost || isNaN(parseFloat(i.cost)) || parseFloat(i.cost) < 0)) {
      setApiError('Please enter a valid cost for every service item.'); return;
    }
    setApiError(null);
    createLog.mutate(
      { logged_at: localInputToUtcIso(form.logged_at), service_items: items.map((i) => ({ name: i.name, cost: parseFloat(i.cost) })),
        odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : undefined,
        workshop_name: form.workshop_name || undefined,
        next_service_km: form.next_service_km ? parseFloat(form.next_service_km) : undefined,
        notes: form.notes || undefined },
      { onSuccess: resetForm, onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setApiError(msg ?? 'Failed to save service record.');
        } },
    );
  };

  const ic = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Logs</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => { setShowForm(true); setApiError(null); }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Service</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 md:p-6 space-y-5">
          <h2 className="font-semibold">New Service Record</h2>
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{apiError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Select Service Types <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {allTypes.map((type) => {
                const active = selectedNames.includes(type);
                return (
                  <button key={type} type="button" onClick={() => toggleType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500 hover:text-green-600'}`}>
                    {active && '✓ '}{type}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input type="text" value={customInput} placeholder="Add custom type…"
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomType(); } }}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="button" onClick={addCustomType} disabled={!customInput.trim()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40">+ Add</button>
            </div>
          </div>
          {items.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 grid grid-cols-[1fr_140px_32px] gap-3">
                <span>Service Item</span><span>Cost</span><span />
              </div>
              <div className="divide-y">
                {items.map((item, idx) => (
                  <div key={item.name} className="grid grid-cols-[1fr_140px_32px] gap-3 items-center px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                    <input type="number" step="0.01" min="0" value={item.cost} placeholder="0.00"
                      onChange={(e) => updateCost(idx, e.target.value)}
                      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full" />
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 px-4 py-2.5 flex justify-between items-center border-t">
                <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span className="text-sm font-semibold text-green-700">Total: {formatCurrency(totalCost)}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div><label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" value={form.logged_at} max={maxDatetime} required className={ic}
                onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Odometer (km)</label>
              <input type="number" value={form.odometer_reading} placeholder="12500" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, odometer_reading: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Workshop</label>
              <input type="text" value={form.workshop_name} placeholder="Yamaha Service Center" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, workshop_name: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Next Service (km)</label>
              <input type="number" value={form.next_service_km} placeholder="15000" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, next_service_km: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Notes</label>
              <input type="text" value={form.notes} placeholder="Optional" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLog.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {createLog.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !logs?.length ? (
        <EmptyState title="No service records yet" description="Log your first service to track maintenance history." />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date & Time','Services','Total','Odometer','Workshop','Next (km)',''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDatetime(log.logged_at)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {log.service_items.map((item) => (
                          <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">{item.name}</span>
                            <span className="text-gray-500 whitespace-nowrap">{formatCurrency(item.cost)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatCurrency(log.cost)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {log.odometer_reading ? `${log.odometer_reading.toLocaleString()} km` : '—'}
                    </td>
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

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white border rounded-xl p-4 space-y-3">
                {/* Row 1: date + total + delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDatetime(log.logged_at)}</p>
                    {log.odometer_reading && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{log.odometer_reading.toLocaleString()} km
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold text-green-700">{formatCurrency(log.cost)}</span>
                    <button onClick={() => deleteLog.mutate(log.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Row 2: service item badges */}
                <div className="flex flex-wrap gap-1.5">
                  {log.service_items.map((item) => (
                    <span key={item.name} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200">
                      {item.name} <span className="text-green-500">{formatCurrency(item.cost)}</span>
                    </span>
                  ))}
                </div>
                {/* Row 3: workshop / next service */}
                {(log.workshop_name || log.next_service_km) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                    {log.workshop_name && <span>🏪 {log.workshop_name}</span>}
                    {log.next_service_km && <span>Next: {log.next_service_km.toLocaleString()} km</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
