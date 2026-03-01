import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Brand } from '../types';
import { Table, Button, Input, Dialog, Card } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';

const BrandsPage: React.FC = () => {
  const [data, setData] = useState<{ data: Brand[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<Brand>>({ name: '', description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openCreateModal = () => {
    setCurrentBrand({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setCurrentBrand(brand);
    setImageFile(null);
    setImagePreview(brand.image || null);
    setRemoveImage(false);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!currentBrand.name?.trim()) {
      alert('Brand name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentBrand._id) {
        await api.brands.update({
          brand_id: currentBrand._id,
          name: currentBrand.name,
          description: currentBrand.description || '',
          image: imageFile,
          remove_image: removeImage,
        });
      } else {
        await api.brands.create({
          name: currentBrand.name,
          description: currentBrand.description || '',
          image: imageFile,
        });
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
        <Button variant="primary" size="md" className="gap-2" onClick={openCreateModal}>
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
                      {brand.image ? (
                        <img
                          src={brand.image}
                          alt={brand.name}
                          className="w-10 h-10 rounded object-cover border border-black/10"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-black/5 rounded flex items-center justify-center font-bold text-lg border border-black/10">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
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
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(brand)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error hover:bg-error/5"
                        onClick={() => { setCurrentBrand(brand); setIsDeleteOpen(true); }}
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
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
        title={currentBrand._id ? 'Edit Brand' : 'Create Brand'}
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
            onChange={(e) => setCurrentBrand({ ...currentBrand, name: e.target.value })}
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
              onChange={(e) => setCurrentBrand({ ...currentBrand, description: e.target.value })}
            />
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Brand Image <span className="text-gray-400">(Optional)</span>
            </label>

            {imagePreview ? (
              <div className="relative w-32 h-32 rounded border border-border overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-500 gap-2"
              >
                <Upload size={20} />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs text-gray-400">JPG, JPEG, PNG, WEBP · Max 5MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 hover:underline text-left"
              >
                Change image
              </button>
            )}
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