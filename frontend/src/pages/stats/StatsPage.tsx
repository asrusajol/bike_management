import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Fuel, Wrench, TrendingUp, Receipt, ArrowDown, ArrowUp } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useStats } from '@/hooks/useStats';
import BikeSelector from '@/components/shared/BikeSelector';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS } from '@/types/expense';

// ── Mini stat card ─────────────────────────────────────────────────────────────

const ACCENT_BORDER: Record<string, string> = {
  blue:   'border-l-blue-500',
  orange: 'border-l-orange-500',
  green:  'border-l-green-600',
  purple: 'border-l-purple-500',
  red:    'border-l-red-500',
  sky:    'border-l-sky-500',
  yellow: 'border-l-yellow-500',
};

function MiniCard({
  label, value, sub, accent = 'blue',
}: {
  label: React.ReactNode; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 border-l-4 ${ACCENT_BORDER[accent] ?? ACCENT_BORDER.blue}`}>
      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">{label}</p>
      <p className="text-lg font-bold leading-tight break-all">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{children}</h2>;
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

type FilterTab = 'overall' | 'fuel' | 'service' | 'expense';

const TABS: { key: FilterTab; label: string; icon: React.ReactNode; active: string }[] = [
  { key: 'overall', label: 'Overall',  icon: <TrendingUp className="w-3.5 h-3.5" />, active: 'bg-gray-800 text-white' },
  { key: 'fuel',    label: 'Fuel',     icon: <Fuel       className="w-3.5 h-3.5" />, active: 'bg-orange-500 text-white' },
  { key: 'service', label: 'Service',  icon: <Wrench     className="w-3.5 h-3.5" />, active: 'bg-green-600 text-white' },
  { key: 'expense', label: 'Expenses', icon: <Receipt    className="w-3.5 h-3.5" />, active: 'bg-purple-600 text-white' },
];

const PIE_COLORS = ['#f97316', '#22c55e', '#a855f7'];
const EXPENSE_PIE_COLORS = ['#3b82f6', '#f59e0b', '#6b7280', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#9ca3af'];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';
  const { data: stats, isLoading } = useStats(activeBikeId);
  const [tab, setTab] = useState<FilterTab>('overall');

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  const { summary, monthly } = stats;

  const overallPieData = [
    { name: 'Fuel',     value: summary.total_fuel_cost },
    { name: 'Service',  value: summary.total_service_cost },
    { name: 'Expenses', value: summary.total_expense_cost },
  ].filter((d) => d.value > 0);

  const expensePieData = stats.expense_by_category.map((row) => ({
    name: EXPENSE_CATEGORY_LABELS[row.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? row.category,
    value: row.cost,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <BikeSelector value={activeBikeId} onChange={setBikeId} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon, active }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${tab === key ? active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── OVERALL ─────────────────────────────────────────────────────────── */}
      {tab === 'overall' && (
        <div className="space-y-6">
          {summary.total_km_run != null && (
            <div>
              <SectionTitle>Distance</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniCard label="Total KM Run" value={`${summary.total_km_run.toLocaleString()} km`} accent="blue"
                  sub={summary.days_tracked ? `over ${summary.days_tracked} days` : undefined} />
                {summary.daily_avg_km != null && (
                  <MiniCard label="Daily Avg KM" value={`${summary.daily_avg_km} km/day`} accent="sky" />
                )}
                {stats.avg_fuel_efficiency && (
                  <MiniCard label="Avg Efficiency" value={`${stats.avg_fuel_efficiency} km/L`} accent="green" />
                )}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Cost Overview</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniCard label="Total Spent"    value={formatCurrency(summary.total_cost)}         accent="blue" />
              <MiniCard label="Fuel"           value={formatCurrency(summary.total_fuel_cost)}    accent="orange" sub={`${summary.fuel_logs_count} fill-ups`} />
              <MiniCard label="Services"       value={formatCurrency(summary.total_service_cost)} accent="green"  sub={`${summary.service_logs_count} records`} />
              <MiniCard label="Other Expenses" value={formatCurrency(summary.total_expense_cost)} accent="purple" sub={`${summary.expense_count} records`} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {overallPieData.length > 0 && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Cost Distribution</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={overallPieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {overallPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {monthly.length > 0 && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Monthly Spend</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="fuel_cost"    name="Fuel"    stroke="#f97316" strokeWidth={2}   dot={{ r: 3, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="service_cost" name="Service" stroke="#22c55e" strokeWidth={2}   dot={{ r: 3, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expense_cost" name="Expense" stroke="#a855f7" strokeWidth={2}   dot={{ r: 3, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="total_cost"   name="Total"   stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {monthly.length > 0 && (
              <div className="bg-white border rounded-xl p-6 lg:col-span-2">
                <h2 className="font-semibold mb-4">Cost Breakdown by Month</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="fuel_cost"    name="Fuel"    fill="#f97316" stackId="a" />
                    <Bar dataKey="service_cost" name="Service" fill="#22c55e" stackId="a" />
                    <Bar dataKey="expense_cost" name="Other"   fill="#a855f7" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FUEL ─────────────────────────────────────────────────────────────── */}
      {tab === 'fuel' && (
        <div className="space-y-6">
          <div>
            <SectionTitle>Cost</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniCard label="Total Fuel Cost" value={formatCurrency(summary.total_fuel_cost)} accent="orange"
                sub={`${summary.fuel_logs_count} fill-ups`} />
              {summary.fuel_daily_avg_cost != null && (
                <MiniCard label="Daily Avg Cost" value={formatCurrency(summary.fuel_daily_avg_cost)} accent="sky"
                  sub={summary.days_tracked ? `over ${summary.days_tracked} days` : undefined} />
              )}
              {stats.avg_fuel_efficiency && (
                <MiniCard label="Avg Efficiency" value={`${stats.avg_fuel_efficiency} km/L`} accent="green" />
              )}
            </div>
          </div>

          <div>
            <SectionTitle>Efficiency Range</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {summary.fuel_max_efficiency != null && (
                <MiniCard
                  label={<><ArrowUp className="w-3 h-3 text-green-500" />Highest Efficiency</>}
                  value={`${summary.fuel_max_efficiency} km/L`}
                  accent="green"
                />
              )}
              {summary.fuel_min_efficiency != null && (
                <MiniCard
                  label={<><ArrowDown className="w-3 h-3 text-red-500" />Lowest Efficiency</>}
                  value={`${summary.fuel_min_efficiency} km/L`}
                  accent="red"
                />
              )}
              {summary.total_km_run != null && (
                <MiniCard label="Total KM Run" value={`${summary.total_km_run.toLocaleString()} km`} accent="blue" />
              )}
            </div>
          </div>

          {monthly.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-1">Monthly Fuel Cost</h2>
                <p className="text-xs text-gray-400 mb-4">Dot = each recorded month</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="fuel_cost" name="Fuel Cost" stroke="#f97316" strokeWidth={2.5}
                      dot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Cost by Month</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="fuel_cost" name="Fuel Cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SERVICE ──────────────────────────────────────────────────────────── */}
      {tab === 'service' && (
        <div className="space-y-6">
          <div>
            <SectionTitle>Service Summary</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniCard label="Total Service Cost" value={formatCurrency(summary.total_service_cost)} accent="green"
                sub={`${summary.service_logs_count} records`} />
              {summary.days_tracked && summary.total_service_cost > 0 && (
                <MiniCard label="Daily Avg Cost"
                  value={formatCurrency(summary.total_service_cost / summary.days_tracked)}
                  accent="sky" sub={`over ${summary.days_tracked} days`} />
              )}
              {summary.service_logs_count > 0 && (
                <MiniCard label="Avg Cost / Visit"
                  value={formatCurrency(summary.total_service_cost / summary.service_logs_count)}
                  accent="purple" />
              )}
            </div>
          </div>

          {monthly.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-1">Monthly Service Cost</h2>
                <p className="text-xs text-gray-400 mb-4">Dot = each recorded month</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="service_cost" name="Service Cost" stroke="#22c55e" strokeWidth={2.5}
                      dot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Service Cost by Month</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="service_cost" name="Service" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES ─────────────────────────────────────────────────────────── */}
      {tab === 'expense' && (
        <div className="space-y-6">
          <div>
            <SectionTitle>Expense Summary</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniCard label="Total Expenses" value={formatCurrency(summary.total_expense_cost)} accent="purple"
                sub={`${summary.expense_count} records`} />
              {summary.days_tracked && summary.total_expense_cost > 0 && (
                <MiniCard label="Daily Avg Cost"
                  value={formatCurrency(summary.total_expense_cost / summary.days_tracked)}
                  accent="sky" sub={`over ${summary.days_tracked} days`} />
              )}
              {summary.expense_count > 0 && (
                <MiniCard label="Avg Cost / Record"
                  value={formatCurrency(summary.total_expense_cost / summary.expense_count)}
                  accent="blue" />
              )}
            </div>
          </div>

          {/* Category breakdown */}
          {expensePieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">By Category</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {expensePieData.map((_, i) => <Cell key={i} fill={EXPENSE_PIE_COLORS[i % EXPENSE_PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category table */}
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-sm">Category Breakdown</h2>
                </div>
                <div className="divide-y">
                  {stats.expense_by_category.map((row, i) => (
                    <div key={row.category} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: EXPENSE_PIE_COLORS[i % EXPENSE_PIE_COLORS.length] }} />
                        <span className="text-sm text-gray-700">
                          {EXPENSE_CATEGORY_LABELS[row.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? row.category}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(row.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly expense chart */}
          {monthly.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-1">Monthly Expenses</h2>
                <p className="text-xs text-gray-400 mb-4">Dot = each recorded month</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="expense_cost" name="Expenses" stroke="#a855f7" strokeWidth={2.5}
                      dot={{ r: 5, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Expenses by Month</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="expense_cost" name="Expenses" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
