import React from 'react';
import { GridColumn } from './types';
import {
  formatCurrency,
  formatQuantity,
  formatPercentage,
  formatDate,
  formatDateTime,
  getStatusBadgeTheme,
} from './GridFormatters';

export function createTextColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & { isCode?: boolean }
): GridColumn<T> {
  const isCode = options?.isCode ?? false;
  return {
    field,
    headerName,
    type: 'text',
    width: options?.width ?? (isCode ? 140 : 180),
    minWidth: options?.minWidth ?? (isCode ? 100 : 120),
    sortable: options?.sortable ?? true,
    filterable: options?.filterable ?? true,
    pinned: options?.pinned,
    align: options?.align ?? 'left',
    renderCell: options?.renderCell ?? (isCode
      ? ({ value }) => (
          <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
            {value ?? '-'}
          </span>
        )
      : undefined),
    ...options,
  };
}

export function createNumberColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & { uomField?: string; uomText?: string; decimals?: number }
): GridColumn<T> {
  return {
    field,
    headerName,
    type: 'number',
    width: options?.width ?? 120,
    minWidth: options?.minWidth ?? 80,
    sortable: options?.sortable ?? true,
    filterable: options?.filterable ?? true,
    align: 'right',
    renderCell: ({ row, value }) => {
      const uom = options?.uomField ? (row as any)[options.uomField] : options?.uomText;
      return (
        <span className="tabular-nums font-mono">
          {formatQuantity(value, uom, { decimals: options?.decimals })}
        </span>
      );
    },
    ...options,
  };
}

export function createCurrencyColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & { currency?: string; decimals?: number }
): GridColumn<T> {
  return {
    field,
    headerName,
    type: 'currency',
    width: options?.width ?? 150,
    minWidth: options?.minWidth ?? 110,
    sortable: options?.sortable ?? true,
    filterable: options?.filterable ?? true,
    align: 'right',
    renderCell: ({ value }) => (
      <span className="tabular-nums font-mono font-medium text-slate-800 dark:text-slate-200">
        {formatCurrency(value, options?.currency ?? 'IDR', { decimals: options?.decimals ?? 0 })}
      </span>
    ),
    ...options,
  };
}

export function createDateColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & { isDateTime?: boolean }
): GridColumn<T> {
  const isDateTime = options?.isDateTime ?? false;
  return {
    field,
    headerName,
    type: isDateTime ? 'datetime' : 'date',
    width: options?.width ?? (isDateTime ? 155 : 120),
    minWidth: options?.minWidth ?? (isDateTime ? 130 : 100),
    sortable: options?.sortable ?? true,
    filterable: options?.filterable ?? true,
    renderCell: ({ value }) => (
      <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
        {isDateTime ? formatDateTime(value) : formatDate(value)}
      </span>
    ),
    ...options,
  };
}

export function createStatusColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & {
    filterOptions?: { label: string; value: string | number }[];
    formatLabel?: (status: string) => string;
  }
): GridColumn<T> {
  return {
    field,
    headerName,
    type: 'status',
    width: options?.width ?? 130,
    minWidth: options?.minWidth ?? 100,
    sortable: options?.sortable ?? true,
    filterable: options?.filterable ?? true,
    filterOptions: options?.filterOptions,
    renderCell: ({ value }) => {
      if (!value) return <span className="text-slate-400">-</span>;
      const theme = getStatusBadgeTheme(String(value));
      const label = options?.formatLabel
        ? options.formatLabel(String(value))
        : String(value).replace(/_/g, ' ');

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          {label}
        </span>
      );
    },
    ...options,
  };
}

export function createProgressColumn<T>(
  field: string,
  headerName: string,
  options?: Partial<GridColumn<T>> & { max?: number; showLabel?: boolean }
): GridColumn<T> {
  const max = options?.max ?? 100;
  const showLabel = options?.showLabel ?? true;

  return {
    field,
    headerName,
    type: 'progress',
    width: options?.width ?? 140,
    minWidth: options?.minWidth ?? 100,
    sortable: options?.sortable ?? true,
    align: 'center',
    renderCell: ({ value }) => {
      const num = typeof value === 'number' ? value : 0;
      const pct = Math.min(100, Math.max(0, (num / max) * 100));

      const barColor =
        pct >= 100
          ? 'bg-emerald-500'
          : pct >= 50
          ? 'bg-blue-500'
          : pct > 0
          ? 'bg-amber-500'
          : 'bg-slate-300 dark:bg-slate-600';

      return (
        <div className="w-full flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {showLabel && (
            <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 w-8 text-right">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      );
    },
    ...options,
  };
}

export function createActionColumn<T>(
  renderActions: (params: { row: T; index: number }) => React.ReactNode,
  options?: { width?: number; headerName?: string; pinned?: 'left' | 'right' }
): GridColumn<T> {
  return {
    field: '__actions',
    headerName: options?.headerName ?? 'Actions',
    type: 'action',
    width: options?.width ?? 120,
    minWidth: 80,
    sortable: false,
    filterable: false,
    hideable: false,
    pinned: options?.pinned ?? 'right',
    align: 'right',
    renderCell: ({ row, index }) => renderActions({ row, index }),
  };
}
