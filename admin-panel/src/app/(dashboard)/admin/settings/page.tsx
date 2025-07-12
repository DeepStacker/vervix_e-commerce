'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Server,
  Mail,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Check,
  X,
  AlertTriangle,
  Info,
  HelpCircle,
  Lock,
  Key,
  Database,
  Zap,
  Clock,
  Users,
  ShoppingCart,
  Package,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Paintbrush,
  Type,
  Layout,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Activity,
  BarChart3,
  Target,
  Flag,
  Calendar,
  Search,
  Filter,
  SortAsc,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// Validation schemas
const generalSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().min(1, 'Site description is required'),
  siteUrl: z.string().url('Please enter a valid URL'),
  adminEmail: z.string().email('Please enter a valid email'),
  supportEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
  language: z.string().min(1, 'Language is required'),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
});

const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().min(1, 'Primary color is required'),
  secondaryColor: z.string().min(1, 'Secondary color is required'),
  accentColor: z.string().min(1, 'Accent color is required'),
  fontFamily: z.string().min(1, 'Font family is required'),
  fontSize: z.enum(['small', 'medium', 'large']),
  borderRadius: z.enum(['none', 'small', 'medium', 'large']),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  customCss: z.string().optional(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  orderNotifications: z.boolean(),
  stockNotifications: z.boolean(),
  userNotifications: z.boolean(),
  systemNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  newsletterEmails: z.boolean(),
  emailFrequency: z.enum(['immediately', 'hourly', 'daily', 'weekly']),
  notificationSound: z.boolean(),
  desktopNotifications: z.boolean(),
});

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  passwordMinLength: z.number().min(6).max(128),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSymbols: z.boolean(),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  loginAttempts: z.number().min(3).max(10),
  lockoutDuration: z.number().min(5).max(60),
  ipWhitelist: z.string().optional(),
  sslRequired: z.boolean(),
  csrfProtection: z.boolean(),
  apiRateLimit: z.number().min(10).max(10000),
  encryptionEnabled: z.boolean(),
});

const systemSettingsSchema = z.object({
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  backupRetention: z.number().min(1).max(365),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  logRetention: z.number().min(1).max(90),
  cacheEnabled: z.boolean(),
  cacheDuration: z.number().min(300).max(86400),
  compressionEnabled: z.boolean(),
  cdnEnabled: z.boolean(),
  cdnUrl: z.string().optional(),
  analyticsEnabled: z.boolean(),
  analyticsProvider: z.enum(['google', 'mixpanel', 'segment']).optional(),
  analyticsId: z.string().optional(),
  debugMode: z.boolean(),
  performanceMonitoring: z.boolean(),
  errorReporting: z.boolean(),
  autoUpdates: z.boolean(),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;
type SystemSettings = z.infer<typeof systemSettingsSchema>;

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Theme Preview Component
interface ThemePreviewProps {
  settings: AppearanceSettings;
  onSettingsChange: (settings: Partial<AppearanceSettings>) => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ settings, onSettingsChange }) => {
  const previewStyle = {
    backgroundColor: settings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
    color: settings.theme === 'dark' ? '#ffffff' : '#1a1a1a',
    borderRadius: settings.borderRadius === 'none' ? '0px' : 
                  settings.borderRadius === 'small' ? '4px' : 
                  settings.borderRadius === 'medium' ? '8px' : '12px',
    fontSize: settings.fontSize === 'small' ? '14px' : 
             settings.fontSize === 'medium' ? '16px' : '18px',
    fontFamily: settings.fontFamily,
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Preview</h4>
      <div 
        className="p-4 border rounded transition-all duration-200"
        style={previewStyle}
      >
        <div className="space-y-3">
          <div 
            className="px-3 py-2 text-white rounded text-sm font-medium"
            style={{ backgroundColor: settings.primaryColor }}
          >
            Primary Color
          </div>
          <div 
            className="px-3 py-2 text-white rounded text-sm font-medium"
            style={{ backgroundColor: settings.secondaryColor }}
          >
            Secondary Color
          </div>
          <div 
            className="px-3 py-2 text-white rounded text-sm font-medium"
            style={{ backgroundColor: settings.accentColor }}
          >
            Accent Color
          </div>
          <p className="text-sm">
            This is how your theme will look with the current settings. 
            Font: {settings.fontFamily}, Size: {settings.fontSize}, 
            Radius: {settings.borderRadius}
          </p>
        </div>
      </div>
    </Card>
  );
};

// Settings Form Components
interface SettingsFormProps<T> {
  settings: T;
  onSettingsChange: (settings: T) => void;
  onSave: () => void;
  isLoading: boolean;
  title: string;
  children: React.ReactNode;
}

const SettingsForm = <T,>({ 
  settings, 
  onSettingsChange, 
  onSave, 
  isLoading, 
  title, 
  children 
}: SettingsFormProps<T>) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      {children}
    </Card>
  );
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Vervix E-commerce',
    siteDescription: 'Modern e-commerce platform',
    siteUrl: 'https://vervix.com',
    adminEmail: 'admin@vervix.com',
    supportEmail: 'support@vervix.com',
    contactPhone: '+1 (555) 123-4567',
    address: '123 Business St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back later.',
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    accentColor: '#10b981',
    fontFamily: 'Inter',
    fontSize: 'medium',
    borderRadius: 'medium',
    logoUrl: '',
    faviconUrl: '',
    heroImageUrl: '',
    customCss: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    stockNotifications: true,
    userNotifications: true,
    systemNotifications: true,
    marketingEmails: false,
    newsletterEmails: false,
    emailFrequency: 'immediately',
    notificationSound: true,
    desktopNotifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordMinLength: 8,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    loginAttempts: 5,
    lockoutDuration: 15,
    ipWhitelist: '',
    sslRequired: true,
    csrfProtection: true,
    apiRateLimit: 1000,
    encryptionEnabled: true,
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    backupFrequency: 'daily',
    backupRetention: 30,
    logLevel: 'info',
    logRetention: 7,
    cacheEnabled: true,
    cacheDuration: 3600,
    compressionEnabled: true,
    cdnEnabled: false,
    cdnUrl: '',
    analyticsEnabled: true,
    analyticsProvider: 'google',
    analyticsId: '',
    debugMode: false,
    performanceMonitoring: true,
    errorReporting: true,
    autoUpdates: false,
  });

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => Promise.all([
      adminApi.get('/admin/settings/general'),
      adminApi.get('/admin/settings/appearance'),
      adminApi.get('/admin/settings/notifications'),
      adminApi.get('/admin/settings/security'),
      adminApi.get('/admin/settings/system'),
    ]),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update settings mutations
  const updateGeneralMutation = useMutation({
    mutationFn: (settings: GeneralSettings) => 
      adminApi.put('/admin/settings/general', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('General settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update general settings');
    },
  });

  const updateAppearanceMutation = useMutation({
    mutationFn: (settings: AppearanceSettings) => 
      adminApi.put('/admin/settings/appearance', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Appearance settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update appearance settings');
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: (settings: NotificationSettings) => 
      adminApi.put('/admin/settings/notifications', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Notification settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notification settings');
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (settings: SecuritySettings) => 
      adminApi.put('/admin/settings/security', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Security settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update security settings');
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: (settings: SystemSettings) => 
      adminApi.put('/admin/settings/system', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('System settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update system settings');
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      adminApi.put('/admin/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordChangeOpen(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  // System maintenance mutations
  const createBackupMutation = useMutation({
    mutationFn: () => adminApi.post('/admin/backup'),
    onSuccess: () => {
      toast.success('Backup created successfully');
      setBackupDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create backup');
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => adminApi.delete('/admin/cache'),
    onSuccess: () => {
      toast.success('Cache cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear cache');
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load settings data
  useEffect(() => {
    if (settingsData) {
      const [general, appearance, notifications, security, system] = settingsData;
      if (general?.data?.settings) {
        setGeneralSettings(prev => ({ ...prev, ...general.data.settings }));
      }
      if (appearance?.data?.settings) {
        setAppearanceSettings(prev => ({ ...prev, ...appearance.data.settings }));
      }
      if (notifications?.data?.settings) {
        setNotificationSettings(prev => ({ ...prev, ...notifications.data.settings }));
      }
      if (security?.data?.settings) {
        setSecuritySettings(prev => ({ ...prev, ...security.data.settings }));
      }
      if (system?.data?.settings) {
        setSystemSettings(prev => ({ ...prev, ...system.data.settings }));
      }
    }
  }, [settingsData]);

  // Save handlers
  const handleSaveGeneral = async () => {
    try {
      await generalSettingsSchema.parseAsync(generalSettings);
      updateGeneralMutation.mutate(generalSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await appearanceSettingsSchema.parseAsync(appearanceSettings);
      updateAppearanceMutation.mutate(appearanceSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await notificationSettingsSchema.parseAsync(notificationSettings);
      updateNotificationMutation.mutate(notificationSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSaveSecurity = async () => {
    try {
      await securitySettingsSchema.parseAsync(securitySettings);
      updateSecurityMutation.mutate(securitySettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSaveSystem = async () => {
    try {
      await systemSettingsSchema.parseAsync(systemSettings);
      updateSystemMutation.mutate(systemSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handlePasswordChange = (data: PasswordChangeFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleClearCache = () => {
    clearCacheMutation.mutate();
  };

  const handleResetSettings = () => {
    setResetDialogOpen(false);
    // Reset to defaults
    setGeneralSettings({
      siteName: 'Vervix E-commerce',
      siteDescription: 'Modern e-commerce platform',
      siteUrl: 'https://vervix.com',
      adminEmail: 'admin@vervix.com',
      supportEmail: 'support@vervix.com',
      contactPhone: '+1 (555) 123-4567',
      address: '123 Business St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      maintenanceMode: false,
      maintenanceMessage: 'We are currently performing maintenance. Please check back later.',
    });
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasswordChangeOpen(true)}
          >
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBackupDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Create Backup
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>System Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleClearCache}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Cache
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Export feature coming soon')}>
                <Download className="mr-2 h-4 w-4" />
                Export Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Import feature coming soon')}>
                <Upload className="mr-2 h-4 w-4" />
                Import Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setResetDialogOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset to Defaults
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <SettingsForm
            settings={generalSettings}
            onSettingsChange={setGeneralSettings}
            onSave={handleSaveGeneral}
            isLoading={updateGeneralMutation.isPending}
            title="General Settings"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    value={generalSettings.siteUrl}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Business St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={generalSettings.city}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={generalSettings.state}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={generalSettings.zipCode}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
