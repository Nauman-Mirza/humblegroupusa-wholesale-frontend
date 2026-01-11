import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserDetail, ShippingAddress } from '../types';
import { 
  Table, 
  Button, 
  Badge, 
  Input, 
  Dialog, 
  Switch, 
  Card 
} from '../components/UIComponents';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [data, setData] = useState<{ data: User[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 15, page };
      const res = await api.users.getAll(params);
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const openEditDialog = async (user: User) => {
    setLoadingDetail(true);
    setIsEditOpen(true);
    try {
      const detail = await api.users.getDetail(user._id);
      setCurrentUser({
        ...detail.data.user,
        shipping_address: detail.data.shipping_address
      });
    } catch (err: any) {
      alert(err.message || 'Failed to load user details');
      setIsEditOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        phone: currentUser.phone,
        company_name: currentUser.company_name,
        website: currentUser.website || ''
      };

      if (currentUser.shipping_address) {
        payload.shipping_address = currentUser.shipping_address;
      }

      await api.users.update(currentUser._id, payload);
      
      const originalUser = data?.data.find(u => u._id === currentUser._id);
      if (originalUser && currentUser.is_active !== originalUser.is_active) {
        await api.users.setActive(currentUser._id, currentUser.is_active);
      }
      
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await api.users.delete(currentUser._id);
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
          <h1 className="text-2xl font-bold">Wholesale Customers</h1>
          <p className="text-sm text-gray-600 mt-1">Manage wholesale buyer accounts</p>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-full" />
            <span className="text-sm text-gray-600 mt-4">Loading customers...</span>
          </div>
        ) : (
          <>
            <Table headers={['Customer', 'Company', 'Contact', 'Status', 'Actions']}>
              {data?.data.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold">{user.first_name} {user.last_name}</span>
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{user.company_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{user.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? 'success' : 'neutral'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-error hover:bg-error/5"
                        onClick={() => { setCurrentUser(user as UserDetail); setIsDeleteOpen(true); }}
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
                Showing {data?.data.length || 0} of {data?.total || 0} customers
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

      <Dialog 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSaveUser}>Save Changes</Button>
          </>
        )}
      >
        {loadingDetail ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
          </div>
        ) : currentUser && (
          <form className="space-y-5" onSubmit={handleSaveUser}>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="First Name" 
                value={currentUser.first_name} 
                onChange={(e) => setCurrentUser({...currentUser, first_name: e.target.value})}
              />
              <Input 
                label="Last Name" 
                value={currentUser.last_name} 
                onChange={(e) => setCurrentUser({...currentUser, last_name: e.target.value})}
              />
            </div>

            <Input 
              label="Email" 
              type="email" 
              value={currentUser.email} 
              onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Phone" 
                value={currentUser.phone} 
                onChange={(e) => setCurrentUser({...currentUser, phone: e.target.value})}
              />
              <Input 
                label="Website (Optional)" 
                value={currentUser.website || ''} 
                onChange={(e) => setCurrentUser({...currentUser, website: e.target.value})}
              />
            </div>

            <Input 
              label="Company Name" 
              value={currentUser.company_name} 
              onChange={(e) => setCurrentUser({...currentUser, company_name: e.target.value})}
            />

            <div className="bg-gray-50 p-5 border border-gray-200 rounded space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Shipping Address</h3>
              
              <Input 
                label="Address Line 1" 
                value={currentUser.shipping_address?.address_1 || ''} 
                onChange={(e) => setCurrentUser({
                  ...currentUser, 
                  shipping_address: { ...(currentUser.shipping_address || {} as ShippingAddress), address_1: e.target.value }
                })}
              />

              <Input 
                label="Address Line 2 (Optional)" 
                value={currentUser.shipping_address?.address_2 || ''} 
                onChange={(e) => setCurrentUser({
                  ...currentUser, 
                  shipping_address: { ...(currentUser.shipping_address || {} as ShippingAddress), address_2: e.target.value }
                })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="City" 
                  value={currentUser.shipping_address?.city || ''} 
                  onChange={(e) => setCurrentUser({
                    ...currentUser, 
                    shipping_address: { ...(currentUser.shipping_address || {} as ShippingAddress), city: e.target.value }
                  })}
                />
                <Input 
                  label="Postcode" 
                  value={currentUser.shipping_address?.postcode || ''} 
                  onChange={(e) => setCurrentUser({
                    ...currentUser, 
                    shipping_address: { ...(currentUser.shipping_address || {} as ShippingAddress), postcode: e.target.value }
                  })}
                />
              </div>

              <Input 
                label="Country" 
                value={currentUser.shipping_address?.country || ''} 
                onChange={(e) => setCurrentUser({
                  ...currentUser, 
                  shipping_address: { ...(currentUser.shipping_address || {} as ShippingAddress), country: e.target.value }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-5 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">Account Status</span>
                  <Badge variant={currentUser.is_active ? 'success' : 'neutral'}>
                    {currentUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {currentUser.is_active 
                    ? 'Customer can log in and place orders' 
                    : 'Customer account is disabled'
                  }
                </p>
              </div>
              <Switch 
                checked={currentUser.is_active} 
                onChange={(val) => setCurrentUser({...currentUser, is_active: val})}
                label="Toggle account status"
              />
            </div>
          </form>
        )}
      </Dialog>

      <Dialog 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Customer"
        footer={(
          <>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isSubmitting} onClick={handleDelete}>Delete Customer</Button>
          </>
        )}
      >
        {currentUser && (
          <p className="text-sm py-4">
            Are you sure you want to delete <strong>{currentUser.first_name} {currentUser.last_name}</strong>? 
            This action cannot be undone and will remove all associated data.
          </p>
        )}
      </Dialog>
    </div>
  );
};

export default UsersPage;