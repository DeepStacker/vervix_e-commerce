import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';

// Import actual components
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

// Import context providers
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Import actual auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Import actual pages
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import OrderHistory from './pages/OrderHistory';

// Import placeholder components for remaining pages
import {
  About,
  Contact,
  OrderDetail,
  ImageManagement
} from './components/PlaceholderComponents';

// Import actual admin components
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Analytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import AdminMedia from './pages/admin/Media';

// Import actual components
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Global Styles
import './styles/globals.css';
import './styles/animations.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
    });

    // Cleanup function
    return () => {
      AOS.refresh();
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Router>
                  <div className="App">
                    {/* Toast Notifications */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#1a1a1a',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        },
                        success: {
                          iconTheme: {
                            primary: '#c9a96e',
                            secondary: '#ffffff',
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
                      {/* Admin Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin/*"
                        element={
                          <AdminLayout>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/dashboard" element={<Dashboard />} />
                              <Route path="/products" element={<Products />} />
                              <Route path="/orders" element={<Orders />} />
                              <Route path="/customers" element={<Customers />} />
                              <Route path="/analytics" element={<Analytics />} />
                              <Route path="/images" element={<ImageManagement />} />
                              <Route path="/settings" element={<AdminSettings />} />
                              <Route path="/media" element={<AdminMedia />} />
                            </Routes>
                          </AdminLayout>
                        }
                      />

                      {/* Main Website Routes */}
                      <Route
                        path="/*"
                        element={
                          <>
                            <Navbar />
                            <main className="main-content">
                              <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/products" element={<ProductListing />} />
                                <Route path="/products/:category" element={<ProductListing />} />
                                <Route path="/product/:slug" element={<ProductDetail />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/cart" element={<Cart />} />
                                
                                {/* Auth Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                
                                {/* Protected Routes */}
                                <Route
                                  path="/profile"
                                  element={
                                    <ProtectedRoute>
                                      <Profile />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/wishlist"
                                  element={
                                    <ProtectedRoute>
                                      <Wishlist />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/orders"
                                  element={
                                    <ProtectedRoute>
                                      <OrderHistory />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/order/:id"
                                  element={
                                    <ProtectedRoute>
                                      <OrderDetail />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/checkout"
                                  element={
                                    <ProtectedRoute>
                                      <Checkout />
                                    </ProtectedRoute>
                                  }
                                />
                                
                                {/* 404 Route */}
                                <Route
                                  path="*"
                                  element={
                                    <div className="min-h-screen flex items-center justify-center">
                                      <div className="text-center">
                                        <h1 className="text-6xl font-bold text-luxury-gold mb-4">404</h1>
                                        <h2 className="text-2xl font-semibold text-primary-black mb-4">
                                          Page Not Found
                                        </h2>
                                        <p className="text-warm-gray mb-8">
                                          The page you're looking for doesn't exist.
                                        </p>
                                        <a
                                          href="/"
                                          className="inline-block bg-primary-black text-white px-8 py-3 rounded-lg hover:bg-secondary-black transition-all duration-300"
                                        >
                                          Back to Home
                                        </a>
                                      </div>
                                    </div>
                                  }
                                />
                              </Routes>
                            </main>
                            <Footer />
                          </>
                        }
                      />
                    </Routes>
                  </div>
                </Router>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
