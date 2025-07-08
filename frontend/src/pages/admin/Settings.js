import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiUpload,
  FiSettings,
  FiMail,
  FiLock,
  FiGlobe,
  FiDollarSign,
  FiShield,
  FiDatabase,
  FiToggleLeft,
  FiToggleRight,
  FiBell,
  FiUser,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Vervix',
    siteDescription: 'Luxury fashion ecommerce platform',
    siteUrl: 'https://vervix.com',
    contactEmail: 'contact@vervix.com',
    supportEmail: 'support@vervix.com',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    lowStockAlerts: true,
    customerRegistration: true,
    newReviews: true,
    systemUpdates: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAttempts: 5,
    passwordExpiry: 90,
    ipWhitelist: '',
    enableAuditLog: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    paypalEnabled: false,
    codEnabled: true,
    minOrderAmount: 10,
    maxOrderAmount: 5000,
    processingFee: 2.9,
    taxRate: 8.5
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery(
    'admin-settings',
    async () => {
      const settingsResponse = await Promise.allSettled([
        axios.get('/api/admin/settings/general'),
        axios.get('/api/admin/settings/notifications'),
        axios.get('/api/admin/settings/security'),
        axios.get('/api/admin/settings/payment')
      ]);
      
      const settings = {};
      settingsResponse.forEach((result, index) => {
        const categories = ['general', 'notifications', 'security', 'payment'];
        if (result.status === 'fulfilled') {
          settings[categories[index]] = result.value.data.settings;
        }
      });
      
      return settings;
    },
    {
      onSuccess: (data) => {
        if (data.general) setGeneralSettings(prev => ({ ...prev, ...data.general }));
        if (data.notifications) setNotificationSettings(prev => ({ ...prev, ...data.notifications }));
        if (data.security) setSecuritySettings(prev => ({ ...prev, ...data.security }));
        if (data.payment) setPaymentSettings(prev => ({ ...prev, ...data.payment }));
      },
      onError: (error) => {
        console.log('Settings not found, using defaults');
      }
    }
  );

  // Save settings mutation
  const saveSettingsMutation = useMutation(
    async ({ type, settings }) => {
      const response = await axios.put(`/api/admin/settings/${type}`, settings);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Settings saved successfully');
        queryClient.invalidateQueries('admin-settings');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (passwordData) => {
      const response = await axios.put('/api/admin/change-password', passwordData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  // Handle form submissions
  const handleSaveGeneral = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({ type: 'general', settings: generalSettings });
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({ type: 'notifications', settings: notificationSettings });
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({ type: 'security', settings: securitySettings });
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({ type: 'payment', settings: paymentSettings });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    changePasswordMutation.mutate(passwordForm);
  };

  // Toggle component
  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 ${
          enabled ? 'bg-luxury-gold' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const tabs = [
    { id: 'general', name: 'General', icon: FiSettings },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'payment', name: 'Payment', icon: FiDollarSign },
    { id: 'account', name: 'Account', icon: FiUser }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 rounded w-1/4"></div>
        <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your admin panel and store settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* General Settings */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={generalSettings.siteUrl}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saveSettingsMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-luxury-gold text-white rounded-md hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                >
                  <FiSave className="mr-2" size={16} />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <Toggle
                  enabled={notificationSettings.emailNotifications}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, emailNotifications: value }))}
                  label="Email Notifications"
                  description="Receive notifications via email"
                />
                
                <Toggle
                  enabled={notificationSettings.smsNotifications}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, smsNotifications: value }))}
                  label="SMS Notifications"
                  description="Receive notifications via SMS"
                />
                
                <Toggle
                  enabled={notificationSettings.orderNotifications}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, orderNotifications: value }))}
                  label="Order Notifications"
                  description="Get notified when new orders are placed"
                />
                
                <Toggle
                  enabled={notificationSettings.lowStockAlerts}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: value }))}
                  label="Low Stock Alerts"
                  description="Get notified when products are running low"
                />
                
                <Toggle
                  enabled={notificationSettings.customerRegistration}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, customerRegistration: value }))}
                  label="Customer Registration"
                  description="Get notified when new customers register"
                />
                
                <Toggle
                  enabled={notificationSettings.newReviews}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, newReviews: value }))}
                  label="New Reviews"
                  description="Get notified when customers leave reviews"
                />
                
                <Toggle
                  enabled={notificationSettings.systemUpdates}
                  onChange={(value) => setNotificationSettings(prev => ({ ...prev, systemUpdates: value }))}
                  label="System Updates"
                  description="Get notified about system updates and maintenance"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saveSettingsMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-luxury-gold text-white rounded-md hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                >
                  <FiSave className="mr-2" size={16} />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              <div className="space-y-6">
                <Toggle
                  enabled={securitySettings.twoFactorAuth}
                  onChange={(value) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: value }))}
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                />
                
                <Toggle
                  enabled={securitySettings.enableAuditLog}
                  onChange={(value) => setSecuritySettings(prev => ({ ...prev, enableAuditLog: value }))}
                  label="Enable Audit Logging"
                  description="Log all admin actions for security monitoring"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.loginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="365"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IP Whitelist
                    </label>
                    <input
                      type="text"
                      placeholder="192.168.1.1, 10.0.0.1"
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saveSettingsMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-luxury-gold text-white rounded-md hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                >
                  <FiSave className="mr-2" size={16} />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <form onSubmit={handleSavePayment} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                  
                  <Toggle
                    enabled={paymentSettings.stripeEnabled}
                    onChange={(value) => setPaymentSettings(prev => ({ ...prev, stripeEnabled: value }))}
                    label="Stripe"
                    description="Accept credit and debit card payments"
                  />
                  
                  <Toggle
                    enabled={paymentSettings.paypalEnabled}
                    onChange={(value) => setPaymentSettings(prev => ({ ...prev, paypalEnabled: value }))}
                    label="PayPal"
                    description="Accept PayPal payments"
                  />
                  
                  <Toggle
                    enabled={paymentSettings.codEnabled}
                    onChange={(value) => setPaymentSettings(prev => ({ ...prev, codEnabled: value }))}
                    label="Cash on Delivery"
                    description="Allow customers to pay upon delivery"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentSettings.minOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Order Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentSettings.maxOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, maxOrderAmount: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Fee (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={paymentSettings.processingFee}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, processingFee: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={paymentSettings.taxRate}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saveSettingsMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-luxury-gold text-white rounded-md hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                >
                  <FiSave className="mr-2" size={16} />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <div className="space-y-8">
              {/* Change Password */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isLoading}
                    className="flex items-center px-4 py-2 bg-luxury-gold text-white rounded-md hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                  >
                    <FiLock className="mr-2" size={16} />
                    {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
