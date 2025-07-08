import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  loadStripe 
} from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  FiCreditCard, 
  FiLock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiShield,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

// Load Stripe (replace with your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      ':-webkit-autofill': {
        color: '#fce883',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm = ({ orderId, amount, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);

  // Create payment intent when component mounts
  useEffect(() => {
    if (orderId && amount) {
      createPaymentIntent();
    }
  }, [orderId, amount]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/payments/create-payment-intent', {
        orderId
      });

      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
      } else {
        throw new Error(response.data.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment intent creation error:', error);
      setError(error.response?.data?.message || 'Failed to initialize payment');
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm card payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: 'Customer Name', // You can get this from form
            },
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message);
        onError && onError(paymentError);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await confirmPayment(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentIntentId) => {
    try {
      const response = await axios.post('/api/payments/confirm-payment', {
        paymentIntentId
      });

      if (response.data.success) {
        toast.success('Payment successful!');
        onSuccess && onSuccess(response.data);
      } else {
        throw new Error(response.data.message || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError('Payment confirmation failed. Please contact support.');
      onError && onError(error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
        <span className="ml-3 text-gray-600">Initializing payment...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiCreditCard className="h-6 w-6 text-luxury-gold mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Secure Payment</h3>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FiLock className="h-4 w-4 mr-1" />
          <span>SSL Encrypted</span>
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center">
              <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Details Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Card Information
            </label>
            <button
              type="button"
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="text-sm text-luxury-gold hover:text-luxury-gold-dark"
            >
              {showCardDetails ? (
                <>
                  <FiEyeOff className="h-4 w-4 inline mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <FiEye className="h-4 w-4 inline mr-1" />
                  Show Details
                </>
              )}
            </button>
          </div>

          <div className={`border border-gray-300 rounded-lg p-4 transition-all duration-300 ${
            showCardDetails ? 'bg-gray-50' : 'bg-white'
          }`}>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>

          {showCardDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex items-center">
                  <FiShield className="h-3 w-3 mr-1" />
                  <span>Your card details are encrypted and secure</span>
                </div>
                <div className="flex items-center">
                  <FiLock className="h-3 w-3 mr-1" />
                  <span>We never store your full card information</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiShield className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p>This is a secure payment powered by Stripe. Your payment information is encrypted and protected.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!stripe || loading || !clientSecret}
            className="flex items-center px-6 py-2 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <FiCheckCircle className="h-4 w-4 mr-2" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Payment Methods Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span>Visa, Mastercard, Amex</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            <span>256-bit SSL Encryption</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StripePayment = ({ orderId, amount, onSuccess, onError, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        orderId={orderId}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
};

export default StripePayment; 