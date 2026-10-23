import React, { useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Download,
  Rows3,
  Columns,
  RotateCcw,
} from 'lucide-react';
import { DensityMode, GridColumn } from './types';

interface GridToolbarProps<T> {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  columns: GridColumn<T>[];
  onToggleColumnVisibility?: (field: string) => void;
  onResetColumns?: () => void;
  density: DensityMode;
  onDensityChange?: (d: DensityMode) => void;
  showDensitySelector?: boolean;
  onExportCsv?: () => void;
  exportable?: boolean;
  activeFilterCount: number;
  onClearAllFilters?: () => void;
  totalRowCount: number;
  filteredRowCount: number;
}

export const GridToolbar = <T,>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  columns,
  onToggleColumnVisibility,
  onResetColumns,
  density,
  onDensityChange,
  showDensitySelector = true,
  onExportCsv,
  exportable = true,
  activeFilterCount,
  onClearAllFilters,
  totalRowCount,
  filteredRowCount,
}: GridToolbarProps<T>) => {
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-slate-50/70 border-b border-slate-200 text-xs font-sans">
      {/* Left: Global Search & Active Filter Chips */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-slate-200 rounded pl-8 pr-7 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeFilterCount > 0 && onClearAllFilters && (
          <button
            onClick={onClearAllFilters}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded shrink-0 transition-colors"
            title="Reset all column filters"
          >
            <span>{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Right: Tools & Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
        {/* Row Counts */}
        <span className="text-[11px] text-slate-500 font-mono mr-1">
          {filteredRowCount === totalRowCount ? (
            <span>{totalRowCount.toLocaleString()} records</span>
          ) : (
            <span>
              <strong className="text-slate-800">{filteredRowCount.toLocaleString()}</strong> of {totalRowCount.toLocaleString()} records
            </span>
          )}
        </span>

        {/* Columns Customizer */}
        {onToggleColumnVisibility && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnsMenu((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs transition-colors"
              title="Configure visible columns"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Columns</span>
            </button>

            {showColumnsMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs space-y-2 animate-in fade-in duration-100"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-semibold text-slate-700">
                  <span>Visible Columns</span>
                  {onResetColumns && (
                    <button
                      onClick={onResetColumns}
                      className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {columns
                    .filter((c) => c.hideable !== false && c.type !== 'action')
                    .map((col) => {
                      const isVis = col.isVisible !== false;
                      return (
                        <label
                          key={col.field}
                          className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isVis}
                            onChange={() => onToggleColumnVisibility(col.field)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className={isVis ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            {col.headerName}
                          </span>
                        </label>
                      );
                    })}
                </div>

                <div className="border-t border-slate-100 pt-1 text-right">
                  <button
                    onClick={() => setShowColumnsMenu(false)}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Density Selector */}
        {showDensitySelector && onDensityChange && (
          <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 shadow-2xs">
            <button
              onClick={() => onDensityChange('compact')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                density === 'compact'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Compact row height (36px)"
            >
              Compact
            </button>
            <button
              onClick={() => onDensityChange('comfortable')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                density === 'comfortable'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Comfortable row height (46px)"
            >
              Comfortable
            </button>
          </div>
        )}

        {/* Export CSV Button */}
        {exportable && onExportCsv && (
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs transition-colors"
            title="Export data to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Export</span>
          </button>
        )}
      </div>
    </div>
  );
};
