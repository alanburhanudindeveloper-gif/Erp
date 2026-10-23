import { GridColumn } from './types';

export function exportToCsv<T>(
  data: T[],
  columns: GridColumn<T>[],
  fileName = 'export-grid-data.csv'
) {
  if (!data || data.length === 0) return;

  const exportCols = columns.filter((col) => col.type !== 'action' && col.isVisible !== false);

  // Headers
  const headers = exportCols.map((col) => `"${col.headerName.replace(/"/g, '""')}"`);

  // Rows
  const rows = data.map((row) => {
    return exportCols
      .map((col) => {
        let val: any;
        if (col.valueGetter) {
          val = col.valueGetter(row);
        } else {
          val = (row as any)[col.field];
        }

        if (val === null || val === undefined) {
          return '""';
        }

        // Format dates or objects cleanly
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }

        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
