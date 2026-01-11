import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Brand } from '../types';
import { Table, Button, Input, Dialog, Card } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const BrandsPage: React.FC = () => {
  const [data, setData] = useState<{ data: Brand[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<Brand>>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.brands.getAll({ per_page: 15, page, search });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleSave = async () => {
    if (!currentBrand.name?.trim()) {
      alert('Brand name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentBrand._id) {
        await api.brands.update(currentBrand._id, currentBrand.name, currentBrand.description || '');
      } else {
        await api.brands.create(currentBrand.name, currentBrand.description || '');
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
    if (!currentBrand._id) return;
    setIsSubmitting(true);
    try {
      await api.brands.delete(currentBrand._id);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-sm text-gray-600 mt-1">Manage product brands and manufacturers</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          className="gap-2" 
          onClick={() => { 
            setCurrentBrand({ name: '', description: '' }); 
            setIsModalOpen(true); 
          }}
        >
          <Plus size={16} /> Add Brand
        </Button>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search brands by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading brands...</span>
          </div>
        ) : (
          <>
            <Table headers={['Brand', 'Description', 'Created', 'Actions']}>
              {data?.data.map((brand) => (
                <tr key={brand._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/5 rounded flex items-center justify-center font-bold text-lg border border-black/10">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {brand.description || 'No description'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(brand.created_at).toLocaleDateString('en-US', {
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
                          setCurrentBrand(brand); 
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
                          setCurrentBrand(brand); 
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
                Showing {data?.data.length || 0} of {data?.total || 0} brands
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
        title={currentBrand._id ? "Edit Brand" : "Create Brand"}
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
              {currentBrand._id ? 'Save Changes' : 'Create Brand'}
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <Input 
            label="Brand Name" 
            placeholder="e.g., Nike, Adidas, Supreme"
            value={currentBrand.name || ''} 
            onChange={(e) => setCurrentBrand({...currentBrand, name: e.target.value})}
            required
          />
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea 
              className="border border-border rounded px-3 py-2 text-sm bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Brief description of the brand..."
              value={currentBrand.description || ''}
              onChange={(e) => setCurrentBrand({...currentBrand, description: e.target.value})}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Delete Brand"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>
              Delete Brand
            </Button>
          </>
        )}
      >
        <div className="py-4">
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <strong className="text-gray-900">{currentBrand.name}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> All categories associated with this brand may be affected.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BrandsPage;