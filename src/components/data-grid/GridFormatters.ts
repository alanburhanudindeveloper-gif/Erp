/**
 * Standardized enterprise formatters for numeric, currency, date, and status fields.
 * Follows ERP Manufacturing formatting conventions.
 */

export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'IDR',
  options?: { showSymbol?: boolean; decimals?: number }
): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const decimals = options?.decimals ?? 0;
  const showSymbol = options?.showSymbol ?? true;

  const formattedNum = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  if (!showSymbol) return formattedNum;
  return currency === 'IDR' ? `Rp ${formattedNum}` : `${currency} ${formattedNum}`;
}

export function formatQuantity(
  value: number | null | undefined,
  uom?: string,
  options?: { decimals?: number }
): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const decimals = options?.decimals ?? (Number.isInteger(value) ? 0 : 2);

  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return uom ? `${formatted} ${uom}` : formatted;
}

export function formatPercentage(
  value: number | null | undefined,
  options?: { decimals?: number; multiplyBy100?: boolean }
): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const decimals = options?.decimals ?? 1;
  const num = options?.multiplyBy100 ? value * 100 : value;
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toISOString().split('T')[0];
  } catch {
    return fallback;
  }
}

export function formatDateTime(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
    return `${dateStr} ${timeStr}`;
  } catch {
    return fallback;
  }
}

export function getStatusBadgeTheme(status: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'AVAILABLE':
    case 'RELEASED':
    case 'PASSED':
    case 'POSTED':
    case 'READY':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
      };

    case 'IN_PROGRESS':
    case 'IN PROGRESS':
    case 'RUNNING':
    case 'RESERVED':
    case 'PARTIALLY_RECEIVED':
    case 'PARTIAL':
    case 'PROCESSING':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-500',
      };

    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'DRAFT':
    case 'SUBMITTED':
    case 'PLANNED':
    case 'UNRELEASED':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/60',
        dot: 'bg-amber-500',
      };

    case 'HOLD':
    case 'BLOCKED':
    case 'QUARANTINE':
    case 'UNDER_INSPECTION':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800/60',
        dot: 'bg-purple-500',
      };

    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
    case 'DEFECTIVE':
    case 'SCRAPPED':
    case 'INACTIVE':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/60',
        dot: 'bg-rose-500',
      };

    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}
