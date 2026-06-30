import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useBikes } from '@/hooks/useBikes';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import BikeSelector from '@/components/shared/BikeSelector';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

function nowLocal(): string {
  const d = new Date(); d.setSeconds(0, 0); return d.toISOString().slice(0, 16);
}
function formatDatetime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type FormState = { logged_at: string; category: ExpenseCategory; cost: string; description: string; notes: string };
function makeEmpty(): FormState {
  return { logged_at: nowLocal(), category: 'insurance', cost: '', description: '', notes: '' };
}

const categoryColors: Record<ExpenseCategory, string> = {
  insurance:   'bg-blue-100 text-blue-700',
  tax:         'bg-yellow-100 text-yellow-700',
  parking:     'bg-gray-100 text-gray-700',
  accessories: 'bg-purple-100 text-purple-700',
  repair:      'bg-red-100 text-red-700',
  cleaning:    'bg-cyan-100 text-cyan-700',
  fine:        'bg-orange-100 text-orange-700',
  other:       'bg-gray-100 text-gray-600',
};

export default function ExpensesPage() {
  const { data: bikes } = useBikes();
  const [bikeId, setBikeId] = useState('');
  const activeBikeId = bikeId || bikes?.[0]?.id || '';

  const { data: expenses, isLoading } = useExpenses(activeBikeId);
  const createExpense = useCreateExpense(activeBikeId);
  const deleteExpense = useDeleteExpense(activeBikeId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmpty);
  const [apiError, setApiError] = useState<string | null>(null);

  const maxDatetime = nowLocal();

  const resetForm = () => { setShowForm(false); setForm(makeEmpty()); setApiError(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    createExpense.mutate(
      { logged_at: form.logged_at, category: form.category, cost: parseFloat(form.cost),
        description: form.description || undefined, notes: form.notes || undefined },
      { onSuccess: resetForm, onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setApiError(msg ?? 'Failed to save expense.');
        } },
    );
  };

  const ic = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex items-center gap-3">
          <BikeSelector value={activeBikeId} onChange={setBikeId} />
          <button onClick={() => { setShowForm(true); setApiError(null); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Expense</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 md:p-6 space-y-4">
          <h2 className="font-semibold">New Expense</h2>
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{apiError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div><label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" value={form.logged_at} max={maxDatetime} required className={ic}
                onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className={ic}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" step="0.01" min="0" value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} required placeholder="5500" className={ic} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Annual renewal" className={ic} /></div>
            <div><label className="block text-sm font-medium mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional" className={ic} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createExpense.isPending}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {createExpense.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !expenses?.length ? (
        <EmptyState title="No expenses yet" description="Track insurance, taxes, accessories and more." />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date & Time','Category','Amount','Description',''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDatetime(exp.logged_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[exp.category]}`}>
                        {EXPENSE_CATEGORY_LABELS[exp.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(exp.cost)}</td>
                    <td className="px-4 py-3 text-gray-500">{exp.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteExpense.mutate(exp.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {expenses.map((exp) => (
              <div key={exp.id} className="bg-white border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDatetime(exp.logged_at)}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${categoryColors[exp.category]}`}>
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold text-purple-700">{formatCurrency(exp.cost)}</span>
                    <button onClick={() => deleteExpense.mutate(exp.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {exp.description && <p className="text-xs text-gray-500">{exp.description}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
