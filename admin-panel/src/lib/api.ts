import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// CRUD operation types
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle 401 errors and token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAuthToken(refreshToken);
              const newToken = response.data.token;
              
              this.setAuthToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.clearAuthTokens();
            // Redirect to login or dispatch logout action
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/login';
            }
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  private clearAuthTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
  }

  private async refreshAuthToken(refreshToken: string): Promise<AxiosResponse> {
    return this.instance.post('/auth/refresh', { refreshToken });
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
    };

    if (error.response?.data) {
      const errorData = error.response.data as any;
      apiError.message = errorData.message || apiError.message;
      apiError.errors = errorData.errors;
    } else if (error.message) {
      apiError.message = error.message;
    }

    return apiError;
  }

  // Generic CRUD methods
  async get<T = any>(url: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async getPaginated<T = any>(url: string, params?: QueryParams): Promise<PaginatedResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  // File upload method
  async upload<T = any>(url: string, formData: FormData, onUploadProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Bulk operations
  async bulkUpdate<T = any>(url: string, data: { ids: string[]; updates: any }): Promise<ApiResponse<T>> {
    return this.patch(url, data);
  }

  async bulkDelete<T = any>(url: string, ids: string[]): Promise<ApiResponse<T>> {
    return this.delete(`${url}?ids=${ids.join(',')}`);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Specific API endpoints
export const adminApi = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getSalesAnalytics: (params?: QueryParams) => apiClient.get('/admin/analytics/sales', params),
  
  // Users
  getUsers: (params?: QueryParams) => apiClient.getPaginated('/admin/users', params),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  bulkUpdateUsers: (data: { ids: string[]; updates: any }) => apiClient.bulkUpdate('/admin/users/bulk', data),
};

export const productsApi = {
  getProducts: (params?: QueryParams) => apiClient.getPaginated('/products', params),
  getProduct: (id: string) => apiClient.get(`/products/${id}`),
  createProduct: (data: any) => apiClient.post('/products', data),
  updateProduct: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/products/${id}`),
  bulkUpdateProducts: (data: { ids: string[]; updates: any }) => apiClient.bulkUpdate('/products/bulk', data),
  uploadProductImages: (productId: string, formData: FormData, onProgress?: (progress: number) => void) =>
    apiClient.upload(`/products/${productId}/images`, formData, onProgress),
};

export const ordersApi = {
  getOrders: (params?: QueryParams) => apiClient.getPaginated('/orders', params),
  getOrder: (id: string) => apiClient.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => apiClient.patch(`/orders/${id}/status`, { status }),
  updateOrder: (id: string, data: any) => apiClient.put(`/orders/${id}`, data),
  deleteOrder: (id: string) => apiClient.delete(`/orders/${id}`),
  bulkUpdateOrders: (data: { ids: string[]; updates: any }) => apiClient.bulkUpdate('/orders/bulk', data),
};

export const categoriesApi = {
  getCategories: (params?: QueryParams) => apiClient.getPaginated('/categories', params),
  getCategory: (id: string) => apiClient.get(`/categories/${id}`),
  createCategory: (data: any) => apiClient.post('/categories', data),
  updateCategory: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`),
};

export const authApi = {
  login: (credentials: { email: string; password: string }) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data: any) => apiClient.put('/auth/profile', data),
};

export const supportApi = {
  getTickets: (params?: QueryParams) => apiClient.getPaginated('/support', params),
  getTicket: (id: string) => apiClient.get(`/support/${id}`),
  updateTicket: (id: string, data: any) => apiClient.put(`/support/${id}`, data),
  deleteTicket: (id: string) => apiClient.delete(`/support/${id}`),
  addTicketReply: (id: string, reply: string) => apiClient.post(`/support/${id}/replies`, { reply }),
};

export const auditApi = {
  getAuditLogs: (params?: QueryParams) => apiClient.getPaginated('/audit', params),
  getAuditLog: (id: string) => apiClient.get(`/audit/${id}`),
};

// Export default client
export default apiClient;

// Utility functions for error handling
export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'message' in error && 'status' in error;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getErrorMessages = (error: unknown): string[] => {
  if (isApiError(error) && error.errors) {
    return error.errors;
  }
  return [getErrorMessage(error)];
};
