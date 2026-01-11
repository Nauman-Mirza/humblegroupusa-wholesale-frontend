import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Brand } from '../types';
import { Table, Button, Input, Dialog, Select, Card, Badge } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const [data, setData] = useState<{ data: Category[]; total: number } | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ 
    name: '', 
    description: '', 
    brand_id: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await api.brands.getAll({ per_page: 100, page: 1 });
      setBrands(res.data);
    } catch (err) {
      console.error('Failed to load brands');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.categories.getAll({ 
        per_page: 15, 
        page, 
        search, 
        brand_id: selectedBrand || undefined 
      });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search, selectedBrand]);

  const handleSave = async () => {
    if (!currentCategory.name?.trim()) {
      alert('Category name is required');
      return;
    }
    if (!currentCategory.brand_id) {
      alert('Please select a brand');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentCategory._id) {
        await api.categories.update(
          currentCategory._id, 
          currentCategory.name, 
          currentCategory.description || '', 
          currentCategory.brand_id
        );
      } else {
        await api.categories.create(
          currentCategory.name, 
          currentCategory.description || '', 
          currentCategory.brand_id
        );
      }
      setIsModalOpen(false);
      setPage(1);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCategory._id) return;
    setIsSubmitting(true);
    try {
      await api.categories.delete(currentCategory._id);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBrandName = (brandId: string) => {
    return brands.find(b => b._id === brandId)?.name || 'Unknown Brand';
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Product Categories</h1>
          <p className="text-sm text-gray-600 mt-1">Organize products into categories by brand</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          className="gap-2" 
          onClick={() => { 
            setCurrentCategory({ 
              name: '', 
              description: '', 
              brand_id: brands[0]?._id || '' 
            }); 
            setIsModalOpen(true); 
          }}
          disabled={brands.length === 0}
        >
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search categories by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-gray-500" />
            <Select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              options={[
                { label: 'All Brands', value: '' }, 
                ...brands.map(b => ({ label: b.name, value: b._id }))
              ]}
              className="h-10 min-w-[200px]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading categories...</span>
          </div>
        ) : (
          <>
            <Table headers={['Category', 'Brand', 'Description', 'Created', 'Actions']}>
              {data?.data.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">
                      {getBrandName(category.brand_id)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {category.description || 'No description'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { 
                          setCurrentCategory(category); 
                          setIsModalOpen(true); 
                        }}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-error hover:bg-error/5"
                        onClick={() => { 
                          setCurrentCategory(category); 
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
                Showing {data?.data.length || 0} of {data?.total || 0} categories
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
        onClose={() => setIsModalOpen(false)} 
        title={currentCategory._id ? "Edit Category" : "Create Category"}
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
              {currentCategory._id ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <Input 
            label="Category Name" 
            placeholder="e.g., Men's Footwear, Women's Apparel"
            value={currentCategory.name || ''} 
            onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
            required
          />
          
          <Select 
            label="Brand"
            value={currentCategory.brand_id || ''}
            onChange={(e) => setCurrentCategory({...currentCategory, brand_id: e.target.value})}
            options={brands.map(b => ({ label: b.name, value: b._id }))}
          />
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea 
              className="border border-border rounded px-3 py-2 text-sm bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Brief description of the category..."
              value={currentCategory.description || ''}
              onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Delete Category"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>
              Delete Category
            </Button>
          </>
        )}
      >
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong className="text-gray-900">{currentCategory.name}</strong>?
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;