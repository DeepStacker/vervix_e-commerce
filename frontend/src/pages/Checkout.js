import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiTruck, FiCreditCard, FiMapPin, FiUser, FiMail, FiPhone, FiCheck, FiShield } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import StripePayment from '../components/payment/StripePayment';

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Customer info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Shipping address
    shippingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: ''
    },
    
    // Billing address
    billingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: ''
    },
    
    // Shipping method
    shippingMethod: 'standard',
    
    // Payment method
    paymentMethod: 'stripe',
    
    // Order notes
    notes: '',
    
    // Terms and conditions
    acceptTerms: false,
    marketingEmails: false
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart data
  const { data: cart, isLoading: cartLoading } = useQuery(
    'cart',
    async () => {
      const response = await axios.get('/api/cart');
      return response.data;
    }
  );

  // Fetch user data if authenticated
  const { data: user } = useQuery(
    'user',
    async () => {
      const response = await axios.get('/api/auth/me');
      return response.data;
    },
    {
      enabled: !!localStorage.getItem('token'),
      onSuccess: (data) => {
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            shippingAddress: {
              ...prev.shippingAddress,
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              phone: data.user.phone || ''
            }
          }));
        }
      }
    }
  );

  // Create order mutation
  const createOrderMutation = useMutation(
    async (orderData) => {
      const response = await axios.post('/api/orders', orderData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Order placed successfully!');
        queryClient.invalidateQueries('cart');
        navigate(`/order/${data.order._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to place order');
        setIsProcessing(false);
      }
    }
  );

  // Handle form input changes
  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle same as shipping toggle
  const handleSameAsShipping = (checked) => {
    setSameAsShipping(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress }
      }));
    }
  };

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shippingCost = formData.shippingMethod === 'express' ? 15 : formData.shippingMethod === 'overnight' ? 25 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1: // Customer info
        return formData.firstName && formData.lastName && formData.email;
      case 2: // Shipping
        const shipping = formData.shippingAddress;
        return shipping.firstName && shipping.lastName && shipping.street && 
               shipping.city && shipping.state && shipping.zipCode;
      case 3: // Payment
        return formData.paymentMethod && formData.acceptTerms;
      default:
        return true;
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!validateStep(3)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    const orderData = {
      items: cart.items.map(item => ({
        product: item.product,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price
      })),
      customerInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      },
      shippingAddress: formData.shippingAddress,
      billingAddress: sameAsShipping ? formData.shippingAddress : formData.billingAddress,
      shipping: {
        method: formData.shippingMethod,
        cost: shippingCost
      },
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      subtotal,
      tax: { amount: tax, rate: 0.08 },
      total
    };

    await createOrderMutation.mutateAsync(orderData);
  };

  if (cartLoading) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const steps = [
    { number: 1, title: 'Customer Info', icon: FiUser },
    { number: 2, title: 'Shipping', icon: FiMapPin },
    { number: 3, title: 'Payment', icon: FiCreditCard },
    { number: 4, title: 'Review', icon: FiCheck }
  ];

  return (
    <div className="section-padding bg-luxury-cream">
      <div className="container-luxury">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="section-title text-center">Checkout</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'border-luxury-gold bg-luxury-gold text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <FiCheck size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-luxury-gold' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-luxury-gold' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange(null, 'firstName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange(null, 'lastName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Shipping Address */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.firstName}
                        onChange={(e) => handleInputChange('shippingAddress', 'firstName', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.lastName}
                        onChange={(e) => handleInputChange('shippingAddress', 'lastName', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.company}
                        onChange={(e) => handleInputChange('shippingAddress', 'company', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.shippingAddress.phone}
                        onChange={(e) => handleInputChange('shippingAddress', 'phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.street}
                        onChange={(e) => handleInputChange('shippingAddress', 'street', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.city}
                        onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.state}
                        onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.zipCode}
                        onChange={(e) => handleInputChange('shippingAddress', 'zipCode', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select
                        value={formData.shippingAddress.country}
                        onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'standard', name: 'Standard Shipping', price: 0, time: '5-7 business days' },
                      { id: 'express', name: 'Express Shipping', price: 15, time: '2-3 business days' },
                      { id: 'overnight', name: 'Overnight Shipping', price: 25, time: '1 business day' }
                    ].map((method) => (
                      <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-luxury-gold">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={formData.shippingMethod === method.id}
                          onChange={(e) => handleInputChange(null, 'shippingMethod', e.target.value)}
                          className="mr-3 text-luxury-gold focus:ring-luxury-gold"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.time}</div>
                        </div>
                        <div className="font-semibold">
                          {method.price === 0 ? 'Free' : `$${method.price.toFixed(2)}`}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Payment Method Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'stripe', name: 'Credit / Debit Card', icon: '💳', description: 'Secure payment with Stripe' },
                      { id: 'paypal', name: 'PayPal', icon: '🔵', description: 'Pay with your PayPal account' }
                    ].map((method) => (
                      <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-luxury-gold">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={(e) => handleInputChange(null, 'paymentMethod', e.target.value)}
                          className="mr-3 text-luxury-gold focus:ring-luxury-gold"
                        />
                        <span className="mr-3 text-xl">{method.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stripe Payment Component */}
                {formData.paymentMethod === 'stripe' && (
                  <StripePayment
                    orderId={null} // Will be set after order creation
                    amount={total}
                    onSuccess={(data) => {
                      toast.success('Payment successful!');
                      // Handle successful payment
                    }}
                    onError={(error) => {
                      toast.error('Payment failed. Please try again.');
                    }}
                    onCancel={() => {
                      setCurrentStep(2);
                    }}
                  />
                )}

                {/* Terms and Conditions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Terms & Conditions</h2>
                  <div className="space-y-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange(null, 'acceptTerms', e.target.checked)}
                        className="mr-3 mt-1 text-luxury-gold focus:ring-luxury-gold"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the <a href="/terms" className="text-luxury-gold hover:underline">Terms and Conditions</a> and{' '}
                        <a href="/privacy" className="text-luxury-gold hover:underline">Privacy Policy</a> *
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.marketingEmails}
                        onChange={(e) => handleInputChange(null, 'marketingEmails', e.target.checked)}
                        className="mr-3 mt-1 text-luxury-gold focus:ring-luxury-gold"
                      />
                      <span className="text-sm text-gray-700">
                        I would like to receive marketing emails about new products and special offers
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item._id} className="flex items-center gap-4">
                        <img
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.variant?.size && `Size: ${item.variant.size}`}
                            {item.variant?.color && ` • Color: ${item.variant.color}`}
                          </p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Information Review */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                      <p className="text-gray-600">{formData.firstName} {formData.lastName}</p>
                      <p className="text-gray-600">{formData.email}</p>
                      {formData.phone && <p className="text-gray-600">{formData.phone}</p>}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <p className="text-gray-600">
                        {formData.shippingAddress.firstName} {formData.shippingAddress.lastName}
                      </p>
                      <p className="text-gray-600">{formData.shippingAddress.street}</p>
                      <p className="text-gray-600">
                        {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              <div className="flex-1" />
              {currentStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold-dark transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FiLock size={18} />
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <FiLock size={16} />
                  <span className="text-sm font-medium">Secure Checkout</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiTruck className="text-luxury-gold" />
                  <span>Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiShield className="text-luxury-gold" />
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 