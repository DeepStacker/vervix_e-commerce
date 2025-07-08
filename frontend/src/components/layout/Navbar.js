import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount: cartItems } = useCart();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-luxury sticky top-0 z-40">
      <div className="container-luxury">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="font-playfair text-3xl font-bold text-primary-black hover:text-luxury-gold transition-colors duration-300"
          >
            VERVIX
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Home */}
            <Link to="/" className="nav-link">
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="nav-link flex items-center space-x-1"
              >
                <span>Categories</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCategoriesOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCategoriesOpen(false)}
                  ></div>
                  <div className="nav-dropdown">
                    <Link 
                      to="/products/men" 
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center space-x-2 hover:bg-soft-cream"
                    >
                      <span>👔</span>
                      <span>Men</span>
                    </Link>
                    <Link 
                      to="/products/women" 
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center space-x-2 hover:bg-soft-cream"
                    >
                      <span>👗</span>
                      <span>Women</span>
                    </Link>
                    <Link 
                      to="/products/unisex" 
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center space-x-2 hover:bg-soft-cream"
                    >
                      <span>👕</span>
                      <span>Unisex</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* About Us */}
            <Link to="/about" className="nav-link">
              About Us
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search luxury fashion..."
                className="w-64 pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-all duration-300"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-warm-gray"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 hover:text-luxury-gold transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
              </svg>
              {cartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* Profile/Auth */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 hover:text-luxury-gold transition-colors duration-300"
                >
                  <div className="w-8 h-8 bg-luxury-gold rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.firstName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-luxury rounded-lg py-2 z-50">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-primary-black hover:bg-soft-cream transition-colors duration-200"
                      >
                        Profile
                      </Link>
                      <Link 
                        to="/orders" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-primary-black hover:bg-soft-cream transition-colors duration-200"
                      >
                        Order History
                      </Link>
                      <Link 
                        to="/wishlist" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-primary-black hover:bg-soft-cream transition-colors duration-200"
                      >
                        Wishlist
                      </Link>
                      <hr className="my-2 border-border-light" />
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-soft-cream transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-primary-black hover:text-luxury-gold transition-colors duration-300"
                >
                  Login
                </Link>
                <span className="text-warm-gray">|</span>
                <Link 
                  to="/register" 
                  className="text-sm font-medium text-primary-black hover:text-luxury-gold transition-colors duration-300"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:text-luxury-gold transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border-light py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search luxury fashion..."
                  className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-all duration-300"
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-warm-gray"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 nav-link"
              >
                Home
              </Link>
              
              <div className="py-2">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full nav-link"
                >
                  <span>Categories</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isCategoriesOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <Link 
                      to="/products/men" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-1 text-sm text-warm-gray hover:text-luxury-gold"
                    >
                      👔 Men
                    </Link>
                    <Link 
                      to="/products/women" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-1 text-sm text-warm-gray hover:text-luxury-gold"
                    >
                      👗 Women
                    </Link>
                    <Link 
                      to="/products/unisex" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-1 text-sm text-warm-gray hover:text-luxury-gold"
                    >
                      👕 Unisex
                    </Link>
                  </div>
                )}
              </div>
              
              <Link 
                to="/about" 
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 nav-link"
              >
                About Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
