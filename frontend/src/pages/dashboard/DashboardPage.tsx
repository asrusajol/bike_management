import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fuel, Wrench, Receipt, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBikes } from '@/hooks/useBikes';
import { useStats } from '@/hooks/useStats';
import StatCard from '@/components/shared/StatCard';
import BikeSelector from '@/components/shared/BikeSelector';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data: bikes, isLoading } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';
  const { data: stats } = useStats(activeBikeId);

  if (isLoading) return <LoadingSpinner />;

  if (!bikes?.length) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏍</div>
        <h2 className="text-xl font-semibold">No bikes yet</h2>
        <p className="text-gray-500 mt-2">Add your first bike to start tracking costs.</p>
        <Link to="/bikes" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
          Add a bike
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <BikeSelector value={activeBikeId} onChange={setBikeId} />
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Spent"    value={formatCurrency(stats.summary.total_cost)}         icon={TrendingUp} color="blue" />
            <StatCard label="Fuel"           value={formatCurrency(stats.summary.total_fuel_cost)}    icon={Fuel}       color="orange" sub={`${stats.summary.fuel_logs_count} fill-ups`} />
            <StatCard label="Services"       value={formatCurrency(stats.summary.total_service_cost)} icon={Wrench}     color="green"  sub={`${stats.summary.service_logs_count} records`} />
            <StatCard label="Other Expenses" value={formatCurrency(stats.summary.total_expense_cost)} icon={Receipt}    color="purple" sub={`${stats.summary.expense_count} records`} />
          </div>

          {stats.avg_fuel_efficiency && (
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Avg fuel efficiency</p>
              <p className="text-2xl font-bold mt-1">{stats.avg_fuel_efficiency} km/L</p>
            </div>
          )}

          {stats.monthly.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Monthly Cost Breakdown</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="fuel_cost"    name="Fuel"    fill="#f97316" stackId="a" />
                  <Bar dataKey="service_cost" name="Service" fill="#22c55e" stackId="a" />
                  <Bar dataKey="expense_cost" name="Other"   fill="#a855f7" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
