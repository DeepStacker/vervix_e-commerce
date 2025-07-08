import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEdit, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShoppingBag,
  FiDollarSign,
  FiStar,
  FiUser,
  FiX,
  FiDownload,
  FiMail as FiSendMail
} from 'react-icons/fi';
import { useQuery } from 'react-query';
import axios from 'axios';

const Customers = () => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    tier: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Fetch customers
  const { data: customersData, isLoading } = useQuery(
    ['admin-customers', searchTerm, filters],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.status) params.append('status', filters.status);
      if (filters.tier) params.append('tier', filters.tier);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      
      const response = await axios.get(`/api/admin/customers?${params}`);
      return response.data;
    }
  );

  // Mock data for development
  const mockCustomers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      status: 'active',
      tier: 'gold',
      totalOrders: 15,
      totalSpent: 4500.00,
      averageOrderValue: 300.00,
      lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
      addresses: [
        {
          type: 'shipping',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      ],
      recentOrders: [
        {
          orderNumber: 'VER-2024-001',
          total: 299.99,
          status: 'delivered',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
        },
        {
          orderNumber: 'VER-2023-045',
          total: 599.99,
          status: 'delivered',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
        }
      ]
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+1-555-0456',
      status: 'active',
      tier: 'platinum',
      totalOrders: 28,
      totalSpent: 8900.00,
      averageOrderValue: 317.86,
      lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 730).toISOString(),
      addresses: [
        {
          type: 'shipping',
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      ],
      recentOrders: [
        {
          orderNumber: 'VER-2024-002',
          total: 999.97,
          status: 'processing',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
          orderNumber: 'VER-2023-089',
          total: 799.99,
          status: 'delivered',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
        }
      ]
    }
  ];

  const customers = customersData?.customers || mockCustomers;

  // Handle customer selection
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get tier color
  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get tier icon
  const getTierIcon = (tier) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiSendMail className="h-4 w-4 mr-2" />
            Send Email
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
                placeholder="Search customers..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <select
                  value={filters.tier}
                  onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>

                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">All Dates</option>
                  <option value="today">Registered Today</option>
                  <option value="week">Registered This Week</option>
                  <option value="month">Registered This Month</option>
                  <option value="year">Registered This Year</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-3 rounded"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <motion.div
              key={customer._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Customer Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer._id)}
                    onChange={() => handleCustomerSelect(customer._id)}
                    className="w-4 h-4 text-luxury-gold border-gray-300 rounded focus:ring-luxury-gold"
                  />
                  <button
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(true);
                    }}
                    className="text-luxury-gold hover:text-luxury-gold-dark"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{customer.totalOrders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </div>
                  <div className="text-xs text-gray-500">Total Spent</div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tier:</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTierColor(customer.tier)}`}>
                    <span className="mr-1">{getTierIcon(customer.tier)}</span>
                    {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg Order:</span>
                  <span className="font-medium">{formatCurrency(customer.averageOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Order:</span>
                  <span className="text-xs">{formatDate(customer.lastOrderDate)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button className="flex items-center text-sm text-luxury-gold hover:text-luxury-gold-dark">
                    <FiMail className="h-4 w-4 mr-1" />
                    Email
                  </button>
                  <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <FiShoppingBag className="h-4 w-4 mr-1" />
                    Orders
                  </button>
                  <button className="flex items-center text-sm text-gray-600 hover:text-gray-700">
                    <FiEdit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && customers.length === 0 && (
        <div className="text-center py-12">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Customers will appear here once they register.
          </p>
        </div>
      )}

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showCustomerModal && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCustomerModal(false)}></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center text-white font-semibold text-xl mr-4">
                        {selectedCustomer.firstName.charAt(0)}{selectedCustomer.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </h3>
                        <p className="text-gray-500">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCustomerModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Customer Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <FiMail className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-sm">{selectedCustomer.email}</span>
                        </div>
                        <div className="flex items-center">
                          <FiPhone className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-sm">{selectedCustomer.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-sm">Member since {formatDate(selectedCustomer.registrationDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTierColor(selectedCustomer.tier)}`}>
                            <span className="mr-1">{getTierIcon(selectedCustomer.tier)}</span>
                            {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)} Tier
                          </span>
                        </div>
                      </div>

                      {/* Addresses */}
                      {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                        <div className="mt-6">
                          <h5 className="font-medium text-gray-900 mb-3">Addresses</h5>
                          {selectedCustomer.addresses.map((address, index) => (
                            <div key={index} className="flex items-start mb-3">
                              <FiMapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                              <div className="text-sm">
                                <div className="font-medium capitalize">{address.type} Address</div>
                                <div>{address.street}</div>
                                <div>{address.city}, {address.state} {address.zipCode}</div>
                                <div>{address.country}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Order Statistics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Order Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</div>
                          <div className="text-sm text-gray-500">Total Orders</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedCustomer.totalSpent)}
                          </div>
                          <div className="text-sm text-gray-500">Total Spent</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedCustomer.averageOrderValue)}
                          </div>
                          <div className="text-sm text-gray-500">Avg Order Value</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">
                            {formatDate(selectedCustomer.lastOrderDate)}
                          </div>
                          <div className="text-sm text-gray-500">Last Order</div>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      <h5 className="font-medium text-gray-900 mb-3">Recent Orders</h5>
                      <div className="space-y-2">
                        {selectedCustomer.recentOrders.map((order, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{order.orderNumber}</div>
                              <div className="text-xs text-gray-500">{formatDate(order.date)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">{formatCurrency(order.total)}</div>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-luxury-gold text-base font-medium text-white hover:bg-luxury-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                  <button className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    <FiMail className="h-4 w-4 mr-2" />
                    Send Email
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

export default Customers; 