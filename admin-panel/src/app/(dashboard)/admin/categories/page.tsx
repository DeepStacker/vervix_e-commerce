'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/types';
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
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Tag,
  Package,
  ArrowUp,
  ArrowDown,
  Star,
  Settings,
  Image as ImageIcon,
  Palette,
  Link,
  Hash,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Move,
  GripVertical,
  Users,
  Globe,
  Zap,
  Target,
  Crown,
  ShoppingBag,
  X,
} from 'lucide-react';

interface CategoryFormData {
  name: string;
  description: string;
  parent: string;
  color: string;
  icon: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface CategoryTreeItemProps {
  category: Category;
  level: number;
  expandedItems: Set<string>;
  selectedItems: string[];
  onToggleExpand: (categoryId: string) => void;
  onSelectItem: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onMoveUp: (category: Category) => void;
  onMoveDown: (category: Category) => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  level,
  expandedItems,
  selectedItems,
  onToggleExpand,
  onSelectItem,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
}) => {
  const isExpanded = expandedItems.has(category._id);
  const isSelected = selectedItems.includes(category._id);
  const hasChildren = category.children && category.children.length > 0;

  const paddingLeft = level * 20 + 8;

  return (
    <div className="border-b border-border/50">
      <div 
        className={`flex items-center py-3 px-2 hover:bg-muted/50 ${
          isSelected ? 'bg-muted' : ''
        }`}
        style={{ paddingLeft }}
      >
        <div className="flex items-center space-x-2 flex-1">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={() => onToggleExpand(category._id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectItem(category._id)}
          />

          {/* Category Icon */}
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Tag 
                className="h-4 w-4" 
                style={{ color: category.color }}
              />
            )}
            
            {category.icon && (
              <span className="text-sm">{category.icon}</span>
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{category.name}</span>
              {category.isFeatured && (
                <Badge variant="secondary">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              {!category.isActive && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate max-w-md">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Category Stats */}
        <div className="flex items-center space-x-4 mr-4">
          <div className="text-center">
            <p className="text-sm font-medium">{category.productCount || 0}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          {hasChildren && (
            <div className="text-center">
              <p className="text-sm font-medium">{category.children?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Children</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium">{category.sortOrder}</p>
            <p className="text-xs text-muted-foreground">Order</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(category)}
            disabled={category.sortOrder === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(category)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditCategory(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(category)}>
                {category.isActive ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteCategory(category)}
                className="text-red-600"
                disabled={hasChildren || (category.productCount || 0) > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {category.children?.map((child) => (
            <CategoryTreeItem
              key={child._id}
              category={child}
              level={level + 1}
              expandedItems={expandedItems}
              selectedItems={selectedItems}
              onToggleExpand={onToggleExpand}
              onSelectItem={onSelectItem}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onToggleStatus={onToggleStatus}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  categories: Category[];
  onSubmit: (data: CategoryFormData) => void;
  isLoading: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  categories,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent: '',
    color: '#000000',
    icon: '',
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent: category.parent || '',
        color: category.color || '#000000',
        icon: category.icon || '',
        isActive: category.isActive ?? true,
        isFeatured: category.isFeatured ?? false,
        sortOrder: category.sortOrder || 0,
        seo: {
          title: category.seo?.title || '',
          description: category.seo?.description || '',
          keywords: category.seo?.keywords || [],
        },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parent: '',
        color: '#000000',
        icon: '',
        isActive: true,
        isFeatured: false,
        sortOrder: 0,
        seo: {
          title: '',
          description: '',
          keywords: [],
        },
      });
    }
    setKeywordInput('');
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    onSubmit(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.seo.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, keywordInput.trim()],
        },
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter(k => k !== keyword),
      },
    }));
  };

  // Filter out current category and its descendants from parent options
  const availableParents = categories.filter(cat => {
    if (category && cat._id === category._id) return false;
    if (category && cat.path && cat.path.includes(category._id)) return false;
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
          <DialogDescription>
            {category 
              ? 'Update the category information and settings.' 
              : 'Create a new category for organizing your products.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select 
                    value={formData.parent} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Parent (Root Category)</SelectItem>
                      {availableParents.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {'  '.repeat(cat.level)}{cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked as boolean }))}
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Category Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 p-1 border"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Emoji or Symbol)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🛍️ or any symbol"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="flex items-center space-x-2">
                  <Tag style={{ color: formData.color }} className="h-5 w-5" />
                  {formData.icon && <span className="text-lg">{formData.icon}</span>}
                  <span className="font-medium">{formData.name || 'Category Name'}</span>
                  {formData.isFeatured && (
                    <Badge variant="secondary">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seo.title}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seo: { ...prev.seo, title: e.target.value }
                  }))}
                  placeholder="SEO optimized title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seo.description}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seo: { ...prev.seo, description: e.target.value }
                  }))}
                  placeholder="SEO meta description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">SEO Keywords</Label>
                <div className="flex space-x-2">
                  <Input
                    id="keywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Enter keyword and press Add"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                  />
                  <Button type="button" onClick={addKeyword} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.seo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seo.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="cursor-pointer">
                        {keyword}
                        <X 
                          className="ml-1 h-3 w-3" 
                          onClick={() => removeKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories', { tree: true }],
    queryFn: () => categoriesApi.getCategories({ tree: true }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setIsFormModalOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => 
      categoriesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
      setIsFormModalOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
      setSelectedItems(prev => prev.filter(id => id !== id));
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const categories = categoriesData?.data || [];
  const flatCategories = flattenCategories(categories);

  // Utility function to flatten category tree
  function flattenCategories(categories: Category[]): Category[] {
    const flattened: Category[] = [];
    const flatten = (cats: Category[]) => {
      cats.forEach(cat => {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    flatten(categories);
    return flattened;
  }

  // Filter categories based on search and filters
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && category.isActive) ||
      (filterStatus === 'inactive' && !category.isActive);
    
    const matchesFeatured = filterFeatured === 'all' ||
      (filterFeatured === 'featured' && category.isFeatured) ||
      (filterFeatured === 'not_featured' && !category.isFeatured);

    return matchesSearch && matchesStatus && matchesFeatured;
  });

  // Toggle expand/collapse
  const handleToggleExpand = (categoryId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Expand all categories
  const handleExpandAll = () => {
    const allIds = new Set(flatCategories.map(cat => cat._id));
    setExpandedItems(allIds);
  };

  // Collapse all categories
  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  // Handle item selection
  const handleSelectItem = (categoryId: string) => {
    setSelectedItems(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(flatCategories.map(cat => cat._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle form submission
  const handleFormSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory._id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Handle category actions
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category._id);
    }
  };

  const handleToggleStatus = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category._id,
      data: { ...category, isActive: !category.isActive }
    });
  };

  const handleMoveUp = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category._id,
      data: { ...category, sortOrder: Math.max(0, category.sortOrder - 1) }
    });
  };

  const handleMoveDown = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category._id,
      data: { ...category, sortOrder: category.sortOrder + 1 }
    });
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select categories first');
      return;
    }

    switch (action) {
      case 'activate':
        selectedItems.forEach(id => {
          const category = flatCategories.find(cat => cat._id === id);
          if (category && !category.isActive) {
            updateCategoryMutation.mutate({
              id: category._id,
              data: { ...category, isActive: true }
            });
          }
        });
        break;
      case 'deactivate':
        selectedItems.forEach(id => {
          const category = flatCategories.find(cat => cat._id === id);
          if (category && category.isActive) {
            updateCategoryMutation.mutate({
              id: category._id,
              data: { ...category, isActive: false }
            });
          }
        });
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedItems.length} categories?`)) {
          selectedItems.forEach(id => {
            deleteCategoryMutation.mutate(id);
          });
        }
        break;
    }
  };

  // Get stats
  const totalCategories = flatCategories.length;
  const activeCategories = flatCategories.filter(cat => cat.isActive).length;
  const featuredCategories = flatCategories.filter(cat => cat.isFeatured).length;
  const totalProducts = flatCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products with hierarchical categories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
          >
            {viewMode === 'tree' ? <Grid3X3 className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            {viewMode === 'tree' ? 'Grid View' : 'Tree View'}
          </Button>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          
