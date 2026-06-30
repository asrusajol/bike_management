import { useState, useMemo } from 'react';
import { Fuel, Wrench, Receipt, Gauge, MapPin, Zap } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useServiceLogs } from '@/hooks/useServiceLogs';
import { useExpenses } from '@/hooks/useExpenses';
import BikeSelector from '@/components/shared/BikeSelector';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { FuelLog } from '@/types/fuel';
import type { ServiceLog } from '@/types/service';
import type { Expense } from '@/types/expense';
import { EXPENSE_CATEGORY_LABELS } from '@/types/expense';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'all' | 'fuel' | 'service' | 'expense';

interface BaseEvent {
  id: string;
  sortKey: number; // ms timestamp for sorting
  monthKey: string; // "June 2026"
  dayKey: string; // "30 Jun 2026"
  timeLabel: string; // "14:30" or ""
}

interface FuelEvent extends BaseEvent { type: 'fuel'; data: FuelLog }
interface ServiceEvent extends BaseEvent { type: 'service'; data: ServiceLog }
interface ExpenseEvent extends BaseEvent { type: 'expense'; data: Expense }

type TimelineEvent = FuelEvent | ServiceEvent | ExpenseEvent;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDatetime(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function toEvents(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  expenses: Expense[],
): TimelineEvent[] {
  const all: TimelineEvent[] = [];

  for (const log of fuelLogs) {
    const d = parseDatetime(log.logged_at);
    all.push({ id: log.id, type: 'fuel', data: log, sortKey: d.getTime(), monthKey: fmtMonth(d), dayKey: fmtDay(d), timeLabel: fmtTime(d) });
  }

  for (const log of serviceLogs) {
    const d = parseDatetime(log.logged_at);
    all.push({ id: log.id, type: 'service', data: log, sortKey: d.getTime(), monthKey: fmtMonth(d), dayKey: fmtDay(d), timeLabel: fmtTime(d) });
  }

  for (const exp of expenses) {
    const d = parseDatetime(exp.logged_at);
    all.push({ id: exp.id, type: 'expense', data: exp, sortKey: d.getTime(), monthKey: fmtMonth(d), dayKey: fmtDay(d), timeLabel: fmtTime(d) });
  }

  return all.sort((a, b) => b.sortKey - a.sortKey);
}

// ── Event Cards ───────────────────────────────────────────────────────────────

function FuelCard({ data }: { data: FuelLog }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-gray-900">Fuel Fill-up</span>
        <span className="font-bold text-orange-600 text-sm">{formatCurrency(data.total_cost)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{data.fuel_quantity} L</span>
        <span className="flex items-center gap-1">⛽ {formatCurrency(data.fuel_price_per_unit)}/unit</span>
        {data.odometer_reading && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.odometer_reading.toLocaleString()} km</span>
        )}
        {data.fuel_efficiency != null && (
          <span className="flex items-center gap-1 text-green-600 font-medium"><Zap className="w-3 h-3" />{data.fuel_efficiency} km/L</span>
        )}
        {data.km_since_last != null && (
          <span className="text-blue-600">+{data.km_since_last.toLocaleString()} km</span>
        )}
        {data.station_name && (
          <span className="text-gray-400">{data.station_name}</span>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ data }: { data: ServiceLog }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-gray-900">Service</span>
        <span className="font-bold text-green-700 text-sm">{formatCurrency(data.cost)}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-1">
        {data.service_items.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
            {item.name}
            <span className="text-green-500">{formatCurrency(item.cost)}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
        {data.odometer_reading && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.odometer_reading.toLocaleString()} km</span>
        )}
        {data.workshop_name && <span>🏪 {data.workshop_name}</span>}
        {data.next_service_km && <span>Next: {data.next_service_km.toLocaleString()} km</span>}
        {data.notes && <span className="text-gray-400 italic">{data.notes}</span>}
      </div>
    </div>
  );
}

const EXPENSE_COLORS: Record<string, string> = {
  insurance: 'bg-blue-50 text-blue-700 border-blue-200',
  tax: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  parking: 'bg-gray-50 text-gray-700 border-gray-200',
  accessories: 'bg-purple-50 text-purple-700 border-purple-200',
  repair: 'bg-red-50 text-red-700 border-red-200',
  cleaning: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  fine: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

function ExpenseCard({ data }: { data: Expense }) {
  const label = EXPENSE_CATEGORY_LABELS[data.category] ?? data.category;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Expense</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${EXPENSE_COLORS[data.category] ?? EXPENSE_COLORS.other}`}>
            {label}
          </span>
        </div>
        <span className="font-bold text-purple-700 text-sm">{formatCurrency(data.cost)}</span>
      </div>
      {(data.description || data.notes) && (
        <p className="text-xs text-gray-500">{data.description ?? data.notes}</p>
      )}
    </div>
  );
}

// ── Dot + icon per type ───────────────────────────────────────────────────────

const TYPE_META = {
  fuel:    { Icon: Fuel,    dot: 'bg-orange-500', ring: 'ring-orange-100' },
  service: { Icon: Wrench,  dot: 'bg-green-600',  ring: 'ring-green-100' },
  expense: { Icon: Receipt, dot: 'bg-purple-600', ring: 'ring-purple-100' },
} as const;

const FILTER_BTNS: { key: EventType; label: string; color: string }[] = [
  { key: 'all',     label: 'All',      color: 'bg-gray-800 text-white' },
  { key: 'fuel',    label: 'Fuel',     color: 'bg-orange-500 text-white' },
  { key: 'service', label: 'Service',  color: 'bg-green-600 text-white' },
  { key: 'expense', label: 'Expense',  color: 'bg-purple-600 text-white' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const [filter, setFilter] = useState<EventType>('all');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: fuelLogs = [],    isLoading: fuelLoading }    = useFuelLogs(activeBikeId);
  const { data: serviceLogs = [], isLoading: serviceLoading } = useServiceLogs(activeBikeId);
  const { data: expenses = [],    isLoading: expenseLoading } = useExpenses(activeBikeId);

  const isLoading = fuelLoading || serviceLoading || expenseLoading;

  const events = useMemo(
    () => toEvents(fuelLogs, serviceLogs, expenses),
    [fuelLogs, serviceLogs, expenses],
  );

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of filtered) {
      const arr = map.get(ev.monthKey) ?? [];
      arr.push(ev);
      map.set(ev.monthKey, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  // Per-month totals
  const monthTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const ev of filtered) {
      const cost =
        ev.type === 'fuel' ? (ev.data as FuelLog).total_cost :
        ev.type === 'service' ? (ev.data as ServiceLog).cost :
        (ev.data as Expense).cost;
      totals.set(ev.monthKey, (totals.get(ev.monthKey) ?? 0) + cost);
    }
    return totals;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">History</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {FILTER_BTNS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity ${
              filter === key ? color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            {key !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({events.filter((e) => e.type === key).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} records</span>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No history yet" description="Add fuel fill-ups, service records or expenses to see your timeline." />
      ) : (
        <div className="space-y-8">
          {grouped.map(([month, evts]) => (
            <div key={month}>
              {/* Month header */}
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-2 z-10 rounded-lg px-3">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{month}</span>
                <span className="text-sm font-semibold text-gray-500">
                  {formatCurrency(monthTotals.get(month) ?? 0)}
                </span>
              </div>

              {/* Events */}
              <div className="relative ml-5">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

                <div className="space-y-1">
                  {evts.map((ev, idx) => {
                    const { Icon, dot, ring } = TYPE_META[ev.type];
                    const showDayLabel = idx === 0 || evts[idx - 1].dayKey !== ev.dayKey;

                    return (
                      <div key={ev.id}>
                        {/* Day separator */}
                        {showDayLabel && (
                          <div className="flex items-center gap-3 mb-2 mt-4 first:mt-0">
                            <div className="w-7 shrink-0" />
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {ev.dayKey}
                            </span>
                          </div>
                        )}

                        {/* Event row */}
                        <div className="flex items-start gap-3 group">
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-7 h-7 rounded-full ${dot} ring-4 ${ring} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>

                          {/* Card */}
                          <div className="flex-1 bg-white border rounded-xl px-4 py-3 mb-2 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              {/* Event content */}
                              {ev.type === 'fuel'    && <FuelCard    data={ev.data as FuelLog} />}
                              {ev.type === 'service' && <ServiceCard data={ev.data as ServiceLog} />}
                              {ev.type === 'expense' && <ExpenseCard data={ev.data as Expense} />}
                            </div>
                            {/* Time stamp */}
                            {ev.timeLabel && (
                              <p className="text-right text-xs text-gray-300 mt-1">{ev.timeLabel}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
