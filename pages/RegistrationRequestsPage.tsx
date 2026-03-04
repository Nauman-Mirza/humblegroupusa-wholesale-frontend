import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RegistrationRequest } from '../types';
import { Table, Button, Input, Dialog, Badge, Card } from '../components/UIComponents';
import { Search, ChevronLeft, ChevronRight, Check, X, Eye } from 'lucide-react';

type Tab = 'pending' | 'declined';

const RegistrationRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [data, setData] = useState<{ data: RegistrationRequest[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accepted' | 'declined'>('accepted');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page, search: search || undefined };
      const res = activeTab === 'pending'
        ? await api.registrationRequests.getPending(params)
        : await api.registrationRequests.getDeclined(params);
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search, activeTab]);

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await api.registrationRequests.updateStatus(selectedRequest._id, confirmAction);
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedRequest(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirm = (request: RegistrationRequest, action: 'accepted' | 'declined') => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const openDetail = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Registration Requests</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-steel hover:text-primary'
          }`}
        >
          Pending Requests
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'declined'
              ? 'border-primary text-primary'
              : 'border-transparent text-steel hover:text-primary'
          }`}
        >
          Declined Requests
        </button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" size={16} />
          <input
            type="text"
            placeholder="Search by name, company, website, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-sm text-sm outline-none placeholder:text-gray-300"
          />
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-20 text-steel text-sm">
            No {activeTab} registration requests found.
          </div>
        ) : (
          <>
            <Table headers={['Name', 'Email', 'Company', 'Phone', 'Website', 'Submitted', 'Actions']}>
              {data.data.map((request) => (
                <tr key={request._id} className="hover:bg-platinum/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">
                    {request.first_name} {request.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-steel">{request.email}</td>
                  <td className="px-4 py-3 text-sm">{request.company_name}</td>
                  <td className="px-4 py-3 text-sm text-steel">{request.phone}</td>
                  <td className="px-4 py-3 text-sm">
                    {request.website ? (
                      <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[150px]">
                        {request.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-steel">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-steel">{formatDate(request.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openDetail(request)} title="View Details">
                        <Eye size={15} />
                      </Button>
                      {activeTab === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => openConfirm(request, 'accepted')} title="Accept">
                            <Check size={15} className="text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openConfirm(request, 'declined')} title="Decline">
                            <X size={15} className="text-error" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-platinum/20">
              <span className="text-[11px] text-steel uppercase tracking-widest">
                {data.total} total {activeTab} request{data.total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-xs font-medium px-2">Page {page}</span>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={!data || data.data.length < 15}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedRequest(null); }}
        title="Registration Request Details"
        footer={
          <div className="flex gap-2">
            {selectedRequest?.registration_request === 'pending' && (
              <>
                <Button variant="danger" onClick={() => { setIsDetailOpen(false); openConfirm(selectedRequest!, 'declined'); }}>
                  Decline
                </Button>
                <Button variant="primary" onClick={() => { setIsDetailOpen(false); openConfirm(selectedRequest!, 'accepted'); }}>
                  Accept
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => { setIsDetailOpen(false); setSelectedRequest(null); }}>
              Close
            </Button>
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">First Name</label>
                <p className="text-sm mt-1">{selectedRequest.first_name}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Last Name</label>
                <p className="text-sm mt-1">{selectedRequest.last_name}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Email</label>
                <p className="text-sm mt-1">{selectedRequest.email}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Phone</label>
                <p className="text-sm mt-1">{selectedRequest.phone}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Company</label>
                <p className="text-sm mt-1">{selectedRequest.company_name}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Website</label>
                <p className="text-sm mt-1">
                  {selectedRequest.website ? (
                    <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedRequest.website}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Status</label>
                <p className="mt-1">
                  <Badge variant={selectedRequest.registration_request === 'pending' ? 'warning' : 'error'}>
                    {selectedRequest.registration_request}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Submitted</label>
                <p className="text-sm mt-1">{formatDate(selectedRequest.created_at)}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-[11px] font-bold text-steel uppercase tracking-widest mb-3">Agreements</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {selectedRequest.agree_min_order ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  <span>Minimum Order</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.agree_no_personal_use ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  <span>No Personal Use</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.agree_terms ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  <span>Terms & Conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.agree_no_resell ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                  <span>No Resell</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Signature</label>
                  <p className="text-sm mt-1 italic">{selectedRequest.signature}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-steel uppercase tracking-widest">Signed At</label>
                  <p className="text-sm mt-1">{selectedRequest.signed_at ? formatDate(selectedRequest.signed_at) : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setSelectedRequest(null); }}
        title={confirmAction === 'accepted' ? 'Accept Registration' : 'Decline Registration'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsConfirmOpen(false); setSelectedRequest(null); }}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'accepted' ? 'primary' : 'danger'}
              onClick={handleStatusUpdate}
              loading={isSubmitting}
            >
              {confirmAction === 'accepted' ? 'Accept' : 'Decline'}
            </Button>
          </div>
        }
      >
        {selectedRequest && (
          <p className="text-sm">
            Are you sure you want to <strong>{confirmAction === 'accepted' ? 'accept' : 'decline'}</strong> the registration request from{' '}
            <strong>{selectedRequest.first_name} {selectedRequest.last_name}</strong> ({selectedRequest.company_name})?
          </p>
        )}
      </Dialog>
    </div>
  );
};

export default RegistrationRequestsPage;
