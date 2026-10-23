import React from 'react';
import { SearchX, Inbox, FilterX } from 'lucide-react';

interface GridEmptyStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
  onClearFilters?: () => void;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export const GridEmptyState: React.FC<GridEmptyStateProps> = ({
  hasFilters,
  hasSearch,
  onClearFilters,
  message,
  action,
}) => {
  const isFiltered = hasFilters || hasSearch;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {isFiltered ? <SearchX className="w-5 h-5" /> : <Inbox className="w-5 h-5" />}
      </div>

      <h4 className="text-xs font-bold text-slate-800 mb-1">
        {message || (isFiltered ? 'No records match your criteria' : 'No records found')}
      </h4>

      <p className="text-[11px] text-slate-500 max-w-sm mb-3">
        {isFiltered
          ? 'Try adjusting your search terms or clearing column filters to view more records.'
          : 'There is currently no data registered in this ledger or table.'}
      </p>

      {isFiltered && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
        >
          <FilterX className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear Filters & Search</span>
        </button>
      )}

      {!isFiltered && action && (
        <button
          onClick={action.onClick}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
