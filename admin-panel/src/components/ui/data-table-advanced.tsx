'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Label } from './label';
import { Switch } from './switch';
import { Textarea } from './textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Upload,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  X,
  Plus,
  Minus,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  FileImage,
  Columns,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  Hash,
  Type,
  ToggleLeft,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced column type with more customization options
export interface AdvancedColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  visible?: boolean;
  pinned?: boolean;
  resizable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  cellRenderer?: (props: CellRendererProps<T>) => React.ReactNode;
  headerRenderer?: (column: AdvancedColumn<T>) => React.ReactNode;
  footerRenderer?: (data: T[], column: AdvancedColumn<T>) => React.ReactNode;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage' | 'custom';
  format?: (value: any) => string;
  sortFn?: (a: T, b: T) => number;
  filterFn?: (item: T, filterValue: any) => boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  sticky?: boolean;
  group?: string;
  tooltip?: string | ((value: any, item: T) => string);
  editable?: boolean;
  required?: boolean;
  validation?: (value: any) => string | null;
}

export interface CellRendererProps<T = any> {
  value: any;
  item: T;
  column: AdvancedColumn<T>;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  onEdit?: (value: any) => void;
  onCancel?: () => void;
  onSave?: (value: any) => void;
}

export interface FilterValue {
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'notIn';
  options?: { value: any; label: string }[];
}

export interface AdvancedFilterConfig {
  [key: string]: FilterValue;
}

export interface AdvancedSortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  multiSort?: Array<{ key: string; order: 'asc' | 'desc' }>;
}

export interface AdvancedPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  offset: number;
  startIndex: number;
  endIndex: number;
}

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: string[]) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: boolean;
  requireConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ExportOptions {
  csv?: boolean;
  excel?: boolean;
  pdf?: boolean;
  json?: boolean;
  customFormats?: Array<{
    label: string;
    format: string;
    handler: (data: any[], columns: AdvancedColumn[]) => void;
  }>;
}

export interface TableSettings {
  density: 'compact' | 'standard' | 'comfortable';
  showBorders: boolean;
  stripedRows: boolean;
  hoverEffect: boolean;
  stickyHeader: boolean;
  columnVisibility: { [key: string]: boolean };
  columnOrder: string[];
  columnWidths: { [key: string]: number };
  defaultSort?: AdvancedSortConfig;
  defaultFilters?: AdvancedFilterConfig;
  pageSize: number;
}

export interface AdvancedDataTableProps<T = any> {
  data: T[];
  columns: AdvancedColumn<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: AdvancedPaginationInfo;
  sortConfig?: AdvancedSortConfig;
  filterConfig?: AdvancedFilterConfig;
  selectedRows?: string[];
  bulkActions?: BulkAction[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchColumns?: string[];
  filterable?: boolean;
  exportable?: boolean;
  exportOptions?: ExportOptions;
  selectable?: boolean;
  selectMode?: 'single' | 'multiple';
  responsive?: boolean;
  virtualScrolling?: boolean;
  infiniteScroll?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loadingRows?: number;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  cellClassName?: string | ((value: any, item: T, column: AdvancedColumn<T>, index: number) => string);
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onMultiSort?: (sorts: Array<{ key: string; order: 'asc' | 'desc' }>) => void;
  onFilter?: (filters: AdvancedFilterConfig) => void;
  onSearch?: (query: string, columns: string[]) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSelectionChange?: (selectedRows: string[]) => void;
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
  onCellClick?: (value: any, item: T, column: AdvancedColumn<T>, index: number) => void;
  onCellEdit?: (value: any, item: T, column: AdvancedColumn<T>, index: number) => void;
  onExport?: (format: string, data: T[], columns: AdvancedColumn[]) => void;
  onSettingsChange?: (settings: TableSettings) => void;
  getRowId?: (item: T, index: number) => string;
  getRowClassName?: (item: T, index: number) => string;
  canSelectRow?: (item: T, index: number) => boolean;
  showFooter?: boolean;
  showHeader?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  showSettings?: boolean;
  showBulkActions?: boolean;
  initialSettings?: Partial<TableSettings>;
  persistSettings?: boolean;
  settingsKey?: string;
  customActions?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  children?: React.ReactNode;
}

// Default cell renderers for different data types
const DefaultCellRenderers = {
  string: ({ value }: CellRendererProps) => <span>{value?.toString() || ''}</span>,
  number: ({ value }: CellRendererProps) => <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>,
  currency: ({ value }: CellRendererProps) => <span>{typeof value === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : value}</span>,
  percentage: ({ value }: CellRendererProps) => <span>{typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value}</span>,
  date: ({ value }: CellRendererProps) => <span>{value ? new Date(value).toLocaleDateString() : ''}</span>,
  boolean: ({ value }: CellRendererProps) => <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>,
  custom: ({ value, column }: CellRendererProps) => column.render ? column.render(value, null, -1) : <span>{value?.toString() || ''}</span>,
};

// Filter component for individual columns
const ColumnFilter: React.FC<{
  column: AdvancedColumn;
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  data: any[];
}> = ({ column, value, onChange, data }) => {
  const [localValue, setLocalValue] = useState(value?.value || '');
  const [operator, setOperator] = useState(value?.operator || 'contains');

  const getUniqueValues = () => {
    const values = data.map(item => item[column.key]).filter(v => v != null);
    return [...new Set(values)].sort();
  };

  const handleChange = (newValue: any, newOperator?: string) => {
    const filterValue: FilterValue = {
      type: column.dataType === 'number' ? 'number' : 
            column.dataType === 'date' ? 'date' : 
            column.dataType === 'boolean' ? 'boolean' : 'text',
      value: newValue,
      operator: newOperator || operator,
    };
    onChange(newValue ? filterValue : undefined);
    setLocalValue(newValue);
    if (newOperator) setOperator(newOperator);
  };

  if (column.dataType === 'boolean') {
    return (
      <Select value={localValue?.toString()} onValueChange={(val) => handleChange(val === 'true')}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (column.dataType === 'date') {
    return (
      <div className="space-y-2">
        <Select value={operator} onValueChange={setOperator}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="gt">After</SelectItem>
            <SelectItem value="lt">Before</SelectItem>
            <SelectItem value="between">Between</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Select date"
        />
      </div>
    );
  }

  if (column.dataType === 'number') {
    return (
      <div className="space-y-2">
        <Select value={operator} onValueChange={setOperator}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="gt">Greater than</SelectItem>
            <SelectItem value="gte">Greater or equal</SelectItem>
            <SelectItem value="lt">Less than</SelectItem>
            <SelectItem value="lte">Less or equal</SelectItem>
            <SelectItem value="between">Between</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter number"
        />
      </div>
    );
  }

  // Default text filter
  return (
    <div className="space-y-2">
      <Select value={operator} onValueChange={setOperator}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="contains">Contains</SelectItem>
          <SelectItem value="equals">Equals</SelectItem>
          <SelectItem value="startsWith">Starts with</SelectItem>
          <SelectItem value="endsWith">Ends with</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Filter ${column.label.toLowerCase()}...`}
      />
    </div>
  );
};

// Settings dialog component
const TableSettingsDialog: React.FC<{
  columns: AdvancedColumn[];
  settings: TableSettings;
  onSettingsChange: (settings: TableSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ columns, settings, onSettingsChange, open, onOpenChange }) => {
  const [localSettings, setLocalSettings] = useState<TableSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSettings({
      density: 'standard',
      showBorders: true,
      stripedRows: false,
      hoverEffect: true,
      stickyHeader: true,
      columnVisibility: Object.fromEntries(columns.map(col => [col.key as string, col.visible !== false])),
      columnOrder: columns.map(col => col.key as string),
      columnWidths: {},
      pageSize: 10,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Table Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of the table.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Density */}
          <div className="space-y-2">
            <Label>Table Density</Label>
            <Select 
              value={localSettings.density} 
              onValueChange={(value: 'compact' | 'standard' | 'comfortable') => 
                setLocalSettings(prev => ({ ...prev, density: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visual Options */}
          <div className="space-y-4">
            <Label>Visual Options</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-borders">Show Borders</Label>
                <Switch
                  id="show-borders"
                  checked={localSettings.showBorders}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showBorders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="striped-rows">Striped Rows</Label>
                <Switch
                  id="striped-rows"
                  checked={localSettings.stripedRows}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, stripedRows: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hover-effect">Hover Effect</Label>
                <Switch
                  id="hover-effect"
                  checked={localSettings.hoverEffect}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, hoverEffect: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sticky-header">Sticky Header</Label>
                <Switch
                  id="sticky-header"
                  checked={localSettings.stickyHeader}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, stickyHeader: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Column Visibility */}
          <div className="space-y-4">
            <Label>Column Visibility</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {columns.map((column) => (
                <div key={column.key as string} className="flex items-center justify-between">
                  <Label htmlFor={`col-${column.key}`}>{column.label}</Label>
                  <Switch
                    id={`col-${column.key}`}
                    checked={localSettings.columnVisibility[column.key as string] !== false}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({
                        ...prev,
                        columnVisibility: {
                          ...prev.columnVisibility,
                          [column.key as string]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Page Size */}
          <div className="space-y-2">
            <Label>Page Size</Label>
            <Select 
              value={localSettings.pageSize.toString()} 
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, pageSize: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export dialog component
const ExportDialog: React.FC<{
  data: any[];
  columns: AdvancedColumn[];
  exportOptions: ExportOptions;
  onExport: (format: string, data: any[], columns: AdvancedColumn[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ data, columns, exportOptions, onExport, open, onOpenChange }) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(col => col.exportable !== false).map(col => col.key as string)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [filename, setFilename] = useState('table-export');

  const handleExport = () => {
    const exportColumns = columns.filter(col => selectedColumns.includes(col.key as string));
    onExport(selectedFormat, data, exportColumns);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose the format and options for exporting your data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportOptions.csv && <SelectItem value="csv">CSV</SelectItem>}
                {exportOptions.excel && <SelectItem value="excel">Excel</SelectItem>}
                {exportOptions.pdf && <SelectItem value="pdf">PDF</SelectItem>}
                {exportOptions.json && <SelectItem value="json">JSON</SelectItem>}
                {exportOptions.customFormats?.map(format => (
                  <SelectItem key={format.format} value={format.format}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filename</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
          </div>

          <div className="space-y-2">
            <Label>Columns to Export</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {columns.filter(col => col.exportable !== false).map((column) => (
                <div key={column.key as string} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${column.key}`}
                    checked={selectedColumns.includes(column.key as string)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedColumns(prev => [...prev, column.key as string]);
                      } else {
                        setSelectedColumns(prev => prev.filter(key => key !== column.key));
                      }
                    }}
                  />
                  <Label htmlFor={`export-${column.key}`}>{column.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-headers"
              checked={includeHeaders}
              onCheckedChange={setIncludeHeaders}
            />
            <Label htmlFor="include-headers">Include Headers</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export ({data.length} rows)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main AdvancedDataTable component
export const AdvancedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  sortConfig,
  filterConfig = {},
  selectedRows = [],
  bulkActions = [],
  searchable = true,
  searchPlaceholder = "Search...",
  searchColumns,
  filterable = true,
  exportable = false,
  exportOptions = { csv: true, excel: true, pdf: true, json: true },
  selectable = false,
  selectMode = 'multiple',
  responsive = true,
  virtualScrolling = false,
  infiniteScroll = false,
  emptyMessage = "No data available",
  emptyIcon,
  loadingRows = 5,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  cellClassName,
  onSort,
  onMultiSort,
  onFilter,
  onSearch,
  onPageChange,
  onLimitChange,
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  onCellClick,
  onCellEdit,
  onExport,
  onSettingsChange,
  getRowId,
  getRowClassName,
  canSelectRow,
  showFooter = false,
  showHeader = true,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  showExport = true,
  showSettings = true,
  showBulkActions = true,
  initialSettings,
  persistSettings = false,
  settingsKey = 'advanced-data-table-settings',
  customActions,
  toolbarActions,
  children,
  ...props
}: AdvancedDataTableProps<T>) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [localFilters, setLocalFilters] = useState<AdvancedFilterConfig>(filterConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [columnFiltersOpen, setColumnFiltersOpen] = useState<{ [key: string]: boolean }>({});
  
  // Table settings state
  const [settings, setSettings] = useState<TableSettings>({
    density: 'standard',
    showBorders: true,
    stripedRows: false,
    hoverEffect: true,
    stickyHeader: true,
    columnVisibility: Object.fromEntries(columns.map(col => [col.key as string, col.visible !== false])),
    columnOrder: columns.map(col => col.key as string),
    columnWidths: {},
    pageSize: 10,
    ...initialSettings,
  });

  // Load settings from localStorage if persistSettings is enabled
  useEffect(() => {
    if (persistSettings) {
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.warn('Failed to parse saved table settings:', error);
        }
      }
    }
  }, [persistSettings, settingsKey]);

  // Save settings to localStorage when settings change
  useEffect(() => {
    if (persistSettings) {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }
  }, [settings, persistSettings, settingsKey]);

  // Visible columns based on settings
  const visibleColumns = useMemo(() => {
    return columns.filter(col => settings.columnVisibility[col.key as string] !== false);
  }, [columns, settings.columnVisibility]);

  // Get row ID
  const getRowIdFn = useCallback((item: T, index: number) => {
    if (getRowId) return getRowId(item, index);
    return item.id?.toString() || item._id?.toString() || index.toString();
  }, [getRowId]);

  // Check if row can be selected
  const canSelectRowFn = useCallback((item: T, index: number) => {
    if (canSelectRow) return canSelectRow(item, index);
    return true;
  }, [canSelectRow]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      const searchCols = searchColumns || columns.filter(col => col.searchable !== false).map(col => col.key as string);
      onSearch(query, searchCols);
    }
  }, [onSearch, searchColumns, columns]);

  // Handle filter changes
  const handleFilterChange = useCallback((columnKey: string, filterValue: FilterValue | undefined) => {
    const newFilters = { ...localFilters };
    if (filterValue) {
      newFilters[columnKey] = filterValue;
    } else {
      delete newFilters[columnKey];
    }
    setLocalFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  }, [localFilters, onFilter]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;
    
    const currentSort = sortConfig?.sortBy === columnKey ? sortConfig.sortOrder : null;
    const newOrder = currentSort === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newOrder);
  }, [onSort, sortConfig]);

  // Handle row selection
  const handleRowSelection = useCallback((rowId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    let newSelection: string[];
    if (selectMode === 'single') {
      newSelection = selected ? [rowId] : [];
    } else {
      if (selected) {
        newSelection = [...selectedRows, rowId];
      } else {
        newSelection = selectedRows.filter(id => id !== rowId);
      }
    }
    onSelectionChange(newSelection);
  }, [selectedRows, selectMode, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!onSelectionChange) return;
    
    if (selected) {
      const selectableRowIds = data
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => canSelectRowFn(item, index))
        .map(({ item, index }) => getRowIdFn(item, index));
      onSelectionChange(selectableRowIds);
    } else {
      onSelectionChange([]);
    }
  }, [data, onSelectionChange, canSelectRowFn, getRowIdFn]);

  // Handle
