import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SubCategory, Brand, Category } from '../types';
import { Table, Button, Input, Dialog, Select, Card, Badge } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

const SubCategoriesPage: React.FC = () => {
  const [data, setData] = useState<{ data: SubCategory[]; total: number } | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalCategories, setModalCategories] = useState<Category[]>([]); // Separate state for modal
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState<Partial<SubCategory>>({ 
    name: '', 
    description: '', 
    brand_id: '',
    category_id: '',
    price_type: 'single',
    price: { amount: 0 },
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [removeImages, setRemoveImages] = useState<string[]>([]);

  const fetchBrands = async () => {
    try {
      const res = await api.brands.getAll({ per_page: 100, page: 1 });
      setBrands(res.data);
    } catch (err) {
      console.error('Failed to load brands');
    }
  };

  const fetchCategories = async (brandId?: string) => {
    try {
      const res = await api.categories.getAll({ 
        per_page: 100, 
        page: 1, 
        brand_id: brandId 
      });
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories');
      setCategories([]);
    }
  };

  const fetchModalCategories = async (brandId: string) => {
    try {
      const res = await api.categories.getAll({ 
        per_page: 100, 
        page: 1, 
        brand_id: brandId 
      });
      setModalCategories(res.data);
    } catch (err) {
      console.error('Failed to load modal categories');
      setModalCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.subCategories.getAll({ 
        per_page: 15, 
        page, 
        search, 
        brand_id: selectedBrand || undefined,
        category_id: selectedCategory || undefined
      });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load sub-categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchCategories(selectedBrand);
    } else {
      setCategories([]);
      setSelectedCategory('');
    }
  }, [selectedBrand]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search, selectedBrand, selectedCategory]);

  const handleBrandChange = async (brandId: string) => {
    setCurrentSubCategory({
      ...currentSubCategory,
      brand_id: brandId,
      category_id: ''
    });
    
    if (brandId) {
      await fetchModalCategories(brandId);
    } else {
      setModalCategories([]);
    }
  };

const openCreateModal = async () => {
  const initialBrand = brands[0]?.id || brands[0]?._id || '';
  
  setCurrentSubCategory({ 
    name: '', 
    description: '', 
    brand_id: initialBrand,
    category_id: '',
    price_type: 'single',
    price: { amount: 0 },
    images: []
  });
  
  setImageFiles([]);
  setRemoveImages([]);
  
  if (initialBrand) {
    await fetchModalCategories(initialBrand);
  }
  
  setIsModalOpen(true);
};

  const openEditModal = async (subCat: SubCategory) => {
  // Get the brand_id and category_id from nested objects
  const brandId = subCat.brand?.id || '';
  const categoryId = subCat.category?.id || '';
  
  // First, load the categories for this brand
  if (brandId) {
    await fetchModalCategories(brandId);
  }
  
  // Set the current sub-category with proper IDs extracted from nested objects
  setCurrentSubCategory({
    id: subCat.id,
    name: subCat.name,
    description: subCat.description,
    brand_id: brandId,
    category_id: categoryId,
    price_type: subCat.price_type,
    price: subCat.price,
    images: subCat.images
  });
  
  setImageFiles([]);
  setRemoveImages([]);
  setIsModalOpen(true);
};

  const handleSave = async () => {
  if (!currentSubCategory.name?.trim()) {
    alert('Sub-category name is required');
    return;
  }
  if (!currentSubCategory.brand_id) {
    alert('Please select a brand');
    return;
  }
  if (!currentSubCategory.category_id) {
    alert('Please select a category');
    return;
  }

  // Validate price
  if (currentSubCategory.price_type === 'single') {
    if (!currentSubCategory.price?.amount || currentSubCategory.price.amount <= 0) {
      alert('Please enter a valid price amount');
      return;
    }
  } else {
    if (!currentSubCategory.price?.min || !currentSubCategory.price?.max) {
      alert('Please enter valid min and max prices');
      return;
    }
    if (currentSubCategory.price.max < currentSubCategory.price.min) {
      alert('Max price must be greater than min price');
      return;
    }
  }
  
  setIsSubmitting(true);
  try {
    const formData = new FormData();
    
    const subCatId = currentSubCategory.id || currentSubCategory._id;
    if (subCatId) {
      formData.append('sub_category_id', subCatId);
    }
    
    formData.append('name', currentSubCategory.name);
    if (currentSubCategory.description) {
      formData.append('description', currentSubCategory.description);
    }
    formData.append('brand_id', currentSubCategory.brand_id);
    formData.append('category_id', currentSubCategory.category_id);
    formData.append('price_type', currentSubCategory.price_type || 'single');

    if (currentSubCategory.price_type === 'single') {
      formData.append('price[amount]', currentSubCategory.price?.amount?.toString() || '0');
    } else {
      formData.append('price[min]', currentSubCategory.price?.min?.toString() || '0');
      formData.append('price[max]', currentSubCategory.price?.max?.toString() || '0');
    }

    // Add new images
    imageFiles.forEach((file) => {
      formData.append('images[]', file);
    });

    // Add images to remove (for update only)
    if (subCatId && removeImages.length > 0) {
      removeImages.forEach((path) => {
        formData.append('remove_images[]', path);
      });
    }

    if (subCatId) {
      await api.subCategories.update(formData);
    } else {
      await api.subCategories.create(formData);
    }
    
    setIsModalOpen(false);
    setImageFiles([]);
    setRemoveImages([]);
    setModalCategories([]);
    setPage(1);
    fetchData();
  } catch (err: any) {
    alert(err.message || 'Operation failed');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async () => {
  const subCatId = currentSubCategory.id || currentSubCategory._id;
  if (!subCatId) return;
  
  setIsSubmitting(true);
  try {
    await api.subCategories.delete(subCatId);
    setIsDeleteOpen(false);
    fetchData();
  } catch (err: any) {
    alert(err.message || 'Delete failed');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const existingCount = (currentSubCategory.images?.length || 0) - removeImages.length;
      const newCount = imageFiles.length + files.length;
      
      if (existingCount + newCount > 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      
      setImageFiles([...imageFiles, ...files]);
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const markImageForRemoval = (imagePath: string) => {
    setRemoveImages([...removeImages, imagePath]);
  };

  const unmarkImageForRemoval = (imagePath: string) => {
    setRemoveImages(removeImages.filter(path => path !== imagePath));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sub-Categories</h1>
          <p className="text-sm text-gray-600 mt-1">Manage product sub-categories with pricing and images</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          className="gap-2" 
          onClick={openCreateModal}
          disabled={brands.length === 0}
        >
          <Plus size={16} /> Add Sub-Category
        </Button>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search sub-categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-gray-500" />
            <Select 
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedCategory('');
              }}
              options={[
                { label: 'All Brands', value: '' }, 
                ...brands.map(b => ({ label: b.name, value: b.id || b._id || '' }))
                ]}
              className="h-10 min-w-[150px]"
            />
            <Select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { label: 'All Categories', value: '' }, 
                ...categories.map(c => ({ label: c.name, value: c.id || c._id || '' }))
                ]}
              className="h-10 min-w-[150px]"
              disabled={!selectedBrand}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading sub-categories...</span>
          </div>
        ) : (
          <>
            <Table headers={['Sub-Category', 'Brand', 'Category', 'Price', 'Images', 'Actions']}>
              {data?.data.map((subCat) => (
                <tr key={subCat.id || subCat._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{subCat.name}</span>
                      {subCat.description && (
                        <span className="text-sm text-gray-500 line-clamp-1">{subCat.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">
                      {subCat.brand?.name || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{subCat.category?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {subCat.price_type === 'single' ? (
                      <span className="font-semibold text-gray-900">${subCat.price.amount?.toFixed(2)}</span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        ${subCat.price.min?.toFixed(2)} - ${subCat.price.max?.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <ImageIcon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{subCat.images?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditModal(subCat)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-error hover:bg-error/5"
                        onClick={() => { 
                          setCurrentSubCategory(subCat); 
                          setIsDeleteOpen(true); 
                        }}
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
                Showing {data?.data.length || 0} of {data?.total || 0} sub-categories
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
        setModalCategories([]);
    }} 
    title={currentSubCategory.id || currentSubCategory._id ? "Edit Sub-Category" : "Create Sub-Category"}
    footer={(
        <>
        <Button variant="outline" onClick={() => {
            setIsModalOpen(false);
            setModalCategories([]);
        }}>Cancel</Button>
        <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
            {currentSubCategory.id || currentSubCategory._id ? 'Save Changes' : 'Create Sub-Category'}
        </Button>
        </>
    )}
    >
    <div className="space-y-5">
        <Input 
        label="Sub-Category Name" 
        placeholder="e.g., Running Shoes, T-Shirts"
        value={currentSubCategory.name || ''} 
        onChange={(e) => setCurrentSubCategory({...currentSubCategory, name: e.target.value})}
        required
        />
        
        <div className="grid grid-cols-2 gap-4">
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">Brand</label>
    <select 
      value={currentSubCategory.brand_id || ''}
      onChange={(e) => handleBrandChange(e.target.value)}
      className="border border-border rounded px-3 py-2 text-sm bg-white outline-none transition-all cursor-pointer"
    >
      <option value="">Select a brand</option>
      {brands.map(b => (
        <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
        ))}
    </select>
  </div>

  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">Category</label>
    <select 
      value={currentSubCategory.category_id || ''}
      onChange={(e) => setCurrentSubCategory({...currentSubCategory, category_id: e.target.value})}
      disabled={!currentSubCategory.brand_id || modalCategories.length === 0}
      className={`border border-border rounded px-3 py-2 text-sm bg-white outline-none transition-all ${
        !currentSubCategory.brand_id || modalCategories.length === 0 
          ? 'cursor-not-allowed bg-gray-100 text-gray-400' 
          : 'cursor-pointer'
      }`}
    >
      <option value="">
        {!currentSubCategory.brand_id 
          ? 'Select brand first' 
          : modalCategories.length === 0 
            ? 'No categories available' 
            : 'Select a category'
        }
      </option>
      {modalCategories.map(c => (
        <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
        ))}
    </select>
    {!currentSubCategory.brand_id && (
      <p className="text-xs text-gray-500">Please select a brand first</p>
    )}
    {currentSubCategory.brand_id && modalCategories.length === 0 && (
      <p className="text-xs text-yellow-600">This brand has no categories. Please create one first.</p>
    )}
  </div>
</div>
        
        <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
            Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea 
            className="border border-border rounded px-3 py-2 text-sm bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-black/10"
            placeholder="Brief description..."
            value={currentSubCategory.description || ''}
            onChange={(e) => setCurrentSubCategory({...currentSubCategory, description: e.target.value})}
        />
        </div>

        {/* Price Type */}
        <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Price Type</label>
        <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
            <input 
                type="radio" 
                name="price_type" 
                value="single"
                checked={currentSubCategory.price_type === 'single'}
                onChange={() => setCurrentSubCategory({
                ...currentSubCategory, 
                price_type: 'single',
                price: { amount: currentSubCategory.price?.amount || 0 }
                })}
                className="w-4 h-4"
            />
            <span className="text-sm">Single Price</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
            <input 
                type="radio" 
                name="price_type" 
                value="range"
                checked={currentSubCategory.price_type === 'range'}
                onChange={() => setCurrentSubCategory({
                ...currentSubCategory, 
                price_type: 'range',
                price: { 
                    min: currentSubCategory.price?.min || 0, 
                    max: currentSubCategory.price?.max || 0 
                }
                })}
                className="w-4 h-4"
            />
            <span className="text-sm">Price Range</span>
            </label>
        </div>
        </div>

        {/* Price Inputs */}
        {currentSubCategory.price_type === 'single' ? (
        <Input 
            label="Price ($)" 
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={currentSubCategory.price?.amount || ''} 
            onChange={(e) => setCurrentSubCategory({
            ...currentSubCategory, 
            price: { amount: parseFloat(e.target.value) || 0 }
            })}
        />
        ) : (
        <div className="grid grid-cols-2 gap-4">
            <Input 
            label="Min Price ($)" 
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={currentSubCategory.price?.min || ''} 
            onChange={(e) => setCurrentSubCategory({
                ...currentSubCategory, 
                price: { ...currentSubCategory.price, min: parseFloat(e.target.value) || 0 }
            })}
            />
            <Input 
            label="Max Price ($)" 
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={currentSubCategory.price?.max || ''} 
            onChange={(e) => setCurrentSubCategory({
                ...currentSubCategory, 
                price: { ...currentSubCategory.price, max: parseFloat(e.target.value) || 0 }
            })}
            />
        </div>
        )}

        {/* Images */}
<div className="space-y-3">
  <label className="text-sm font-medium text-gray-700">
    Images <span className="text-gray-400">(Max 5)</span>
  </label>
  
  {/* Existing Images */}
  {currentSubCategory.images && currentSubCategory.images.length > 0 && (
    <div>
      <p className="text-xs text-gray-600 mb-2">Current Images</p>
      <div className="grid grid-cols-5 gap-2">
        {currentSubCategory.images.map((img, idx) => {
          const isMarked = removeImages.includes(img);
          return (
            <div key={idx} className="relative group">
              <img 
                src={img} 
                alt={`Image ${idx + 1}`}
                className={`w-full h-20 object-cover rounded border ${isMarked ? 'opacity-50 border-red-500' : 'border-gray-200'}`}
                onError={(e) => {
                  console.error('Image failed to load:', img);
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="12" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              <button
                type="button"
                onClick={() => isMarked ? unmarkImageForRemoval(img) : markImageForRemoval(img)}
                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${isMarked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                title={isMarked ? 'Click to keep this image' : 'Click to remove this image'}
              >
                {isMarked ? '↺' : '×'}
              </button>
            </div>
          );
        })}
      </div>
      {removeImages.length > 0 && (
        <p className="text-xs text-red-600 mt-2">
          {removeImages.length} image(s) marked for removal
        </p>
      )}
    </div>
  )}

  {/* New Images Preview */}
  {imageFiles.length > 0 && (
    <div>
      <p className="text-xs text-gray-600 mb-2">New Images to Upload</p>
      <div className="grid grid-cols-5 gap-2">
        {imageFiles.map((file, idx) => (
          <div key={idx} className="relative group">
            <img 
              src={URL.createObjectURL(file)} 
              alt={`New ${idx + 1}`}
              className="w-full h-20 object-cover rounded border border-green-200"
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
  <div>
    <input 
      type="file"
      id="image-upload"
      multiple
      accept="image/jpeg,image/jpg,image/png,image/webp"
      onChange={handleImageChange}
      className="hidden"
    />
    <label 
      htmlFor="image-upload"
      className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded text-sm cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <ImageIcon size={16} />
      Add More Images
    </label>
    <p className="text-xs text-gray-500 mt-2">
      Accepts JPG, PNG, WEBP (max 2MB each, 5 images total)
    </p>
  </div>
</div>
    </div>
    </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Delete Sub-Category"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>
              Delete Sub-Category
            </Button>
          </>
        )}
      >
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong className="text-gray-900">{currentSubCategory.name}</strong>?
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This will also delete all associated images. This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default SubCategoriesPage;