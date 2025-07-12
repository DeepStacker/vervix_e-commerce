'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  LabelList,
  Treemap,
  ReferenceArea,
  ReferenceLine,
  Brush,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Download,
  MoreHorizontal,
  Settings,
  RefreshCw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Palette,
  Grid,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  Target,
  Zap,
  Filter,
  Calendar,
  MousePointer,
  Info,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
  RotateCcw,
  FileSpreadsheet,
  FileImage,
  FileText,
  Share2,
  Expand,
  Shrink,
  Move,
  Copy,
  Edit3,
  Save,
  Trash2,
  Layers,
  PaintBucket,
  Type,
  Layout,
  Database,
  Clock,
  Hash,
  Percent,
  DollarSign,
} from 'lucide-react';

// Types
export interface ChartDataPoint {
  [key: string]: any;
  name?: string;
  value?: number;
  label?: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color?: string;
  type?: 'bar' | 'line' | 'area' | 'scatter';
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
  yAxisId?: string;
  stackId?: string;
  connectNulls?: boolean;
  dot?: boolean;
  activeDot?: boolean;
  hide?: boolean;
  legendType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'composed' | 'radar' | 'scatter' | 'funnel' | 'treemap';
  data: ChartDataPoint[];
  series?: ChartSeries[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  colors?: string[];
  theme?: 'light' | 'dark' | 'custom';
  customColors?: { [key: string]: string };
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showBrush?: boolean;
  showZoom?: boolean;
  interactive?: boolean;
  animated?: boolean;
  responsive?: boolean;
  xAxis?: {
    dataKey?: string;
    label?: string;
    hide?: boolean;
    type?: 'number' | 'category';
    domain?: [number | string, number | string];
    tickFormatter?: (value: any) => string;
    angle?: number;
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  };
  yAxis?: {
    label?: string;
    hide?: boolean;
    type?: 'number' | 'category';
    domain?: [number | string, number | string];
    tickFormatter?: (value: any) => string;
    orientation?: 'left' | 'right';
  };
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
  };
  tooltip?: {
    formatter?: (value: any, name: string, props: any) => [string, string];
    labelFormatter?: (label: any) => string;
    separator?: string;
    cursor?: boolean | object;
    contentStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
  };
}

export interface AnalyticsChartProps {
  config: ChartConfig;
  loading?: boolean;
  error?: string | null;
  className?: string;
  onDataPointClick?: (data: ChartDataPoint, index: number) => void;
  onSeriesClick?: (series: ChartSeries) => void;
  onExport?: (format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json') => void;
  onConfigChange?: (config: ChartConfig) => void;
  showToolbar?: boolean;
  showSettings?: boolean;
  showExport?: boolean;
  showFullscreen?: boolean;
  allowConfigEdit?: boolean;
  realTimeUpdate?: boolean;
  updateInterval?: number;
  onRefresh?: () => void;
  customToolbarActions?: React.ReactNode;
  id?: string;
}

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Default color palettes
const COLOR_PALETTES = {
  default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'],
  blues: ['#1f77b4', '#aec7e8', '#c5dbf1', '#dbecf4', '#e8f4f8', '#f2f9fc'],
  greens: ['#2ca02c', '#98df8a', '#c5e8b7', '#d9f2d1', '#e8f8e8', '#f4fbf4'],
  reds: ['#d62728', '#ff9999', '#ffb3b3', '#ffcccc', '#ffe0e0', '#fff0f0'],
  oranges: ['#ff7f0e', '#ffbb78', '#ffd39f', '#ffe0bf', '#ffebdf', '#fff5ef'],
  purples: ['#9467bd', '#c5b0d5', '#d4c5dd', '#e0d4e6', '#ebe4ee', '#f5f2f6'],
  viridis: ['#440154', '#31688e', '#35b779', '#fde725'],
  plasma: ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921'],
  rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'],
};

// Utility functions
const formatValue = (value: any, type: 'number' | 'currency' | 'percentage' | 'date' = 'number'): string => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'number':
    default:
      return typeof value === 'number' ? value.toLocaleString() : value.toString();
  }
};

const generateColors = (count: number, palette: string = 'default'): string[] => {
  const baseColors = COLOR_PALETTES[palette as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.default;
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};

const exportChart = (element: HTMLElement, format: string, filename: string = 'chart') => {
  // This would typically use libraries like html2canvas, jsPDF, etc.
  // For now, we'll show a toast message
  toast.success(`Exporting chart as ${format.toUpperCase()}...`);
  console.log('Export chart:', { element, format, filename });
};

// Chart Container Component
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
  className,
  headerClassName,
  contentClassName,
  loading = false,
  error = null,
  onRetry,
}) => {
  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chart Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        {(title || actions) && (
          <div className={cn('flex items-center justify-between mb-6', headerClassName)}>
            <div>
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </div>
        )}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {(title || actions) && (
        <div className={cn('flex items-center justify-between mb-6', headerClassName)}>
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn('w-full', contentClassName)}>
        {children}
      </div>
    </Card>
  );
};

// Chart Settings Dialog
const ChartSettingsDialog: React.FC<{
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ config, onConfigChange, open, onOpenChange }) => {
  const [localConfig, setLocalConfig] = useState<ChartConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
    toast.success('Chart settings updated');
  };

  const handleReset = () => {
    setLocalConfig(config);
    toast.info('Settings reset');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chart Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of your chart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={localConfig.title || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Chart title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={localConfig.subtitle || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Chart subtitle"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select
                value={localConfig.type}
                onValueChange={(value: ChartConfig['type']) => 
                  setLocalConfig(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="composed">Composed Chart</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="funnel">Funnel Chart</SelectItem>
                  <SelectItem value="treemap">Treemap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Display Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-legend">Show Legend</Label>
                <Switch
                  id="show-legend"
                  checked={localConfig.showLegend !== false}
                  onCheckedChange={(checked) => 
                    setLocalConfig(prev => ({ ...prev, showLegend: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-tooltip">Show Tooltip</Label>
                <Switch
                  id="show-tooltip"
                  checked={localConfig.showTooltip !== false}
                  onCheckedChange={(checked) => 
                    setLocalConfig(prev => ({ ...prev, showTooltip: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-grid">Show Grid</Label>
                <Switch
                  id="show-grid"
                  checked={localConfig.showGrid !== false}
                  onCheckedChange={(checked) => 
                    setLocalConfig(prev => ({ ...prev, showGrid: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="animated">Animated</Label>
                <Switch
                  id="animated"
                  checked={localConfig.animated !== false}
                  onCheckedChange={(checked) => 
                    setLocalConfig(prev => ({ ...prev, animated: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Color Palette</h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                <div
                  key={name}
                  className="cursor-pointer p-2 border rounded hover:border-primary transition-colors"
                  onClick={() => setLocalConfig(prev => ({ ...prev, colors }))}
                >
                  <div className="flex space-x-1 mb-1">
                    {colors.slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs capitalize">{name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Axis Settings */}
          {['bar', 'line', 'area', 'composed', 'scatter'].includes(localConfig.type) && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Axis Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="x-axis-label">X-Axis Label</Label>
                  <Input
                    id="x-axis-label"
                    value={localConfig.xAxis?.label || ''}
                    onChange={(e) => setLocalConfig(prev => ({
                      ...prev,
                      xAxis: { ...prev.xAxis, label: e.target.value }
                    }))}
                    placeholder="X-axis label"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="y-axis-label">Y-Axis Label</Label>
                  <Input
                    id="y-axis-label"
                    value={localConfig.yAxis?.label || ''}
                    onChange={(e) => setLocalConfig(prev => ({
                      ...prev,
                      yAxis: { ...prev.yAxis, label: e.target.value }
                    }))}
                    placeholder="Y-axis label"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export Dialog
const ExportDialog: React.FC<{
  onExport: (format: string, options: any) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ onExport, open, onOpenChange }) => {
  const [format, setFormat] = useState('png');
  const [filename, setFilename] = useState('chart');
  const [quality, setQuality] = useState(1);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);

  const handleExport = () => {
    onExport(format, {
      filename,
      quality,
      includeTitle,
      includeLegend,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Chart</DialogTitle>
          <DialogDescription>
            Choose the format and options for exporting your chart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="jpg">JPEG Image</SelectItem>
                <SelectItem value="svg">SVG Vector</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
          </div>

          {['png', 'jpg'].includes(format) && (
            <div className="space-y-2">
              <Label htmlFor="quality">Quality: {Math.round(quality * 100)}%</Label>
              <input
                type="range"
                id="quality"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-title">Include Title</Label>
              <Switch
                id="include-title"
                checked={includeTitle}
                onCheckedChange={setIncludeTitle}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-legend">Include Legend</Label>
              <Switch
                id="include-legend"
                checked={includeLegend}
                onCheckedChange={setIncludeLegend}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Analytics Chart Component
export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  config,
  loading = false,
  error = null,
  className,
  onDataPointClick,
  onSeriesClick,
  onExport,
  onConfigChange,
  showToolbar = true,
  showSettings = true,
  showExport = true,
  showFullscreen = true,
  allowConfigEdit = false,
  realTimeUpdate = false,
  updateInterval = 30000,
  onRefresh,
  customToolbarActions,
  id = 'analytics-chart',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomArea, setZoomArea] = useState<{ x1?: number; x2?: number; y1?: number; y2?: number }>({});
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Real-time updates
  useEffect(() => {
    if (realTimeUpdate && updateInterval > 0 && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [realTimeUpdate, updateInterval, onRefresh]);

  // Generate colors for the chart
  const colors = useMemo(() => {
    return config.colors || generateColors(config.data.length, 'default');
  }, [config.colors, config.data.length]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Chart refreshed');
    } catch (error) {
      toast.error('Failed to refresh chart');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle export
  const handleExport = (format: string, options: any) => {
    if (onExport) {
      onExport(format as any);
    } else if (chartRef.current) {
      exportChart(chartRef.current, format, options.filename);
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle zoom
  const handleZoom = () => {
    if (zoomArea.x1 !== undefined && zoomArea.x2 !== undefined) {
      // Apply zoom logic here
      setZoomArea({});
      toast.success('Zoomed to selection');
    }
  };

  // Handle reset zoom
  const handleResetZoom = () => {
    setZoomArea({});
    toast.success('Zoom reset');
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value, 'number')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on type
  const renderChart = () => {
    const baseProps = {
      width: typeof config.width === 'string' ? undefined : config.width,
      height: typeof config.height === 'string' ? undefined : config.height,
      data: config.data,
      margin: config.margin || { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const commonComponents = (
      <>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        {config.xAxis?.hide !== true && (
          <XAxis
            dataKey={config.xAxis?.dataKey || 'name'}
            label={config.xAxis?.label}
            type={config.xAxis?.type}
            domain={config.xAxis?.domain}
            tickFormatter={config.xAxis?.tickFormatter}
            angle={config.xAxis?.angle}
            interval={config.xAxis?.interval}
          />
        )}
        {config.yAxis?.hide !== true && (
          <YAxis
            label={config.yAxis?.label}
            type={config.yAxis?.type}
            domain={config.yAxis?.domain}
            tickFormatter={config.yAxis?.tickFormatter}
            orientation={config.yAxis?.orientation}
          />
        )}
        {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
        {config.showLegend !== false && (
          <Legend
            verticalAlign={config.legend?.verticalAlign || 'bottom'}
            align={config.legend?.align || 'center'}
            layout={config.legend?.layout || 'horizontal'}
            iconType={config.legend?.iconType}
          />
        )}
        {config.showBrush && <Brush />}
      </>
    );

    switch (config.type) {
      case 'bar':
        return (
          <BarChart {...baseProps}>
            {commonComponents}
            {config.series?.map((series, index) => (
              <Bar
                key={series.dataKey}
                dataKey={series.dataKey}
                name={series.name}
                fill={series.color || colors[index]}
                stackId={series.stackId}
                onClick={(data, index) => onDataPointClick?.(data, index)}
              />
            )) || (
              <Bar
                dataKey="value"
                fill={colors[0]}
                onClick={(data, index) => onDataPointClick?.(data, index)}
              />
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...baseProps}>
            {commonComponents}
            {config.series?.map((series, index) => (
              <Line
                key={series.dataKey}
                type="monotone"
                dataKey={series.dataKey}
                name={series.name}
                stroke={series.color || colors[index]}
                strokeWidth={series.strokeWidth || 2}
                strokeDasharray={series.strokeDasharray}
                dot={series.dot}
                activeDot={series.activeDot}
                connectNulls={series.connectNulls}
              />
            )) || (
              <Line
                
