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
        return { label: 'Chờ xác nhận', cls: 'border-[#E4BB78]/30 bg-[#E4BB78]/10 text-[#E4BB78]' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', cls: 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]' };
      case 'PROCESSING':
        return { label: 'Đang xử lý', cls: 'border-[#D6B27C]/30 bg-[#D6B27C]/10 text-[#D6B27C]' };
      case 'SHIPPING':
        return { label: 'Đang giao hàng', cls: 'border-sky-400/30 bg-sky-500/10 text-sky-300' };
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
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-[#191A1D] border border-[#333235] rounded-t-xl sm:rounded-xs shadow-2xl flex flex-col text-[#F5F0E9] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#333235] bg-[#0E0F11]/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono tracking-widest text-[#D6B27C] uppercase font-bold">
                ATELIER ORDER AUDIT
              </span>
              {order && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${getStatusBadge(order.status).cls}`}>
                  {getStatusBadge(order.status).label}
                </span>
              )}
            </div>
            <h2 id="order-detail-title" className="font-serif text-lg sm:text-xl text-[#F5F0E9] font-medium">
              Đơn hàng #{orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn"
            className="w-8 h-8 flex items-center justify-center text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#212226] rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs font-sans">
          {isLoading && (
            <div className="py-16 text-center text-[#AAA5A0] font-mono">
              <div className="w-6 h-6 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải thông tin đơn hàng #{orderNumber}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#DF8D84]/10 border border-[#DF8D84]/30 rounded-xs text-[#DF8D84]">
              <p className="font-bold mb-1">Không thể tải thông tin đơn hàng</p>
              <p>{error}</p>
            </div>
          )}

          {order && (
            <>
              {/* Row 1: Customer details & Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer card */}
                <div className="p-4 bg-[#212226] border border-[#333235] rounded-xs space-y-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#D6B27C] font-bold">
                    Thông tin Giao hàng
                  </h3>
                  <div className="space-y-1 text-[#AAA5A0]">
                    <p><strong className="text-[#F5F0E9]">Người nhận:</strong> {order.recipient.name}</p>
                    <p><strong className="text-[#F5F0E9]">Số điện thoại:</strong> {order.recipient.phone}</p>
                    <p>
                      <strong className="text-[#F5F0E9]">Địa chỉ:</strong> {order.recipient.address}
                      {order.recipient.ward ? `, ${order.recipient.ward}` : ''}
                      {order.recipient.district ? `, ${order.recipient.district}` : ''}
                      {order.recipient.city ? `, ${order.recipient.city}` : ''}
                    </p>
                    {order.recipient.note && (
                      <p className="text-[#E4BB78] pt-1">
                        <strong className="text-[#E4BB78]">Ghi chú của khách:</strong> "{order.recipient.note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial breakdown card */}
                <div className="p-4 bg-[#212226] border border-[#333235] rounded-xs space-y-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#D6B27C] font-bold">
                    Thanh toán & Doanh thu
                  </h3>
                  <div className="space-y-1.5 text-[#AAA5A0]">
                    <div className="flex justify-between">
                      <span>Tạm tính dòng hàng:</span>
                      <span className="font-mono text-[#F5F0E9]">{formatVND(order.financials.subtotalAmount)}</span>
                    </div>
                    {order.financials.discountAmount > 0 && (
                      <div className="flex justify-between text-[#8BC9A8]">
                        <span>
                          Giảm giá {order.financials.couponCode ? `(${order.financials.couponCode})` : ''}:
                        </span>
                        <span className="font-mono">-{formatVND(order.financials.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span className="font-mono text-[#F5F0E9]">
                        {order.financials.shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(order.financials.shippingFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#333235] flex justify-between items-center text-sm">
                      <span className="font-bold text-[#F5F0E9]">Tổng tiền thu COD:</span>
                      <span className="font-mono font-bold text-[#D6B27C] text-base">
                        {formatVND(order.financials.finalAmount)}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#AAA5A0]">Trạng thái thanh toán:</span>
                      <span
                        className={`px-2 py-0.5 rounded-xs border ${
                          order.paymentStatus === 'PAID'
                            ? 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]'
                            : 'border-[#E4BB78]/30 bg-[#E4BB78]/10 text-[#E4BB78]'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN (COD)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Order Items */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#D6B27C] font-bold mb-2.5">
                  Sản phẩm trong đơn ({order.items.length} mặt hàng)
                </h3>
                <div className="border border-[#333235] rounded-xs overflow-hidden">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#212226] border-b border-[#333235] font-mono text-[11px] text-[#D6B27C]">
                      <tr>
                        <th className="p-3">SẢN PHẨM</th>
                        <th className="p-3">PHÂN LOẠI</th>
                        <th className="p-3 text-right">ĐƠN GIÁ</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-right">THÀNH TIỀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333235] text-[#F5F0E9]/90">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-[#212226]/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.thumbnailUrl && (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.productName}
                                  className="w-10 h-12 object-cover rounded-xs border border-[#333235] shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-medium text-[#F5F0E9]">{item.productName}</p>
                                <p className="text-[10px] font-mono text-[#AAA5A0]">SKU: {item.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            <span>{item.colorName}</span> / <span className="font-bold text-[#F5F0E9]">{item.size}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-[#AAA5A0]">{formatVND(item.unitPrice)}</td>
                          <td className="p-3 text-center font-mono font-bold text-[#F5F0E9]">{item.quantity}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#F5F0E9]">
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
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-[#D6B27C] font-bold mb-2.5 flex items-center gap-1.5">
                  <span>✦</span>
                  <span>Nhật ký chuyển đổi trạng thái (Audit Trail)</span>
                </h3>
                <div className="p-4 bg-[#212226] border border-[#333235] rounded-xs">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="relative border-l border-[#333235] pl-4 ml-2 space-y-4">
                      {order.statusHistory.map((h) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#D6B27C] border-2 border-[#191A1D]" />
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {h.fromStatus && (
                              <>
                                <span className="font-mono text-[10px] text-[#AAA5A0]">{h.fromStatus}</span>
                                <span className="text-[#AAA5A0]/50 text-[10px]">→</span>
                              </>
                            )}
                            <span className="font-mono text-[11px] font-bold text-[#D6B27C]">{h.toStatus}</span>
                            <span className="text-[10px] font-mono text-[#AAA5A0]">• {formatDate(h.createdAt)}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#191A1D] border border-[#333235] rounded-xs text-[#AAA5A0]">
                              {h.changedBy}
                            </span>
                          </div>
                          {h.note && <p className="text-[#F5F0E9]/80 text-xs italic">"{h.note}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#AAA5A0] italic">Chưa có bản ghi lịch sử trạng thái.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Transition Action Bar */}
        {order && (
          <div className="p-4 border-t border-[#333235] bg-[#0E0F11]/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-[#AAA5A0] font-mono">
              <span>Hành động cho trạng thái </span>
              <strong className="text-[#F5F0E9]">{order.status}</strong>:
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CONFIRMED')}
                    className="px-3.5 py-2 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer shadow-sm"
                  >
                    Xác nhận đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-[#DF8D84]/40 hover:bg-[#DF8D84]/20 text-[#DF8D84] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer"
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
                    className="px-3.5 py-2 bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer shadow-sm"
                  >
                    Bắt đầu đóng gói
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-[#DF8D84]/40 hover:bg-[#DF8D84]/20 text-[#DF8D84] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer"
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
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-[#0E0F11] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer shadow-sm"
                  >
                    Bàn giao vận chuyển
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'CANCELLED')}
                    className="px-3.5 py-2 border border-[#DF8D84]/40 hover:bg-[#DF8D84]/20 text-[#DF8D84] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer"
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
                    className="px-3.5 py-2 bg-[#8BC9A8] hover:bg-[#9fd5ba] text-[#0E0F11] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer shadow-sm"
                  >
                    Giao thành công & Thu tiền COD
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerAction(order.orderNumber, 'DELIVERY_FAILED')}
                    className="px-3.5 py-2 border border-orange-400/50 hover:bg-orange-500/20 text-orange-300 font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer"
                  >
                    Báo giao thất bại
                  </button>
                </>
              )}

              {order.status === 'DELIVERY_FAILED' && (
                <button
                  type="button"
                  onClick={() => onTriggerAction(order.orderNumber, undefined, true)}
                  className="px-4 py-2 bg-[#E4BB78] hover:bg-[#ebd097] text-[#0E0F11] font-mono text-xs uppercase font-bold rounded-xs transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <span>✦</span>
                  <span>Xác nhận nhận hàng hoàn về kho & Hoàn tồn</span>
                </button>
              )}

              {['COMPLETED', 'CANCELLED', 'RETURNED'].includes(order.status) && (
                <span className="text-[#AAA5A0] font-mono text-xs italic">
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
