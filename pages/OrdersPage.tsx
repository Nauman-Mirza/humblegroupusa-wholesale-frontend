import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { Button, Card, Badge, Dialog } from '../components/UIComponents';
import { Search, ChevronLeft, ChevronRight, User as UserIcon, Calendar, ChevronDown, ChevronUp, Download, FileText, File, X, Check, Users } from 'lucide-react';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface SelectedCustomer {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

const OrdersPage: React.FC = () => {
  const [data, setData] = useState<{ data: Order[]; total: number; last_page?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Export dialog state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Customer selection state
  const [customerMode, setCustomerMode] = useState<'all' | 'selected'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [allCustomers, setAllCustomers] = useState<SelectedCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerFilterText, setCustomerFilterText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.orders.getAll({ per_page: 10, page, search });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load all customers when dialog opens with "selected" mode
  const loadAllCustomers = async () => {
    if (allCustomers.length > 0) return; // already loaded
    setIsLoadingCustomers(true);
    try {
      // Fetch a large page to get all customers
      let all: SelectedCustomer[] = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await api.users.getAll({ per_page: 100, page: currentPage });
        const users = (res.data || []).map((u: any) => ({
          _id: u._id || u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          company_name: u.company_name || '',
        }));
        all = [...all, ...users];
        hasMore = all.length < res.total;
        currentPage++;
      }
      setAllCustomers(all);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredCustomers();
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      filtered.forEach(c => next.add(c._id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    const filtered = getFilteredCustomers();
    const filteredIds = new Set(filtered.map(c => c._id));
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      filteredIds.forEach(id => next.delete(id));
      return next;
    });
  };

  const getFilteredCustomers = () => {
    if (!customerFilterText.trim()) return allCustomers;
    const q = customerFilterText.toLowerCase();
    return allCustomers.filter(c =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q)
    );
  };

  const filteredCustomers = getFilteredCustomers();
  const allFilteredSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.has(c._id));

  // ─── Build export rows from API response ───────────────────────────
  const buildExportRows = (orders: any[]) => {
    const headers = [
      'Order ID', 'Warehouse Order ID', 'Status', 'Order Total ($)', 'Items Count', 'Order Date',
      'Customer Name', 'Email', 'Phone', 'Company', 'Can Order',
      'Ship First Name', 'Ship Last Name', 'Ship Company', 'Street 1', 'Street 2',
      'City', 'State', 'Postal Code', 'Country', 'Country Code',
      'SKU', 'Product Name', 'Qty', 'Unit Price ($)', 'Line Total ($)',
    ];

    const rows: any[][] = [];
    for (const order of orders) {
      for (const item of order.items ?? []) {
        rows.push([
          order.order_id,
          String(order.warehence_order_id),
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
    return { headers, rows };
  };

  // ─── CSV export ────────────────────────────────────────────────────
  const exportCSV = (headers: string[], rows: any[][]) => {
    const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `orders-export-${dateLabel()}.csv`);
  };

  // ─── Excel export (XML Spreadsheet — no library needed) ───────────
  const exportExcel = (headers: string[], rows: any[][]) => {
    let xml = '<?xml version="1.0"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '  <Styles>\n';
    xml += '    <Style ss:ID="header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/></Style>\n';
    xml += '    <Style ss:ID="currency"><NumberFormat ss:Format="$#,##0.00"/></Style>\n';
    xml += '    <Style ss:ID="text"><NumberFormat ss:Format="@"/></Style>\n';
    xml += '  </Styles>\n';
    xml += '  <Worksheet ss:Name="Orders">\n';
    xml += '    <Table>\n';
    headers.forEach(() => { xml += '      <Column ss:AutoFitWidth="1" ss:Width="120"/>\n'; });
    xml += '      <Row>\n';
    headers.forEach(h => { xml += `        <Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`; });
    xml += '      </Row>\n';
    const currencyCols = new Set([3, 24, 25]);
    const numberCols = new Set([4, 23]);
    rows.forEach(row => {
      xml += '      <Row>\n';
      row.forEach((cell, idx) => {
        const val = cell ?? '';
        if (currencyCols.has(idx) && typeof val === 'number') {
          xml += `        <Cell ss:StyleID="currency"><Data ss:Type="Number">${val}</Data></Cell>\n`;
        } else if (numberCols.has(idx) && typeof val === 'number') {
          xml += `        <Cell><Data ss:Type="Number">${val}</Data></Cell>\n`;
        } else {
          xml += `        <Cell ss:StyleID="text"><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>\n`;
        }
      });
      xml += '      </Row>\n';
    });
    xml += '    </Table>\n  </Worksheet>\n</Workbook>';
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    downloadBlob(blob, `orders-export-${dateLabel()}.xls`);
  };

  // ─── PDF export ────────────────────────────────────────────────────
  const exportPDF = (headers: string[], rows: any[][]) => {
    const style = `<style>
      @page { size: landscape; margin: 10mm; }
      body { font-family: Arial, sans-serif; font-size: 9px; margin: 0; padding: 10px; }
      h1 { font-size: 16px; margin-bottom: 4px; }
      .meta { font-size: 10px; color: #666; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #111; color: #fff; padding: 6px 4px; text-align: left; font-size: 8px; text-transform: uppercase; }
      td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; font-size: 8px; }
      tr:nth-child(even) td { background: #f9fafb; }
      .footer { margin-top: 12px; font-size: 9px; color: #999; text-align: right; }
    </style>`;
    const dateRange = exportDateFrom || exportDateTo
      ? `Date Range: ${exportDateFrom || 'Start'} to ${exportDateTo || 'Present'}`
      : 'All Dates';
    const selectedArr = allCustomers.filter(c => selectedCustomerIds.has(c._id));
    const customerInfo = customerMode === 'all'
      ? 'All Customers'
      : `Selected: ${selectedArr.map(c => `${c.first_name} ${c.last_name}`).join(', ')}`;
    let html = `<!DOCTYPE html><html><head><title>Orders Export</title>${style}</head><body>`;
    html += `<h1>Orders Export</h1>`;
    html += `<div class="meta">${dateRange} &bull; ${customerInfo} &bull; Generated: ${new Date().toLocaleString()}</div>`;
    html += '<table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => { html += `<td>${escapeHtml(String(cell ?? ''))}</td>`; });
      html += '</tr>';
    });
    html += `</tbody></table><div class="footer">Total rows: ${rows.length}</div></body></html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } else {
      alert('Please allow popups to export PDF.');
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────
  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dateLabel = () => `${exportDateFrom || 'all'}-to-${exportDateTo || 'all'}`;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── Main export handler ──────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const userIds = customerMode === 'selected' && selectedCustomerIds.size > 0
        ? Array.from(selectedCustomerIds) as string[]
        : undefined;

      const res = await api.orders.exportData({
        date_from: exportDateFrom || undefined,
        date_to: exportDateTo || undefined,
        user_ids: userIds,
      });

      const orders = res?.data?.rows || [];
      if (!Array.isArray(orders) || orders.length === 0) {
        alert('No data found for the selected filters.');
        return;
      }

      const { headers, rows } = buildExportRows(orders);

      switch (exportFormat) {
        case 'csv': exportCSV(headers, rows); break;
        case 'excel': exportExcel(headers, rows); break;
        case 'pdf': exportPDF(headers, rows); break;
      }

      setIsExportOpen(false);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const openExportDialog = () => {
    setExportDateFrom('');
    setExportDateTo('');
    setExportFormat('csv');
    setCustomerMode('all');
    setSelectedCustomerIds(new Set());
    setCustomerFilterText('');
    setIsExportOpen(true);
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
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (ext === 'pdf') return <FileText size={16} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <FileText size={16} className="text-blue-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={16} className="text-blue-600" />;
    return <File size={16} className="text-gray-500" />;
  };

  const handleDownload = (url: string, filename: string) => {
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
          <Badge variant="neutral">Total Orders: {data?.total || 0}</Badge>
          <Button variant="outline" onClick={openExportDialog}>
            <Download size={14} className="mr-1" /> Export Orders
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
                  <div className="px-6 py-4 cursor-pointer" onClick={() => toggleOrder(order._id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</span>
                          <span className="font-mono text-sm font-semibold text-gray-900">{order._id.slice(-8)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</span>
                          <div className="flex items-center gap-2">
                            <UserIcon size={14} className="text-gray-400" />
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{order.user?.company_name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</span>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</span>
                          <span className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                          <span className="text-xs text-gray-500 mt-1">{order.items_count} items</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Attachment</span>
                          {order.attachments && order.attachments.length > 0 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownload(order.attachments![0].url, order.attachments![0].name); }}
                              className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-black transition-colors group"
                            >
                              <Download size={14} className="text-gray-500 group-hover:text-black" />
                              <span className="truncate max-w-[120px]">{order.attachments[0].name}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                      <button className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors">
                        {expandedOrder === order._id ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
                      </button>
                    </div>
                  </div>

                  {expandedOrder === order._id && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-border">
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Order Items</h4>
                        <div className="bg-white rounded border border-border overflow-hidden">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Product ID</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.product_id}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{item.sku}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {order.attachments && order.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Attached Documents</h4>
                          <div className="bg-white rounded border border-border">
                            {order.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-b-0">
                                <div className="flex items-center gap-3">
                                  {getFileIcon(attachment.file_extension)}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                    <p className="text-xs text-gray-500 uppercase">{attachment.file_extension}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => window.open(attachment.url, '_blank')} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                                    <FileText size={14} /> View
                                  </button>
                                  <button onClick={() => handleDownload(attachment.url, attachment.name)} className="px-3 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                                    <Download size={14} /> Download
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
              <span className="text-sm text-gray-600">Showing {data?.data.length || 0} of {data?.total || 0} orders</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-sm font-medium px-3">Page {page} of {(data as any)?.last_page || 1}</span>
                <Button variant="outline" size="sm" disabled={page >= ((data as any)?.last_page || 1)} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ════════════════ EXPORT DIALOG ════════════════ */}
      <Dialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Order History"
        footer={<>
          <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={isExporting} onClick={handleExport} disabled={customerMode === 'selected' && selectedCustomerIds.size === 0}>
            <Download size={14} className="mr-1" /> Export {exportFormat.toUpperCase()}
          </Button>
        </>}
      >
        <div className="space-y-5 py-2">

          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="flex gap-2">
              {([
                { value: 'csv' as ExportFormat, label: 'CSV', icon: '📄' },
                { value: 'excel' as ExportFormat, label: 'Excel', icon: '📊' },
                { value: 'pdf' as ExportFormat, label: 'PDF', icon: '📑' },
              ]).map(fmt => (
                <button
                  key={fmt.value}
                  onClick={() => setExportFormat(fmt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                    exportFormat === fmt.value ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{fmt.icon}</span> {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <p className="text-xs text-gray-500 mb-2">Leave blank to include all dates.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">From</label>
                <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">To</label>
                <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm" />
              </div>
            </div>
          </div>

          {/* Customer selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customers</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setCustomerMode('all'); setSelectedCustomerIds(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                  customerMode === 'all' ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}>
                <Users size={14} /> All Customers
              </button>
              <button onClick={() => { setCustomerMode('selected'); loadAllCustomers(); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                  customerMode === 'selected' ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}>
                <UserIcon size={14} /> Select Customers
              </button>
            </div>

            {customerMode === 'selected' && (
              <div className="space-y-3">
                {/* Selected count + chips */}
                {selectedCustomerIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-[80px] overflow-y-auto">
                    {allCustomers
                      .filter(c => selectedCustomerIds.has(c._id))
                      .map(c => (
                        <span key={c._id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-xs text-gray-800 rounded-full border border-gray-200 shadow-sm">
                          <span className="font-medium">{c.first_name} {c.last_name}</span>
                          <button onClick={() => toggleCustomer(c._id)}
                            className="p-0.5 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 ml-3">Loading customers...</span>
                  </div>
                ) : (
                  <>
                    {/* Filter + select/deselect all */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Filter customers..."
                          value={customerFilterText}
                          onChange={(e) => setCustomerFilterText(e.target.value)}
                          className="w-full h-9 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                        />
                      </div>
                      <button
                        onClick={allFilteredSelected ? deselectAllFiltered : selectAllFiltered}
                        className="h-9 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        {allFilteredSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Customer list */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          {customerFilterText ? 'No customers match your filter.' : 'No customers found.'}
                        </div>
                      ) : (
                        filteredCustomers.map((customer, idx) => {
                          const isSelected = selectedCustomerIds.has(customer._id);
                          return (
                            <div
                              key={customer._id}
                              onClick={() => toggleCustomer(customer._id)}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                                isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected ? 'bg-black border-black' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>

                              {/* Avatar circle */}
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-gray-600">
                                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {customer.first_name} {customer.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {customer.email}{customer.company_name ? ` · ${customer.company_name}` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Summary */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} shown</span>
                      <span className="font-medium text-gray-700">{selectedCustomerIds.size} selected</span>
                    </div>

                    {selectedCustomerIds.size === 0 && (
                      <p className="text-xs text-amber-600">Please select at least one customer to export.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {exportFormat === 'pdf' && (
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
              PDF will open in a new window. Use your browser's Print → Save as PDF to download.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default OrdersPage;