'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, usersApi } from '@/lib/api';
import { Order, User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User as UserIcon,
  MapPin,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Banknote,
  ShoppingBag,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface OrdersPageFilters {
  search: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customer: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string, notes?: string) => void;
  onPaymentStatusUpdate: (orderId: string, paymentStatus: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onPaymentStatusUpdate,
}) => {
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: order.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'outline';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'destructive';
      case 'partially_refunded': return 'secondary';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    onStatusUpdate(order._id, selectedStatus, statusNotes);
    setStatusUpdateOpen(false);
    setSelectedStatus('');
    setStatusNotes('');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span>Order Details - {order.orderNumber}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusUpdateOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <UserIcon className="mr-2 h-5 w-5" />
                Customer Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{order.customerInfo.email}</span>
                </div>
                {order.customerInfo.phone && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerInfo.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Order Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping.cost)}</span>
                </div>
                {order.discount.amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount.amount)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentDetails.last4 && (
                  <div className="flex justify-between">
                    <span>Card:</span>
                    <span>**** **** **** {order.paymentDetails.last4}</span>
                  </div>
                )}
                {order.paymentDetails.paidAt && (
                  <div className="flex justify-between">
                    <span>Paid At:</span>
                    <span>{new Date(order.paymentDetails.paidAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Shipping Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Shipping Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="capitalize">{order.shipping.method}</span>
                </div>
                {order.shipping.trackingNumber && (
                  <div className="flex justify-between">
                    <span>Tracking:</span>
                    <span className="font-mono">{order.shipping.trackingNumber}</span>
                  </div>
                )}
                {order.shipping.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span>Est. Delivery:</span>
                    <span>{new Date(order.shipping.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="font-medium">Shipping Address:</p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="p-4 mt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Order Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.variant && (
                      <div className="text-sm text-muted-foreground">
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                        {item.variant.color && <span className="ml-2">Color: {item.variant.color}</span>}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="p-4 mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Status History
              </h3>
              <div className="space-y-3">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{history.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(history.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {(order.notes || order.adminNotes) && (
            <Card className="p-4 mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Notes
              </h3>
              <div className="space-y-3">
                {order.notes && (
                  <div>
                    <p className="font-medium">Customer Notes:</p>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                )}
                {order.adminNotes && (
                  <div>
                    <p className="font-medium">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{order.adminNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order {order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add a note about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onSelectAllOrders: (selected: boolean) => void;
  onViewOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  selectedOrders,
  onSelectOrder,
  onSelectAllOrders,
  onViewOrder,
  onUpdateOrderStatus,
}) => {
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'outline';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'destructive';
      case 'partially_refunded': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-muted rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAllOrders}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
              />
            </TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isSelected = selectedOrders.includes(order._id);
            
            return (
              <TableRow key={order._id} className={isSelected ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectOrder(order._id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.customerInfo.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                    <p className="text-sm text-muted-foreground capitalize">
                      {order.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatCurrency(order.total, order.currency)}</p>
                    <p className="text-sm text-muted-foreground">{order.currency}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewOrder(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onUpdateOrderStatus(order._id, 'confirmed')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateOrderStatus(order._id, 'shipped')}>
                        <Truck className="mr-2 h-4 w-4" />
                        Mark as Shipped
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateOrderStatus(order._id, 'delivered')}>
                        <Package className="mr-2 h-4 w-4" />
                        Mark as Delivered
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onUpdateOrderStatus(order._id, 'cancelled')}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {orders.length === 0 && (
        <div className="p-8 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            No orders match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </Card>
  );
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrdersPageFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    customer: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch orders with filters
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', currentPage, pageSize, filters],
    queryFn: () => ordersApi.getOrders({
      page: currentPage,
      limit: pageSize,
      search: filters.search || undefined,
      status: filters.status || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      customer: filters.customer || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { ids: string[]; updates: any }) => 
      ordersApi.bulkUpdateOrders(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orders updated successfully');
      setSelectedOrders([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update orders');
    },
  });

  // Update filter
  const updateFilter = (key: keyof OrdersPageFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      paymentMethod: '',
      customer: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  // Handle order selection
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = (selected: boolean) => {
    if (selected && ordersData?.data) {
      setSelectedOrders(ordersData.data.map((o: Order) => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders first');
      return;
    }

    switch (action) {
      case 'confirm':
        bulkUpdateMutation.mutate({
          ids: selectedOrders,
          updates: { status: 'confirmed' }
        });
        break;
      case 'process':
        bulkUpdateMutation.mutate({
          ids: selectedOrders,
          updates: { status: 'processing' }
        });
        break;
      case 'ship':
        bulkUpdateMutation.mutate({
          ids: selectedOrders,
          updates: { status: 'shipped' }
        });
        break;
      case 'deliver':
