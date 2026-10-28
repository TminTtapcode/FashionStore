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

    // Trigger refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-300' };
      case 'PROCESSING':
        return { label: 'Đang xử lý', cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' };
      case 'SHIPPING':
        return { label: 'Đang giao', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300' };
      case 'COMPLETED':
        return { label: 'Hoàn tất', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
      case 'DELIVERY_FAILED':
        return { label: 'Giao thất bại', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-300' };
      case 'RETURNED':
        return { label: 'Đã hoàn về kho', cls: 'border-purple-500/30 bg-purple-500/10 text-purple-300' };
      case 'CANCELLED':
        return { label: 'Đã hủy', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300' };
      default:
        return { label: status, cls: 'border-white/20 bg-white/5 text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-2xs border text-xs font-mono flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-white/40 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls: Status Tabs & Search Bar */}
      <div className="bg-[#111218] border border-white/10 rounded-xs p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`px-3 py-1.5 rounded-2xs text-[11px] font-mono tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C7AD83] text-[#0A0B0E] font-bold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn (#ORD-...), số ĐT, tên khách..."
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-2xs text-xs text-white placeholder-white/30 focus:border-[#C7AD83] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs rounded-2xs transition-colors cursor-pointer"
            >
              Tìm
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs font-mono text-white/50">
            <span>
              Tổng số đơn: <strong className="text-white">{ordersPage?.totalElements ?? 0}</strong>
            </span>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="p-1.5 text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-2xs transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="bg-[#111218] border border-white/10 rounded-xs overflow-hidden">
        {isLoading && (
          <div className="py-20 text-center text-white/50 font-mono text-xs">
            <div className="w-6 h-6 border-2 border-[#C7AD83] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-rose-300 font-sans text-xs">
            <p className="font-bold mb-2">Đã xảy ra lỗi khi tải đơn hàng</p>
            <p className="text-white/60 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-2xs font-mono cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && ordersPage?.items.length === 0 && (
          <div className="py-20 text-center text-white/40 font-mono text-xs space-y-2">
            <p className="text-base text-white/60">Không tìm thấy đơn hàng nào</p>
            <p>
              {appliedSearch
                ? `Không có kết quả khớp với từ khóa "${appliedSearch}"`
                : selectedStatus
                ? `Hiện không có đơn hàng nào ở trạng thái ${selectedStatus}`
                : 'Cửa hàng chưa có đơn hàng nào.'}
            </p>
          </div>
        )}

        {!isLoading && !error && ordersPage && ordersPage.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-white/5 border-b border-white/10 font-mono text-[11px] text-[#C7AD83]">
                <tr>
                  <th className="p-3.5">MÃ ĐƠN & NGÀY TẠO</th>
                  <th className="p-3.5">NGƯỜI NHẬN</th>
                  <th className="p-3.5">SẢN PHẨM TÓM TẮT</th>
                  <th className="p-3.5 text-right">TỔNG TIỀN (COD)</th>
                  <th className="p-3.5 text-center">TRẠNG THÁI</th>
                  <th className="p-3.5 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {ordersPage.items.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const firstItem = order.items[0];
                  const remainingCount = order.items.length - 1;

                  return (
                    <tr key={order.orderId} className="hover:bg-white/[0.02] transition-colors">
                      {/* Order number & Date */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white tracking-wide">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[10px] font-mono text-white/40 mt-0.5">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="p-3.5">
                        <div className="font-medium text-white">{order.recipient.name}</div>
                        <div className="text-[10px] font-mono text-white/50">{order.recipient.phone}</div>
                        <div className="text-[10px] text-white/40 truncate max-w-xs">
                          {order.recipient.city || order.recipient.address}
                        </div>
                      </td>

                      {/* Products Summary */}
                      <td className="p-3.5">
                        {firstItem && (
                          <div>
                            <span className="font-medium text-white/90">{firstItem.productName}</span>
                            <span className="text-[11px] font-mono text-white/50 ml-1.5">
                              ({firstItem.colorName} / {firstItem.size} × {firstItem.quantity})
                            </span>
                          </div>
                        )}
                        {remainingCount > 0 && (
                          <span className="text-[10px] font-mono text-[#C7AD83]">
                            +{remainingCount} mặt hàng khác
                          </span>
                        )}
                      </td>

                      {/* Total Amount & Payment */}
                      <td className="p-3.5 text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          {formatVND(order.financials.finalAmount)}
                        </div>
                        <div className="text-[10px] font-mono">
                          <span
                            className={
                              order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400/80'
                            }
                          >
                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thu tiền'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-2xs text-[10px] font-mono font-bold border tracking-wider ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingOrderNumber(order.orderNumber)}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-[11px] rounded-2xs transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>

                        {/* Quick transitions directly from table */}
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'CONFIRMED')}
                            className="px-2.5 py-1.5 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-mono text-[11px] font-bold rounded-2xs transition-colors cursor-pointer"
                          >
                            Xác nhận
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'PROCESSING')}
                            className="px-2.5 py-1.5 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-mono text-[11px] font-bold rounded-2xs transition-colors cursor-pointer"
                          >
                            Xử lý
                          </button>
                        )}

                        {order.status === 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'SHIPPING')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold rounded-2xs transition-colors cursor-pointer"
                          >
                            Giao shipper
                          </button>
                        )}

                        {order.status === 'SHIPPING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, 'COMPLETED')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold rounded-2xs transition-colors cursor-pointer"
                          >
                            Hoàn tất
                          </button>
                        )}

                        {order.status === 'DELIVERY_FAILED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order.orderNumber, undefined, true)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold rounded-2xs transition-colors cursor-pointer"
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

        {/* Pagination Footer */}
        {ordersPage && ordersPage.totalPages > 1 && (
          <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs font-mono text-white/60">
            <div>
              Trang {ordersPage.page + 1} / {ordersPage.totalPages} ({ordersPage.totalElements} đơn)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!ordersPage.hasPrevious}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 border border-white/15 rounded-2xs hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Trước
              </button>
              <button
                type="button"
                disabled={!ordersPage.hasNext}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border border-white/15 rounded-2xs hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
