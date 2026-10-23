import React from 'react';
import { CheckSquare, X } from 'lucide-react';
import { BulkAction } from './types';

interface GridBulkActionsProps<T> {
  selectedCount: number;
  totalCount: number;
  selectedRows: T[];
  actions?: BulkAction<T>[];
  onClearSelection: () => void;
  onSelectAllVisible?: () => void;
}

export const GridBulkActions = <T,>({
  selectedCount,
  totalCount,
  selectedRows,
  actions = [],
  onClearSelection,
  onSelectAllVisible,
}: GridBulkActionsProps<T>) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-sans shadow-md animate-in slide-in-from-top-1 duration-150">
      {/* Left: Selection Counter */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-blue-400" />
        <span className="font-semibold">
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white underline text-[11px] ml-1"
        >
          Clear
        </button>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          const variantClasses =
            act.variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : act.variant === 'success'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : act.variant === 'warning'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700';

          return (
            <button
              key={idx}
              onClick={() => act.onClick(selectedRows)}
              title={act.tooltip}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors shadow-2xs ${variantClasses}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
