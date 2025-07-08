import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEdit, 
  FiTruck, 
  FiCheckCircle,
  FiX,
  FiDownload,
  FiPrinter,
  FiMail,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiShoppingCart
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import adminApi from '../../api/adminApi';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

const Orders = () => {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    paymentStatus: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Delete order mutation
  const deleteOrderMutation = useMutation(
    async (orderId) => {
      await adminApi.delete(`/admin/orders/${orderId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-orders']);
        toast.success('Order deleted successfully');
        setShowOrderModal(false);
        setSelectedOrder(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  );

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery(
    ['admin-orders', searchTerm, filters],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      
      const response = await adminApi.get(`/admin/orders?${params}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Mock data for development
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'VER-2024-001',
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      },
      items: [
        {
          product: {
            name: 'Luxury Silk Shirt',
            price: 299.99,
            image: 'https://via.placeholder.com/100x100'
          },
          quantity: 1,
          variant: { size: 'M', color: 'Black' }
        }
      ],
      total: 299.99,
      subtotal: 299.99,
      tax: 29.99,
      shipping: 0,
      status: 'pending',
      paymentStatus: 'paid',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      paymentMethod: 'credit_card',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      _id: '2',
      orderNumber: 'VER-2024-002',
      customer: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0456'
      },
      items: [
        {
          product: {
            name: 'Premium Denim Jacket',
            price: 199.99,
            image: 'https://via.placeholder.com/100x100'
          },
          quantity: 1,
          variant: { size: 'L', color: 'Blue' }
        },
        {
          product: {
            name: 'Cashmere Sweater',
            price: 399.99,
            image: 'https://via.placeholder.com/100x100'
          },
          quantity: 2,
          variant: { size: 'M', color: 'Gray' }
        }
      ],
      total: 999.97,
      subtotal: 999.97,
      tax: 99.99,
      shipping: 0,
      status: 'processing',
      paymentStatus: 'paid',
      shippingAddress: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      billingAddress: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      paymentMethod: 'paypal',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
    }
  ];

  const orders = ordersData?.orders || mockOrders;

  // Update order status mutation
  const updateStatusMutation = useMutation(
    async ({ orderId, status }) => {
      await adminApi.patch(`/admin/orders/${orderId}/status`, { status });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-orders']);
        toast.success('Order status updated successfully');
        setShowOrderModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  );

  // Handle order selection
  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  // Handle status update
  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading orders...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Failed to load orders. Please try again later.</div>;
  if (!orders || orders.length === 0) return <div className="p-8 text-center text-gray-500">No orders found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiPrinter className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/10' 
                  : 'border-gray-300 text-gray-600 hover:border-luxury-gold'
              }`}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">All Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="bg-gray-200 h-4 w-4 rounded"></div>
                <div className="bg-gray-200 h-4 flex-1 rounded"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                <div className="bg-gray-200 h-4 w-16 rounded"></div>
                <div className="bg-gray-200 h-4 w-16 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-luxury-gold border-gray-300 rounded focus:ring-luxury-gold"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleOrderSelect(order._id)}
                      className="w-4 h-4 text-luxury-gold border-gray-300 rounded focus:ring-luxury-gold"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">{order.items.length} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOrderClick(order)}
                        className="text-luxury-gold hover:text-luxury-gold-dark"
                        title="View Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit Order"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders.length === 0 && (
        <div className="text-center py-12">
          <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Orders will appear here once customers start placing them.
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowOrderModal(false)}></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Order Details - {selectedOrder.orderNumber}
                    </h3>
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Number:</span>
                          <span className="font-medium">{selectedOrder.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                            {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Status
                        </label>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</span>
                        </div>
                        <div className="flex items-center">
                          <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedOrder.customer.email}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedOrder.customer.phone}</span>
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-3 mt-4">Shipping Address</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start">
                          <FiMapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div>{selectedOrder.shippingAddress.street}</div>
                            <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</div>
                            <div>{selectedOrder.shippingAddress.country}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.product.name}</h5>
                            <p className="text-sm text-gray-600">
                              Size: {item.variant.size}, Color: {item.variant.color}
                            </p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span>{formatCurrency(selectedOrder.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span>{formatCurrency(selectedOrder.shipping)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-lg border-t border-gray-200 pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-luxury-gold text-base font-medium text-white hover:bg-luxury-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Handle print order
                      window.print();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <FiPrinter className="h-4 w-4 mr-2" />
                    Print Order
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders; 