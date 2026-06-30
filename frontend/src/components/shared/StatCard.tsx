import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const colors = {
  blue:   'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
  green:  'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  red:    'bg-red-50 text-red-600',
};

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: keyof typeof colors;
  sub?: string;
}

export default function StatCard({ label, value, icon: Icon, color = 'blue', sub }: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium leading-tight">{label}</p>
        <div className={cn('rounded-lg p-2 shrink-0', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-bold leading-tight break-all">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
