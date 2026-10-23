import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { ColumnFilter, FilterOperator, GridColumn } from './types';

interface GridFilterPopoverProps<T> {
  column: GridColumn<T>;
  currentFilter?: ColumnFilter;
  onApplyFilter: (filter: ColumnFilter | null) => void;
  uniqueValues?: { label: string; value: any; count?: number }[];
  onClose: () => void;
}

export const GridFilterPopover = <T,>({
  column,
  currentFilter,
  onApplyFilter,
  uniqueValues,
  onClose,
}: GridFilterPopoverProps<T>) => {
  const colType = column.type || 'text';

  // Determine initial operator
  const defaultOperator: FilterOperator =
    colType === 'number' || colType === 'currency' ? 'eq' : colType === 'status' || colType === 'badge' ? 'in' : 'contains';

  const [operator, setOperator] = useState<FilterOperator>(currentFilter?.operator || defaultOperator);
  const [value, setValue] = useState<any>(currentFilter?.value ?? (defaultOperator === 'in' ? [] : ''));
  const [secondValue, setSecondValue] = useState<any>(currentFilter?.secondValue ?? '');

  // Handle status multi-select
  const handleToggleEnum = (itemVal: any) => {
    const arr = Array.isArray(value) ? [...value] : [];
    const index = arr.indexOf(itemVal);
    if (index >= 0) {
      arr.splice(index, 1);
    } else {
      arr.push(itemVal);
    }
    setValue(arr);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (operator === 'in') {
      if (Array.isArray(value) && value.length > 0) {
        onApplyFilter({ field: column.field, operator: 'in', value });
      } else {
        onApplyFilter(null);
      }
    } else if (value !== '' && value !== null && value !== undefined) {
      onApplyFilter({
        field: column.field,
        operator,
        value,
        secondValue: operator === 'between' ? secondValue : undefined,
      });
    } else {
      onApplyFilter(null);
    }
    onClose();
  };

  const handleClear = () => {
    onApplyFilter(null);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full mt-1 left-0 z-50 w-64 bg-white border border-slate-300 rounded shadow-lg p-3 text-xs font-sans text-slate-800 space-y-2.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filter: {column.headerName}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleApply} className="space-y-2">
        {/* ENUM / STATUS MULTI-SELECT CHECKBOXES */}
        {(colType === 'status' || colType === 'badge' || column.filterOptions) ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[11px] text-slate-500 font-medium block">Select values:</span>
            {(column.filterOptions || uniqueValues || []).map((opt) => {
              const isChecked = Array.isArray(value) && value.includes(opt.value);
              return (
                <label
                  key={String(opt.value)}
                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEnum(opt.value)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800">{opt.label}</span>
                  </div>
                  {'count' in opt && (opt as any).count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">({(opt as any).count})</span>
                  )}
                </label>
              );
            })}
          </div>
        ) : (colType === 'number' || colType === 'currency') ? (
          /* NUMBER / CURRENCY FILTER */
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Condition</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as FilterOperator)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
              >
                <option value="eq">Equals (=)</option>
                <option value="gt">Greater than (&gt;)</option>
                <option value="gte">Greater or equal (&gt;=)</option>
                <option value="lt">Less than (&lt;)</option>
                <option value="lte">Less or equal (&lt;=)</option>
                <option value="between">Between</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter number..."
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
              />
            </div>

            {operator === 'between' && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">And</label>
                <input
                  type="number"
                  value={secondValue}
                  onChange={(e) => setSecondValue(e.target.value)}
                  placeholder="Enter upper bound..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            )}
          </div>
        ) : (
          /* TEXT FILTER */
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Condition</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as FilterOperator)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Filter text</label>
              <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type query..."
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-slate-500 hover:text-rose-600 font-medium"
          >
            Clear
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
