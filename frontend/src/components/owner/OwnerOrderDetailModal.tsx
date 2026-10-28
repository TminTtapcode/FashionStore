import { useEffect, useState, useRef } from 'react';
import { getOwnerOrderDetailApi } from '../../api/ownerOrderApi';
import type { OrderConfirmation, OrderStatus } from '../../types/order';

interface OwnerOrderDetailModalProps {
  isOpen: boolean;
  orderNumber: string | null;
  onClose: () => void;
  onTriggerAction: (orderNumber: string, targetStatus?: OrderStatus, isConfirmReturn?: boolean) => void;
}

export default function OwnerOrderDetailModal({
  isOpen,
  orderNumber,
  onClose,
  onTriggerAction,
}: OwnerOrderDetailModalProps) {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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
    if (!isOpen || !orderNumber) {
      setOrder(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getOwnerOrderDetailApi(orderNumber, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setOrder(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Lỗi tải chi tiết đơn hàng');
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, orderNumber]);

  // Focus trap and Escape listener
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        const closeBtn = containerRef.current?.querySelector<HTMLElement>('button[aria-label="Đóng chi tiết đơn"]');
        closeBtn?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        previouslyFocusedRef.current?.focus?.();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-300' };
      case 'PROCESSING':
        return { label: 'Đang xử lý', cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' };
      case 'SHIPPING':
        return { label: 'Đang giao hàng', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300' };
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
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0E0F14] border border-white/15 rounded-xs shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono tracking-widest text-[#C7AD83] uppercase font-bold">
                  ATELIER ORDER AUDIT
                </span>
                {order && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-2xs border ${getStatusBadge(order.status).cls}`}>
                    {getStatusBadge(order.status).label}
                  </span>
                )}
              </div>
              <h2 id="order-detail-title" className="font-editorial text-xl text-white font-medium">
                Đơn hàng #{orderNumber}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn"
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {isLoading && (
            <div className="py-16 text-center text-white/50 font-mono">
              <div className="w-6 h-6 border-2 border-[#C7AD83] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải thông tin đơn hàng #{orderNumber}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xs text-rose-300">
              <p className="font-bold mb-1">Không thể tải thông tin đơn hàng</p>
              <p>{error}</p>
            </div>
          )}

          {order && (
            <>
              {/* Row 1: Customer details & Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer card */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xs space-y-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#C7AD83] font-bold">
                    Thông tin Giao hàng
                  </h3>
                  <div className="space-y-1 text-white/80">
                    <p><strong className="text-white">Người nhận:</strong> {order.recipient.name}</p>
                    <p><strong className="text-white">Số điện thoại:</strong> {order.recipient.phone}</p>
                    <p>
                      <strong className="text-white">Địa chỉ:</strong> {order.recipient.address}
                      {order.recipient.ward ? `, ${order.recipient.ward}` : ''}
                      {order.recipient.district ? `, ${order.recipient.district}` : ''}
                      {order.recipient.city ? `, ${order.recipient.city}` : ''}
                    </p>
                    {order.recipient.note && (
                      <p className="text-amber-200/90 pt-1">
                        <strong className="text-amber-300">Ghi chú của khách:</strong> "{order.recipient.note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial breakdown card */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xs space-y-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#C7AD83] font-bold">
                    Thanh toán & Doanh thu
                  </h3>
                  <div className="space-y-1.5 text-white/80">
                    <div className="flex justify-between">
                      <span>Tạm tính dòng hàng:</span>
                      <span className="font-mono text-white">{formatVND(order.financials.subtotalAmount)}</span>
                    </div>
                    {order.financials.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>
                          Giảm giá {order.financials.couponCode ? `(${order.financials.couponCode})` : ''}:
                        </span>
                        <span className="font-mono">-{formatVND(order.financials.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span className="font-mono text-white">
                        {order.financials.shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(order.financials.shippingFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                      <span className="font-bold text-white">Tổng tiền thu COD:</span>
                      <span className="font-mono font-bold text-[#C7AD83] text-base">
                        {formatVND(order.financials.finalAmount)}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-white/50">Trạng thái thanh toán:</span>
                      <span
                        className={`px-2 py-0.5 rounded-2xs border ${
                          order.paymentStatus === 'PAID'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN (COD)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Order Items Table */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#C7AD83] font-bold mb-2.5">
                  Sản phẩm trong đơn ({order.items.length} mặt hàng)
                </h3>
                <div className="border border-white/10 rounded-2xs overflow-hidden">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-white/5 border-b border-white/10 font-mono text-[11px] text-[#C7AD83]">
                      <tr>
                        <th className="p-3">SẢN PHẨM</th>
                        <th className="p-3">PHÂN LOẠI</th>
                        <th className="p-3 text-right">ĐƠN GIÁ</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-right">THÀNH TIỀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-white/80">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.thumbnailUrl && (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.productName}
                                  className="w-10 h-12 object-cover rounded-2xs border border-white/10 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-medium text-white">{item.productName}</p>
                                <p className="text-[10px] font-mono text-white/50">SKU: {item.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            <span>{item.colorName}</span> / <span className="font-bold text-white">{item.size}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-white/70">{formatVND(item.unitPrice)}</td>
                          <td className="p-3 text-center font-mono font-bold text-white">{item.quantity}</td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            {formatVND(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 3: Status History Audit Trail */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#C7AD83] font-bold mb-2.5 flex items-center gap-1.5">
                  <span>✦</span>
                  <span>Nhật ký chuyển đổi trạng thái (Audit Trail)</span>
                </h3>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xs">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="relative border-l border-white/15 pl-4 ml-2 space-y-4">
                      {order.statusHistory.map((h) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#C7AD83] border-2 border-[#0E0F14]" />
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {h.fromStatus && (
                              <>
                                <span className="font-mono text-[10px] text-white/50">{h.fromStatus}</span>
                                <span className="text-white/30 text-[10px]">→</span>
                              </>
                            )}
                            <span className="font-mono text-[11px] font-bold text-[#C7AD83]">{h.toStatus}</span>
                            <span className="text-[10px] font-mono text-white/40">• {formatDate(h.createdAt)}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded-2xs text-white/70">
                              {h.changedBy}
                            </span>
                          </div>
                          {h.note && <p className="text-white/70 text-xs italic">"{h.note}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 italic">Chưa có bản ghi lịch sử trạng thái.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Allowed Transition Action Bar */}
        {order && (
          <div className="p-4 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-white/60 font-mono">
              <span>Hành động khả dụng cho trạng thái </span>
              <strong className="text-white">{order.status}</strong>:
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Allowed actions based on OrderStatus state machine */}
              {order.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CONFIRMED')}
                    className="px-3.5 py-2 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer shadow-sm"
                  >
                    Xác nhận đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-rose-500/40 hover:bg-rose-500/20 text-rose-300 font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {order.status === 'CONFIRMED' && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'PROCESSING')}
                    className="px-3.5 py-2 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer shadow-sm"
                  >
                    Bắt đầu đóng gói
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-rose-500/40 hover:bg-rose-500/20 text-rose-300 font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {order.status === 'PROCESSING' && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'SHIPPING')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer shadow-sm"
                  >
                    Bàn giao vận chuyển
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-rose-500/40 hover:bg-rose-500/20 text-rose-300 font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {order.status === 'SHIPPING' && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'COMPLETED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer shadow-sm"
                  >
                    Giao thành công & Thu tiền COD
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'DELIVERY_FAILED')}
                    className="px-3.5 py-2 border border-orange-500/50 hover:bg-orange-500/20 text-orange-300 font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer"
                  >
                    Báo giao thất bại
                  </button>
                </>
              )}

              {order.status === 'DELIVERY_FAILED' && (
                <button
                  type="button"
                  onClick={() => onTriggerAction(order.orderNumber, undefined, true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs uppercase font-bold rounded-2xs transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <span>✦</span>
                  <span>Xác nhận nhận hàng hoàn về kho & Hoàn tồn</span>
                </button>
              )}

              {['COMPLETED', 'CANCELLED', 'RETURNED'].includes(order.status) && (
                <span className="text-white/40 font-mono text-xs italic">
                  Đơn hàng đã kết thúc vòng đời (Terminal state). Không thể thay đổi trạng thái.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
