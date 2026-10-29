import { useState, useEffect } from 'react';
import { getOwnerOrdersApi, updateOwnerOrderStatusApi, confirmReturnOwnerOrderApi } from '../../api/ownerOrderApi';
import OwnerOrderDetailModal from './OwnerOrderDetailModal';
import OwnerActionConfirmModal from './OwnerActionConfirmModal';
import type { OrderConfirmation, OrderStatus } from '../../types/order';
import type { PageResponse } from '../../types/catalog';

const STATUS_TABS: Array<{ label: string; value: OrderStatus | '' }> = [
  { label: 'TẤT CẢ', value: '' },
  { label: 'CHỜ XÁC NHẬN', value: 'PENDING' },
  { label: 'ĐÃ XÁC NHẬN', value: 'CONFIRMED' },
  { label: 'ĐANG XỬ LÝ', value: 'PROCESSING' },
  { label: 'ĐANG GIAO', value: 'SHIPPING' },
  { label: 'HOÀN TẤT', value: 'COMPLETED' },
  { label: 'GIAO THẤT BẠI', value: 'DELIVERY_FAILED' },
  { label: 'ĐÃ HOÀN VỀ KHO', value: 'RETURNED' },
  { label: 'ĐÃ HỦY', value: 'CANCELLED' },
];

export default function OwnerOrdersView() {
  const [ordersPage, setOrdersPage] = useState<PageResponse<OrderConfirmation> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [viewingOrderNumber, setViewingOrderNumber] = useState<string | null>(null);
  const [actionConfig, setActionConfig] = useState<{
    orderNumber: string;
    targetStatus?: OrderStatus;
    isConfirmReturn?: boolean;
  } | null>(null);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getOwnerOrdersApi(
      {
        page: currentPage,
        size: 15,
        status: selectedStatus || undefined,
        search: appliedSearch || undefined,
      },
      controller.signal
    )
      .then((data) => {
        if (ignore || controller.signal.aborted) return;
        setOrdersPage(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Lỗi tải danh sách đơn hàng');
        setIsLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentPage, selectedStatus, appliedSearch, refreshTrigger]);

  const handleTabChange = (status: OrderStatus | '') => {
    setSelectedStatus(status);
    setCurrentPage(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
    setCurrentPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(0);
  };

  const handleOpenAction = (orderNumber: string, targetStatus?: OrderStatus, isConfirmReturn = false) => {
    setActionConfig({ orderNumber, targetStatus, isConfirmReturn });
  };

  const handleExecuteAction = async (note: string) => {
    if (!actionConfig) return;
    const { orderNumber, targetStatus, isConfirmReturn } = actionConfig;

    if (isConfirmReturn) {
      await confirmReturnOwnerOrderApi(orderNumber, note);
      setFeedbackMessage({
        type: 'success',
        text: `Đã xác nhận kiện hàng hoàn #${orderNumber} về kho và khôi phục tồn kho thành công!`,
      });
    } else if (targetStatus) {
      await updateOwnerOrderStatusApi(orderNumber, targetStatus, note);
      setFeedbackMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái đơn hàng #${orderNumber} sang ${targetStatus} thành công!`,
      });
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', cls: 'border-[#E4BB78]/30 bg-[#E4BB78]/10 text-[#E4BB78]' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', cls: 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]' };
      case 'PROCESSING':
        return { label: 'Đang xử lý', cls: 'border-[#D6B27C]/30 bg-[#D6B27C]/10 text-[#D6B27C]' };
      case 'SHIPPING':
        return { label: 'Đang giao', cls: 'border-sky-400/30 bg-sky-500/10 text-sky-300' };
      case 'COMPLETED':
        return { label: 'Hoàn tất', cls: 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]' };
      case 'DELIVERY_FAILED':
        return { label: 'Giao thất bại', cls: 'border-orange-400/30 bg-orange-500/10 text-orange-300' };
      case 'RETURNED':
        return { label: 'Đã hoàn về kho', cls: 'border-purple-400/30 bg-purple-500/10 text-purple-300' };
      case 'CANCELLED':
        return { label: 'Đã hủy', cls: 'border-[#DF8D84]/30 bg-[#DF8D84]/10 text-[#DF8D84]' };
      default:
        return { label: status, cls: 'border-[#333235] bg-[#212226] text-[#AAA5A0]' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Studio Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#333235]/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D6B27C] block mb-1">
            OPERATIONS / ORDER FULFILLMENT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#F5F0E9]">
            Quản lý Đơn hàng
          </h1>
          <p className="text-xs text-[#AAA5A0] mt-1 max-w-xl">
            Theo dõi hành trình hoàn tất đơn hàng, xác nhận xử lý, bàn giao shipper và kiểm soát hàng hoàn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="px-3.5 py-2 bg-[#191A1D] hover:bg-[#212226] border border-[#333235] text-[#F5F0E9] font-mono text-xs rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xs border text-xs font-mono flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-[#8BC9A8]/10 border-[#8BC9A8]/30 text-[#8BC9A8]'
              : 'bg-[#DF8D84]/10 border-[#DF8D84]/30 text-[#DF8D84]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedbackMessage.type === 'success' ? '✓' : '⚠'}</span>
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-[#AAA5A0] hover:text-[#F5F0E9] cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Container: Status Tabs & Search Bar */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-xs p-4 space-y-4 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#333235]/60 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`px-3 py-1.5 rounded-xs text-[11px] font-mono tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D6B27C] text-[#0E0F11] font-bold shadow-xs'
                    : 'text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#212226]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Order Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn (#ORD-...), số ĐT, tên khách..."
                className="w-full px-3 py-2 bg-[#212226] border border-[#333235] rounded-xs text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:border-[#D6B27C] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA5A0] hover:text-[#F5F0E9] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] font-mono text-xs rounded-xs transition-colors cursor-pointer"
            >
              Tìm
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs font-mono text-[#AAA5A0]">
            <span>
              Tổng số đơn: <strong className="text-[#F5F0E9] font-bold">{ordersPage?.totalElements ?? 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Orders List */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-xs overflow-hidden shadow-sm">
        {isLoading && (
          <div className="py-20 text-center text-[#AAA5A0] font-mono text-xs">
            <div className="w-6 h-6 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-[#DF8D84] font-sans text-xs">
            <p className="font-bold mb-2">Đã xảy ra lỗi khi tải đơn hàng</p>
            <p className="text-[#AAA5A0] mb-4">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-1.5 bg-[#DF8D84]/20 border border-[#DF8D84]/40 text-[#DF8D84] rounded-xs font-mono cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && ordersPage?.items.length === 0 && (
          <div className="py-20 text-center text-[#AAA5A0] font-mono text-xs space-y-2">
            <p className="text-base text-[#F5F0E9]">Không tìm thấy đơn hàng nào</p>
            <p>
              {appliedSearch
                ? `Không có kết quả khớp với từ khóa "${appliedSearch}"`
                : selectedStatus
                ? `Hiện không có đơn hàng nào ở trạng thái ${selectedStatus}`
                : 'Cửa hàng chưa có đơn hàng nào.'}
            </p>
          </div>
        )}

        {/* Desktop Table View (>= 768px) */}
        {!isLoading && !error && ordersPage && ordersPage.items.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#212226] border-b border-[#333235] font-mono text-[11px] text-[#D6B27C] tracking-wider uppercase">
                <tr>
                  <th className="p-3.5">MÃ ĐƠN & NGÀY TẠO</th>
                  <th className="p-3.5">NGƯỜI NHẬN</th>
                  <th className="p-3.5">SẢN PHẨM TÓM TẮT</th>
                  <th className="p-3.5 text-right">TỔNG TIỀN (COD)</th>
                  <th className="p-3.5 text-center">TRẠNG THÁI</th>
                  <th className="p-3.5 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333235] text-[#F5F0E9]/90">
                {ordersPage.items.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const firstItem = order.items[0];
                  const remainingCount = order.items.length - 1;

                  return (
                    <tr key={order.orderId} className="hover:bg-[#212226]/50 transition-colors">
                      {/* Order number & Date */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#F5F0E9] tracking-wide">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[10px] font-mono text-[#AAA5A0] mt-0.5">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="p-3.5">
                        <div className="font-medium text-[#F5F0E9]">{order.recipient.name}</div>
                        <div className="text-[10px] font-mono text-[#AAA5A0]">{order.recipient.phone}</div>
                        <div className="text-[10px] text-[#AAA5A0]/80 truncate max-w-xs">
                          {order.recipient.city || order.recipient.address}
                        </div>
                      </td>

                      {/* Products Summary */}
                      <td className="p-3.5">
                        {firstItem && (
                          <div>
                            <span className="font-medium text-[#F5F0E9]">{firstItem.productName}</span>
                            <span className="text-[11px] font-mono text-[#AAA5A0] ml-1.5">
                              ({firstItem.colorName} / {firstItem.size} × {firstItem.quantity})
                            </span>
                          </div>
                        )}
                        {remainingCount > 0 && (
                          <span className="text-[10px] font-mono text-[#D6B27C] block mt-0.5">
                            +{remainingCount} mặt hàng khác
                          </span>
                        )}
                      </td>

                      {/* Total Amount & Payment */}
                      <td className="p-3.5 text-right">
                        <div className="font-mono font-bold text-[#F5F0E9] text-sm">
                          {formatVND(order.financials.finalAmount)}
                        </div>
                        <div className="text-[10px] font-mono mt-0.5">
                          <span
                            className={
                              order.paymentStatus === 'PAID' ? 'text-[#8BC9A8]' : 'text-[#E4BB78]'
                            }
                          >
                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thu tiền (COD)'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold border tracking-wider ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingOrderNumber(order.orderNumber)}
                          className="px-2.5 py-1.5 bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] font-mono text-[11px] rounded-xs transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>

                        {/* Quick transitions directly from table */}
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'CONFIRMED')}
                            className="px-2.5 py-1.5 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-[11px] font-bold rounded-xs transition-colors cursor-pointer"
                          >
                            Xác nhận
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'PROCESSING')}
                            className="px-2.5 py-1.5 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-[11px] font-bold rounded-xs transition-colors cursor-pointer"
                          >
                            Xử lý
                          </button>
                        )}

                        {order.status === 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'SHIPPING')}
                            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-[#0E0F11] font-mono text-[11px] font-bold rounded-xs transition-colors cursor-pointer"
                          >
                            Giao shipper
                          </button>
                        )}

                        {order.status === 'SHIPPING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'COMPLETED')}
                            className="px-2.5 py-1.5 bg-[#8BC9A8] hover:bg-[#9fd5ba] text-[#0E0F11] font-mono text-[11px] font-bold rounded-xs transition-colors cursor-pointer"
                          >
                            Hoàn tất
                          </button>
                        )}

                        {order.status === 'DELIVERY_FAILED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, undefined, true)}
                            className="px-2.5 py-1.5 bg-[#E4BB78] hover:bg-[#ebd097] text-[#0E0F11] font-mono text-[11px] font-bold rounded-xs transition-colors cursor-pointer"
                          >
                            Nhận hàng hoàn
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card List (< 768px) */}
        {!isLoading && !error && ordersPage && ordersPage.items.length > 0 && (
          <div className="block md:hidden divide-y divide-[#333235]">
            {ordersPage.items.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const firstItem = order.items[0];
              const remainingCount = order.items.length - 1;

              return (
                <div key={order.orderId} className="p-4 space-y-3">
                  {/* Top: Order # & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#F5F0E9] tracking-wide">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] font-mono text-[#AAA5A0] ml-2">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold border tracking-wider ${statusBadge.cls}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Recipient Snapshot */}
                  <div className="bg-[#212226] border border-[#333235] rounded-xs p-2.5 text-xs">
                    <div className="flex items-center justify-between font-medium text-[#F5F0E9]">
                      <span>{order.recipient.name}</span>
                      <span className="font-mono text-[11px] text-[#AAA5A0]">{order.recipient.phone}</span>
                    </div>
                    <p className="text-[11px] text-[#AAA5A0] mt-1 line-clamp-1">
                      {order.recipient.address}
                      {order.recipient.city ? `, ${order.recipient.city}` : ''}
                    </p>
                  </div>

                  {/* Products snippet */}
                  <div className="text-xs text-[#AAA5A0]">
                    {firstItem && (
                      <p className="text-[#F5F0E9]">
                        <strong>{firstItem.productName}</strong>
                        <span className="text-[#AAA5A0] font-mono text-[11px] ml-1">
                          ({firstItem.colorName} / {firstItem.size} × {firstItem.quantity})
                        </span>
                      </p>
                    )}
                    {remainingCount > 0 && (
                      <span className="text-[11px] font-mono text-[#D6B27C] block mt-0.5">
                        +{remainingCount} mặt hàng khác
                      </span>
                    )}
                  </div>

                  {/* Financials & Actions Row */}
                  <div className="pt-1 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-[#D6B27C] text-sm">
                        {formatVND(order.financials.finalAmount)}
                      </div>
                      <div className="text-[10px] font-mono">
                        <span className={order.paymentStatus === 'PAID' ? 'text-[#8BC9A8]' : 'text-[#E4BB78]'}>
                          {order.paymentStatus === 'PAID' ? 'Đã TT' : 'Thu COD'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingOrderNumber(order.orderNumber)}
                        className="px-3 py-1.5 bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] font-mono text-xs rounded-xs transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>

                      {order.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order.orderNumber, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-xs font-bold rounded-xs cursor-pointer"
                        >
                          Xác nhận
                        </button>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order.orderNumber, 'PROCESSING')}
                          className="px-3 py-1.5 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-xs font-bold rounded-xs cursor-pointer"
                        >
                          Xử lý
                        </button>
                      )}

                      {order.status === 'PROCESSING' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order.orderNumber, 'SHIPPING')}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-[#0E0F11] font-mono text-xs font-bold rounded-xs cursor-pointer"
                        >
                          Giao shipper
                        </button>
                      )}

                      {order.status === 'SHIPPING' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order.orderNumber, 'COMPLETED')}
                          className="px-3 py-1.5 bg-[#8BC9A8] hover:bg-[#9fd5ba] text-[#0E0F11] font-mono text-xs font-bold rounded-xs cursor-pointer"
                        >
                          Hoàn tất
                        </button>
                      )}

                      {order.status === 'DELIVERY_FAILED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order.orderNumber, undefined, true)}
                          className="px-3 py-1.5 bg-[#E4BB78] hover:bg-[#ebd097] text-[#0E0F11] font-mono text-xs font-bold rounded-xs cursor-pointer"
                        >
                          Nhận hoàn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {ordersPage && ordersPage.totalPages > 1 && (
          <div className="p-3.5 border-t border-[#333235] bg-[#212226] flex items-center justify-between text-xs font-mono text-[#AAA5A0]">
            <div>
              Trang {ordersPage.page + 1} / {ordersPage.totalPages} ({ordersPage.totalElements} đơn)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!ordersPage.hasPrevious}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 border border-[#333235] bg-[#191A1D] rounded-xs hover:bg-[#212226] text-[#F5F0E9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Trước
              </button>
              <button
                type="button"
                disabled={!ordersPage.hasNext}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border border-[#333235] bg-[#191A1D] rounded-xs hover:bg-[#212226] text-[#F5F0E9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OwnerOrderDetailModal
        isOpen={Boolean(viewingOrderNumber)}
        orderNumber={viewingOrderNumber}
        onClose={() => setViewingOrderNumber(null)}
        onTriggerAction={(orderNumber, targetStatus, isConfirmReturn) => {
          handleOpenAction(orderNumber, targetStatus, isConfirmReturn);
        }}
      />

      {/* Action Confirmation Modal */}
      <OwnerActionConfirmModal
        key={actionConfig ? `${actionConfig.orderNumber}-${actionConfig.targetStatus || 'return'}` : 'closed'}
        isOpen={Boolean(actionConfig)}
        orderNumber={actionConfig?.orderNumber || ''}
        targetStatus={actionConfig?.targetStatus}
        isConfirmReturn={actionConfig?.isConfirmReturn}
        onClose={() => setActionConfig(null)}
        onConfirm={handleExecuteAction}
      />
    </div>
  );
}
