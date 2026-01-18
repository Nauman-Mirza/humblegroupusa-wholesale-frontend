import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Brand, Category, SubCategory, Role } from '../types';
import { 
  Table, 
  Button, 
  Badge, 
  Input, 
  Dialog, 
  Card,
  Select 
} from '../components/UIComponents';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Package, Upload, Image as ImageIcon, Check } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const [data, setData] = useState<{ data: Product[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterSubCategoryId, setFilterSubCategoryId] = useState('');

  // Dropdown options for filters
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterCategories, setFilterCategories] = useState<Category[]>([]);
  const [filterSubCategories, setFilterSubCategories] = useState<SubCategory[]>([]);

  // Roles for product visibility
  const [roles, setRoles] = useState<Role[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sku: '',
    brand_id: '',
    category_id: '',
    sub_category_id: '',
    product_visibility: [] as string[], // Array of role IDs
    images: [] as File[],
    existingImages: [] as string[],
    removeImages: [] as string[]
  });

  // Dropdown options for form
  const [formBrands, setFormBrands] = useState<Brand[]>([]);
  const [formCategories, setFormCategories] = useState<Category[]>([]);
  const [formSubCategories, setFormSubCategories] = useState<SubCategory[]>([]);

  // Load brands and roles on mount
  useEffect(() => {
    loadBrands();
    loadRoles();
  }, []);

  // Load filter categories when filter brand changes
  useEffect(() => {
    if (filterBrandId) {
      loadFilterCategories(filterBrandId);
    } else {
      setFilterCategories([]);
      setFilterCategoryId('');
      setFilterSubCategories([]);
      setFilterSubCategoryId('');
    }
  }, [filterBrandId]);

  // Load filter sub-categories when filter category changes
  useEffect(() => {
    if (filterCategoryId) {
      loadFilterSubCategories(filterCategoryId);
    } else {
      setFilterSubCategories([]);
      setFilterSubCategoryId('');
    }
  }, [filterCategoryId]);

  // Load form categories when form brand changes
  useEffect(() => {
    if (formData.brand_id) {
      loadFormCategories(formData.brand_id);
    } else {
      setFormCategories([]);
      setFormData(prev => ({ ...prev, category_id: '', sub_category_id: '' }));
      setFormSubCategories([]);
    }
  }, [formData.brand_id]);

  // Load form sub-categories when form category changes
  useEffect(() => {
    if (formData.category_id) {
      loadFormSubCategories(formData.category_id);
    } else {
      setFormSubCategories([]);
      setFormData(prev => ({ ...prev, sub_category_id: '' }));
    }
  }, [formData.category_id]);

  const loadBrands = async () => {
    try {
      const res = await api.brands.getAll({ per_page: 100, page: 1 });
      setBrands(res.data);
      setFormBrands(res.data);
    } catch (err: any) {
      console.error('Failed to load brands:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.roles.getAll({ per_page: 100, page: 1 });
      setRoles(res.data);
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadFilterCategories = async (brandId: string) => {
    try {
      const res = await api.categories.getAll({ per_page: 100, page: 1, brand_id: brandId });
      setFilterCategories(res.data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadFilterSubCategories = async (categoryId: string) => {
    try {
      const res = await api.subCategories.getAll({ per_page: 100, page: 1, category_id: categoryId });
      setFilterSubCategories(res.data);
    } catch (err: any) {
      console.error('Failed to load sub-categories:', err);
    }
  };

  const loadFormCategories = async (brandId: string) => {
    try {
      const res = await api.categories.getAll({ per_page: 100, page: 1, brand_id: brandId });
      setFormCategories(res.data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadFormSubCategories = async (categoryId: string) => {
    try {
      const res = await api.subCategories.getAll({ per_page: 100, page: 1, category_id: categoryId });
      setFormSubCategories(res.data);
    } catch (err: any) {
      console.error('Failed to load sub-categories:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 15, page };
      if (searchQuery) params.search = searchQuery;
      if (filterBrandId) params.brand_id = filterBrandId;
      if (filterCategoryId) params.category_id = filterCategoryId;
      if (filterSubCategoryId) params.sub_category_id = filterSubCategoryId;

      const res = await api.products.getAll(params);
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchQuery, filterBrandId, filterCategoryId, filterSubCategoryId]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      sku: '',
      brand_id: '',
      category_id: '',
      sub_category_id: '',
      product_visibility: [],
      images: [],
      existingImages: [],
      removeImages: []
    });
    setEditingProduct(null);
    setFormCategories([]);
    setFormSubCategories([]);
  };

  const openCreateDialog = () => {
    resetForm();
    
    // Set default role to General Users (type: 'general')
    const generalUsersRole = roles.find(r => r.type === 'general');
    if (generalUsersRole) {
      setFormData(prev => ({
        ...prev,
        product_visibility: [generalUsersRole._id || generalUsersRole.id || '']
      }));
    }
    
    setIsModalOpen(true);
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    
    const brandId = product.brand_id || '';
    const categoryId = product.category_id || '';
    const subCategoryId = product.sub_category_id || '';

    // Get product_visibility IDs - need to match names to IDs
    let visibilityIds: string[] = [];
    if (product.product_visibility && product.product_visibility.length > 0) {
      // If we have IDs directly
      visibilityIds = product.product_visibility;
    } else if (product.product_visibility_names && product.product_visibility_names.length > 0) {
      // If we only have names, match them to IDs
      visibilityIds = product.product_visibility_names
        .map(name => {
          const role = roles.find(r => r.name.toLowerCase() === name.toLowerCase());
          return role ? (role._id || role.id || '') : '';
        })
        .filter(id => id !== '');
    }

    // If no visibility is set, default to General Users (type: 'general')
    if (visibilityIds.length === 0) {
      const generalUsersRole = roles.find(r => r.type === 'general');
      if (generalUsersRole) {
        visibilityIds = [generalUsersRole._id || generalUsersRole.id || ''];
      }
    }

    // Set form data and open modal immediately
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      sku: product.sku,
      brand_id: brandId,
      category_id: categoryId,
      sub_category_id: subCategoryId,
      product_visibility: visibilityIds,
      images: [],
      existingImages: product.images || [],
      removeImages: []
    });

    // Open modal immediately for better UX
    setIsModalOpen(true);

    // Load categories and subcategories in parallel (non-blocking)
    const promises = [];
    if (brandId) {
      promises.push(loadFormCategories(brandId));
    }
    if (categoryId) {
      promises.push(loadFormSubCategories(categoryId));
    }
    
    // Load data in background after modal is open
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  // Toggle any role (General Users or custom roles)
  const toggleRole = (roleId: string) => {
    setFormData(prev => {
      let newVisibility = [...prev.product_visibility];
      
      // Toggle the clicked role
      if (newVisibility.includes(roleId)) {
        newVisibility = newVisibility.filter(id => id !== roleId);
      } else {
        newVisibility.push(roleId);
      }
      
      return { ...prev, product_visibility: newVisibility };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter((file: File) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image type. Only JPG, PNG, and WEBP are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    const totalImages = formData.existingImages.length - formData.removeImages.length + formData.images.length + validFiles.length;
    
    if (totalImages > 10) {
      alert('Maximum 10 images allowed per product');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
  };

  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleRemoveExistingImage = (imageUrl: string) => {
    setFormData(prev => {
      const isMarkedForRemoval = prev.removeImages.includes(imageUrl);
      
      return {
        ...prev,
        removeImages: isMarkedForRemoval
          ? prev.removeImages.filter(url => url !== imageUrl)
          : [...prev.removeImages, imageUrl]
      };
    });
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (!formData.sub_category_id) {
      alert('Please select a sub-category');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (!editingProduct && !formData.sku.trim()) {
      alert('SKU is required');
      return;
    }

    // Validate that at least one role is selected
    if (formData.product_visibility.length === 0) {
      alert('Please select at least one customer role for product visibility');
      return;
    }

    if (!editingProduct) {
      const totalImages = formData.images.length;
      if (totalImages === 0) {
        alert('Please upload at least 1 image');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('sub_category_id', formData.sub_category_id);

      // Add product visibility (role IDs)
      formData.product_visibility.forEach((roleId) => {
        formDataToSend.append('product_visibility[]', roleId);
      });

      // Add images
      formData.images.forEach((file) => {
        formDataToSend.append('images[]', file);
      });

      if (editingProduct) {
        formDataToSend.append('product_id', editingProduct._id || editingProduct.id || '');
        
        formData.removeImages.forEach((imgUrl) => {
          const pathMatch = imgUrl.match(/\/storage\/(.+)$/);
          if (pathMatch) {
            formDataToSend.append('remove_images[]', pathMatch[1]);
          }
        });

        await api.products.update(formDataToSend);
      } else {
        formDataToSend.append('sku', formData.sku);
        await api.products.create(formDataToSend);
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await api.products.delete(editingProduct._id || editingProduct.id || '');
      setIsDeleteOpen(false);
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="error">Out of Stock</Badge>;
    if (quantity <= 10) return <Badge variant="warning">Low Stock ({quantity})</Badge>;
    return <Badge variant="success">In Stock ({quantity})</Badge>;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-600 mt-1">Manage product inventory</p>
        </div>
        <Button variant="primary" onClick={openCreateDialog}>
          <Package size={16} /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="lg:col-span-2"
        />

        <select
          value={filterBrandId}
          onChange={(e) => {
            setFilterBrandId(e.target.value);
            setFilterCategoryId('');
            setFilterSubCategoryId('');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand._id || brand.id} value={brand._id || brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={filterCategoryId}
          onChange={(e) => {
            setFilterCategoryId(e.target.value);
            setFilterSubCategoryId('');
            setPage(1);
          }}
          disabled={!filterBrandId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">All Categories</option>
          {filterCategories.map((category) => (
            <option key={category._id || category.id} value={category._id || category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filterSubCategoryId}
          onChange={(e) => {
            setFilterSubCategoryId(e.target.value);
            setPage(1);
          }}
          disabled={!filterCategoryId}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">All Sub-Categories</option>
          {filterSubCategories.map((subCat) => (
            <option key={subCat._id || subCat.id} value={subCat._id || subCat.id}>
              {subCat.name}
            </option>
          ))}
        </select>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-full" />
            <span className="text-sm text-gray-600 mt-4">Loading products...</span>
          </div>
        ) : (
          <>
            <Table headers={['Product', 'SKU', 'Category', 'Price', 'Stock', 'Visibility', 'Actions']}>
              {data?.data.map((product) => (
                <tr key={product._id || product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23e5e7eb" width="48" height="48"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{product.sku}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {product.brand?.name && (
                        <div className="font-medium text-gray-900">{product.brand.name}</div>
                      )}
                      {product.category?.name && (
                        <div className="text-gray-600">→ {product.category.name}</div>
                      )}
                      {product.sub_category?.name && (
                        <div className="text-gray-500">→ {product.sub_category.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">
                      ${Number(product.price || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStockBadge(product.quantity)}
                  </td>
                  <td className="px-6 py-4">
                    {product.product_visibility_names && product.product_visibility_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {product.product_visibility_names.slice(0, 2).map((name, idx) => (
                          <Badge key={idx} variant="neutral">
                            <span className="capitalize text-xs">{name}</span>
                          </Badge>
                        ))}
                        {product.product_visibility_names.length > 2 && (
                          <Badge variant="neutral">
                            <span className="text-xs">+{product.product_visibility_names.length - 2}</span>
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="neutral">
                        <span className="capitalize text-xs">General Users</span>
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-error hover:bg-error/5"
                        onClick={() => { setEditingProduct(product); setIsDeleteOpen(true); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>

            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-border">
              <span className="text-sm text-gray-600">
                Showing {data?.data.length || 0} of {data?.total || 0} products
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-sm font-medium px-3">Page {page}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!data || data.data.length < 15}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Dialog 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingProduct ? "Edit Product" : "Create Product"}
        footer={(
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              loading={isSubmitting} 
              onClick={handleSaveProduct}
            >
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </>
        )}
      >
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }}>
          <Input 
            label="Product Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="Enter product name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Price ($)" 
              type="number"
              step="0.01"
              min="0"
              value={formData.price} 
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              placeholder="0.00"
            />
            <Input 
              label="Quantity" 
              type="number"
              min="0"
              value={formData.quantity} 
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
              placeholder="0"
            />
          </div>

          <Input 
            label="SKU" 
            value={formData.sku} 
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            required
            disabled={editingProduct !== null}
            placeholder="Enter unique SKU"
            className={editingProduct ? "bg-gray-100 cursor-not-allowed" : ""}
          />
          {editingProduct && (
            <p className="text-xs text-gray-500 -mt-3">SKU cannot be changed after creation</p>
          )}

          {/* Category Selection */}
          <div className="bg-gray-50 p-4 border border-gray-200 rounded space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Category Selection</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({...formData, brand_id: e.target.value, category_id: '', sub_category_id: ''})}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">Select Brand</option>
                {formBrands.map((brand) => (
                  <option key={brand._id || brand.id} value={brand._id || brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value, sub_category_id: ''})}
                required
                disabled={!formData.brand_id || formCategories.length === 0}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
              >
                <option value="">
                  {!formData.brand_id ? 'Select brand first' : formCategories.length === 0 ? 'No categories available' : 'Select Category'}
                </option>
                {formCategories.map((category) => (
                  <option key={category._id || category.id} value={category._id || category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Sub-Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sub_category_id}
                onChange={(e) => setFormData({...formData, sub_category_id: e.target.value})}
                required
                disabled={!formData.category_id || formSubCategories.length === 0}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
              >
                <option value="">
                  {!formData.category_id ? 'Select category first' : formSubCategories.length === 0 ? 'No sub-categories available' : 'Select Sub-Category'}
                </option>
                {formSubCategories.map((subCat) => (
                  <option key={subCat._id || subCat.id} value={subCat._id || subCat.id}>
                    {subCat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Visibility - All Checkboxes */}
          <div className="bg-gray-50 p-4 border border-gray-200 rounded space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">Product Visibility <span className="text-red-500">*</span></h3>
              <span className="text-xs text-gray-500">
                {formData.product_visibility.length} role(s) selected
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Select one or more customer roles who can view this product. You can select multiple roles.
            </p>
            
            <div className="border border-gray-200 rounded bg-white overflow-hidden">
              {roles.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No roles available
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {roles.map((role) => {
                    const roleId = role._id || role.id || '';
                    const isSelected = formData.product_visibility.includes(roleId);
                    const isGeneralUsers = role.type === 'general';
                    
                    return (
                      <div 
                        key={roleId}
                        onClick={() => toggleRole(roleId)}
                        className={`
                          flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
                          ${isSelected ? 'bg-black/5' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize font-medium">{role.name}</span>
                          {isGeneralUsers && (
                            <Badge variant="success">
                              <span className="text-[10px]">All Customers</span>
                            </Badge>
                          )}
                        </div>
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${isSelected ? 'bg-black border-black' : 'border-gray-300'}
                        `}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-gray-50 p-5 border border-gray-200 rounded space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">Product Images</h3>
              <span className="text-xs text-gray-500">
                {formData.existingImages.length - formData.removeImages.length + formData.images.length} / 10 images
              </span>
            </div>

            {/* Existing Images */}
            {editingProduct && formData.existingImages.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Current Images</label>
                <div className="grid grid-cols-5 gap-2">
                  {formData.existingImages.map((img, idx) => {
                    const isMarkedForRemoval = formData.removeImages.includes(img);
                    
                    return (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`Product ${idx + 1}`}
                          className={`w-full h-20 object-cover rounded border-2 ${
                            isMarkedForRemoval
                              ? 'opacity-50 border-red-500' 
                              : 'border-gray-200'
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => toggleRemoveExistingImage(img)}
                          className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            isMarkedForRemoval
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                          title={isMarkedForRemoval ? 'Click to keep this image' : 'Click to remove this image'}
                        >
                          {isMarkedForRemoval ? '↺' : '×'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {formData.removeImages.length > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    {formData.removeImages.length} image(s) marked for removal
                  </p>
                )}
              </div>
            )}

            {/* New Images */}
            {formData.images.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">New Images to Upload</label>
                <div className="grid grid-cols-5 gap-2">
                  {formData.images.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`New ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border-2 border-green-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1 rounded">
                        NEW
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {(formData.existingImages.length - formData.removeImages.length + formData.images.length) < 10 && (
              <div>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload images
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WEBP (Max 5MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {!editingProduct && formData.images.length === 0 && (
              <p className="text-xs text-red-500">At least 1 image is required</p>
            )}
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Product"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>Delete Product</Button>
          </>
        )}
      >
        {editingProduct && (
          <p className="text-sm py-4">
            Are you sure you want to delete <strong>{editingProduct.name}</strong>? 
            This action cannot be undone and will remove the product and all its images.
          </p>
        )}
      </Dialog>
    </div>
  );
};

export default ProductsPage;