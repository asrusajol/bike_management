import { useBikes } from '@/hooks/useBikes';

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function BikeSelector({ value, onChange }: Props) {
  const { data: bikes } = useBikes();

  if (!bikes?.length) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-lg px-3 py-1.5 text-sm bg-white"
    >
      {bikes.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
