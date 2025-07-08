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
import { useQuery, useMutation } from 'react-query';
import adminApi from '../../api/adminApi';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';

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

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customersData, isLoading, error } = useQuery(
    ['admin-customers', searchTerm, filters],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      const response = await adminApi.get(`/admin/customers?${params}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
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
      default: return '��';
    }
  };

  // Edit customer mutation
  const editCustomerMutation = useMutation(
    async ({ id, formData }) => {
      await adminApi.put(`/admin/customers/${id}`, formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-customers']);
        toast.success('Customer updated successfully');
        setShowCustomerModal(false);
        setSelectedCustomer(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update customer');
      }
    }
  );

  // Delete customer mutation
  const deleteCustomerMutation = useMutation(
    async (customerId) => {
      await adminApi.delete(`/admin/customers/${customerId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-customers']);
        toast.success('Customer deleted successfully');
        setShowCustomerModal(false);
        setSelectedCustomer(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete customer');
      }
    }
  );

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };
  const handleCustomerEdit = (formData) => {
    if (selectedCustomer) {
      editCustomerMutation.mutate({ id: selectedCustomer._id, formData });
    }
  };
  const handleCustomerDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading customers...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Failed to load customers. Please try again later.</div>;
  if (!customers || customers.length === 0) return <div className="p-8 text-center text-gray-500">No customers found.</div>;

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
                    onClick={() => handleCustomerClick(customer)}
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
        <Modal
          isOpen={showCustomerModal}
          onRequestClose={() => { setShowCustomerModal(false); setSelectedCustomer(null); }}
          contentLabel="Customer Details"
          ariaHideApp={false}
          className="modal"
          overlayClassName="modal-overlay"
        >
          {selectedCustomer && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
              <div>
                <strong>Email:</strong> {selectedCustomer.email}
              </div>
              <div>
                <strong>Phone:</strong> {selectedCustomer.phone}
              </div>
              <div>
                <strong>Address:</strong> {selectedCustomer.address}
              </div>
              {/* Add more fields as needed */}
              <form onSubmit={e => { e.preventDefault(); handleCustomerEdit(new FormData(e.target)); }} className="space-y-2">
                <input name="firstName" defaultValue={selectedCustomer.firstName} className="input" />
                <input name="lastName" defaultValue={selectedCustomer.lastName} className="input" />
                <input name="email" defaultValue={selectedCustomer.email} className="input" />
                <input name="phone" defaultValue={selectedCustomer.phone} className="input" />
                {/* Add more editable fields as needed */}
                <div className="flex space-x-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={editCustomerMutation.isLoading}>
                    {editCustomerMutation.isLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button type="button" onClick={() => handleCustomerDelete(selectedCustomer._id)} className="btn btn-secondary" disabled={deleteCustomerMutation.isLoading}>
                    {deleteCustomerMutation.isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button type="button" onClick={() => { setShowCustomerModal(false); setSelectedCustomer(null); }} className="btn">
                    Close
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default Customers; 