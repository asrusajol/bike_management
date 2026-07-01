import { useState } from 'react';
import { Plus, Trash2, Calculator, AlertCircle, Gauge, MapPin, Zap } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useFuelLogs, useCreateFuelLog, useDeleteFuelLog } from '@/hooks/useFuelLogs';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency, nowLocalInput, localInputToUtcIso } from '@/lib/utils';

const PRICE_KEY = 'fuel_price_per_unit';
const STATIONS_KEY = 'fuel_stations';

function loadPrice(): string { return localStorage.getItem(PRICE_KEY) ?? ''; }
function loadStations(): string[] {
  try { return JSON.parse(localStorage.getItem(STATIONS_KEY) ?? '[]'); } catch { return []; }
}
function savePrice(price: string) { if (price) localStorage.setItem(PRICE_KEY, price); }
function saveStation(name: string, current: string[]): string[] {
  if (!name.trim()) return current;
  const updated = Array.from(new Set([name.trim(), ...current])).slice(0, 30);
  localStorage.setItem(STATIONS_KEY, JSON.stringify(updated));
  return updated;
}

type FormState = {
  logged_at: string; odometer_reading: string; fuel_price_per_unit: string;
  fuel_quantity: string; total_cost: string; station_name: string; is_full_tank: boolean;
};

function makeEmpty(): FormState {
  return { logged_at: nowLocalInput(), odometer_reading: '', fuel_price_per_unit: loadPrice(),
           fuel_quantity: '', total_cost: '', station_name: '', is_full_tank: true };
}

function calcTotal(qty: string, price: string): string {
  const q = parseFloat(qty), p = parseFloat(price);
  return !isNaN(q) && !isNaN(p) && p > 0 ? (q * p).toFixed(2) : '';
}
function calcQty(total: string, price: string): string {
  const t = parseFloat(total), p = parseFloat(price);
  return !isNaN(t) && !isNaN(p) && p > 0 ? (t / p).toFixed(3) : '';
}
function tankPct(qty: string, capacity: number | undefined): number | null {
  if (!capacity) return null;
  const q = parseFloat(qty);
  return isNaN(q) || q <= 0 ? null : Math.min(Math.round((q / capacity) * 100), 100);
}

function PctBadge({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${color}`}>≈ {pct}%</span>;
}

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function FuelPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';
  const activeBike = bikes?.find((b) => b.id === activeBikeId);

  const { data: logs, isLoading } = useFuelLogs(activeBikeId);
  const createLog = useCreateFuelLog(activeBikeId);
  const deleteLog = useDeleteFuelLog(activeBikeId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty);
  const [lastEdited, setLastEdited] = useState<'qty' | 'total'>('qty');
  const [stations, setStations] = useState<string[]>(loadStations);
  const [apiError, setApiError] = useState<string | null>(null);

  const maxDatetime = nowLocalInput();

  const handlePriceChange = (val: string) => {
    if (lastEdited === 'qty') setForm((f) => ({ ...f, fuel_price_per_unit: val, total_cost: calcTotal(f.fuel_quantity, val) }));
    else setForm((f) => ({ ...f, fuel_price_per_unit: val, fuel_quantity: calcQty(f.total_cost, val) }));
  };
  const handleQtyChange = (val: string) => { setLastEdited('qty'); setForm((f) => ({ ...f, fuel_quantity: val, total_cost: calcTotal(val, f.fuel_price_per_unit) })); };
  const handleTotalChange = (val: string) => { setLastEdited('total'); setForm((f) => ({ ...f, total_cost: val, fuel_quantity: calcQty(val, f.fuel_price_per_unit) })); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    savePrice(form.fuel_price_per_unit);
    const updated = saveStation(form.station_name, stations);
    setStations(updated);
    createLog.mutate(
      { logged_at: localInputToUtcIso(form.logged_at), odometer_reading: parseFloat(form.odometer_reading),
        fuel_price_per_unit: parseFloat(form.fuel_price_per_unit),
        fuel_quantity: form.fuel_quantity ? parseFloat(form.fuel_quantity) : undefined,
        total_cost: form.total_cost ? parseFloat(form.total_cost) : undefined,
        is_full_tank: form.is_full_tank, station_name: form.station_name || undefined },
      {
        onSuccess: () => { setShowForm(false); setForm(makeEmpty()); setLastEdited('qty'); },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setApiError(msg ?? 'Failed to save fuel log. Please check your inputs.');
        },
      },
    );
  };

  const ic = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
  const icAuto = `${ic} bg-orange-50 border-orange-200`;
  const pct = tankPct(form.fuel_quantity, activeBike?.tank_capacity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fuel Logs</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => { setShowForm(true); setApiError(null); }}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Fill-up</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-semibold">New Fuel Log</h2>
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{apiError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" value={form.logged_at} max={maxDatetime} required className={ic}
                onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Odometer (km)</label>
              <input type="number" step="0.1" value={form.odometer_reading} required placeholder="12500" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, odometer_reading: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price / Unit</label>
              <input type="number" step="0.01" value={form.fuel_price_per_unit} required placeholder="105.50" className={ic}
                onChange={(e) => handlePriceChange(e.target.value)} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1">
                Fuel (L)
                {lastEdited === 'total' && form.fuel_quantity && <span className="flex items-center gap-0.5 text-orange-500 text-xs font-normal"><Calculator className="w-3 h-3" /> auto</span>}
                {pct !== null && <PctBadge pct={pct} />}
              </label>
              <input type="number" step="0.001" value={form.fuel_quantity} placeholder="8.500"
                className={lastEdited === 'total' && form.fuel_quantity ? icAuto : ic}
                onChange={(e) => handleQtyChange(e.target.value)} />
              {activeBike?.tank_capacity && <p className="text-xs text-gray-400 mt-0.5">Tank: {activeBike.tank_capacity} L</p>}
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium mb-1">
                Total Price
                {lastEdited === 'qty' && form.total_cost && <span className="flex items-center gap-0.5 text-orange-500 text-xs font-normal"><Calculator className="w-3 h-3" /> auto</span>}
              </label>
              <input type="number" step="0.01" value={form.total_cost} placeholder="896.75"
                className={lastEdited === 'qty' && form.total_cost ? icAuto : ic}
                onChange={(e) => handleTotalChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Station</label>
              <input list="station-list" value={form.station_name} placeholder="Select or type…" className={ic}
                onChange={(e) => setForm((f) => ({ ...f, station_name: e.target.value }))} />
              <datalist id="station-list">{stations.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_full_tank} className="rounded"
                  onChange={(e) => setForm((f) => ({ ...f, is_full_tank: e.target.checked }))} />
                Full tank
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLog.isPending || (!form.fuel_quantity && !form.total_cost)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {createLog.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(makeEmpty()); setLastEdited('qty'); setApiError(null); }}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {/* Log list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !logs?.length ? (
        <EmptyState title="No fuel logs yet" description="Log your first fill-up to track fuel efficiency." />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date & Time','Odometer','KM Run','Liters','Tank %','Efficiency','Price/Unit','Total','Station',''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => {
                  const logPct = activeBike?.tank_capacity ? Math.min(Math.round((log.fuel_quantity / activeBike.tank_capacity) * 100), 100) : null;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDatetime(log.logged_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{log.odometer_reading.toLocaleString()} km</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.km_since_last != null ? <span className="text-blue-600 font-medium">{log.km_since_last.toLocaleString()} km</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">{log.fuel_quantity} L</td>
                      <td className="px-4 py-3">{logPct !== null ? <PctBadge pct={logPct} /> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.fuel_efficiency != null ? <span className="font-medium text-green-700">{log.fuel_efficiency} km/L</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(log.fuel_price_per_unit)}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(log.total_cost)}</td>
                      <td className="px-4 py-3 text-gray-500">{log.station_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteLog.mutate(log.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => {
              const logPct = activeBike?.tank_capacity ? Math.min(Math.round((log.fuel_quantity / activeBike.tank_capacity) * 100), 100) : null;
              return (
                <div key={log.id} className="bg-white border rounded-xl p-4 space-y-3">
                  {/* Row 1: date + total + delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDatetime(log.logged_at)}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{log.odometer_reading.toLocaleString()} km
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold text-orange-600">{formatCurrency(log.total_cost)}</span>
                      <button onClick={() => deleteLog.mutate(log.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Row 2: badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full">
                      <Gauge className="w-3 h-3" />{log.fuel_quantity} L
                    </span>
                    {logPct !== null && <PctBadge pct={logPct} />}
                    {log.km_since_last != null && (
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        +{log.km_since_last.toLocaleString()} km
                      </span>
                    )}
                    {log.fuel_efficiency != null && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        <Zap className="w-3 h-3" />{log.fuel_efficiency} km/L
                      </span>
                    )}
                    <span className="text-xs text-gray-400 self-center">{formatCurrency(log.fuel_price_per_unit)}/unit</span>
                    {log.station_name && <span className="text-xs text-gray-400 self-center">⛽ {log.station_name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
