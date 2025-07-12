'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, ordersApi } from '@/lib/api';
import { User, Order } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
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
  Phone,
  Mail,
  ShoppingBag,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Heart,
  CreditCard,
  Package,
  Settings,
  Trash2,
  UserCheck,
  UserX,
  Send,
  FileText,
  PieChart,
  BarChart3,
  Target,
  Tag,
  Gift,
  Crown,
  Zap,
  Shield,
} from 'lucide-react';

interface CustomersPageFilters {
  search: string;
  status: string;
  segment: string;
  registrationDate: string;
  lastOrderDate: string;
  minOrderValue: string;
  maxOrderValue: string;
  orderCount: string;
  emailVerified: boolean;
  hasOrders: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CustomerDetailsModalProps {
  customer: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (customerId: string, status: string, notes?: string) => void;
  onSendMessage: (customerId: string, message: string, type: string) => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onStatusUpdate,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [messageType, setMessageType] = useState('email');
  const [messageContent, setMessageContent] = useState('');
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Fetch customer orders
  const { data: customerOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', customer?._id],
    queryFn: () => ordersApi.getOrders({ customer: customer?._id, limit: 50 }),
    enabled: !!customer?._id && isOpen,
  });

  if (!customer) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'default';
      case 'loyal': return 'secondary';
      case 'new': return 'outline';
      case 'at_risk': return 'destructive';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    onStatusUpdate(customer._id, selectedStatus, statusNotes);
    setStatusUpdateOpen(false);
    setSelectedStatus('');
    setStatusNotes('');
  };

  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }
    onSendMessage(customer._id, messageContent, messageType);
    setMessageContent('');
  };

  // Calculate customer stats
  const orders = customerOrders?.data || [];
  const totalSpent = orders.reduce((sum: number, order: Order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const lastOrderDate = orders.length > 0 ? new Date(Math.max(...orders.map((o: Order) => new Date(o.createdAt).getTime()))) : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {customer.avatar ? (
                    <img
                      src={customer.avatar}
                      alt={customer.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <span className="text-xl font-semibold">{customer.fullName}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getStatusColor(customer.isActive ? 'active' : 'inactive')}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {customer.emailVerified && (
                      <Badge variant="outline">
                        <Shield className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <Crown className="mr-1 h-3 w-3" />
                      {customer.role === 'admin' ? 'Admin' : 'Customer'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusUpdateOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('communication')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="communication">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Order</p>
                      <p className="text-sm font-medium">
                        {lastOrderDate ? lastOrderDate.toLocaleDateString() : 'No orders'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.email}</span>
                      {customer.emailVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {customer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                    )}
                    {customer.dateOfBirth && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Born: {new Date(customer.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {customer.gender && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{customer.gender}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined: {new Date(customer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last Login: {new Date(customer.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Addresses */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Addresses ({customer.addresses.length})
                  </h3>
                  <div className="space-y-3">
                    {customer.addresses.length > 0 ? (
                      customer.addresses.map((address, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="capitalize">
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.street}<br />
                            {address.city}, {address.state} {address.zipCode}<br />
                            {address.country}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No addresses on file</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Heart className="h-6 w-6 mx-auto text-red-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Wishlist Items</p>
                    <p className="text-lg font-semibold">{customer.wishlist?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <ShoppingBag className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Cart Items</p>
                    <p className="text-lg font-semibold">{customer.cart?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Reviews</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="h-6 w-6 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Support Tickets</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order History ({orders.length})</h3>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Orders
                </Button>
              </div>
              
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((order: Order) => (
                    <Card key={order._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} items
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {orders.length > 10 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All Orders
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-muted-foreground">
                    This customer hasn't placed any orders yet.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Card className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Tracking</h3>
                <p className="text-muted-foreground">
                  Activity tracking will be implemented in a future update.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Preferences</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Newsletter Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        Receive marketing emails and updates
                      </p>
                    </div>
                    <Badge variant={customer.preferences.newsletter ? 'default' : 'secondary'}>
                      {customer.preferences.newsletter ? 'Subscribed' : 'Unsubscribed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Order updates and important account information
                      </p>
                    </div>
                    <Badge variant={customer.preferences.emailNotifications ? 'default' : 'secondary'}>
                      {customer.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Text message updates for orders and promotions
                      </p>
                    </div>
                    <Badge variant={customer.preferences.smsNotifications ? 'default' : 'secondary'}>
                      {customer.preferences.smsNotifications ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Customer</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageType">Communication Method</Label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="notification">App Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                  
                  <Button onClick={handleSendMessage} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Customer Status</DialogTitle>
            <DialogDescription>
              Update the status for {customer.fullName}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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

interface CustomerTableProps {
  customers: User[];
  isLoading: boolean;
  selectedCustomers: string[];
  onSelectCustomer: (customerId: string) => void;
  onSelectAllCustomers: (selected: boolean) => void;
  onViewCustomer: (customer: User) => void;
  onUpdateCustomerStatus: (customerId: string, status: string) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
  selectedCustomers,
  onSelectCustomer,
  onSelectAllCustomers,
  onViewCustomer,
  onUpdateCustomerStatus,
}) => {
  const allSelected = customers.length > 0 && selectedCustomers.length === customers.length;
  const someSelected = selectedCustomers.length > 0 && selectedCustomers.length < customers.length;

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const getCustomerSegment = (customer: User) => {
    // Simple segmentation logic - can be enhanced
    const joinDate = new Date(customer.createdAt);
    const daysSinceJoin = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceJoin < 30) return { segment: 'new', color: 'outline' };
    if (customer.wishlist?.length > 10) return { segment: 'engaged', color: 'default' };
    if (!customer.lastLogin || (Date.now() - new Date(customer.lastLogin).getTime()) > (90 * 24 * 60 * 60 * 1000)) {
      return { segment: 'at_risk', color: 'destructive' };
    }
    return { segment: 'regular', color: 'secondary' };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-muted rounded animate-pulse" />
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
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
                onCheckedChange={onSelectAllCustomers}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
              />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const isSelected = selectedCustomers.includes(customer._id);
            const segment = getCustomerSegment(customer);
            
            return (
              <TableRow key={customer._id} className={isSelected ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectCustomer(customer._id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {customer.avatar ? (
                        <img
                          src={customer.avatar}
                          alt={customer.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{customer.fullName}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {customer.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="mr-1 h-2 w-2" />
                            Verified
                          </Badge>
                        )}
                        {customer.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="mr-1 h-2 w-2" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(customer.isActive)}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={segment.color as any} className="capitalize">
                    {segment.segment.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{new Date
