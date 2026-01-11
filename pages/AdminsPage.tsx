import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminUser } from '../types';
import { Table, Button, Input, Dialog, Select, Card, Badge, Switch } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminsPage: React.FC = () => {
  const [data, setData] = useState<{ data: AdminUser[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Partial<AdminUser>>({ 
    name: '', 
    email: '', 
    role: 'admin',
    is_active: true
  });
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 15, page };
      
      if (search) params.search = search;
      
      const res = await api.admins.getAll(params);
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleSave = async () => {
    if (!currentAdmin.name?.trim()) {
      alert('Name is required');
      return;
    }
    if (!currentAdmin.email?.trim()) {
      alert('Email is required');
      return;
    }
    const adminId = currentAdmin.id || currentAdmin._id;
    if (!adminId && !password?.trim()) {
      alert('Password is required for new admin');
      return;
    }
    if (password && password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: currentAdmin.name,
        email: currentAdmin.email,
        role: currentAdmin.role || 'admin',
        is_active: currentAdmin.is_active
      };

      if (password) {
        payload.password = password;
      }

      if (adminId) {
        await api.admins.update(adminId, payload);
      } else {
        await api.admins.create(payload);
      }
      
      setIsModalOpen(false);
      setPassword('');
      setPage(1);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const adminId = currentAdmin.id || currentAdmin._id;
    if (!adminId) return;
    
    setIsSubmitting(true);
    try {
      await api.admins.delete(adminId);
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
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-sm text-gray-600 mt-1">Manage administrator accounts and permissions</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          className="gap-2" 
          onClick={() => { 
            setCurrentAdmin({ 
              name: '', 
              email: '', 
              role: 'admin',
              is_active: true
            }); 
            setPassword('');
            setIsModalOpen(true); 
          }}
        >
          <Plus size={16} /> Add Admin
        </Button>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading admins...</span>
          </div>
        ) : (
          <>
            <Table headers={['Admin', 'Email', 'Role', 'Status', 'Created', 'Actions']}>
              {data?.data.map((admin) => {
                const adminId = admin.id || admin._id || '';
                return (
                  <tr key={adminId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{admin.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{admin.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={admin.role === 'super_admin' ? 'warning' : 'neutral'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={admin.is_active ? 'success' : 'neutral'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(admin.created_at).toLocaleDateString('en-US', {
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
                            setCurrentAdmin(admin);
                            setPassword('');
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
                            setCurrentAdmin(admin); 
                            setIsDeleteOpen(true); 
                          }}
                          disabled={admin.role === 'super_admin'}
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
                Showing {data?.data.length || 0} of {data?.total || 0} admins
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
        title={(currentAdmin.id || currentAdmin._id) ? "Edit Admin" : "Create Admin"}
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
              {(currentAdmin.id || currentAdmin._id) ? 'Save Changes' : 'Create Admin'}
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <Input 
            label="Full Name" 
            placeholder="e.g., John Doe"
            value={currentAdmin.name || ''} 
            onChange={(e) => setCurrentAdmin({...currentAdmin, name: e.target.value})}
            required
          />
          
          <Input 
            label="Email Address" 
            type="email"
            placeholder="admin@humblegroup.com"
            value={currentAdmin.email || ''} 
            onChange={(e) => setCurrentAdmin({...currentAdmin, email: e.target.value})}
            required
          />

          <Input 
            label={(currentAdmin.id || currentAdmin._id) ? "New Password (Leave blank to keep current)" : "Password"} 
            type="password"
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required={!(currentAdmin.id || currentAdmin._id)}
          />

          <Select 
            label="Role"
            value={currentAdmin.role || 'admin'}
            onChange={(e) => setCurrentAdmin({...currentAdmin, role: e.target.value as 'admin' | 'super_admin'})}
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Super Admin', value: 'super_admin' },
            ]}
          />

          <div className="flex items-center justify-between p-5 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-gray-900">Account Status</span>
                <Badge variant={currentAdmin.is_active ? 'success' : 'neutral'}>
                  {currentAdmin.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {currentAdmin.is_active 
                  ? 'Admin can log in and access the system' 
                  : 'Admin account is disabled'
                }
              </p>
            </div>
            <Switch 
              checked={currentAdmin.is_active || false} 
              onChange={(val) => setCurrentAdmin({...currentAdmin, is_active: val})}
              label="Toggle account status"
            />
          </div>

          {currentAdmin.role === 'super_admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-xs text-yellow-800">
                <strong>Warning:</strong> Super Admins have full system access and can manage other admins.
              </p>
            </div>
          )}
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Delete Admin"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>
              Delete Admin
            </Button>
          </>
        )}
      >
        <div className="py-4">
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <strong className="text-gray-900">{currentAdmin.name}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-xs text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The admin will lose access immediately.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminsPage;