import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { Table, Button, Card, Badge, Dialog } from '../components/UIComponents';
import { Search, Filter, ChevronLeft, ChevronRight, Package, User, Calendar, ChevronDown, ChevronUp, Download, FileText, File } from 'lucide-react';


const OrdersPage: React.FC = () => {
  const [data, setData] = useState<{ data: Order[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.orders.getAll({ 
        per_page: 10, 
        page, 
        search
      });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
  setIsExporting(true);
  try {
    const res = await api.orders.exportData({
      date_from: exportDateFrom || undefined,
      date_to: exportDateTo || undefined,
    });

    const orders = res?.data?.rows || [];
    if (!Array.isArray(orders) || orders.length === 0) {
      alert('No data found for the selected range.');
      return;
    }

    const rows: any[][] = [];

    for (const order of orders) {
      for (const item of order.items ?? []) {
        rows.push([
          order.order_id,
          // Prefix with ' to force Excel to treat as text — prevents scientific notation
          "'" + String(order.warehence_order_id),
          order.status.charAt(0).toUpperCase() + order.status.slice(1),
          order.total,
          order.items_count,
          order.created_at?.slice(0, 10) ?? '',
          order.user_name,
          order.user_email,
          String(order.user_phone),
          order.company_name,
          order.can_order ? 'Yes' : 'No',
          order.ship_first_name,
          order.ship_last_name,
          order.ship_company,
          order.ship_street1,
          order.ship_street2 ?? '',
          order.ship_city,
          order.ship_state,
          String(order.ship_postal_code),
          order.ship_country,
          order.ship_country_code,
          item.sku,
          item.product_name,
          item.quantity,
          item.default_price,
          parseFloat((item.quantity * item.default_price).toFixed(2)),
        ]);
      }
    }

    const headers = [
      'Order ID', 'Warehouse Order ID', 'Status', 'Order Total ($)', 'Items Count', 'Order Date',
      'Customer Name', 'Email', 'Phone', 'Company', 'Can Order',
      'Ship First Name', 'Ship Last Name', 'Ship Company', 'Street 1', 'Street 2',
      'City', 'State', 'Postal Code', 'Country', 'Country Code',
      'SKU', 'Product Name', 'Qty', 'Unit Price ($)', 'Line Total ($)',
    ];

    const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${exportDateFrom || 'all'}-to-${exportDateTo || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportOpen(false);
  } catch (err: any) {
    alert(err.message || 'Export failed');
  } finally {
    setIsExporting(false);
  }
};

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created': return 'info';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (ext === 'pdf') return <FileText size={16} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <FileText size={16} className="text-blue-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={16} className="text-blue-600" />;
    return <File size={16} className="text-gray-500" />;
  };

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">
            Total Orders: {data?.total || 0}
          </Badge>
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-border rounded pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 mt-4">Loading orders...</span>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.data.map((order) => (
                <div key={order._id} className="hover:bg-gray-50 transition-colors">
                  {/* Order Header */}
                  <div 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleOrder(order._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        {/* Order ID */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</span>
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {order._id.slice(-8)}
                          </span>
                        </div>

                        {/* Customer */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</span>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{order.user?.company_name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</span>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{formatDate(order.created_at)}</span>
                          </div>
                        </div>

                        {/* Total & Items */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{order.items_count} items</span>
                        </div>

                        {/* Attachment Indicator */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Attachment</span>
                          {order.attachments && order.attachments.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(order.attachments[0].url, order.attachments[0].name);
                              }}
                              className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-black transition-colors group"
                              title={order.attachments[0].name}
                            >
                              <Download size={14} className="text-gray-500 group-hover:text-black" />
                              <span className="truncate max-w-[120px]">{order.attachments[0].name}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors">
                        {expandedOrder === order._id ? (
                          <ChevronUp size={18} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {expandedOrder === order._id && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-border">
                      {/* Order Items */}
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                          Order Items
                        </h4>
                        <div className="bg-white rounded border border-border overflow-hidden">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Product ID
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  SKU
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                    {item.product_id}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {item.sku}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                    {item.quantity}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Attachments Section */}
                      {order.attachments && order.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                            Attached Documents
                          </h4>
                          <div className="bg-white rounded border border-border">
                            {order.attachments.map((attachment, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  {getFileIcon(attachment.file_extension)}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {attachment.name}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase">
                                      {attachment.file_extension}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => window.open(attachment.url, '_blank')}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                  >
                                    <FileText size={14} />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownload(attachment.url, attachment.name)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                                  >
                                    <Download size={14} />
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-border">
              <span className="text-sm text-gray-600">
                Showing {data?.data.length || 0} of {data?.total || 0} orders
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
                <span className="text-sm font-medium px-3">
                  Page {page} of {(data as any)?.last_page || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= ((data as any)?.last_page || 1)}
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
  isOpen={isExportOpen}
  onClose={() => setIsExportOpen(false)}
  title="Export Orders to CSV"
  footer={(
    <>
      <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
      <Button variant="primary" loading={isExporting} onClick={handleExport}>
        <Download size={14} className="mr-1" /> Export
      </Button>
    </>
  )}
>
  <div className="space-y-4 py-2">
    <p className="text-sm text-gray-600">
      Select a date range to filter exported orders. Leave blank to export all.
    </p>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Date From</label>
        <input
          type="date"
          value={exportDateFrom}
          onChange={(e) => setExportDateFrom(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Date To</label>
        <input
          type="date"
          value={exportDateTo}
          onChange={(e) => setExportDateTo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        />
      </div>
    </div>
  </div>
</Dialog>
    </div>
  );
};

export default OrdersPage;