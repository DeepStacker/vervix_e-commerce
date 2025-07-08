import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import adminApi from '../../api/adminApi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await adminApi.post('/auth/admin/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, user } = response.data;
      
      // Store admin token separately
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      // Set authorization header for future requests
      adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Welcome to Vervix Admin!');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle demo admin login
  const handleDemoLogin = async () => {
    setFormData({
      email: 'admin@vervix.com',
      password: 'admin123'
    });
    
    // Small delay to show the demo credentials
    setTimeout(async () => {
      await handleSubmit({ preventDefault: () => {} });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <FiShield className="h-12 w-12 text-luxury-gold" />
            </div>
            <h1 className="text-4xl font-bold text-luxury-gold mb-2">VERVIX</h1>
            <p className="text-gray-400">Admin Panel</p>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-gray-400">
            Sign in to manage your luxury fashion store
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 bg-white/10 border rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                    errors.email ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Enter admin email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                    errors.password ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Security Notice</span>
              </div>
              <p className="text-xs text-yellow-200">
                This is a secure admin area. All activities are logged and monitored.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-luxury-gold hover:bg-luxury-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center">
                  Access Admin Panel
                  <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>

            {/* Demo Login Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition-colors disabled:opacity-50"
            >
              Try Demo Admin Account
            </button>
          </form>

          {/* Security Features */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>SSL Encrypted Connection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Two-Factor Authentication Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Activity Logging Enabled</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back to Main Site */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Main Site
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            © 2024 Vervix Admin Panel. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin; 