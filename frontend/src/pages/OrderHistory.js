import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiEye, 
  FiRefreshCw, 
  FiFilter, 
  FiCalendar, 
  FiPackage, 
  FiTruck,
  FiCheckCircle,
  FiX,
  FiClock,
  FiChevronDown,
  FiSearch
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrderHistory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders with filters and pagination
  const { data: ordersData, isLoading, error } = useQuery(
    ['orders', 'my-orders', filters, pagination],
    async () => {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await axios.get(`/api/orders/my-orders?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Reorder mutation
  const reorderMutation = useMutation(
    async (orderId) => {
      const response = await axios.post(`/api/orders/${orderId}/reorder`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
          if (data.data.addedToCart > 0) {
            // Optionally navigate to cart
            const shouldGoToCart = window.confirm('Items added to cart. Go to cart now?');
            if (shouldGoToCart) {
              navigate('/cart');
            }
          }
          queryClient.invalidateQueries(['cart']);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reorder');
      }
    }
  );

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: FiPackage, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: FiTruck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiX, label: 'Cancelled' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: FiRefreshCw, label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle reorder
  const handleReorder = async (orderId) => {
    if (window.confirm('This will add all available items from this order to your cart. Continue?')) {
      await reorderMutation.mutateAsync(orderId);
    }
  };

  // Loading skeleton
  if (isLoading && !ordersData) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Orders</h2>
            <p className="text-warm-gray mb-6">{error.message}</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-6 py-3 rounded-lg hover:bg-luxury-gold-dark transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.pagination?.totalPages || 1;
  const currentPage = ordersData?.pagination?.currentPage || 1;

  return (
    <div className="section-padding bg-luxury-cream">
      <div className="container-luxury">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="section-title">Order History</h1>
              <p className="text-warm-gray mt-2">
                Track and manage your orders
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter size={16} />
              Filters
              <FiChevronDown 
                size={16} 
                className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg p-6 shadow-sm mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Orders
                    </label>
                    <div className="relative">
                      <FiSearch size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Order number, product name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    >
                      <option value="">All Time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 3 months</option>
                      <option value="1y">Last year</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <FiPackage size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-warm-gray mb-6">
              You haven't placed any orders yet or no orders match your filters.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-6 py-3 rounded-lg hover:bg-luxury-gold-dark transition-colors"
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-warm-gray">
                            Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${order.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-warm-gray">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto">
                      {order.items?.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                          <img
                            src={item.image || '/placeholder-product.jpg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{order.items.length - 4}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <FiEye size={16} />
                        View Details
                      </button>
                      
                      {['delivered', 'cancelled'].includes(order.status) && (
                        <button
                          onClick={() => handleReorder(order._id)}
                          disabled={reorderMutation.isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold-dark transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <FiRefreshCw size={16} />
                          {reorderMutation.isLoading ? 'Reordering...' : 'Reorder'}
                        </button>
                      )}

                      {order.status === 'shipped' && order.shipping?.trackingNumber && (
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <FiTruck size={16} />
                          Track Package
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 mt-8"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    const page = Math.max(1, currentPage - 2) + idx;
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-luxury-gold text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
