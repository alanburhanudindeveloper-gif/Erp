/**
 * Standard query pagination interfaces and pure helper functions.
 */

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginateItems<T>(items: T[], query?: PaginationQuery): PaginatedResult<T> {
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.max(1, Math.min(100, query?.limit ?? 20));
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;

  const startIndex = (page - 1) * limit;
  const slicedItems = items.slice(startIndex, startIndex + limit);

  return {
    items: slicedItems,
    total,
    page,
    limit,
    totalPages,
  };
}
