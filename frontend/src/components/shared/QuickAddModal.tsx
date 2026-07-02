import { useState, useEffect } from 'react';
import { X, Calculator, AlertCircle, Plus } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useCreateFuelLog } from '@/hooks/useFuelLogs';
import { useCreateServiceLog } from '@/hooks/useServiceLogs';
import { useCreateExpense } from '@/hooks/useExpenses';
import { PREDEFINED_SERVICE_TYPES } from '@/types/service';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/types/expense';
import { formatCurrency, nowLocalInput, localInputToUtcIso } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

const ic = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2';

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{msg}</span>
    </div>
  );
}

// ── Fuel form ──────────────────────────────────────────────────────────────────

const PRICE_KEY = 'fuel_price_per_unit';
const STATIONS_KEY = 'fuel_stations';
const loadPrice = () => localStorage.getItem(PRICE_KEY) ?? '';
const loadStations = (): string[] => { try { return JSON.parse(localStorage.getItem(STATIONS_KEY) ?? '[]'); } catch { return []; } };
const savePrice = (p: string) => { if (p) localStorage.setItem(PRICE_KEY, p); };
const saveStation = (name: string, cur: string[]): string[] => {
  if (!name.trim()) return cur;
  const u = Array.from(new Set([name.trim(), ...cur])).slice(0, 30);
  localStorage.setItem(STATIONS_KEY, JSON.stringify(u)); return u;
};
const calcTotal = (qty: string, price: string) => { const q = parseFloat(qty), p = parseFloat(price); return !isNaN(q) && !isNaN(p) && p > 0 ? (q * p).toFixed(2) : ''; };
const calcQty   = (total: string, price: string) => { const t = parseFloat(total), p = parseFloat(price); return !isNaN(t) && !isNaN(p) && p > 0 ? (t / p).toFixed(3) : ''; };
const tankPct   = (qty: string, cap?: number) => { if (!cap) return null; const q = parseFloat(qty); return isNaN(q) || q <= 0 ? null : Math.min(Math.round((q / cap) * 100), 100); };
function PctBadge({ pct }: { pct: number }) {
  const c = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${c}`}>≈ {pct}%</span>;
}

function FuelForm({ bikeId, onSuccess }: { bikeId: string; onSuccess: () => void }) {
  const { data: bikes } = useBikes();
  const activeBike = bikes?.find((b) => b.id === bikeId);
  const createLog = useCreateFuelLog(bikeId);
  const [form, setForm] = useState({ logged_at: nowLocalInput(), odometer_reading: '', fuel_price_per_unit: loadPrice(), fuel_quantity: '', total_cost: '', station_name: '', is_full_tank: true });
  const [lastEdited, setLastEdited] = useState<'qty' | 'total'>('qty');
  const [stations, setStations] = useState<string[]>(loadStations);
  const [err, setErr] = useState<string | null>(null);
  const pct = tankPct(form.fuel_quantity, activeBike?.tank_capacity);

  const onPrice = (v: string) => lastEdited === 'qty'
    ? setForm((f) => ({ ...f, fuel_price_per_unit: v, total_cost: calcTotal(f.fuel_quantity, v) }))
    : setForm((f) => ({ ...f, fuel_price_per_unit: v, fuel_quantity: calcQty(f.total_cost, v) }));
  const onQty   = (v: string) => { setLastEdited('qty');   setForm((f) => ({ ...f, fuel_quantity: v, total_cost: calcTotal(v, f.fuel_price_per_unit) })); };
  const onTotal = (v: string) => { setLastEdited('total'); setForm((f) => ({ ...f, total_cost: v, fuel_quantity: calcQty(v, f.fuel_price_per_unit) })); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    savePrice(form.fuel_price_per_unit);
    setStations(saveStation(form.station_name, stations));
    createLog.mutate(
      { logged_at: localInputToUtcIso(form.logged_at), odometer_reading: parseFloat(form.odometer_reading), fuel_price_per_unit: parseFloat(form.fuel_price_per_unit), fuel_quantity: form.fuel_quantity ? parseFloat(form.fuel_quantity) : undefined, total_cost: form.total_cost ? parseFloat(form.total_cost) : undefined, is_full_tank: form.is_full_tank, station_name: form.station_name || undefined },
      { onSuccess, onError: (e: unknown) => setErr((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save.') },
    );
  };

  const f1 = `${ic} focus:ring-orange-400`;
  const fa = `${ic} bg-orange-50 border-orange-200 focus:ring-orange-400`;

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <ErrorBanner msg={err} />}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Date & Time</label>
          <input type="datetime-local" value={form.logged_at} max={nowLocalInput()} required className={f1} onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Odometer (km)</label>
          <input type="number" step="0.1" value={form.odometer_reading} required placeholder="12500" className={f1} onChange={(e) => setForm((f) => ({ ...f, odometer_reading: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Price / Unit</label>
          <input type="number" step="0.01" value={form.fuel_price_per_unit} required placeholder="105.50" className={f1} onChange={(e) => onPrice(e.target.value)} /></div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium mb-1 text-gray-600">
            Fuel (L)
            {lastEdited === 'total' && form.fuel_quantity && <span className="text-orange-500 flex items-center gap-0.5"><Calculator className="w-3 h-3" />auto</span>}
            {pct !== null && <PctBadge pct={pct} />}
          </label>
          <input type="number" step="0.001" value={form.fuel_quantity} placeholder="8.500" className={lastEdited === 'total' && form.fuel_quantity ? fa : f1} onChange={(e) => onQty(e.target.value)} />
          {activeBike?.tank_capacity && <p className="text-xs text-gray-400 mt-0.5">Tank: {activeBike.tank_capacity} L</p>}
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium mb-1 text-gray-600">
            Total Price
            {lastEdited === 'qty' && form.total_cost && <span className="text-orange-500 flex items-center gap-0.5"><Calculator className="w-3 h-3" />auto</span>}
          </label>
          <input type="number" step="0.01" value={form.total_cost} placeholder="896.75" className={lastEdited === 'qty' && form.total_cost ? fa : f1} onChange={(e) => onTotal(e.target.value)} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Station</label>
          <input list="qs-stations" value={form.station_name} placeholder="Select or type…" className={f1} onChange={(e) => setForm((f) => ({ ...f, station_name: e.target.value }))} />
          <datalist id="qs-stations">{stations.map((s) => <option key={s} value={s} />)}</datalist></div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.is_full_tank} className="rounded" onChange={(e) => setForm((f) => ({ ...f, is_full_tank: e.target.checked }))} />
        Full tank
      </label>
      <button type="submit" disabled={createLog.isPending || (!form.fuel_quantity && !form.total_cost)}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
        {createLog.isPending ? 'Saving…' : 'Save Fuel Log'}
      </button>
    </form>
  );
}

// ── Service form ───────────────────────────────────────────────────────────────

const CUSTOM_TYPES_KEY = 'custom_service_types';
const loadCustomTypes = (): string[] => { try { return JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY) ?? '[]'); } catch { return []; } };
const saveCustomType = (name: string, cur: string[]): string[] => {
  const t = name.trim(); if (!t) return cur;
  const u = Array.from(new Set([...cur, t])); localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(u)); return u;
};
type ItemDraft = { name: string; cost: string };

function ServiceForm({ bikeId, onSuccess }: { bikeId: string; onSuccess: () => void }) {
  const createLog = useCreateServiceLog(bikeId);
  const [form, setForm] = useState({ logged_at: nowLocalInput(), odometer_reading: '', workshop_name: '', next_service_km: '' });
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(loadCustomTypes);
  const [customInput, setCustomInput] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const allTypes = [...PREDEFINED_SERVICE_TYPES, ...customTypes];
  const selectedNames = items.map((i) => i.name);
  const totalCost = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);

  const toggle = (name: string) =>
    selectedNames.includes(name) ? setItems((p) => p.filter((i) => i.name !== name)) : setItems((p) => [...p, { name, cost: '' }]);
  const addCustom = () => {
    const t = customInput.trim(); if (!t) return;
    setCustomTypes(saveCustomType(t, customTypes));
    if (!selectedNames.includes(t)) setItems((p) => [...p, { name: t, cost: '' }]);
    setCustomInput('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) { setErr('Select at least one service type.'); return; }
    if (items.some((i) => !i.cost || isNaN(parseFloat(i.cost)) || parseFloat(i.cost) < 0)) { setErr('Enter a valid cost for every item.'); return; }
    setErr(null);
    createLog.mutate(
      { logged_at: localInputToUtcIso(form.logged_at), service_items: items.map((i) => ({ name: i.name, cost: parseFloat(i.cost) })), odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : undefined, workshop_name: form.workshop_name || undefined, next_service_km: form.next_service_km ? parseFloat(form.next_service_km) : undefined },
      { onSuccess, onError: (e: unknown) => setErr((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save.') },
    );
  };

  const fg = `${ic} focus:ring-green-500`;

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <ErrorBanner msg={err} />}
      <div>
        <label className="block text-xs font-medium mb-2 text-gray-600">Service Types <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {allTypes.map((type) => (
            <button key={type} type="button" onClick={() => toggle(type)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedNames.includes(type) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
              {selectedNames.includes(type) ? '✓ ' : ''}{type}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={customInput} placeholder="Custom type…" onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button type="button" onClick={addCustom} disabled={!customInput.trim()}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium disabled:opacity-40"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {items.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="divide-y">
            {items.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 text-xs font-medium text-gray-700 truncate">{item.name}</span>
                <input type="number" step="0.01" min="0" value={item.cost} placeholder="0.00"
                  onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, cost: e.target.value } : it))}
                  className="w-24 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-green-50 px-3 py-2 flex justify-between text-xs border-t">
            <span className="text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-green-700">Total: {formatCurrency(totalCost)}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Date & Time</label>
          <input type="datetime-local" value={form.logged_at} max={nowLocalInput()} required className={fg} onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Odometer (km)</label>
          <input type="number" value={form.odometer_reading} placeholder="12500" className={fg} onChange={(e) => setForm((f) => ({ ...f, odometer_reading: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Workshop</label>
          <input type="text" value={form.workshop_name} placeholder="Service Center" className={fg} onChange={(e) => setForm((f) => ({ ...f, workshop_name: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Next Service (km)</label>
          <input type="number" value={form.next_service_km} placeholder="15000" className={fg} onChange={(e) => setForm((f) => ({ ...f, next_service_km: e.target.value }))} /></div>
      </div>
      <button type="submit" disabled={createLog.isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
        {createLog.isPending ? 'Saving…' : 'Save Service Record'}
      </button>
    </form>
  );
}

// ── Expense form ───────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

function ExpenseForm({ bikeId, onSuccess }: { bikeId: string; onSuccess: () => void }) {
  const createExpense = useCreateExpense(bikeId);
  const [form, setForm] = useState({ logged_at: nowLocalInput(), category: 'insurance' as ExpenseCategory, cost: '', description: '' });
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    createExpense.mutate(
      { logged_at: localInputToUtcIso(form.logged_at), category: form.category, cost: parseFloat(form.cost), description: form.description || undefined },
      { onSuccess, onError: (e: unknown) => setErr((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save.') },
    );
  };

  const fp = `${ic} focus:ring-purple-500`;

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <ErrorBanner msg={err} />}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Date & Time</label>
          <input type="datetime-local" value={form.logged_at} max={nowLocalInput()} required className={fp} onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} /></div>
        <div><label className="block text-xs font-medium mb-1 text-gray-600">Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className={fp}>
            {EXPENSE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="col-span-2"><label className="block text-xs font-medium mb-1 text-gray-600">Amount</label>
          <input type="number" step="0.01" min="0" value={form.cost} required placeholder="5500" className={fp} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} /></div>
        <div className="col-span-2"><label className="block text-xs font-medium mb-1 text-gray-600">Description</label>
          <input type="text" value={form.description} placeholder="Annual renewal" className={fp} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
      </div>
      <button type="submit" disabled={createExpense.isPending}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
        {createExpense.isPending ? 'Saving…' : 'Save Expense'}
      </button>
    </form>
  );
}

// ── Modal shell ────────────────────────────────────────────────────────────────

export type QuickAddTab = 'fuel' | 'service' | 'expense';

interface Props {
  defaultBikeId?: string;
  defaultTab?: QuickAddTab;
  onClose: () => void;
}

const TABS: { key: QuickAddTab; label: string; active: string }[] = [
  { key: 'fuel',    label: '⛽ Fuel',    active: 'bg-orange-500 text-white' },
  { key: 'service', label: '🔧 Service', active: 'bg-green-600 text-white' },
  { key: 'expense', label: '💳 Expense', active: 'bg-purple-600 text-white' },
];

export default function QuickAddModal({ defaultBikeId = '', defaultTab = 'fuel', onClose }: Props) {
  const { data: bikes } = useBikes();
  const [tab, setTab] = useState<QuickAddTab>(defaultTab);
  const [bikeId, setBikeId] = useState(defaultBikeId);
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel — full-width sheet on mobile, centered card on sm+ */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-2 border-b shrink-0">
          {/* Bike selector */}
          {bikes && bikes.length > 1 && (
            <select value={activeBikeId} onChange={(e) => setBikeId(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs bg-white mr-1">
              {bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {/* Tabs */}
          <div className="flex gap-1 flex-1">
            {TABS.map(({ key, label, active }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === key ? active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="overflow-y-auto p-4 pb-6">
          {tab === 'fuel'    && <FuelForm    bikeId={activeBikeId} onSuccess={onClose} />}
          {tab === 'service' && <ServiceForm bikeId={activeBikeId} onSuccess={onClose} />}
          {tab === 'expense' && <ExpenseForm bikeId={activeBikeId} onSuccess={onClose} />}
        </div>
      </div>
    </div>
  );
}
