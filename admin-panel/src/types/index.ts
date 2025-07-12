// Base types
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// User and admin types
export interface Address {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

export interface CartItem {
  product: string;
  variant?: string;
  quantity: number;
  addedAt: string;
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  addresses: Address[];
  preferences: UserPreferences;
  wishlist: string[];
  cart: CartItem[];
  lastLogin: string;
  loginAttempts: number;
  lockUntil?: string;
  stripeCustomerId?: string;
  fullName: string;
  isLocked: boolean;
}

export interface AdminUser extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
  department?: string;
  lastActiveAt: string;
}

// Product types with variants and inventory
export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  _id?: string;
  size: string;
  color: string;
  colorCode?: string;
  material?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  stock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  images: ProductImage[];
  status: 'active' | 'inactive' | 'out_of_stock';
  lastStockUpdate: string;
  lowStockAlert: boolean;
}

export interface ProductInventory {
  trackQuantity: boolean;
  continueSellingWhenOutOfStock: boolean;
  quantity: number;
  reservedQuantity: number;
  availableStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  lowStockAlert: boolean;
  lastStockUpdate: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords: string[];
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  brand: string;
  gender: 'men' | 'women' | 'unisex';
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  inventory: ProductInventory;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  isFeatured: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  seo: ProductSEO;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  isDigital: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  metaDescription?: string;
  metaKeywords: string[];
}

// Category types with hierarchy
export interface CategoryImage {
  url?: string;
  alt?: string;
}

export interface CategorySEO {
  title?: string;
  description?: string;
  keywords: string[];
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  slug: string;
  parent?: string;
  level: number;
  path: string;
  image?: CategoryImage;
  icon?: string;
  color: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seo: CategorySEO;
  productCount: number;
  children?: Category[];
}

// Order types with items, status, and payment details
export interface OrderItem {
  product: string;
  variant?: {
    size?: string;
    color?: string;
    sku?: string;
  };
  name: string;
  image?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface OrderTax {
  amount: number;
  rate: number;
}

export interface OrderShipping {
  cost: number;
  method: 'standard' | 'express' | 'overnight' | 'free';
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface OrderDiscount {
  amount: number;
  code?: string;
  type: 'percentage' | 'fixed';
}

export interface OrderPaymentDetails {
  transactionId?: string;
  paymentGateway?: string;
  last4?: string;
  brand?: string;
  paidAt?: string;
  failureReason?: string;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface OrderStatusHistory {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderRefund {
  refundId: string;
  amount: number;
  reason: 'customer_request' | 'defective_product' | 'wrong_item' | 'late_delivery' | 'cancellation' | 'return_processed' | 'duplicate_charge' | 'other';
  type: 'full' | 'partial' | 'shipping' | 'tax';
  method: 'original_payment' | 'store_credit' | 'bank_transfer' | 'check';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  customer: string;
  customerInfo: OrderCustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: OrderTax;
  shipping: OrderShipping;
  discount: OrderDiscount;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'cash_on_delivery';
  paymentIntentId?: string;
  paymentDetails: OrderPaymentDetails;
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  notes?: string;
  adminNotes?: string;
  statusHistory: OrderStatusHistory[];
  refunds: OrderRefund[];
}

// Support ticket types
export interface SupportAttachment {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface SupportMessage {
  sender: string;
  senderType: 'customer' | 'admin' | 'system';
  message: string;
  attachments: SupportAttachment[];
  isInternal: boolean;
  sentAt: string;
}

export interface SupportCustomerSatisfaction {
  rating: number;
  feedback?: string;
  submittedAt: string;
}

export interface SupportStatusHistory {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface SupportLocation {
  country?: string;
  city?: string;
  timezone?: string;
}

export interface SupportSLA {
  targetResolutionTime?: string;
  actualResolutionTime?: string;
  isOverdue: boolean;
  overdueHours: number;
}

export interface SupportAutoClose {
  enabled: boolean;
  closeAfterDays: number;
  lastActivity?: string;
}

export interface SupportTicket extends BaseEntity {
  ticketNumber: string;
  customer: string;
  customerInfo: OrderCustomerInfo;
  type: 'general' | 'technical' | 'billing' | 'order' | 'return' | 'product' | 'shipping' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  subject: string;
  description: string;
  category: 'account_issues' | 'payment_problems' | 'order_status' | 'shipping_delays' | 'product_questions' | 'return_refund' | 'website_technical' | 'mobile_app_issues' | 'general_inquiry' | 'complaint' | 'suggestion' | 'other';
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  estimatedResolutionTime?: string;
  tags: string[];
  attachments: SupportAttachment[];
  messages: SupportMessage[];
  relatedOrder?: string;
  relatedProduct?: string;
  customerSatisfaction?: SupportCustomerSatisfaction;
  statusHistory: SupportStatusHistory[];
  source: 'web' | 'mobile' | 'email' | 'phone' | 'chat' | 'admin';
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  location?: SupportLocation;
  notes?: string;
  internalNotes?: string;
  escalationLevel: number;
  sla: SupportSLA;
  autoClose: SupportAutoClose;
  formattedTicketNumber: string;
}

// Audit log types
export interface AuditLog extends BaseEntity {
  user: string;
  action: string;
  resource: 'user' | 'product' | 'order' | 'payment' | 'inventory' | 'category' | 'system' | 'security';
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  metadata?: any;
  timestamp: string;
  formattedTimestamp: string;
}

// API response types
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

export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  role?: 'user' | 'admin';
  isActive?: boolean;
  addresses?: Address[];
  preferences?: UserPreferences;
}

export interface ProductFormData {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  brand: string;
  gender: 'men' | 'women' | 'unisex';
  tags: string[];
  status: 'draft' | 'active' | 'inactive' | 'archived';
  isFeatured: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  seo?: ProductSEO;
  isDigital?: boolean;
  requiresShipping?: boolean;
  taxable?: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seo?: CategorySEO;
}

export interface OrderFormData {
  customer: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: string;
  notes?: string;
}

export interface SupportTicketFormData {
  customer: string;
  type: string;
  priority: string;
  subject: string;
  description: string;
  category: string;
  assignedTo?: string;
  tags?: string[];
}

// Dashboard analytics types
export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  revenue: number;
  growth: number;
  period: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
  lowStockProducts: number;
  supportTickets: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface RevenueAnalytics {
  daily: ChartData;
  weekly: ChartData;
  monthly: ChartData;
  yearly: ChartData;
}

export interface ProductAnalytics {
  topSellingProducts: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }[];
  categoryPerformance: {
    category: string;
    sales: number;
    revenue: number;
    growth: number;
  }[];
  inventoryStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageLifetimeValue: number;
  topCustomers: {
    id: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
  }[];
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  sales: SalesAnalytics;
  revenue: RevenueAnalytics;
  products: ProductAnalytics;
  customers: CustomerAnalytics;
}

// Pagination and filter types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationParams & { total: number };
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onFilter?: (filters: FilterParams) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
  actions?: {
    label: string;
    onClick: (selectedRows: string[]) => void;
    variant?: 'default' | 'destructive';
  }[];
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type EntityId = string;
export type EntityIds = EntityId[];

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onUpload: (files: FileUpload[]) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}
