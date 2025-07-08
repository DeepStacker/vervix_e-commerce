import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCreditCard, FaMoneyBillWave, FaMobile, FaShieldAlt, FaGoogle, FaCheck, FaLock } from 'react-icons/fa';
import { SiPhonepe, SiPaytm } from 'react-icons/si';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentMethods = ({ 
  orderData, 
  onPaymentSuccess, 
  onPaymentError, 
  totalAmount, 
  onPaymentMethodChange 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [processingUPI, setProcessingUPI] = useState(false);
  const { user } = useAuth();

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <FaCreditCard className="text-2xl text-blue-600" />,
      description: 'Secure payment via Stripe',
      fees: 'Processing fee: ₹0'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: <FaMoneyBillWave className="text-2xl text-green-600" />,
      description: 'Pay when you receive',
      fees: 'COD fee: ₹40'
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: <FaMobile className="text-2xl text-purple-600" />,
      description: 'Pay via UPI apps',
      fees: 'Processing fee: ₹0'
    }
  ];

  const upiApps = [
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: <SiPhonepe className="text-2xl text-purple-600" />,
      color: 'bg-purple-100 border-purple-300'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      icon: <FaGoogle className="text-2xl text-blue-600" />,
      color: 'bg-blue-100 border-blue-300'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: <SiPaytm className="text-2xl text-blue-700" />,
      color: 'bg-blue-100 border-blue-300'
    }
  ];

  const handleMethodChange = (methodId) => {
    setSelectedMethod(methodId);
    onPaymentMethodChange && onPaymentMethodChange(methodId);
  };

  const handleCODOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...orderData,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          totalAmount: totalAmount + 40 // COD fee
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      toast.success('Order placed successfully! You will pay on delivery.');
      onPaymentSuccess({
        orderId: order._id,
        paymentMethod: 'cod',
        paymentStatus: 'pending'
      });
    } catch (error) {
      console.error('COD order error:', error);
      toast.error('Failed to place order. Please try again.');
      onPaymentError && onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPayment = async (upiApp) => {
    setProcessingUPI(true);
    try {
      // Generate UPI payment link
      const response = await fetch('/api/payments/upi/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          orderId: orderData.orderId || `ORDER_${Date.now()}`,
          upiApp: upiApp,
          customerInfo: {
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create UPI payment');
      }

      const { paymentUrl, transactionId } = await response.json();
      
      // Open UPI app or payment gateway
      if (upiApp === 'phonepe') {
        window.open(paymentUrl, '_blank');
      } else if (upiApp === 'googlepay') {
        window.open(paymentUrl, '_blank');
      } else if (upiApp === 'paytm') {
        window.open(paymentUrl, '_blank');
      }

      // Start polling for payment status
      const pollPaymentStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/payments/upi/status/${transactionId}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'success') {
              toast.success('Payment successful!');
              onPaymentSuccess({
                transactionId,
                paymentMethod: 'upi',
                paymentStatus: 'completed',
                upiApp
              });
            } else if (statusData.status === 'failed') {
              toast.error('Payment failed. Please try again.');
              onPaymentError && onPaymentError(new Error('UPI payment failed'));
            } else {
              // Continue polling
              setTimeout(pollPaymentStatus, 3000);
            }
          }
        } catch (error) {
          console.error('Payment status check error:', error);
        }
      };

      // Start polling after 5 seconds
      setTimeout(pollPaymentStatus, 5000);
      
    } catch (error) {
      console.error('UPI payment error:', error);
      toast.error('Failed to initiate UPI payment. Please try again.');
      onPaymentError && onPaymentError(error);
    } finally {
      setProcessingUPI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-playfair font-semibold text-primary-black mb-4">
          Choose Payment Method
        </h3>
        
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-luxury-gold bg-luxury-gold bg-opacity-5'
                : 'border-border-light hover:border-luxury-gold hover:bg-luxury-gold hover:bg-opacity-5'
            }`}
            onClick={() => handleMethodChange(method.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {method.icon}
                </div>
                <div>
                  <h4 className="font-medium text-primary-black">{method.name}</h4>
                  <p className="text-sm text-warm-gray">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-warm-gray">{method.fees}</p>
                {selectedMethod === method.id && (
                  <FaCheck className="text-luxury-gold mt-1 ml-auto" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method Details */}
      <div className="border-t border-border-light pt-6">
        {selectedMethod === 'stripe' && (
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              orderData={orderData}
              totalAmount={totalAmount}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
              loading={loading}
              setLoading={setLoading}
            />
          </Elements>
        )}

        {selectedMethod === 'cod' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FaShieldAlt className="text-orange-600" />
                <h4 className="font-medium text-orange-800">Cash on Delivery</h4>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Pay ₹{totalAmount + 40} (including ₹40 COD fee) when your order is delivered.
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Have exact change ready</li>
                <li>• Valid ID required for delivery</li>
                <li>• Delivery within 3-5 business days</li>
              </ul>
            </div>
            
            <button
              onClick={handleCODOrder}
              disabled={loading}
              className="btn-luxury w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Placing order...
                </>
              ) : (
                'Place Order - COD'
              )}
            </button>
          </div>
        )}

        {selectedMethod === 'upi' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FaLock className="text-purple-600" />
                <h4 className="font-medium text-purple-800">UPI Payment</h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Pay ₹{totalAmount} instantly via your preferred UPI app.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleUPIPayment(app.id)}
                  disabled={processingUPI}
                  className={`${app.color} border-2 rounded-lg p-4 text-center hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {app.icon}
                    <span className="text-sm font-medium text-gray-700">{app.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {processingUPI && (
              <div className="text-center py-4">
                <div className="loading-spinner mx-auto mb-2"></div>
                <p className="text-sm text-warm-gray">
                  Opening UPI app... Please complete the payment and return to this page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <FaShieldAlt className="text-luxury-gold" />
          <h4 className="font-medium text-primary-black">Secure Payment</h4>
        </div>
        <p className="text-sm text-warm-gray">
          All payments are secured with industry-standard encryption. Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({ 
  orderData, 
  totalAmount, 
  onPaymentSuccess, 
  onPaymentError, 
  loading, 
  setLoading 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const handleStripePayment = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      // Create payment intent
      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: totalAmount * 100, // Convert to paise
          currency: 'inr',
          orderData,
          customerInfo: {
            name: user.name,
            email: user.email
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.name,
              email: user.email
            }
          }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onPaymentSuccess({
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe',
          paymentStatus: 'completed'
        });
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      onPaymentError && onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <form onSubmit={handleStripePayment} className="space-y-4">
      <div className="border border-border-light rounded-lg p-4">
        <label className="block text-sm font-medium text-primary-black mb-2">
          Card Details
        </label>
        <CardElement options={cardElementOptions} />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-luxury w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="loading-spinner mr-2"></div>
            Processing payment...
          </>
        ) : (
          `Pay ₹${totalAmount}`
        )}
      </button>
    </form>
  );
};

export default PaymentMethods;
