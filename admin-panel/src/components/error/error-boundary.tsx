'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Log to error reporting service (e.g., Sentry, LogRocket)
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementation for external error logging service
    console.warn('Error logging service not implemented:', { error, errorInfo });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/admin';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <h4 className="font-semibold text-destructive mb-2">Error Details:</h4>
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-destructive/80">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium text-destructive">
                        Component Stack
                      </summary>
                      <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap text-destructive/70">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="text-center text-muted-foreground">
                <p>
                  If this problem persists, please contact our support team with the error details above.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
