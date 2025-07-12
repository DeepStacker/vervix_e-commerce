'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Award,
  Clock,
} from 'lucide-react';

// Types
export interface StatCardData {
  id: string;
  title: string;
  value: string | number;
  formattedValue?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  changePeriod?: string;
  previousValue?: string | number;
  target?: number;
  targetLabel?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'default' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  trend?: Array<{ period: string; value: number }>;
  subtitle?: string;
  description?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  showProgress?: boolean;
  progressValue?: number;
  progressMax?: number;
  badges?: Array<{ label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>;
  actions?: Array<{ label: string; onClick: () => void; icon?: React.ReactNode }>;
  clickable?: boolean;
  onClick?: () => void;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: Date;
  refreshable?: boolean;
  onRefresh?: () => void;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  valueClassName?: string;
  changeClassName?: string;
}

export interface StatsCardsProps {
  cards: StatCardData[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  cardClassName?: string;
  columns?: number;
  responsive?: boolean;
  showLastUpdated?: boolean;
  refreshInterval?: number;
  onCardClick?: (card: StatCardData) => void;
  onRefresh?: (cardId?: string) => void;
  emptyMessage?: string;
  loadingCards?: number;
}

// Helper functions
const formatValue = (
  value: string | number,
  options: {
    prefix?: string;
    suffix?: string;
    unit?: string;
    precision?: number;
    formattedValue?: string;
  } = {}
): string => {
  if (options.formattedValue) {
    return options.formattedValue;
  }

  if (typeof value === 'string') {
    return value;
  }

  let formatted = value.toString();

  // Apply precision
  if (options.precision !== undefined && typeof value === 'number') {
    formatted = value.toFixed(options.precision);
  }

  // Format large numbers
  if (typeof value === 'number' && value >= 1000) {
    if (value >= 1000000) {
      formatted = (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      formatted = (value / 1000).toFixed(1) + 'K';
    }
  }

  // Add prefix and suffix
  if (options.prefix) {
    formatted = options.prefix + formatted;
  }
  if (options.suffix) {
    formatted = formatted + options.suffix;
  }
  if (options.unit) {
    formatted = formatted + ' ' + options.unit;
  }

  return formatted;
};

const formatChange = (change: number, changePeriod?: string): string => {
  const sign = change > 0 ? '+' : '';
  const formatted = `${sign}${change.toFixed(1)}%`;
  return changePeriod ? `${formatted} ${changePeriod}` : formatted;
};

const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
  switch (changeType) {
    case 'increase':
      return 'text-green-600 dark:text-green-400';
    case 'decrease':
      return 'text-red-600 dark:text-red-400';
    case 'neutral':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
  switch (changeType) {
    case 'increase':
      return <TrendingUp className="h-4 w-4" />;
    case 'decrease':
      return <TrendingDown className="h-4 w-4" />;
    case 'neutral':
      return <Minus className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
};

const getCardColor = (color: StatCardData['color']) => {
  switch (color) {
    case 'success':
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
    case 'error':
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    case 'info':
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    default:
      return '';
  }
};

const getCardSize = (size: StatCardData['size']) => {
  switch (size) {
    case 'sm':
      return 'p-4';
    case 'lg':
      return 'p-8';
    default:
      return 'p-6';
  }
};

// Loading skeleton component
const StatCardSkeleton: React.FC<{ size?: StatCardData['size'] }> = ({ size = 'md' }) => {
  return (
    <Card className={cn('animate-pulse', getCardSize(size))}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </Card>
  );
};

// Individual stat card component
const StatCard: React.FC<{
  card: StatCardData;
  onClick?: (card: StatCardData) => void;
  onRefresh?: (cardId: string) => void;
  showLastUpdated?: boolean;
}> = ({ card, onClick, onRefresh, showLastUpdated = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!card.onRefresh && !onRefresh) return;
    
    setIsRefreshing(true);
    try {
      if (card.onRefresh) {
        await card.onRefresh();
      } else if (onRefresh) {
        await onRefresh(card.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClick = () => {
    if (card.clickable && (card.onClick || onClick)) {
      if (card.onClick) {
        card.onClick();
      } else if (onClick) {
        onClick(card);
      }
    }
  };

  if (card.loading) {
    return <StatCardSkeleton size={card.size} />;
  }

  if (card.error) {
    return (
      <Card className={cn('border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950', getCardSize(card.size), card.className)}>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading {card.title}</p>
            <p className="text-sm">{card.error}</p>
          </div>
        </div>
        {(card.refreshable || card.onRefresh) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-3"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Retry
          </Button>
        )}
      </Card>
    );
  }

  const cardContent = (
    <Card
      className={cn(
        'transition-all duration-200',
        getCardSize(card.size),
        getCardColor(card.color),
        card.clickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        card.variant === 'outline' && 'border-2',
        card.variant === 'gradient' && 'bg-gradient-to-br from-background to-muted',
        card.className
      )}
      onClick={handleClick}
    >
      <div className={cn('space-y-4', card.contentClassName)}>
        {/* Header */}
        <div className={cn('flex items-center justify-between', card.headerClassName)}>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
            {card.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{card.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {card.icon && <div className="text-muted-foreground">{card.icon}</div>}
            {(card.actions?.length || card.refreshable || card.onRefresh) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {card.actions?.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={action.onClick}>
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {(card.refreshable || card.onRefresh) && (
                    <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                      <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                      Refresh
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={cn('space-y-2', card.valueClassName)}>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">
              {formatValue(card.value, {
                prefix: card.prefix,
                suffix: card.suffix,
                unit: card.unit,
                precision: card.precision,
                formattedValue: card.formattedValue,
              })}
            </span>
            {card.subtitle && (
              <span className="text-sm text-muted-foreground">{card.subtitle}</span>
            )}
          </div>

          {/* Change indicator */}
          {card.change !== undefined && card.changeType && (
            <div className={cn('flex items-center space-x-1', getChangeColor(card.changeType), card.changeClassName)}>
              {getChangeIcon(card.changeType)}
              <span className="text-sm font-medium">
                {formatChange(card.change, card.changePeriod)}
              </span>
            </div>
          )}

          {/* Target progress */}
          {card.target && card.showProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress to {card.targetLabel || 'target'}</span>
                <span>{((Number(card.value) / card.target) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((Number(card.value) / card.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress bar (general) */}
          {card.showProgress && card.progressValue !== undefined && card.progressMax && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{((card.progressValue / card.progressMax) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((card.progressValue / card.progressMax) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        {card.badges && card.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || 'secondary'} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        {showLastUpdated && card.lastUpdated && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated {card.lastUpdated.toLocaleTimeString()}</span>
            </div>
            {card.clickable && (
              <div className="flex items-center space-x-1">
                <span>View details</span>
                <ArrowUpRight className="h-3 w-3" />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return cardContent;
};

// Main stats cards component
export const StatsCards: React.FC<StatsCardsProps> = ({
  cards,
  loading = false,
  error = null,
  className,
  cardClassName,
  columns = 4,
  responsive = true,
  showLastUpdated = false,
  refreshInterval,
  onCardClick,
  onRefresh,
  emptyMessage = 'No statistics available',
  loadingCards = 4,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
        setRefreshKey(prev => prev + 1);
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  // Grid columns responsive classes
  const getGridCols = () => {
    if (!responsive) {
      return `grid-cols-${columns}`;
    }
    
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  // Handle global error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading statistics</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh()}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </Card>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className={cn('grid gap-6', getGridCols(), className)}>
        {Array.from({ length: loadingCards }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Handle empty state
  if (!cards || cards.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Statistics</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh()}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Load Statistics
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('grid gap-6', getGridCols(), className)} key={refreshKey}>
      {cards.map((card) => (
        <StatCard
          key={card.id}
          card={{ ...card, className: cn(cardClassName, card.className) }}
          onClick={onCardClick}
          onRefresh={onRefresh}
          showLastUpdated={showLastUpdated}
        />
      ))}
    </div>
  );
};

// Export default
export default StatsCards;

// Export individual components for advanced usage
export { StatCard, StatCardSkeleton };

// Export utility functions
export { formatValue, formatChange, getChangeColor, getChangeIcon };
