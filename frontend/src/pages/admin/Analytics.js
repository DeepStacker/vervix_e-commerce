import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiShoppingCart, 
  FiUsers, 
  FiPackage,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiDownload
} from 'react-icons/fi';
import { useQuery } from 'react-query';
import adminApi from '../../api/adminApi';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery(
    ['admin-analytics', timeRange],
    async () => {
      const [sales, users, products] = await Promise.all([
        adminApi.get('/admin/analytics/sales'),
        adminApi.get('/admin/analytics/users'),
        adminApi.get('/admin/analytics/products')
      ]);
      return {
        sales: sales.data,
        users: users.data,
        products: products.data
      };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Mock data for development
  const mockData = {
    overview: {
      totalRevenue: 125000,
      totalOrders: 1247,
      totalCustomers: 892,
      averageOrderValue: 100.24,
      revenueChange: 12.5,
      ordersChange: 8.2,
      customersChange: 15.3,
      aovChange: -2.1
    },
    revenueData: [
      { date: '2024-01-01', revenue: 1200, orders: 12 },
      { date: '2024-01-02', revenue: 1800, orders: 18 },
      { date: '2024-01-03', revenue: 1500, orders: 15 },
      { date: '2024-01-04', revenue: 2200, orders: 22 },
      { date: '2024-01-05', revenue: 1900, orders: 19 },
      { date: '2024-01-06', revenue: 2500, orders: 25 },
      { date: '2024-01-07', revenue: 2100, orders: 21 }
    ],
    topProducts: [
      { name: 'Luxury Silk Shirt', sales: 45, revenue: 13500, growth: 12.5 },
      { name: 'Premium Denim Jacket', sales: 38, revenue: 11400, growth: 8.2 },
      { name: 'Designer Leather Bag', sales: 32, revenue: 9600, growth: 15.3 },
      { name: 'Cashmere Sweater', sales: 28, revenue: 8400, growth: -2.1 },
      { name: 'Silk Scarf', sales: 25, revenue: 2500, growth: 5.7 }
    ],
    customerSegments: [
      { segment: 'New Customers', count: 234, percentage: 26.2 },
      { segment: 'Returning Customers', count: 458, percentage: 51.3 },
      { segment: 'VIP Customers', count: 200, percentage: 22.5 }
    ],
    salesByCategory: [
      { category: 'Shirts', sales: 35, revenue: 10500 },
      { category: 'Jackets', sales: 28, revenue: 8400 },
      { category: 'Bags', sales: 22, revenue: 6600 },
      { category: 'Accessories', sales: 15, revenue: 4500 }
    ]
  };

  const data = {
    overview: analyticsData?.sales?.overview || mockData.overview,
    revenueData: analyticsData?.sales?.salesData || mockData.revenueData,
    topProducts: analyticsData?.sales?.productPerformance || mockData.topProducts,
    customerSegments: analyticsData?.users?.demographics || mockData.customerSegments,
    salesByCategory: analyticsData?.sales?.categoryPerformance || mockData.salesByCategory
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get change color
  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Get change icon
  const getChangeIcon = (change) => {
    return change >= 0 ? FiTrendingUp : FiTrendingDown;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.overview.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {React.createElement(getChangeIcon(data.overview.revenueChange), {
              className: `h-4 w-4 ${getChangeColor(data.overview.revenueChange)}`
            })}
            <span className={`ml-2 text-sm font-medium ${getChangeColor(data.overview.revenueChange)}`}>
              {formatPercentage(data.overview.revenueChange)}
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {React.createElement(getChangeIcon(data.overview.ordersChange), {
              className: `h-4 w-4 ${getChangeColor(data.overview.ordersChange)}`
            })}
            <span className={`ml-2 text-sm font-medium ${getChangeColor(data.overview.ordersChange)}`}>
              {formatPercentage(data.overview.ordersChange)}
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.totalCustomers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {React.createElement(getChangeIcon(data.overview.customersChange), {
              className: `h-4 w-4 ${getChangeColor(data.overview.customersChange)}`
            })}
            <span className={`ml-2 text-sm font-medium ${getChangeColor(data.overview.customersChange)}`}>
              {formatPercentage(data.overview.customersChange)}
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.overview.averageOrderValue)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiPackage className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {React.createElement(getChangeIcon(data.overview.aovChange), {
              className: `h-4 w-4 ${getChangeColor(data.overview.aovChange)}`
            })}
            <span className={`ml-2 text-sm font-medium ${getChangeColor(data.overview.aovChange)}`}>
              {formatPercentage(data.overview.aovChange)}
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedMetric === 'revenue'
                    ? 'bg-luxury-gold text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('orders')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedMetric === 'orders'
                    ? 'bg-luxury-gold text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.revenueData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-luxury-gold rounded-t transition-all duration-300 hover:bg-luxury-gold-dark"
                  style={{
                    height: `${(selectedMetric === 'revenue' ? item.revenue : item.orders) / 25}%`,
                    minHeight: '20px'
                  }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Customer Segments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
            <FiPieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{
                      backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{segment.segment}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{segment.count}</div>
                  <div className="text-xs text-gray-500">{segment.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Products and Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <FiBarChart2 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    <span className={`text-xs font-medium ${getChangeColor(product.growth)}`}>
                      {formatPercentage(product.growth)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{product.sales} sales</span>
                    <span>{formatCurrency(product.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales by Category</h3>
            <FiBarChart2 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.salesByCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-luxury-gold h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(category.revenue / Math.max(...data.salesByCategory.map(c => c.revenue))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{category.sales} items sold</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <FiCalendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Peak Sales Time</h4>
            <p className="text-sm text-gray-600">Weekends (Sat-Sun)</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <FiUsers className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Best Customer</h4>
            <p className="text-sm text-gray-600">Returning customers</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <FiPackage className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Top Category</h4>
            <p className="text-sm text-gray-600">Luxury Shirts</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics; 