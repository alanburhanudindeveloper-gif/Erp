import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  EnterpriseDataGridProps,
  GridColumn,
  SortModel,
  ColumnFilter,
  DensityMode,
} from './types';
import { GridToolbar } from './GridToolbar';
import { GridColumnHeader } from './GridColumnHeader';
import { GridPagination } from './GridPagination';
import { GridBulkActions } from './GridBulkActions';
import { GridEmptyState } from './GridEmptyState';
import { GridLoadingState } from './GridLoadingState';
import { exportToCsv } from './GridExport';
import { StatusBadge } from '../common/StatusBadge';

export function EnterpriseDataGrid<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  keyField = 'id',
  loading = false,
  pagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 25,
  sorting = true,
  filtering = true,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFields,
  rowSelection = false,
  multiSelect = true,
  selectedRowKeys: controlledSelectedRowKeys,
  onSelectionChange,
  bulkActions,
  columnResizing = true,
  columnPinning = true,
  columnVisibility = true,
  density: initialDensity = 'compact',
  showDensitySelector = true,
  exportable = true,
  exportFileName = 'export-data',
  stickyHeader = true,
  height,
  onRowClick,
  renderDetailRow,
  rowClassNames,
  emptyMessage,
  emptyAction,
}: EnterpriseDataGridProps<T>) {
  // 1. Density State
  const [density, setDensity] = useState<DensityMode>(initialDensity);

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ColumnFilter[]>([]);

  // 3. Sorting State
  const [sortModel, setSortModel] = useState<SortModel | undefined>(undefined);

  // 4. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 5. Column Customization (Widths, Hidden, Pinning)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialColumns.forEach((c) => {
      if (c.width) map[c.field] = c.width;
    });
    return map;
  });

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>(() => {
    const map: Record<string, 'left' | 'right' | null> = {};
    initialColumns.forEach((c) => {
      if (c.pinned) map[c.field] = c.pinned;
    });
    return map;
  });

  // 6. Row Selection State
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string>>(new Set());
  const selectedKeys = useMemo(() => {
    if (controlledSelectedRowKeys) return new Set(controlledSelectedRowKeys);
    return internalSelectedKeys;
  }, [controlledSelectedRowKeys, internalSelectedKeys]);

  // 7. Expanded Rows State (Master-Detail)
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(new Set());

  // Handle column resizing
  const handleResize = useCallback((field: string, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [field]: newWidth }));
  }, []);

  // Handle column pin
  const handlePinColumn = useCallback((field: string, pin: 'left' | 'right' | null) => {
    setPinnedColumns((prev) => ({ ...prev, [field]: pin }));
  }, []);

  // Handle column visibility
  const handleToggleColumnVisibility = useCallback((field: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    setHiddenColumns(new Set());
    const resetWidths: Record<string, number> = {};
    const resetPinned: Record<string, 'left' | 'right' | null> = {};
    initialColumns.forEach((c) => {
      if (c.width) resetWidths[c.field] = c.width;
      if (c.pinned) resetPinned[c.field] = c.pinned;
    });
    setColumnWidths(resetWidths);
    setPinnedColumns(resetPinned);
  }, [initialColumns]);

  // Handle sorting toggle (cycle: asc -> desc -> clear)
  const handleSortChange = useCallback(
    (field: string) => {
      if (!sorting) return;
      setSortModel((prev) => {
        if (!prev || prev.field !== field) {
          return { field, direction: 'asc' };
        }
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        }
        return undefined; // Clear sorting
      });
    },
    [sorting]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((colFilter: ColumnFilter | null) => {
    if (!colFilter) return;
    setFilters((prev) => {
      const remaining = prev.filter((f) => f.field !== colFilter.field);
      return [...remaining, colFilter];
    });
    setCurrentPage(1);
  }, []);

  const handleClearColumnFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters([]);
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Filtered and Sorted Data Pipeline
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 1. Global Search
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((row) => {
        // If specific searchFields given, check them
        if (searchFields && searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = row[field];
            return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
          });
        }
        // Otherwise search all column fields
        return initialColumns.some((col) => {
          let val: any;
          if (col.valueGetter) val = col.valueGetter(row);
          else val = row[col.field];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
        });
      });
    }

    // 2. Column Filters
    if (filters.length > 0) {
      result = result.filter((row) => {
        return filters.every((f) => {
          const colDef = initialColumns.find((c) => c.field === f.field);
          let rowVal: any;
          if (colDef?.valueGetter) rowVal = colDef.valueGetter(row);
          else rowVal = row[f.field];

          if (rowVal === null || rowVal === undefined) return false;

          switch (f.operator) {
            case 'contains':
              return String(rowVal).toLowerCase().includes(String(f.value).toLowerCase());
            case 'equals':
              return String(rowVal).toLowerCase() === String(f.value).toLowerCase();
            case 'startsWith':
              return String(rowVal).toLowerCase().startsWith(String(f.value).toLowerCase());
            case 'endsWith':
              return String(rowVal).toLowerCase().endsWith(String(f.value).toLowerCase());
            case 'eq':
              return Number(rowVal) === Number(f.value);
            case 'gt':
              return Number(rowVal) > Number(f.value);
            case 'gte':
              return Number(rowVal) >= Number(f.value);
            case 'lt':
              return Number(rowVal) < Number(f.value);
            case 'lte':
              return Number(rowVal) <= Number(f.value);
            case 'between':
              return Number(rowVal) >= Number(f.value) && Number(rowVal) <= Number(f.secondValue);
            case 'in':
              if (Array.isArray(f.value) && f.value.length > 0) {
                return f.value.includes(rowVal);
              }
              return true;
            default:
              return true;
          }
        });
      });
    }

    // 3. Sorting
    if (sortModel) {
      const colDef = initialColumns.find((c) => c.field === sortModel.field);
      result.sort((a, b) => {
        let valA: any = colDef?.valueGetter ? colDef.valueGetter(a) : a[sortModel.field];
        let valB: any = colDef?.valueGetter ? colDef.valueGetter(b) : b[sortModel.field];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortModel.direction === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortModel.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortModel.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, filters, sortModel, initialColumns]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, pagination, currentPage, pageSize]);

  // Visible Columns with width and pinning applied
  const visibleColumns = useMemo(() => {
    const list = initialColumns.filter((c) => !hiddenColumns.has(c.field));
    return list.map((col) => ({
      ...col,
      width: columnWidths[col.field] || col.width || 140,
      pinned: pinnedColumns[col.field] !== undefined ? pinnedColumns[col.field] : col.pinned,
    }));
  }, [initialColumns, hiddenColumns, columnWidths, pinnedColumns]);

  // Selected Rows
  const selectedRows = useMemo(() => {
    return data.filter((row) => selectedKeys.has(String(row[keyField])));
  }, [data, selectedKeys, keyField]);

  // Toggle Single Row Selection
  const handleToggleRowSelection = useCallback(
    (row: T, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = String(row[keyField]);
      const next = new Set(selectedKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (!multiSelect) next.clear();
        next.add(key);
      }
      setInternalSelectedKeys(next);
      if (onSelectionChange) {
        const selRows = data.filter((r) => next.has(String(r[keyField])));
        onSelectionChange(selRows, Array.from(next));
      }
    },
    [selectedKeys, multiSelect, keyField, data, onSelectionChange]
  );

  // Toggle All Visible Rows Selection
  const handleToggleSelectAll = useCallback(() => {
    const visibleKeys = paginatedData.map((r) => String(r[keyField]));
    const allSelected = visibleKeys.every((k) => selectedKeys.has(k));
    const next = new Set(selectedKeys);

    if (allSelected) {
      visibleKeys.forEach((k) => next.delete(k));
    } else {
      visibleKeys.forEach((k) => next.add(k));
    }

    setInternalSelectedKeys(next);
    if (onSelectionChange) {
      const selRows = data.filter((r) => next.has(String(r[keyField])));
      onSelectionChange(selRows, Array.from(next));
    }
  }, [paginatedData, selectedKeys, keyField, data, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    const next = new Set<string>();
    setInternalSelectedKeys(next);
    if (onSelectionChange) onSelectionChange([], []);
  }, [onSelectionChange]);

  // Master-Detail Row Expansion
  const handleToggleRowExpand = useCallback((row: T, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = String(row[keyField]);
    setExpandedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, [keyField]);

  // Export CSV handler
  const handleExportCsv = useCallback(() => {
    // Export either selected rows or current filtered dataset
    const exportDataset = selectedRows.length > 0 ? selectedRows : filteredAndSortedData;
    exportToCsv(exportDataset, visibleColumns, exportFileName);
  }, [selectedRows, filteredAndSortedData, visibleColumns, exportFileName]);

  // Unique values for column filter options
  const getUniqueValuesForField = useCallback(
    (field: string) => {
      const map = new Map<string, number>();
      data.forEach((row) => {
        const val = row[field];
        if (val !== null && val !== undefined) {
          const str = String(val);
          map.set(str, (map.get(str) || 0) + 1);
        }
      });
      return Array.from(map.entries()).map(([value, count]) => ({
        label: value,
        value,
        count,
      }));
    },
    [data]
  );

  const isAllVisibleSelected =
    paginatedData.length > 0 && paginatedData.every((r) => selectedKeys.has(String(r[keyField])));
  const isSomeVisibleSelected =
    paginatedData.some((r) => selectedKeys.has(String(r[keyField]))) && !isAllVisibleSelected;

  // Row height styling according to density mode
  const rowHeightClass = density === 'compact' ? 'py-1.5' : 'py-3';
  const cellTextClass = density === 'compact' ? 'text-xs' : 'text-xs';

  return (
    <div className="flex flex-col w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* 1. Toolbar */}
      {searchable && (
        <GridToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          columns={visibleColumns}
          onToggleColumnVisibility={columnVisibility ? handleToggleColumnVisibility : undefined}
          onResetColumns={columnVisibility ? handleResetColumns : undefined}
          density={density}
          onDensityChange={setDensity}
          showDensitySelector={showDensitySelector}
          onExportCsv={handleExportCsv}
          exportable={exportable}
          activeFilterCount={filters.length}
          onClearAllFilters={handleClearAllFilters}
          totalRowCount={data.length}
          filteredRowCount={filteredAndSortedData.length}
        />
      )}

      {/* 2. Bulk Action Bar (Context-Aware when rows are selected) */}
      {rowSelection && selectedKeys.size > 0 && (
        <div className="p-2 border-b border-slate-200 bg-slate-900/5">
          <GridBulkActions
            selectedCount={selectedKeys.size}
            totalCount={data.length}
            selectedRows={selectedRows}
            actions={bulkActions}
            onClearSelection={handleClearSelection}
          />
        </div>
      )}

      {/* 3. Grid Table Viewport */}
      <div
        className="w-full overflow-x-auto relative"
        style={{
          maxHeight: height || undefined,
          scrollbarWidth: 'thin',
        }}
      >
        <table className="w-full text-left border-collapse table-fixed">
          {/* Column Colgroups */}
          <colgroup>
            {renderDetailRow && <col style={{ width: 36 }} />}
            {rowSelection && <col style={{ width: 40 }} />}
            {visibleColumns.map((col) => (
              <col key={col.field} style={{ width: col.width }} />
            ))}
          </colgroup>

          {/* Table Header */}
          <thead
            className={`border-b border-slate-200 bg-slate-50/90 text-slate-600 font-semibold text-xs ${
              stickyHeader ? 'sticky top-0 z-30 backdrop-blur-xs' : ''
            }`}
          >
            <tr>
              {/* Expand Detail Column Header */}
              {renderDetailRow && <th className="w-9 p-0" />}

              {/* Row Checkbox Selection Header */}
              {rowSelection && (
                <th className="w-10 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeVisibleSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all visible rows"
                  />
                </th>
              )}

              {/* Dynamic Column Headers */}
              {visibleColumns.map((col) => {
                const colFilter = filters.find((f) => f.field === col.field);
                return (
                  <th
                    key={col.field}
                    style={{ width: col.width }}
                    className={`p-0 relative font-semibold ${
                      col.pinned === 'left'
                        ? 'sticky left-0 z-20 bg-slate-50 border-r border-slate-200 shadow-xs'
                        : col.pinned === 'right'
                        ? 'sticky right-0 z-20 bg-slate-50 border-l border-slate-200 shadow-xs'
                        : ''
                    }`}
                  >
                    <GridColumnHeader
                      column={col}
                      sortModel={sortModel}
                      onSortChange={handleSortChange}
                      filter={colFilter}
                      onFilterChange={(newF) => {
                        if (newF) handleFilterChange(newF);
                        else handleClearColumnFilter(col.field);
                      }}
                      uniqueValues={getUniqueValuesForField(col.field)}
                      onResize={columnResizing ? handleResize : undefined}
                      onPinColumn={columnPinning ? handlePinColumn : undefined}
                      onHideColumn={columnVisibility ? handleToggleColumnVisibility : undefined}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 font-sans">
            {loading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (renderDetailRow ? 1 : 0)}
                  className="p-0"
                >
                  <GridLoadingState columnCount={visibleColumns.length} />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (renderDetailRow ? 1 : 0)}
                  className="p-0"
                >
                  <GridEmptyState
                    hasFilters={filters.length > 0}
                    hasSearch={!!searchQuery}
                    onClearFilters={handleClearAllFilters}
                    message={emptyMessage}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowKey = String(row[keyField] ?? index);
                const isSelected = selectedKeys.has(rowKey);
                const isExpanded = expandedRowKeys.has(rowKey);
                const customClasses = rowClassNames ? rowClassNames(row, index) : '';

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 hover:bg-blue-50'
                          : index % 2 === 1
                          ? 'bg-slate-50/25 hover:bg-slate-50/70'
                          : 'bg-white hover:bg-slate-50/70'
                      } ${onRowClick ? 'cursor-pointer' : ''} ${customClasses}`}
                    >
                      {/* Expand Detail Chevron */}
                      {renderDetailRow && (
                        <td className="w-9 px-2 py-2 text-center text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => handleToggleRowExpand(row, e)}
                            className="p-0.5 rounded hover:bg-slate-200/60 text-slate-500 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Row Selection Checkbox */}
                      {rowSelection && (
                        <td className="w-10 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleRowSelection(row, e as any)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Data Cells */}
                      {visibleColumns.map((col) => {
                        let cellVal: any;
                        if (col.valueGetter) {
                          cellVal = col.valueGetter(row);
                        } else {
                          cellVal = row[col.field];
                        }

                        // Alignments and type styling
                        const isRightAligned = col.align === 'right' || col.type === 'number' || col.type === 'currency';
                        const isCenterAligned = col.align === 'center' || col.type === 'status';

                        return (
                          <td
                            key={col.field}
                            style={{ width: col.width }}
                            className={`px-3 ${rowHeightClass} ${cellTextClass} ${
                              isRightAligned
                                ? 'text-right'
                                : isCenterAligned
                                ? 'text-center'
                                : 'text-left'
                            } ${
                              col.pinned === 'left'
                                ? 'sticky left-0 z-10 bg-inherit border-r border-slate-200'
                                : col.pinned === 'right'
                                ? 'sticky right-0 z-10 bg-inherit border-l border-slate-200'
                                : ''
                            }`}
                          >
                            {col.renderCell ? (
                              col.renderCell({ row, value: cellVal, index })
                            ) : col.type === 'currency' ? (
                              <span className="font-mono font-medium text-slate-900 tabular-nums">
                                Rp {typeof cellVal === 'number' ? cellVal.toLocaleString('id-ID') : cellVal}
                              </span>
                            ) : col.type === 'number' ? (
                              <span className="font-mono font-medium text-slate-800 tabular-nums">
                                {typeof cellVal === 'number' ? cellVal.toLocaleString('id-ID') : cellVal}
                              </span>
                            ) : col.type === 'status' ? (
                              <StatusBadge status={cellVal} />
                            ) : col.type === 'boolean' ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  cellVal
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {cellVal ? 'YES' : 'NO'}
                              </span>
                            ) : (
                              <span className="text-slate-800 truncate block">
                                {cellVal !== null && cellVal !== undefined ? String(cellVal) : '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Master-Detail Expandable Panel */}
                    {renderDetailRow && isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td
                          colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + 1}
                          className="p-4"
                        >
                          {renderDetailRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Grid Pagination */}
      {pagination && (
        <GridPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredAndSortedData.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
