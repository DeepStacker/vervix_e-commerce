import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Cart from './components/cart/Cart';
import PaymentMethods from './components/payment/PaymentMethods';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #d4af37',
                },
                success: {
                  iconTheme: {
                    primary: '#d4af37',
                    secondary: '#000000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment" element={<PaymentMethods />} />
              
              {/* Default Route */}
              <Route path="/" element={
                <div className="min-h-screen bg-cream flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary-black mb-4">
                      Welcome to Vervix
                    </h1>
                    <p className="text-warm-gray mb-8">
                      Luxury E-commerce Platform
                    </p>
                    <div className="space-x-4">
                      <a 
                        href="/login" 
                        className="inline-block bg-primary-black text-cream px-6 py-3 rounded-lg hover:bg-warm-gray transition-colors"
                      >
                        Login
                      </a>
                      <a 
                        href="/register" 
                        className="inline-block bg-luxury-gold text-primary-black px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Register
                      </a>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
