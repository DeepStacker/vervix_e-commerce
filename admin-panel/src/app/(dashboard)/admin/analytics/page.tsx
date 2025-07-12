'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Eye,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Award,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  CreditCard,
  ShoppingBag,
  Heart,
  MessageSquare,
  ThumbsUp,
  Share2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Settings,
  Info,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Color schemes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
const GRADIENTS = [
  { start: '#8884d8', end: '#82ca9d' },
  { start: '#0088FE', end: '#00C49F' },
  { start: '#FFBB28', end: '#FF8042' },
];

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AnalyticsFilters {
  dateRange: DateRange;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareMode: 'none' | 'previous_period' | 'previous_year';
  segment: 'all' | 'new' | 'returning' | 'vip';
  category: string;
  product: string;
  region: string;
}

// Mock data for comprehensive analytics
const mockSalesData = [
  { date: '2024-01-01', sales: 15420, orders: 89, customers: 67 },
  { date: '2024-01-02', sales: 18750, orders: 104, customers: 84 },
  { date: '2024-01-03', sales: 12330, orders: 76, customers: 58 },
  { date: '2024-01-04', sales: 21890, orders: 125, customers: 98 },
  { date: '2024-01-05', sales: 16780, orders: 92, customers: 72 },
  { date: '2024-01-06', sales: 24560, orders: 138, customers: 105 },
  { date: '2024-01-07', sales: 19340, orders: 108, customers: 86 },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 485000, target: 450000, lastYear: 420000 },
  { month: 'Feb', revenue: 520000, target: 480000, lastYear: 445000 },
  { month: 'Mar', revenue: 578000, target: 510000, lastYear: 478000 },
  { month: 'Apr', revenue: 612000, target: 540000, lastYear: 502000 },
  { month: 'May', revenue: 645000, target: 570000, lastYear: 535000 },
  { month: 'Jun', revenue: 698000, target: 600000, lastYear: 568000 },
];

const mockProductPerformance = [
  { name: 'Wireless Headphones', sales: 2847, revenue: 142350, growth: 15.2 },
  { name: 'Smart Watch', sales: 1923, revenue: 96150, growth: 22.8 },
  { name: 'Laptop Stand', sales: 1645, revenue: 49350, growth: -5.4 },
  { name: 'USB-C Hub', sales: 1234, revenue: 37020, growth: 8.9 },
  { name: 'Wireless Mouse', sales: 1089, revenue: 32670, growth: 12.3 },
];

const mockCustomerSegments = [
  { name: 'New Customers', value: 2847, color: '#0088FE' },
  { name: 'Returning Customers', value: 4231, color: '#00C49F' },
  { name: 'VIP Customers', value: 892, color: '#FFBB28' },
  { name: 'Inactive Customers', value: 1456, color: '#FF8042' },
];

const mockChannelPerformance = [
  { channel: 'Direct', revenue: 245000, orders: 1250, conversion: 3.2 },
  { channel: 'Social Media', revenue: 186000, orders: 890, conversion: 2.8 },
  { channel: 'Email', revenue: 164000, orders: 720, conversion: 4.1 },
  { channel: 'Paid Search', revenue: 142000, orders: 650, conversion: 2.5 },
  { channel: 'Organic Search', revenue: 198000, orders: 980, conversion: 3.7 },
];

const mockDeviceData = [
  { device: 'Desktop', sessions: 4250, revenue: 315000 },
  { device: 'Mobile', sessions: 6120, revenue: 228000 },
  { device: 'Tablet', sessions: 1830, revenue: 89000 },
];

const mockGeoData = [
  { country: 'United States', revenue: 285000, orders: 1450 },
  { country: 'Canada', revenue: 145000, orders: 720 },
  { country: 'United Kingdom', revenue: 98000, orders: 480 },
  { country: 'Germany', revenue: 76000, orders: 380 },
  { country: 'France', revenue: 62000, orders: 310 },
];

const mockConversionFunnel = [
  { stage: 'Visitors', value: 10000, color: '#8884d8' },
  { stage: 'Product Views', value: 4500, color: '#82ca9d' },
  { stage: 'Add to Cart', value: 1800, color: '#ffc658' },
  { stage: 'Checkout', value: 720, color: '#ff7c7c' },
  { stage: 'Purchase', value: 450, color: '#00C49F' },
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format percentage
const formatPercentage = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Format number with K/M suffix
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  prefix = '',
  suffix = ''
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">
            {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1 text-sm font-medium">
                {formatPercentage(change)}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
    </Card>
  );
};

// Chart Container Component
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  actions,
  className = ''
}) => {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </Card>
  );
};

// Export functionality
const handleExport = (type: 'csv' | 'pdf' | 'excel', data: any) => {
  toast.success(`Exporting ${type.toUpperCase()} report...`);
  // Implementation would go here
  console.log(`Exporting ${type}:`, data);
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    period: 'day',
    compareMode: 'previous_period',
    segment: 'all',
    category: '',
    product: '',
    region: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', filters],
    queryFn: () => adminApi.getSalesAnalytics({
      period: filters.period,
      from: filters.dateRange.from?.toISOString(),
      to: filters.dateRange.to?.toISOString(),
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update filters
  const updateFilters = (updates: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  // Quick date range presets
  const quickRanges = [
    { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'This month', value: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: 'Last 3 months', value: { from: subDays(new Date(), 90), to: new Date() } },
    { label: 'This year', value: { from: startOfYear(new Date()), to: endOfYear(new Date()) } },
  ];

  // Calculate key metrics
  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = mockSalesData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = mockSalesData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={(value) => handleExport(value as any, analyticsData)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from && filters.dateRange.to ? (
                    `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd')}`
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Ranges</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {quickRanges.map((range) => (
                        <Button
                          key={range.label}
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilters({ dateRange: range.value })}
                          className="justify-start"
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.dateRange.from,
                      to: filters.dateRange.to,
                    }}
                    onSelect={(range) => updateFilters({ dateRange: range || { from: undefined, to: undefined } })}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select value={filters.period} onValueChange={(value: any) => updateFilters({ period: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compare Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare</label>
            <Select value={filters.compareMode} onValueChange={(value: any) => updateFilters({ compareMode: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Comparison</SelectItem>
                <SelectItem value="previous_period">Previous Period</SelectItem>
                <SelectItem value="previous_year">Previous Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Segment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Segment</label>
            <Select value={filters.segment} onValueChange={(value: any) => updateFilters({ segment: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="new">New Customers</SelectItem>
                <SelectItem value="returning">Returning</SelectItem>
                <SelectItem value="vip">VIP Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Region</label>
            <Select value={filters.region} onValueChange={(value) => updateFilters({ region: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                <SelectItem value="north_america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={12.5}
          trend="up"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders}
          change={8.2}
          trend="up"
          icon={<ShoppingCart className="h-6 w-6 text-blue-500" />}
        />
        <MetricCard
          title="Customers"
          value={totalCustomers}
          change={15.8}
          trend="up"
          icon={<Users className="h-6 w-6 text-green-500" />}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          change={-2.4}
          trend="down"
          icon={<Target className="h-6 w-6 text-purple-500" />}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <ChartContainer
              title="Revenue Trend"
              actions={
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">vs Target</Badge>
                  <Badge variant="secondary">vs Last Year</Badge>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Line type="monotone" dataKey="target" stroke="#82ca9d" name="Target" />
                  <Line type="monotone" dataKey="lastYear" stroke="#ffc658" name="Last Year" strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Sales Performance */}
            <ChartContainer title="Daily Sales Performance">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                    formatter={(value, name) => [
                      name === 'sales' ? formatCurrency(value as number) : value,
                      name === 'sales' ? 'Sales' : name === 'orders' ? 'Orders' : 'Customers'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stackId="1"
                    stroke="#8884d8"
                    fill="url(#salesGradient)"
                  />
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Segments */}
            <ChartContainer title="Customer Segments">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockCustomerSegments}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockCustomerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value as number), 'Customers']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Top Products */}
            <ChartContainer title="Top Products by Revenue" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockProductPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8">
                    {mockProductPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Conversion Funnel */}
          <ChartContainer title="Sales Conversion Funnel">
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip formatter={(value) => [formatNumber(value as number), 'Count']} />
                <Funnel
                  dataKey="value"
                  data={mockConversionFunnel}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Channel */}
            <ChartContainer title="Sales by Channel">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockChannelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                  <Bar dataKey="orders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Geographic Performance */}
            <ChartContainer title="Sales by Country">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockGeoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Device Performance */}
          <ChartContainer title="Device Performance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {mockDeviceData.map((device, index) => (
                <Card key={device.device} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{device.device}</p>
                      <p className="text-2xl font-bold">{formatCurrency(device.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(device.sessions)} sessions</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      {device.device === 'Desktop' && <Monitor className="h-6 w-6 text-primary" />}
                
