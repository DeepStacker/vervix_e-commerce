// Frontend test setup
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn()
      })),
      getElement: jest.fn(),
      update: jest.fn(),
      submit: jest.fn(),
      confirmPayment: jest.fn(() => Promise.resolve({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded'
        }
      }))
    })),
    confirmPayment: jest.fn(() => Promise.resolve({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded'
      }
    }))
  }))
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null
  }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>{children}</a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>{children}</a>
  )
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Mock API responses
  mockApiResponse: (method, url, response, status = 200) => {
    const axios = require('axios');
    const mockResponse = { data: response, status };
    
    if (method === 'get') {
      axios.get.mockResolvedValueOnce(mockResponse);
    } else if (method === 'post') {
      axios.post.mockResolvedValueOnce(mockResponse);
    } else if (method === 'put') {
      axios.put.mockResolvedValueOnce(mockResponse);
    } else if (method === 'delete') {
      axios.delete.mockResolvedValueOnce(mockResponse);
    }
  },

  // Mock API errors
  mockApiError: (method, url, error, status = 500) => {
    const axios = require('axios');
    const mockError = {
      response: { data: error, status },
      message: error.message || 'Network Error'
    };
    
    if (method === 'get') {
      axios.get.mockRejectedValueOnce(mockError);
    } else if (method === 'post') {
      axios.post.mockRejectedValueOnce(mockError);
    } else if (method === 'put') {
      axios.put.mockRejectedValueOnce(mockError);
    } else if (method === 'delete') {
      axios.delete.mockRejectedValueOnce(mockError);
    }
  },

  // Mock localStorage
  mockLocalStorage: (data = {}) => {
    Object.keys(data).forEach(key => {
      localStorageMock.getItem.mockImplementation((k) => {
        return k === key ? data[key] : null;
      });
    });
  },

  // Mock sessionStorage
  mockSessionStorage: (data = {}) => {
    Object.keys(data).forEach(key => {
      sessionStorageMock.getItem.mockImplementation((k) => {
        return k === key ? data[key] : null;
      });
    });
  },

  // Clear all mocks
  clearMocks: () => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
  }
};

// Before each test
beforeEach(() => {
  global.testUtils.clearMocks();
});

// After each test
afterEach(() => {
  global.testUtils.clearMocks();
}); 