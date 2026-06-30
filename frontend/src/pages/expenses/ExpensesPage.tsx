import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];
const today = new Date().toISOString().split('T')[0];

export default function ExpensesPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: expenses, isLoading } = useExpenses(activeBikeId);
  const createExpense = useCreateExpense(activeBikeId);
  const deleteExpense = useDeleteExpense(activeBikeId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today, category: 'insurance' as ExpenseCategory, cost: '', description: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(
      { date: form.date, category: form.category, cost: parseFloat(form.cost), description: form.description || undefined, notes: form.notes || undefined },
      { onSuccess: () => setShowForm(false) },
    );
  };

  const categoryColors: Record<ExpenseCategory, string> = {
    insurance: 'bg-blue-100 text-blue-700', tax: 'bg-yellow-100 text-yellow-700',
    parking: 'bg-gray-100 text-gray-700', accessories: 'bg-purple-100 text-purple-700',
    repair: 'bg-red-100 text-red-700', cleaning: 'bg-cyan-100 text-cyan-700',
    fine: 'bg-orange-100 text-orange-700', other: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">New Expense</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} required placeholder="5500" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Annual renewal" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createExpense.isPending} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {createExpense.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <LoadingSpinner /> : !expenses?.length ? (
        <EmptyState title="No expenses yet" description="Track insurance, taxes, accessories and more." />
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Date', 'Category', 'Amount', 'Description', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[exp.category]}`}>{EXPENSE_CATEGORY_LABELS[exp.category]}</span></td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(exp.cost)}</td>
                  <td className="px-4 py-3 text-gray-500">{exp.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteExpense.mutate(exp.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
