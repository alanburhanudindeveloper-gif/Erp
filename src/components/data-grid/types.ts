import React from 'react';

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'status'
  | 'badge'
  | 'boolean'
  | 'progress'
  | 'action';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortModel {
  field: string;
  direction: 'asc' | 'desc';
}

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';
export type NumberFilterOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
export type FilterOperator = TextFilterOperator | NumberFilterOperator | 'in';

export interface ColumnFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // For between operator
}

export interface GridQuery {
  page: number;
  pageSize: number;
  sort?: SortModel;
  filters?: ColumnFilter[];
  search?: string;
}

export interface GridResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DensityMode = 'compact' | 'comfortable';

export interface GridColumn<T> {
  field: string;
  headerName: string;
  type?: ColumnType;
  width?: number; // Initial width in pixels
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: 'left' | 'right' | null;
  align?: 'left' | 'center' | 'right';
  tooltip?: string;
  hideable?: boolean;
  isVisible?: boolean;
  // Custom cell renderer
  renderCell?: (params: { row: T; value: any; index: number }) => React.ReactNode;
  // Value getter if field is nested or computed
  valueGetter?: (row: T) => any;
  // Available filter options for enum/status multi-select
  filterOptions?: { label: string; value: string | number; count?: number }[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  onClick: (selectedRows: T[]) => void;
  permission?: boolean;
  tooltip?: string;
}

export interface EnterpriseDataGridProps<T> {
  data: T[];
  columns: GridColumn<T>[];
  keyField?: string; // Default is 'id'

  // Features flags
  loading?: boolean;
  pagination?: boolean;
  pageSizeOptions?: number[];
  initialPageSize?: number;

  // Server-side execution contract
  serverSide?: boolean;
  totalCount?: number;
  currentPage?: number;
  onQueryChange?: (query: GridQuery) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sort: SortModel | undefined) => void;
  onFilterChange?: (filters: ColumnFilter[]) => void;
  onSearchChange?: (search: string) => void;

  sorting?: boolean;
  filtering?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];

  rowSelection?: boolean;
  multiSelect?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedRows: T[], selectedKeys: string[]) => void;
  bulkActions?: BulkAction<T>[];

  columnResizing?: boolean;
  columnPinning?: boolean;
  columnVisibility?: boolean;

  density?: DensityMode;
  showDensitySelector?: boolean;

  exportable?: boolean;
  exportFileName?: string;

  stickyHeader?: boolean;
  height?: string | number; // e.g. '500px' or '100%'

  // Row interactions
  onRowClick?: (row: T) => void;
  renderDetailRow?: (row: T) => React.ReactNode;
  rowClassNames?: (row: T, index: number) => string;

  // Empty / Error states
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
}
