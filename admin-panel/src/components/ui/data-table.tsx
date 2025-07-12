'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Types
export interface Column<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface SortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: any;
}

export interface BulkAction {
  label: string;
  onClick: (selectedRows: string[]) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationInfo;
  sortConfig?: SortConfig;
  filterConfig?: FilterConfig;
  selectedRows?: string[];
  bulkActions?: BulkAction[];
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  responsive?: boolean;
  emptyMessage?: string;
  loadingRows?: number;
  className?: string;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onFilter?: (filters: FilterConfig) => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSelectionChange?: (selectedRows: string[]) => void;
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void;
  getRowId?: (item: T) => string;
}

// Skeleton loader component
const SkeletonRow: React.FC<{ columns: number }> = ({ columns }) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </TableCell>
    ))}
  </TableRow>
);

// Empty state component
const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({
  message,
  icon = <AlertCircle className="h-12 w-12 text-gray-400" />,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon}
    <h3 className="mt-4 text-lg font-medium text-gray-900">No data found</h3>
    <p className="mt-2 text-sm text-gray-500">{message}</p>
  </div>
);

// Pagination component
const Pagination: React.FC<{
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}> = ({ pagination, onPageChange, onLimitChange }) => {
  const { currentPage, totalPages, totalItems, hasNextPage, hasPrevPage, limit } = pagination;

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [totalPages, onPageChange]
  );

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </p>
        <Select value={limit.toString()} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={!hasPrevPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Main DataTable component
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sortConfig,
  filterConfig = {},
  selectedRows = [],
  bulkActions = [],
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = true,
  responsive = true,
  emptyMessage = 'No data available',
  loadingRows = 5,
  className = '',
  onSort,
  onFilter,
  onSearch,
  onPageChange,
  onLimitChange,
  onSelectionChange,
  onExport,
  getRowId = (item) => item.id || item._id,
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterConfig>(filterConfig);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch]
  );

  // Handle sorting
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return;

      const newSortOrder =
        sortConfig?.sortBy === columnKey && sortConfig?.sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newSortOrder);
    },
    [onSort, sortConfig]
  );

  // Handle row selection
  const handleRowSelection = useCallback(
    (rowId: string, checked: boolean) => {
      if (!onSelectionChange) return;

      const newSelection = checked
        ? [...selectedRows, rowId]
        : selectedRows.filter((id) => id !== rowId);
      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  // Handle select all
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return;

      const newSelection = checked ? data.map((item) => getRowId(item)) : [];
      onSelectionChange(newSelection);
    },
    [data, onSelectionChange, getRowId]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...localFilters, [key]: value };
      setLocalFilters(newFilters);
      if (onFilter) {
        onFilter(newFilters);
      }
    },
    [localFilters, onFilter]
  );

  // Memoized values
  const isAllSelected = useMemo(
    () => data.length > 0 && selectedRows.length === data.length,
    [data.length, selectedRows.length]
  );

  const isIndeterminate = useMemo(
    () => selectedRows.length > 0 && selectedRows.length < data.length,
    [selectedRows.length, data.length]
  );

  const sortIcon = useMemo(() => {
    return (columnKey: string) => {
      if (!sortConfig || sortConfig.sortBy !== columnKey) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
      }
      return sortConfig.sortOrder === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    };
  }, [sortConfig]);

  const renderCell = useCallback(
    (column: Column<T>, item: T, index: number) => {
      const value = item[column.key as keyof T];
      
      if (column.render) {
        return column.render(value, item, index);
      }

      if (value === null || value === undefined) {
        return <span className="text-gray-500">-</span>;
      }

      if (typeof value === 'boolean') {
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      }

      if (Array.isArray(value)) {
        return value.join(', ');
      }

      return String(value);
    },
    []
  );

  return (
    <Card className={className}>
      {/* Header with search, filters, and actions */}
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-2">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {filterable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk actions */}
            {selectable && selectedRows.length > 0 && bulkActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions ({selectedRows.length})
                    <MoreHorizontal className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {bulkActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.onClick(selectedRows)}
                      disabled={action.disabled}
                      className={
                        action.variant === 'destructive' ? 'text-red-600' : ''
                      }
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Export dropdown */}
            {exportable && onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('xlsx')}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Filter row */}
        {filterable && showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 border-t sm:grid-cols-2 lg:grid-cols-4">
            {columns
              .filter((column) => column.filterable)
              .map((column) => (
                <div key={String(column.key)}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.label}
                  </label>
                  <Input
                    placeholder={`Filter by ${column.label.toLowerCase()}`}
                    value={localFilters[String(column.key)] || ''}
                    onChange={(e) =>
                      handleFilterChange(String(column.key), e.target.value)
                    }
                  />
                </div>
              ))}
          </div>
        )}
      </CardHeader>

      {/* Table */}
      <CardContent className="p-0">
        <div className={`${responsive ? 'overflow-x-auto' : ''}`}>
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(ref) => {
                        if (ref) ref.indeterminate = isIndeterminate;
                      }}
                      onChange={(checked) => handleSelectAll(checked)}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={`${column.className || ''} ${
                      column.align === 'center'
                        ? 'text-center'
                        : column.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                    style={{ width: column.width }}
                  >
                    {column.sortable && onSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort(String(column.key))}
                      >
                        {column.label}
                        {sortIcon(String(column.key))}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: loadingRows }).map((_, index) => (
                  <SkeletonRow
                    key={index}
                    columns={columns.length + (selectable ? 1 : 0)}
                  />
                ))
              ) : data.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    <EmptyState message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                data.map((item, index) => {
                  const rowId = getRowId(item);
                  const isSelected = selectedRows.includes(rowId);

                  return (
                    <TableRow
                      key={rowId}
                      className={isSelected ? 'bg-muted/50' : ''}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onChange={(checked) => handleRowSelection(rowId, checked)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={`${rowId}-${String(column.key)}`}
                          className={`${column.className || ''} ${
                            column.align === 'center'
                              ? 'text-center'
                              : column.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {renderCell(column, item, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && onPageChange && onLimitChange && (
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
