import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'BDT') {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatOdometer(value: number, unit: 'km' | 'miles') {
  return `${value.toLocaleString()} ${unit}`;
}

/** Current local time as a `datetime-local` input value (e.g. "2026-07-01T14:30"), in the browser's own timezone. */
export function nowLocalInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convert a naive `datetime-local` value (interpreted as the browser's local time) into a
 * timezone-aware ISO string in UTC, so the backend receives an unambiguous instant rather
 * than a wall-clock time mislabeled as UTC.
 */
export function localInputToUtcIso(localValue: string): string {
  return new Date(localValue).toISOString();
}
