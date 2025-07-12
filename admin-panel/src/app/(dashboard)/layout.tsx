'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useLoading } from '@/app/layout';
import { cn } from '@/lib/utils';

// Types
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Error Boundary for dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Dashboard Error
            </h1>
            <p className="text-muted-foreground mb-6">
              Something went wrong with the dashboard. Please try refreshing the page.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const DashboardLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

// Auth guard component
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, checkAdminRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Store the attempted URL for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/admin/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user has admin role
    if (!checkAdminRole()) {
      router.push('/admin/login?error=insufficient_permissions');
      return;
    }
  }, [isAuthenticated, user, isLoading, mounted, router, pathname, checkAdminRole]);

  // Show loading while checking authentication
  if (!mounted || isLoading) {
    return <DashboardLoading />;
  }

  // Show loading if not authenticated (will redirect)
  if (!isAuthenticated || !user || !checkAdminRole()) {
    return <DashboardLoading />;
  }

  return <>{children}</>;
};

// Main dashboard layout component
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isLoading } = useLoading();

  // Handle sidebar toggle for mobile
  const handleMobileMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle sidebar collapse for desktop
  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Close mobile sidebar when clicking outside
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  // Responsive sidebar management
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AuthGuard>
      <DashboardErrorBoundary>
        <div className="min-h-screen bg-background">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={handleOverlayClick}
            />
          )}

          {/* Desktop sidebar */}
          <div
            className={cn(
              'fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-all duration-300 lg:translate-x-0',
              sidebarCollapsed ? 'w-16' : 'w-64',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            <Sidebar
              className="h-full"
              collapsed={sidebarCollapsed}
              onCollapse={handleSidebarCollapse}
              onMobileClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main content area */}
          <div
            className={cn(
              'transition-all duration-300',
              sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            )}
          >
            {/* Header */}
            <Header
              className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
              onMobileMenuToggle={handleMobileMenuToggle}
            />

            {/* Page content */}
            <main className="p-6 space-y-6">
              {/* Loading overlay */}
              {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              )}

              {/* Page content */}
              <div className="w-full max-w-none">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DashboardErrorBoundary>
    </AuthGuard>
  );
};

export default DashboardLayout;
