import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Pin,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { ColumnFilter, GridColumn, SortModel } from './types';
import { GridFilterPopover } from './GridFilterPopover';

interface GridColumnHeaderProps<T> {
  column: GridColumn<T>;
  sortModel?: SortModel;
  onSortChange?: (field: string) => void;
  filter?: ColumnFilter;
  onFilterChange?: (filter: ColumnFilter | null) => void;
  uniqueValues?: { label: string; value: any; count?: number }[];
  onResize?: (field: string, newWidth: number) => void;
  onPinColumn?: (field: string, pin: 'left' | 'right' | null) => void;
  onHideColumn?: (field: string) => void;
  isResizing?: boolean;
}

export const GridColumnHeader = <T,>({
  column,
  sortModel,
  onSortChange,
  filter,
  onFilterChange,
  uniqueValues,
  onResize,
  onPinColumn,
  onHideColumn,
}: GridColumnHeaderProps<T>) => {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const isSorted = sortModel?.field === column.field;
  const isFiltered = !!filter;

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = column.width || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX.current;
      const minW = column.minWidth || 60;
      const maxW = column.maxWidth || 600;
      const calculatedWidth = Math.max(minW, Math.min(maxW, resizeStartWidth.current + deltaX));
      if (onResize) {
        onResize(column.field, calculatedWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`group relative flex items-center justify-between h-full px-3 py-2 text-xs font-semibold text-slate-700 select-none ${
        column.align === 'right'
          ? 'flex-row-reverse text-right'
          : column.align === 'center'
          ? 'justify-center text-center'
          : 'text-left'
      }`}
    >
      {/* Title & Sorting Area */}
      <div
        onClick={() => {
          if (column.sortable !== false && onSortChange) {
            onSortChange(column.field);
          }
        }}
        className={`flex items-center gap-1.5 truncate cursor-pointer ${
          column.sortable !== false ? 'hover:text-slate-900' : ''
        }`}
        title={column.tooltip || column.headerName}
      >
        <span className="truncate">{column.headerName}</span>

        {/* Sort Indicator */}
        {column.sortable !== false && (
          <span className="shrink-0 text-slate-400">
            {isSorted ? (
              sortModel.direction === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </span>
        )}
      </div>

      {/* Header Tools: Filter & Menu */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
        {/* Filter Trigger */}
        {column.filterable !== false && column.type !== 'action' && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPopover((prev) => !prev);
                setShowColumnMenu(false);
              }}
              className={`p-1 rounded transition-colors ${
                isFiltered
                  ? 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-300'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title={isFiltered ? 'Active filter (click to modify)' : 'Filter column'}
            >
              <Filter className="w-3 h-3" />
            </button>

            {showFilterPopover && onFilterChange && (
              <GridFilterPopover
                column={column}
                currentFilter={filter}
                uniqueValues={uniqueValues}
                onApplyFilter={onFilterChange}
                onClose={() => setShowFilterPopover(false)}
              />
            )}
          </div>
        )}

        {/* Column Quick Menu */}
        {column.type !== 'action' && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColumnMenu((prev) => !prev);
                setShowFilterPopover(false);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Column menu"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {showColumnMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-1 right-0 z-50 w-44 bg-white border border-slate-200 rounded shadow-lg py-1 text-xs font-sans text-slate-700 space-y-0.5 animate-in fade-in duration-100"
              >
                {column.sortable !== false && onSortChange && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange(column.field);
                        setShowColumnMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sort Ascending</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange(column.field);
                        setShowColumnMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sort Descending</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                  </>
                )}

                {onPinColumn && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onPinColumn(column.field, column.pinned === 'left' ? null : 'left');
                        setShowColumnMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5 text-slate-500 rotate-45" />
                      <span>{column.pinned === 'left' ? 'Unpin Left' : 'Pin Left'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPinColumn(column.field, column.pinned === 'right' ? null : 'right');
                        setShowColumnMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{column.pinned === 'right' ? 'Unpin Right' : 'Pin Right'}</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                  </>
                )}

                {column.hideable !== false && onHideColumn && (
                  <button
                    type="button"
                    onClick={() => {
                      onHideColumn(column.field);
                      setShowColumnMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 flex items-center gap-2"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Column</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resize Handle (Drag divider on right edge) */}
      {onResize && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/70 active:bg-blue-600 transition-colors z-20"
          title="Drag to resize column"
        />
      )}
    </div>
  );
};
