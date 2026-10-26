import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  actionNode?: React.ReactNode;
}

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Cari data...',
  pageSize = 10,
  emptyTitle = 'Tidak ada data ditemukan',
  emptySubtitle = 'Sesuaikan kata kunci pencarian atau filter yang dipilih.',
  actionNode,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition"
          />
        </div>
        {actionNode && <div className="flex items-center gap-2">{actionNode}</div>}
      </div>

      {/* Table Grid Container */}
      <div className="overflow-x-auto border border-slate-200 bg-white rounded-lg shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50/80 border-b border-slate-200">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="py-2.5 px-3 font-semibold text-slate-600 tracking-tight whitespace-nowrap select-none"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 hover:text-slate-900 group transition-colors text-left font-semibold text-xs"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                            {sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-indigo-600" />
                            ) : sortDirection === 'desc' ? (
                              <ArrowDown className="w-3 h-3 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                            )}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 transition-colors h-9"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2 px-3 whitespace-nowrap align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="font-medium text-slate-800 text-sm">{emptyTitle}</p>
                    <p className="text-xs text-slate-400">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination & Metrics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div>
          Menampilkan{' '}
          <span className="font-semibold text-slate-700">
            {table.getFilteredRowModel().rows.length === 0
              ? 0
              : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{' '}
          s/d{' '}
          <span className="font-semibold text-slate-700">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-slate-700">
            {table.getFilteredRowModel().rows.length}
          </span>{' '}
          baris total
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-2 font-medium text-slate-600">
            Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
            {table.getPageCount() || 1}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
