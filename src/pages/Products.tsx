import { useState, useEffect, useCallback } from 'react';
import { productService, Product, categoryService, Category } from '@/lib/api-services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Search, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-utils';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availableFilter, setAvailableFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    isAvailable: true,
    image: null as File | null,
  });
  const [imageError, setImageError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockDialogProduct, setStockDialogProduct] = useState<{ id: string; name: string; currentStock: number | null } | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (availableFilter !== 'all') params.isAvailable = availableFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await productService.getAll(params);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, availableFilter, searchTerm]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll(true); // Only active categories
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to old method if category service fails
      try {
        const fallbackResponse = await productService.getCategories();
        setCategories(fallbackResponse.data.map(name => ({ _id: '', name, isActive: true } as Category)));
      } catch (fallbackError) {
        console.error('Failed to load categories (fallback):', fallbackError);
      }
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenDialog = (product?: Product) => {
    setImageError('');
    setImagePreview(null);
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock?.toString() || '',
        description: product.description || '',
        isAvailable: product.isAvailable,
        image: null,
      });
      if (product.imageUrl) {
        setImagePreview(getImageUrl(product.imageUrl) || null);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        stock: '',
        description: '',
        isAvailable: true,
        image: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setImageError('');
    setImagePreview(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      isAvailable: true,
      image: null,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    
    if (!file) {
      setFormData({ ...formData, image: null });
      setImagePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
      setFormData({ ...formData, image: null });
      setImagePreview(null);
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageError('File size too large. Maximum size is 2MB.');
      setFormData({ ...formData, image: null });
      setImagePreview(null);
      e.target.value = ''; // Reset input
      return;
    }

    // Set image and create preview
    setFormData({ ...formData, image: file });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setImageError('');

    // Validate image if provided
    if (formData.image) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(formData.image.type)) {
        setImageError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
        return;
      }
      const maxSize = 2 * 1024 * 1024;
      if (formData.image.size > maxSize) {
        setImageError('File size too large. Maximum size is 2MB.');
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      if (formData.stock) formDataToSend.append('stock', formData.stock);
      formDataToSend.append('isAvailable', formData.isAvailable.toString());
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.image) formDataToSend.append('image', formData.image);

      if (editingProduct) {
        await productService.update(editingProduct._id, formDataToSend);
      } else {
        await productService.create(formDataToSend);
      }

      handleCloseDialog();
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to save product';
      
      // Check if error is related to image upload
      if (errorMessage.toLowerCase().includes('image') || 
          errorMessage.toLowerCase().includes('file') ||
          errorMessage.toLowerCase().includes('upload')) {
        setImageError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setProductToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productService.delete(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to delete product');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleOpenStockDialog = (product: Product) => {
    setStockDialogProduct({
      id: product._id,
      name: product.name,
      currentStock: product.stock,
    });
    setNewStockValue(product.stock?.toString() || '0');
    setStockDialogOpen(true);
  };

  const handleCloseStockDialog = () => {
    setStockDialogOpen(false);
    setStockDialogProduct(null);
    setNewStockValue('');
  };

  const handleUpdateInventory = async () => {
    if (!stockDialogProduct) return;

    const stock = parseInt(newStockValue);
    if (isNaN(stock) || stock < 0) {
      alert('Invalid stock quantity. Please enter a number greater than or equal to 0.');
      return;
    }

    try {
      await productService.updateInventory(stockDialogProduct.id, stock);
      handleCloseStockDialog();
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to update inventory');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id || cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select value={availableFilter} onValueChange={setAvailableFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Card key={product._id}>
              {product.imageUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback jika gambar gagal dimuat
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {product.category}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(product._id, product.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(product.price)}</p>
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    (product.stock !== null ? product.stock > 0 : product.isAvailable)
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {(product.stock !== null ? product.stock > 0 : product.isAvailable) ? 'Available' : 'Unavailable'}
                  </span>
                  {product.stock !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => handleOpenStockDialog(product)}
                    >
                      Stock: {product.stock}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product information'
                : 'Add a new product to your inventory'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <div className="space-y-2">
                    <Input
                      id="category"
                      placeholder="Enter or select category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      list="category-list"
                      required
                    />
                    <datalist id="category-list">
                      {categories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat.name} />
                      ))}
                    </datalist>
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">Quick select:</span>
                        {categories.map((cat) => (
                          <Button
                            key={cat._id || cat.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setFormData({ ...formData, category: cat.name })}
                          >
                            {cat.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    {formData.category && !categories.some(cat => cat.name === formData.category) && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">New category:</span> "{formData.category}" will be created
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (leave empty for non-inventory)</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPEG, PNG, WEBP. Maximum size: 2MB
                </p>
                {imageError && (
                  <p className="text-xs text-destructive font-medium">
                    {imageError}
                  </p>
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {editingProduct?.imageUrl && !formData.image && !imagePreview && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Current image:</p>
                    <img
                      src={getImageUrl(editingProduct.imageUrl)}
                      alt={editingProduct.name}
                      className="h-32 w-32 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete Product?</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{productToDelete?.name}</span>?
            </p>
            <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive font-medium">
                ⚠️ This will permanently remove the product from your inventory.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
            <DialogDescription>
              Update stock for <span className="font-semibold">{stockDialogProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock-quantity">Stock Quantity</Label>
              <Input
                id="stock-quantity"
                type="number"
                min="0"
                step="1"
                value={newStockValue}
                onChange={(e) => setNewStockValue(e.target.value)}
                placeholder="Enter stock quantity"
                className="text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Current stock: <span className="font-medium">{stockDialogProduct?.currentStock ?? 0}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseStockDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateInventory}
            >
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

