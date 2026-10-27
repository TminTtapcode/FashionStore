import { useEffect, useState } from 'react';
import { getMyOrdersApi, cancelOrderApi } from '../api/orderApi';
import type { OrderConfirmation, OrderStatus } from '../types/order';

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<OrderStatus, { text: string; color: string }> = {
  PENDING: { text: 'CHỜ XÁC NHẬN', color: 'bg-[#C7AD83]/20 text-[#C7AD83] border-[#C7AD83]/40' },
  CONFIRMED: { text: 'ĐÃ XÁC NHẬN', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  PROCESSING: { text: 'ĐANG CHUẨN BỊ', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  SHIPPING: { text: 'ĐANG GIAO HÀNG', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  COMPLETED: { text: 'HOÀN TẤT', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  DELIVERY_FAILED: { text: 'GIAO THẤT BẠI', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  RETURNED: { text: 'ĐÃ TRẢ HÀNG', color: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/40' },
  CANCELLED: { text: 'ĐÃ HỦY', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function OrderHistoryDrawer({ isOpen, onClose }: OrderHistoryDrawerProps) {
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý không muốn mua nữa');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Expanded status history
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyOrdersApi();
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrderNumber) return;
    setIsSubmittingCancel(true);
    setCancelError(null);
    try {
      const updatedOrder = await cancelOrderApi(cancellingOrderNumber, cancelReason);
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === cancellingOrderNumber ? updatedOrder : o))
      );
      setCancellingOrderNumber(null);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Không thể hủy đơn hàng');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          aria-label="Lịch sử đơn hàng"
          className="w-screen max-w-xl bg-[#111216] border-l border-white/10 shadow-2xl flex flex-col text-white"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-xl sm:text-2xl font-medium tracking-tight text-white">
                ĐƠN HÀNG CỦA TÔI
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-[#C7AD83]/20 text-[#C7AD83] font-bold border border-[#C7AD83]/40">
                {orders.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng ngăn lịch sử đơn hàng"
              className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-20 text-center font-mono text-xs text-gray-400 space-y-3">
                <div className="w-6 h-6 border-2 border-[#C7AD83] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải danh sách đơn hàng...</p>
              </div>
            ) : error ? (
              <div className="p-4 border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs font-mono space-y-3 rounded-xs">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={loadOrders}
                  className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 uppercase"
                >
                  Thử lại
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center space-y-4 font-mono text-xs text-gray-400">
                <p className="font-editorial text-2xl text-white font-light">Chưa có đơn hàng nào</p>
                <p>Khám phá bộ sưu tập và đặt trang phục yêu thích của bạn.</p>
              </div>
            ) : (
              orders.map((order) => {
                const statusMeta = STATUS_LABELS[order.status] || {
                  text: order.status,
                  color: 'bg-white/10 text-white border-white/20',
                };
                const canCancel = order.status === 'PENDING';
                const isExpanded = expandedOrder === order.orderNumber;

                return (
                  <div
                    key={order.orderNumber}
                    className="border border-white/10 bg-[#16171D] p-5 rounded-xs space-y-4 hover:border-white/20 transition-colors"
                  >
                    {/* Top Row: Order Number, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-white tracking-wider block">
                          #{order.orderNumber}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 border uppercase tracking-widest rounded-2xs ${statusMeta.color}`}
                      >
                        {statusMeta.text}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img
                            src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80'}
                            alt={item.productName}
                            className="w-12 h-16 object-cover bg-black/40 border border-white/10 rounded-2xs shrink-0"
                          />
                          <div className="flex-1 min-w-0 font-mono text-xs">
                            <h4 className="text-white truncate font-medium">{item.productName}</h4>
                            <p className="text-[11px] text-gray-400">
                              Size {item.size} · {item.colorName} · SL: {item.quantity}
                            </p>
                            <p className="text-[11px] text-[#C7AD83]">{formatVnd(item.totalPrice)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-3 border-t border-white/10 font-mono text-xs space-y-1">
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Tạm tính:</span>
                        <span>{formatVnd(order.financials.subtotalAmount)}</span>
                      </div>
                      {order.financials.discountAmount > 0 && (
                        <div className="flex justify-between text-[#C7AD83] text-[11px]">
                          <span>Giảm giá ({order.financials.couponCode || 'Voucher'}):</span>
                          <span>-{formatVnd(order.financials.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Phí vận chuyển:</span>
                        <span>{order.financials.shippingFee === 0 ? 'MIỄN PHÍ' : formatVnd(order.financials.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5 text-sm">
                        <span>Tổng thanh toán ({order.paymentMethod}):</span>
                        <span className="text-[#C7AD83]">{formatVnd(order.financials.finalAmount)}</span>
                      </div>
                    </div>

                    {/* Timeline & Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.orderNumber)}
                        className="font-mono text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? 'Ẩn lịch sử' : 'Xem tiến trình'}</span>
                        <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrderNumber(order.orderNumber);
                            setCancelReason('Đổi ý không muốn mua nữa');
                            setCancelError(null);
                          }}
                          className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 transition-all rounded-xs cursor-pointer"
                        >
                          Hủy đơn hàng
                        </button>
                      )}
                    </div>

                    {/* Status History Timeline (collapsible) */}
                    {isExpanded && order.statusHistory && order.statusHistory.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <span className="font-mono text-[10px] uppercase text-gray-400 tracking-wider block font-bold">
                          Tiến trình đơn hàng:
                        </span>
                        <div className="space-y-2 pl-3 border-l-2 border-white/15">
                          {order.statusHistory.map((h) => (
                            <div key={h.id} className="font-mono text-[11px] relative">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {STATUS_LABELS[h.toStatus]?.text || h.toStatus}
                                </span>
                                <span className="text-[10px] text-gray-400">· {formatDate(h.createdAt)}</span>
                              </div>
                              {h.note && <p className="text-[10px] text-gray-300 italic">"{h.note}"</p>}
                              <span className="text-[9px] text-gray-500 block">Bởi: {h.changedBy}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Confirmation Modal for Order Cancellation */}
      {cancellingOrderNumber && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#16171D] border border-white/15 max-w-md w-full p-6 rounded-xs space-y-5 text-white shadow-2xl">
            <h3 className="font-editorial text-xl font-medium tracking-tight text-rose-400">
              Xác Nhận Hủy Đơn Hàng #{cancellingOrderNumber}
            </h3>
            <p className="font-mono text-xs text-gray-300 leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng này? Toàn bộ số lượng trang phục sẽ được hoàn lại vào kho ngay lập tức.
            </p>

            <div className="space-y-2 font-mono text-xs">
              <label htmlFor="cancelReasonInput" className="text-gray-300 block">Lý do hủy đơn:</label>
              <select
                id="cancelReasonInput"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#111216] border border-white/20 px-3 py-2 text-white focus:outline-hidden focus:border-[#C7AD83] rounded-xs"
              >
                <option value="Đổi ý không muốn mua nữa">Đổi ý không muốn mua nữa</option>
                <option value="Muốn thay đổi địa chỉ hoặc số điện thoại">Muốn thay đổi địa chỉ hoặc số điện thoại</option>
                <option value="Muốn đổi sang kích cỡ / màu sắc khác">Muốn đổi sang kích cỡ / màu sắc khác</option>
                <option value="Thời gian giao hàng không phù hợp">Thời gian giao hàng không phù hợp</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            {cancelError && (
              <div className="p-2 border border-rose-500/50 bg-rose-950/30 text-rose-300 text-xs font-mono">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={() => setCancellingOrderNumber(null)}
                className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                Giữ đơn hàng
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
