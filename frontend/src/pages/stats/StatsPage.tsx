import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useBikes } from '@/hooks/useBikes';
import { useStats } from '@/hooks/useStats';
import BikeSelector from '@/components/shared/BikeSelector';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

const PIE_COLORS = ['#f97316', '#22c55e', '#a855f7'];

export default function StatsPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';
  const { data: stats, isLoading } = useStats(activeBikeId);

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  const pieData = [
    { name: 'Fuel',     value: stats.summary.total_fuel_cost },
    { name: 'Service',  value: stats.summary.total_service_cost },
    { name: 'Expenses', value: stats.summary.total_expense_cost },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <BikeSelector value={activeBikeId} onChange={setBikeId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Cost Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.monthly.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Monthly Spend</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="total_cost" name="Total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.monthly.length > 0 && (
          <div className="bg-white border rounded-xl p-6 lg:col-span-2">
            <h2 className="font-semibold mb-4">Cost Breakdown by Month</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="fuel_cost" name="Fuel" fill="#f97316" stackId="a" />
                <Bar dataKey="service_cost" name="Service" fill="#22c55e" stackId="a" />
                <Bar dataKey="expense_cost" name="Other" fill="#a855f7" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.avg_fuel_efficiency && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-1">Avg Fuel Efficiency</h2>
            <p className="text-4xl font-bold text-orange-500 mt-2">{stats.avg_fuel_efficiency} <span className="text-lg font-normal text-gray-500">km/L</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
