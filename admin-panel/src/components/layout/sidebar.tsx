'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  User,
  LogOut,
  Moon,
  Sun,
  Bell,
  Archive,
  Tag,
  Truck,
  CreditCard,
  MessageSquare,
  FileText,
  Shield,
  Database,
  Palette,
  Mail,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

// Types
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: MenuItem[];
  badge?: {
    count: number;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  disabled?: boolean;
}

interface SidebarProps {
  className?: string;
}

// Navigation menu items
const navigationItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    children: [
      {
        id: 'products-list',
        label: 'All Products',
        icon: Package,
        href: '/admin/products',
      },
      {
        id: 'products-add',
        label: 'Add Product',
        icon: Package,
        href: '/admin/products/add',
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: Tag,
        href: '/admin/products/categories',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: Archive,
        href: '/admin/products/inventory',
        badge: { count: 5, variant: 'destructive' },
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    children: [
      {
        id: 'orders-list',
        label: 'All Orders',
        icon: ShoppingCart,
        href: '/admin/orders',
        badge: { count: 12, variant: 'default' },
      },
      {
        id: 'orders-pending',
        label: 'Pending Orders',
        icon: ShoppingCart,
        href: '/admin/orders/pending',
        badge: { count: 3, variant: 'destructive' },
      },
      {
        id: 'shipping',
        label: 'Shipping',
        icon: Truck,
        href: '/admin/orders/shipping',
      },
      {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
        href: '/admin/orders/payments',
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    children: [
      {
        id: 'customers-list',
        label: 'All Customers',
        icon: Users,
        href: '/admin/customers',
      },
      {
        id: 'customer-groups',
        label: 'Customer Groups',
        icon: Users,
        href: '/admin/customers/groups',
      },
      {
        id: 'support',
        label: 'Support Tickets',
        icon: MessageSquare,
        href: '/admin/customers/support',
        badge: { count: 8, variant: 'secondary' },
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        icon: BarChart3,
        href: '/admin/analytics',
      },
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        icon: FileText,
        href: '/admin/analytics/sales',
      },
      {
        id: 'product-analytics',
        label: 'Product Analytics',
        icon: Package,
        href: '/admin/analytics/products',
      },
      {
        id: 'customer-analytics',
        label: 'Customer Analytics',
        icon: Users,
        href: '/admin/analytics/customers',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      {
        id: 'general-settings',
        label: 'General',
        icon: Settings,
        href: '/admin/settings/general',
      },
      {
        id: 'appearance',
        label: 'Appearance',
        icon: Palette,
        href: '/admin/settings/appearance',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/admin/settings/notifications',
      },
      {
        id: 'email-settings',
        label: 'Email Settings',
        icon: Mail,
        href: '/admin/settings/email',
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: Zap,
        href: '/admin/settings/integrations',
      },
      {
        id: 'security',
        label: 'Security',
        icon: Shield,
        href: '/admin/settings/security',
      },
      {
        id: 'backup',
        label: 'Backup & Export',
        icon: Database,
        href: '/admin/settings/backup',
      },
    ],
  },
];

// Navigation Item Component
const NavigationItem: React.FC<{
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  level: number;
}> = ({ item, isActive, isExpanded, onToggle, level }) => {
  const pathname = usePathname();

  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children.some(child => 
    child.href === pathname || (child.children && child.children.some(subChild => subChild.href === pathname))
  );

  const itemContent = (
    <div
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
        level > 0 && 'ml-4 pl-8',
        isActive || isChildActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        item.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center space-x-3">
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.badge && (
          <Badge variant={item.badge.variant || 'default'} className="ml-auto text-xs">
            {item.badge.count}
          </Badge>
        )}
      </div>
      {hasChildren && (
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  );

  if (hasChildren) {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start p-0 h-auto"
            disabled={item.disabled}
          >
            {itemContent}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isActive={pathname === child.href}
              isExpanded={false}
              onToggle={() => {}}
              level={level + 1}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        <Button
          variant="ghost"
          className="w-full justify-start p-0 h-auto"
          disabled={item.disabled}
        >
          {itemContent}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start p-0 h-auto"
      onClick={onToggle}
      disabled={item.disabled}
    >
      {itemContent}
    </Button>
  );
};

// User Profile Section
const UserProfile: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
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

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full p-2 h-auto">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
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
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full p-3 h-auto justify-start">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {user?.email}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
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
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main Sidebar Component
const SidebarContent: React.FC<{ collapsed: boolean; onToggleCollapse: () => void }> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Auto-expand parent items when child is active
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    
    navigationItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.href === pathname);
        if (hasActiveChild) {
          newExpandedItems[item.id] = true;
        }
      }
    });

    setExpandedItems(prev => ({ ...prev, ...newExpandedItems }));
  }, [pathname]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Vervix Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={pathname === item.href}
              isExpanded={expandedItems[item.id] || false}
              onToggle={() => toggleExpanded(item.id)}
              level={0}
            />
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="border-t p-4">
        <UserProfile collapsed={collapsed} />
      </div>
    </div>
  );
};

// Desktop Sidebar
const DesktopSidebar: React.FC<{ collapsed: boolean; onToggleCollapse: () => void }> = ({
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={cn(
        'hidden md:flex flex-col bg-background border-r transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </div>
  );
};

// Mobile Sidebar
const MobileSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent
          collapsed={false}
          onToggleCollapse={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

// Main Sidebar Export
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Desktop Sidebar */}
      <DesktopSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
    </>
  );
};

export default Sidebar;
