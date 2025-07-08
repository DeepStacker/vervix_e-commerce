import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock contexts
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  })
}));

jest.mock('../../contexts/CartContext', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    items: [],
    loading: false,
    error: null
  })
}));

// Test components
import Wishlist from '../../pages/Wishlist';
import OrderHistory from '../../pages/OrderHistory';

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Wishlist Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty wishlist state', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: []
    });

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
      expect(screen.getByText('Discover Products')).toBeInTheDocument();
    });
  });

  test('renders wishlist items correctly', async () => {
    const mockWishlistData = [
      {
        _id: '1',
        name: 'Test Product',
        price: 99.99,
        images: [{ url: 'test-image.jpg' }],
        category: { name: 'Test Category' },
        inventory: { quantity: 10 },
        isOnSale: false,
        discount: 0
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: mockWishlistData
    });

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });
  });

  test('handles move to cart action', async () => {
    const mockWishlistData = [
      {
        _id: '1',
        name: 'Test Product',
        price: 99.99,
        images: [{ url: 'test-image.jpg' }],
        category: { name: 'Test Category' },
        inventory: { quantity: 10 },
        isOnSale: false,
        discount: 0
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: mockWishlistData
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Successfully moved 1 items to cart',
        data: {
          addedToCart: [{ productId: '1', name: 'Test Product' }],
          unavailableItems: [],
          errors: []
        }
      }
    });

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const moveToCartButton = screen.getByText('Move to Cart');
    fireEvent.click(moveToCartButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users/wishlist/move-to-cart',
        { productIds: ['1'] },
        expect.any(Object)
      );
    });
  });

  test('handles bulk selection and actions', async () => {
    const mockWishlistData = [
      {
        _id: '1',
        name: 'Test Product 1',
        price: 99.99,
        images: [{ url: 'test-image.jpg' }],
        category: { name: 'Test Category' },
        inventory: { quantity: 10 },
        isOnSale: false,
        discount: 0
      },
      {
        _id: '2',
        name: 'Test Product 2',
        price: 149.99,
        images: [{ url: 'test-image2.jpg' }],
        category: { name: 'Test Category' },
        inventory: { quantity: 5 },
        isOnSale: false,
        discount: 0
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: mockWishlistData
    });

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    // Enable bulk selection mode
    const selectItemsButton = screen.getByText('Select Items');
    fireEvent.click(selectItemsButton);

    await waitFor(() => {
      expect(screen.getByText('Select All (2)')).toBeInTheDocument();
    });
  });

  test('handles clear all wishlist', async () => {
    const mockWishlistData = [
      {
        _id: '1',
        name: 'Test Product',
        price: 99.99,
        images: [{ url: 'test-image.jpg' }],
        category: { name: 'Test Category' },
        inventory: { quantity: 10 },
        isOnSale: false,
        discount: 0
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: mockWishlistData
    });

    mockedAxios.delete.mockResolvedValueOnce({
      data: {
        message: 'Wishlist cleared successfully',
        wishlistCount: 0
      }
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your entire wishlist?');
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/users/wishlist', expect.any(Object));
    });
  });
});

describe('Order History Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty order history state', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalOrders: 0
        }
      }
    });

    renderWithProviders(<OrderHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Start Shopping')).toBeInTheDocument();
    });
  });

  test('renders order history correctly', async () => {
    const mockOrdersData = {
      data: [
        {
          _id: 'order1',
          orderNumber: 'VRX000001',
          status: 'delivered',
          total: 199.99,
          createdAt: '2025-01-01T00:00:00Z',
          items: [
            {
              name: 'Test Product',
              image: 'test-image.jpg',
              quantity: 2,
              price: 99.99
            }
          ]
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalOrders: 1
      }
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: mockOrdersData
    });

    renderWithProviders(<OrderHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Order #VRX000001')).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });
  });

  test('handles reorder functionality', async () => {
    const mockOrdersData = {
      data: [
        {
          _id: 'order1',
          orderNumber: 'VRX000001',
          status: 'delivered',
          total: 199.99,
          createdAt: '2025-01-01T00:00:00Z',
          items: [
            {
              name: 'Test Product',
              image: 'test-image.jpg',
              quantity: 2,
              price: 99.99
            }
          ]
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalOrders: 1
      }
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: mockOrdersData
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Reorder completed. 1 items added to cart.',
        data: {
          addedToCart: 1,
          unavailableItems: [],
          cartErrors: []
        }
      }
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    renderWithProviders(<OrderHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Order #VRX000001')).toBeInTheDocument();
    });

    const reorderButton = screen.getByText('Reorder');
    fireEvent.click(reorderButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('This will add all available items from this order to your cart. Continue?');
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders/order1/reorder', expect.any(Object));
    });
  });

  test('handles order filtering', async () => {
    const mockOrdersData = {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0
      }
    };

    mockedAxios.get.mockResolvedValue({
      data: mockOrdersData
    });

    renderWithProviders(<OrderHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Order History')).toBeInTheDocument();
    });

    // Click filters button
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText('Search Orders')).toBeInTheDocument();
      expect(screen.getByText('Order Status')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    // Test status filter
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'delivered' } });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=delivered')
      );
    });
  });
});

describe('API Integration Tests', () => {
  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Server error'
        }
      }
    });

    renderWithProviders(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Wishlist')).toBeInTheDocument();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('handles network errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    renderWithProviders(<OrderHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Orders')).toBeInTheDocument();
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });
});

describe('Loading States', () => {
  test('shows loading skeleton for wishlist', () => {
    // Mock pending promise
    mockedAxios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderWithProviders(<Wishlist />);
    
    expect(screen.getByTestId('loading-skeleton') || 
           document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('shows loading skeleton for order history', () => {
    // Mock pending promise
    mockedAxios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderWithProviders(<OrderHistory />);
    
    expect(screen.getByTestId('loading-skeleton') || 
           document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});
