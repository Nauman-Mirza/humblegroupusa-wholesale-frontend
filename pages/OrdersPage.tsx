import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { Table, Button, Card, Badge } from '../components/UIComponents';
import { Search, Filter, ChevronLeft, ChevronRight, Package, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const [data, setData] = useState<{ data: Order[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
                      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                        {/* Order ID */}
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</span>
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {order._id}
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
    </div>
  );
};

export default OrdersPage;