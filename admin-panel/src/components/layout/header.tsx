'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  Home,
  ChevronRight,
  Plus,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  X,
} from 'lucide-react';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  href?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  description?: string;
}

interface HeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Order Received',
    message: 'Order #12345 has been placed by John Doe',
    type: 'info',
    timestamp: '2 minutes ago',
    read: false,
    href: '/admin/orders/12345',
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    message: 'Product "Nike Air Max" is running low on stock (5 items left)',
    type: 'warning',
    timestamp: '10 minutes ago',
    read: false,
    href: '/admin/products/inventory',
  },
  {
    id: '3',
    title: 'Payment Failed',
    message: 'Payment for order #12344 has failed',
    type: 'error',
    timestamp: '1 hour ago',
    read: true,
    href: '/admin/orders/12344',
  },
  {
    id: '4',
    title: 'New Customer Registration',
    message: 'Jane Smith has registered as a new customer',
    type: 'success',
    timestamp: '2 hours ago',
    read: true,
    href: '/admin/customers',
  },
  {
    id: '5',
    title: 'Support Ticket',
    message: 'New support ticket #ST-001 has been created',
    type: 'info',
    timestamp: '3 hours ago',
    read: true,
    href: '/admin/customers/support',
  },
];

// Quick actions
const quickActions: QuickAction[] = [
  {
    id: 'add-product',
    label: 'Add Product',
    icon: Package,
    href: '/admin/products/add',
    description: 'Create a new product',
  },
  {
    id: 'new-order',
    label: 'New Order',
    icon: ShoppingCart,
    href: '/admin/orders/add',
    description: 'Create a new order',
  },
  {
    id: 'add-customer',
    label: 'Add Customer',
    icon: Users,
    href: '/admin/customers/add',
    description: 'Add a new customer',
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    description: 'View sales analytics',
  },
];

// Breadcrumb generation
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/admin' },
  ];

  if (segments.length <= 1) {
    breadcrumbs[0].current = true;
    return breadcrumbs;
  }

  let currentPath = '';
  for (let i = 1; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const segment = segments[i];
    
    // Format segment label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Handle special cases
    if (segment === 'add') label = 'Add New';
    if (segment === 'edit') label = 'Edit';
    if (segment.length === 24 && /^[0-9a-fA-F]+$/.test(segment)) {
      label = `#${segment.slice(-8)}`;
    }

    const isLast = i === segments.length - 1;
    breadcrumbs.push({
      label,
      href: isLast ? undefined : `/admin${currentPath}`,
      current: isLast,
    });
  }

  return breadcrumbs;
};

// Breadcrumb component
const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Home className="h-4 w-4" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.current ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link
              href={item.href || '#'}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Search component
const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products, orders, customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-64 pl-10 pr-4"
        />
      </form>
      {isOpen && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSearch}
            >
              <Search className="mr-2 h-4 w-4" />
              Search for "{searchQuery}"
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Notifications dropdown
const NotificationsDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start space-x-3 p-3 cursor-pointer',
                  !notification.read && 'bg-muted/50'
                )}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.href) {
                    window.location.href = notification.href;
                  }
                }}
              >
                <span className="text-base">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.timestamp}
                  </p>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary">
              <Link href="/admin/notifications" className="w-full">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Quick actions dropdown
const QuickActionsDropdown: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickActions.map((action) => (
          <DropdownMenuItem key={action.id} asChild>
            <Link href={action.href} className="flex items-center">
              <action.icon className="mr-2 h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                )}
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// User profile dropdown
const UserProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile">
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === 'light' ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Theme toggle button
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

// Mobile menu
const MobileMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open mobile menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Vervix Admin</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
            <Button variant="ghost" className="w-full justify-start">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Phone className="mr-2 h-4 w-4" />
              Call Support
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Main Header component
export const Header: React.FC<HeaderProps> = ({ className, onMobileMenuToggle }) => {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <MobileMenu />
          <div className="hidden md:block">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>

        {/* Center section - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle for desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {/* Quick actions */}
          <div className="hidden lg:block">
            <QuickActionsDropdown />
          </div>
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          {/* User profile */}
          <UserProfileDropdown />
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden border-t px-4 py-2">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
