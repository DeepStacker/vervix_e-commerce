import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiShoppingCart, 
  FiUsers, 
  FiPackage,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useQuery } from 'react-query';
import adminApi from '../../api/adminApi';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import CreateProductForm from './CreateProductForm'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['admin-dashboard', timeRange],
    async () => {
      const response = await adminApi.get(`/admin/dashboard?timeRange=${timeRange}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Mock data for development
  const mockData = {
    stats: {
      totalRevenue: 125000,
      totalOrders: 1247,
      totalCustomers: 892,
      totalProducts: 156,
      revenueChange: 12.5,
      ordersChange: 8.2,
      customersChange: 15.3,
      productsChange: -2.1
    },
    recentOrders: [
      {
        _id: '1',
        orderNumber: 'VER-2024-001',
        customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        total: 299.99,
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        _id: '2',
        orderNumber: 'VER-2024-002',
        customer: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        total: 599.99,
        status: 'processing',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        _id: '3',
        orderNumber: 'VER-2024-003',
        customer: { firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
        total: 199.99,
        status: 'shipped',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ],
    topProducts: [
      { name: 'Luxury Silk Shirt', sales: 45, revenue: 13500 },
      { name: 'Premium Denim Jacket', sales: 38, revenue: 11400 },
      { name: 'Designer Leather Bag', sales: 32, revenue: 9600 },
      { name: 'Cashmere Sweater', sales: 28, revenue: 8400 },
      { name: 'Silk Scarf', sales: 25, revenue: 2500 }
    ],
    alerts: [
      { type: 'low_stock', message: '5 products are running low on stock', count: 5 },
      { type: 'pending_orders', message: '12 orders pending processing', count: 12 },
      { type: 'new_customers', message: '8 new customers registered today', count: 8 }
    ]
  };

  const data = mockData;

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return FiClock;
      case 'processing': return FiEye;
      case 'shipped': return FiCheckCircle;
      case 'delivered': return FiCheckCircle;
      case 'cancelled': return FiAlertCircle;
      default: return FiClock;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add polling for real-time updates (placeholder)
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Refetch dashboard data here for real-time updates
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="bg-gray-200 h-4 rounded w-1/2 mb-2"></div>
              <div className="bg-gray-200 h-8 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Vervix admin dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/admin/settings')}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Settings"
          >
            <FiSettings className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminUser');
              adminApi.defaults.headers.common['Authorization'] = '';
              navigate('/admin/login');
            }}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Logout"
          >
            <FiLogOut className="h-5 w-5 text-gray-600" />
          </button>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {formatCurrency(data.stats.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.stats.revenueChange >= 0 ? (
              <FiTrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-2 text-sm font-medium ${
              data.stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.stats.revenueChange >= 0 ? '+' : ''}{data.stats.revenueChange}%
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
                {data.stats.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.stats.ordersChange >= 0 ? (
              <FiTrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-2 text-sm font-medium ${
              data.stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.stats.ordersChange >= 0 ? '+' : ''}{data.stats.ordersChange}%
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
                {data.stats.totalCustomers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.stats.customersChange >= 0 ? (
              <FiTrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-2 text-sm font-medium ${
              data.stats.customersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.stats.customersChange >= 0 ? '+' : ''}{data.stats.customersChange}%
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
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.totalProducts.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiPackage className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.stats.productsChange >= 0 ? (
              <FiTrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-2 text-sm font-medium ${
              data.stats.productsChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.stats.productsChange >= 0 ? '+' : ''}{data.stats.productsChange}%
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm text-yellow-800">{alert.message}</span>
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  {alert.count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-sm text-luxury-gold hover:text-luxury-gold-dark font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {data.recentOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <button className="text-sm text-luxury-gold hover:text-luxury-gold-dark font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/add/product" className="nav-link">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FiPackage className="h-5 w-5 text-luxury-gold mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Product</span>
          </button></Link>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FiShoppingCart className="h-5 w-5 text-luxury-gold mr-2" />
            <span className="text-sm font-medium text-gray-700">Process Orders</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FiUsers className="h-5 w-5 text-luxury-gold mr-2" />
            <span className="text-sm font-medium text-gray-700">View Customers</span>
          </button>
        </div>
      </motion.div>

      {/* Add navigation link to settings page in dashboard navigation */}
      <Link to="/admin/settings" className="nav-link">Settings</Link>
    </div>
  );
};

export default Dashboard; 