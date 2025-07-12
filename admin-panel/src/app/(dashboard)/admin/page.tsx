'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Legend
} from 'recharts';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Truck,
  Bookmark
} from 'lucide-react';

// Mock data for dashboard visualization
const salesData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 7000 },
  { name: 'Jul', value: 5500 },
  { name: 'Aug', value: 8000 },
  { name: 'Sep', value: 9000 },
  { name: 'Oct', value: 8500 },
  { name: 'Nov', value: 9500 },
  { name: 'Dec', value: 12000 }
];

const conversionRateData = [
  { name: 'Jan', rate: 2.8 },
  { name: 'Feb', rate: 3.2 },
  { name: 'Mar', rate: 3.5 },
  { name: 'Apr', rate: 2.9 },
  { name: 'May', rate: 3.8 },
  { name: 'Jun', rate: 4.2 },
  { name: 'Jul', rate: 4.5 },
  { name: 'Aug', rate: 4.1 },
  { name: 'Sep', rate: 4.7 },
  { name: 'Oct', rate: 5.0 },
  { name: 'Nov', rate: 5.2 },
  { name: 'Dec', rate: 5.5 }
];

const revenueByCategory = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Home & Garden', value: 15 },
  { name: 'Beauty', value: 10 },
  { name: 'Books', value: 8 },
  { name: 'Other', value: 7 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const recentOrders = [
  { id: 'ORD-7890', customer: 'Emma Johnson', amount: 356.90, status: 'delivered', date: '2023-11-28' },
  { id: 'ORD-7891', customer: 'Noah Williams', amount: 124.50, status: 'processing', date: '2023-11-28' },
  { id: 'ORD-7892', customer: 'Olivia Smith', amount: 89.99, status: 'delivered', date: '2023-11-27' },
  { id: 'ORD-7893', customer: 'Liam Jones', amount: 1245.00, status: 'shipped', date: '2023-11-27' },
  { id: 'ORD-7894', customer: 'Ava Brown', amount: 78.50, status: 'cancelled', date: '2023-11-26' }
];

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false);

  // Use React Query to fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => adminApi.getDashboard(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isClient, // Only run on client side
  });

  // Set isClient to true after component mounts to avoid hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Placeholder data while loading or on server render
  const stats = dashboardData?.data || {
    revenue: {
      total: 75480,
      previousPeriod: 68420,
      percentChange: 10.32
    },
    orders: {
      total: 1248,
      previousPeriod: 1125,
      percentChange: 10.93
    },
    customers: {
      total: 3580,
      previousPeriod: 3210,
      percentChange: 11.53
    },
    averageOrderValue: {
      current: 60.48,
      previousPeriod: 60.82,
      percentChange: -0.56
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="outline" className="hidden md:flex">
            Export Reports
          </Button>
          <Button>
            <Clock className="mr-2 h-4 w-4" />
            Last Updated: Today, 9:45 AM
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</h3>
              <div className="flex items-center mt-2">
                {stats.revenue.percentChange >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">{stats.revenue.percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-500">{Math.abs(stats.revenue.percentChange).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold">{stats.orders.total}</h3>
              <div className="flex items-center mt-2">
                {stats.orders.percentChange >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">{stats.orders.percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-500">{Math.abs(stats.orders.percentChange).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Customers</p>
              <h3 className="text-2xl font-bold">{stats.customers.total}</h3>
              <div className="flex items-center mt-2">
                {stats.customers.percentChange >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">{stats.customers.percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-500">{Math.abs(stats.customers.percentChange).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Order Value</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue.current)}</h3>
              <div className="flex items-center mt-2">
                {stats.averageOrderValue.percentChange >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">{stats.averageOrderValue.percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-500">{Math.abs(stats.averageOrderValue.percentChange).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="p-6 lg:col-span-2 xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sales Overview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Monthly</Button>
              <Button variant="ghost" size="sm">Weekly</Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Category */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {revenueByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Conversion Rate Chart */}
        <Card className="p-6 lg:col-span-2 xl:col-span-3">
          <h3 className="text-lg font-semibold mb-4">Conversion Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Orders and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium">{formatCurrency(order.amount)}</p>
                  <Badge 
                    variant={
                      order.status === 'delivered' ? 'default' :
                      order.status === 'processing' ? 'secondary' :
                      order.status === 'shipped' ? 'outline' : 'destructive'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Customers
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Truck className="mr-2 h-4 w-4" />
              Process Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Bookmark className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
          </div>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Low Stock Alert</p>
              <p className="text-sm text-yellow-700">5 products are running low on stock</p>
            </div>
            <Button size="sm" variant="outline">View</Button>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">Orders Pending</p>
              <p className="text-sm text-blue-700">12 orders are awaiting processing</p>
            </div>
            <Button size="sm" variant="outline">Process</Button>
          </div>
        </div>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Cart Abandonment Rate</p>
            <p className="text-2xl font-bold text-red-500">23.5%</p>
            <p className="text-xs text-muted-foreground">+2.1% from last week</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Return Rate</p>
            <p className="text-2xl font-bold text-orange-500">4.2%</p>
            <p className="text-xs text-muted-foreground">-0.5% from last week</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
            <p className="text-2xl font-bold text-green-500">4.8/5</p>
            <p className="text-xs text-muted-foreground">+0.2 from last week</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Page Load Time</p>
            <p className="text-2xl font-bold text-blue-500">1.2s</p>
            <p className="text-xs text-muted-foreground">-0.1s from last week</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
