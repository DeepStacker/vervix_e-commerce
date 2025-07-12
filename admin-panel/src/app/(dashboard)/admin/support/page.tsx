'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi, usersApi } from '@/lib/api';
import { SupportTicket, User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User as UserIcon,
  MessageSquare,
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
  FileText,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Target,
  Zap,
  Archive,
  Send,
  Reply,
  Forward,
  Flag,
  Timer,
  Bell,
  BellOff,
  UserCheck,
  UserX,
  Paperclip,
  Image as ImageIcon,
  Settings,
  BarChart3,
  PieChart,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Workflow,
  Tag,
  Hash,
  ExternalLink,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  HeadphonesIcon,
  MessageCircle,
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Megaphone,
} from 'lucide-react';

interface SupportPageFilters {
  search: string;
  status: string;
  priority: string;
  type: string;
  category: string;
  assignedTo: string;
  source: string;
  startDate: string;
  endDate: string;
  escalationLevel: string;
  isOverdue: boolean;
  hasUnreadMessages: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface TicketDetailsModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (ticketId: string, status: string, notes?: string) => void;
  onAssignTicket: (ticketId: string, assignedTo: string) => void;
  onAddReply: (ticketId: string, message: string, isInternal: boolean) => void;
  onEscalate: (ticketId: string, level: number) => void;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onStatusUpdate,
  onAssignTicket,
  onAddReply,
  onEscalate,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [escalationLevel, setEscalationLevel] = useState(1);

  // Fetch available agents for assignment
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => usersApi.getUsers({ role: 'admin', limit: 100 }),
    enabled: isOpen,
  });

  if (!ticket) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'waiting_customer': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    onStatusUpdate(ticket._id, selectedStatus, statusNotes);
    setStatusUpdateOpen(false);
    setSelectedStatus('');
    setStatusNotes('');
  };

  const handleAssignment = () => {
    if (!selectedAssignee) {
      toast.error('Please select an assignee');
      return;
    }
    onAssignTicket(ticket._id, selectedAssignee);
    setAssignmentOpen(false);
    setSelectedAssignee('');
  };

  const handleEscalation = () => {
    onEscalate(ticket._id, escalationLevel);
    setEscalationOpen(false);
    setEscalationLevel(1);
  };

  const handleAddReply = () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    onAddReply(ticket._id, replyMessage, isInternalReply);
    setReplyMessage('');
    setIsInternalReply(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(ticket.source)}
                  <span className="text-xl font-semibold">{ticket.formattedTicketNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  {ticket.isOverdue && (
                    <Badge variant="destructive">
                      <Clock className="mr-1 h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                  {ticket.escalationLevel > 1 && (
                    <Badge variant="secondary">
                      <Flag className="mr-1 h-3 w-3" />
                      Level {ticket.escalationLevel}
                    </Badge>
                  )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignmentOpen(true)}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEscalationOpen(true)}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Escalate
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-4 text-sm">
                <span>Created: {formatDate(ticket.createdAt)}</span>
                <span>•</span>
                <span>Age: {ticket.ageInDays} days</span>
                {ticket.assignedTo && (
                  <>
                    <span>•</span>
                    <span>Assigned to: {typeof ticket.assignedTo === 'object' ? 
                      `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 
                      'Unknown'}</span>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="messages">
                Messages ({ticket.messages.length})
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Ticket Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.subject}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {ticket.type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {ticket.category.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {ticket.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ticket.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Customer Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {ticket.customerInfo.firstName} {ticket.customerInfo.lastName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{ticket.customerInfo.email}</span>
                    </div>
                    {ticket.customerInfo.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{ticket.customerInfo.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Customer since: {formatDate(ticket.customer.createdAt || '')}</span>
                    </div>
                  </div>
                </Card>

                {/* Technical Details */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Monitor className="mr-2 h-5 w-5" />
                    Technical Details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Source</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {getSourceIcon(ticket.source)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {ticket.source}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Device</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {ticket.deviceType}
                        </p>
                      </div>
                    </div>
                    {ticket.ipAddress && (
                      <div>
                        <Label className="text-sm font-medium">IP Address</Label>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.ipAddress}</p>
                      </div>
                    )}
                    {ticket.location && (
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {ticket.location.city}, {ticket.location.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* SLA and Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Timer className="mr-2 h-5 w-5" />
                    SLA & Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Age</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.ageInDays} days ({ticket.ageInHours} hours)
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Escalation Level</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Flag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Level {ticket.escalationLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                    {ticket.sla.targetResolutionTime && (
                      <div>
                        <Label className="text-sm font-medium">Target Resolution</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(ticket.sla.targetResolutionTime)}
                        </p>
                      </div>
                    )}
                    {ticket.sla.isOverdue && (
                      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">SLA Breach</p>
                          <p className="text-sm text-red-700">
                            Overdue by {ticket.sla.overdueHours} hours
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Related Items */}
              {(ticket.relatedOrder || ticket.relatedProduct) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Related Items
                  </h3>
                  <div className="space-y-3">
                    {ticket.relatedOrder && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Related Order</p>
                            <p className="text-sm text-muted-foreground">
                              {typeof ticket.relatedOrder === 'object' ? 
                                ticket.relatedOrder.orderNumber : 
                                ticket.relatedOrder}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Order
                        </Button>
                      </div>
                    )}
                    {ticket.relatedProduct && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Related Product</p>
                            <p className="text-sm text-muted-foreground">
                              {typeof ticket.relatedProduct === 'object' ? 
                                ticket.relatedProduct.name : 
                                ticket.relatedProduct}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Product
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conversation</h3>
                <Badge variant="outline">{ticket.messages.length} messages</Badge>
              </div>
              
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticket.messages.length > 0 ? (
                  ticket.messages.map((message, index) => (
                    <Card key={index} className={`p-4 ${
                      message.senderType === 'admin' ? 'ml-8' : 'mr-8'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.senderType === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {message.senderType === 'admin' ? (
                              <UserCheck className="h-4 w-4 text-blue-600" />
                            ) : message.senderType === 'customer' ? (
                              <UserIcon className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Settings className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {typeof message.sender === 'object' ? 
                                `${message.sender.firstName} ${message.sender.lastName}` : 
                                'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(message.sentAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {message.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {message.senderType}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, attIndex) => (
                              <div key={attIndex} className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment.originalName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground">
                      Start the conversation by adding a reply below.
                    </p>
                  </Card>
                )}
              </div>

              {/* Add Reply */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internalReply"
                      checked={isInternalReply}
                      onCheckedChange={setIsInternalReply}
                    />
                    <Label htmlFor="internalReply" className="text-sm">
                      Internal Note (not visible to customer)
                    </Label>
                  </div>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach File
                    </Button>
                    <Button onClick={handleAddReply}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="text-lg font-semibold">Status History</h3>
              {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {ticket.statusHistory.map((history, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{history.status}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(history.timestamp)}
                            </span>
                          </div>
                          {history.note && (
                            <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                          )}
                          {history.updatedBy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated by: {typeof history.updatedBy === 'object' ? 
                                `${history.updatedBy.firstName} ${history.updatedBy.lastName}` : 
                                'Unknown'}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No History Available</h3>
                  <p className="text-muted-foreground">
                    Status changes will appear here.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Profile</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {ticket.customerInfo.firstName} {ticket.customerInfo.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{ticket.customerInfo.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Previous Tickets</Label>
                      <p className="text-2xl font-bold text-primary">0</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Customer Since</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(ticket.customer.createdAt || '')}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Full Customer Profile
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Customer Notes</h3>
                  {ticket.notes ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ticket.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No customer notes available.
                    </p>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
                  {ticket.internalNotes ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ticket.internalNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No internal
