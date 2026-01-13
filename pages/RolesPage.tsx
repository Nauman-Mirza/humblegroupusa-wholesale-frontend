import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Role } from '../types';
import { Table, Button, Input, Dialog, Select, Card, Badge } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const RolesPage: React.FC = () => {
  const [data, setData] = useState<{ data: Role[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({ 
    name: '', 
    description: '', 
    type: 'custom'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.roles.getAll({ per_page: 15, page, search });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleSave = async () => {
  if (!currentRole.name?.trim()) {
    alert('Role name is required');
    return;
  }
  if (!currentRole.type) {
    alert('Role type is required');
    return;
  }

  const roleId = currentRole._id || currentRole.id;
  const isEditing = !!roleId;

  // Prevent creating another general role if one exists
  if (currentRole.type === 'general' && !isEditing && generalRoleExists) {
    alert('A general role already exists. Only one general role is allowed.');
    return;
  }

  // Prevent changing general role type to custom
  if (isEditing && currentRole.type !== 'general') {
    const originalRole = data?.data.find(r => (r._id || r.id) === roleId);
    if (originalRole?.type === 'general') {
      alert('General role type cannot be changed.');
      return;
    }
  }
  
  setIsSubmitting(true);
  try {
    if (isEditing) {
      await api.roles.update(roleId, {
        name: currentRole.name,
        description: currentRole.description || '',
        type: currentRole.type
      });
    } else {
      await api.roles.create({
        name: currentRole.name,
        description: currentRole.description || '',
        type: currentRole.type
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
    const roleId = currentRole._id || currentRole.id;
    if (!roleId) return;
    
    setIsSubmitting(true);
    try {
      await api.roles.delete(roleId);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if general role already exists
  const generalRoleExists = data?.data.some(r => r.type === 'general');

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          className="gap-2" 
          onClick={() => { 
            setCurrentRole({ name: '', description: '', type: 'custom' }); 
            setIsModalOpen(true); 
          }}
        >
          <Plus size={16} /> Add Role
        </Button>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search roles by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading roles...</span>
          </div>
        ) : (
          <>
            <Table headers={['Role', 'Type', 'Description', 'Created', 'Actions']}>
              {data?.data.map((role) => {
                const roleId = role._id || role.id || '';
                return (
                  <tr key={roleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/5 rounded flex items-center justify-center font-bold text-lg border border-black/10">
                          {role.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 capitalize">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={role.type === 'general' ? 'warning' : 'neutral'}>
                        {role.type === 'general' ? 'General' : 'Custom'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-2">
                        {role.description || 'No description'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(role.created_at).toLocaleDateString('en-US', {
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
                            setCurrentRole(role); 
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
                            setCurrentRole(role); 
                            setIsDeleteOpen(true); 
                          }}
                          disabled={role.type === 'general'}
                          title={role.type === 'general' ? 'General role cannot be deleted' : 'Delete role'}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>

            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-border">
              <span className="text-sm text-gray-600">
                Showing {data?.data.length || 0} of {data?.total || 0} roles
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
        title={(currentRole._id || currentRole.id) ? "Edit Role" : "Create Role"}
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
              {(currentRole._id || currentRole.id) ? 'Save Changes' : 'Create Role'}
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <Input 
            label="Role Name" 
            placeholder="e.g., Wholesale Customer, VIP Member"
            value={currentRole.name || ''} 
            onChange={(e) => setCurrentRole({...currentRole, name: e.target.value})}
            required
          />

          <Select 
            label="Role Type"
            value={currentRole.type || 'custom'}
            onChange={(e) => setCurrentRole({...currentRole, type: e.target.value as 'general' | 'custom'})}
            options={[
                { label: 'Custom', value: 'custom' },
                { label: 'General', value: 'general' },
            ]}
            />

          {/* Warning for general type */}
          {currentRole.type === 'general' && !(currentRole._id || currentRole.id) && generalRoleExists && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> A general role already exists. Only one general role is allowed.
              </p>
            </div>
          )}

          {currentRole.type === 'general' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-800">
                <strong>Info:</strong> General role is assigned to all new users by default and cannot be deleted.
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea 
              className="border border-border rounded px-3 py-2 text-sm bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Brief description of the role..."
              value={currentRole.description || ''}
              onChange={(e) => setCurrentRole({...currentRole, description: e.target.value})}
              maxLength={500}
            />
            <span className="text-xs text-gray-400 text-right">
              {(currentRole.description || '').length}/500
            </span>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Delete Role"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>
              Delete Role
            </Button>
          </>
        )}
      >
        <div className="py-4">
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <strong className="text-gray-900 capitalize">{currentRole.name}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> Users with this role may lose associated permissions. This action cannot be undone.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RolesPage;