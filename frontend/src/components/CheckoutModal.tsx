import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkoutCodApi } from '../api/orderApi';
import type { OrderConfirmation, CheckoutRequest } from '../types/order';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: (order: OrderConfirmation) => void;
}

const FREESHIP_THRESHOLD = 1000000;
const FLAT_SHIPPING_FEE = 30000;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();

  // Form states
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingCity, setShippingCity] = useState('TP. Hồ Chí Minh');
  const [shippingDistrict, setShippingDistrict] = useState('');
  const [shippingWard, setShippingWard] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);

  // Stable Idempotency Key per checkout modal open
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Generate a fresh idempotency key each time the checkout dialog opens
      const newKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'req_' + Math.random().toString(36).substring(2) + Date.now();
      setIdempotencyKey(newKey);
      setErrorMessage(null);
      setConfirmedOrder(null);

      // Pre-fill user information if available
      if (user) {
        setShippingName(user.fullName || '');
        setShippingPhone(user.phone || '');
      }
    }
  }, [isOpen, user]);

  // Financial calculations from current cart
  const subtotal = cart?.subtotal || 0;
  const isFreeship = subtotal >= FREESHIP_THRESHOLD;
  const shippingFee = isFreeship ? 0 : (subtotal > 0 ? FLAT_SHIPPING_FEE : 0);
  const amountToFreeship = Math.max(0, FREESHIP_THRESHOLD - subtotal);

  // Estimated final total before server validation
  const estimatedFinal = Math.max(0, subtotal + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CheckoutRequest = {
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingCity: shippingCity.trim() || undefined,
      shippingDistrict: shippingDistrict.trim() || undefined,
      shippingWard: shippingWard.trim() || undefined,
      shippingAddress: shippingAddress.trim(),
      shippingNote: shippingNote.trim() || undefined,
      couponCode: couponCode.trim() || undefined,
    };

    try {
      const order = await checkoutCodApi(payload, idempotencyKey);
      setConfirmedOrder(order);
      await refreshCart();
      if (onOrderSuccess) {
        onOrderSuccess(order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset state after transition
      setTimeout(() => {
        setConfirmedOrder(null);
        setErrorMessage(null);
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={handleModalClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#0d0f14] border border-[#E2C99B]/30 shadow-2xl rounded-sm text-stone-200 overflow-hidden z-10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-[#0A0B0E]/80">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#E2C99B]/80 font-mono block">
              ORDER DISPATCH • CASH ON DELIVERY
            </span>
            <h2 className="text-xl sm:text-2xl font-serif tracking-wide text-white font-medium mt-1">
              {confirmedOrder ? 'Đặt Hàng Thành Công' : 'Xác Nhận Đơn Hàng COD'}
            </h2>
          </div>
          <button
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="p-2 text-stone-400 hover:text-white transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {confirmedOrder ? (
          /* ================= ORDER SUCCESS VIEW ================= */
          <div className="p-6 sm:p-10 space-y-8 bg-gradient-to-b from-[#0d0f14] to-[#08090b]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#E2C99B]/10 border border-[#E2C99B]/40 flex items-center justify-center mx-auto text-[#E2C99B]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif text-white tracking-wide">
                Cảm ơn bạn đã lựa chọn Ivre. Atelier
              </h3>
              <p className="text-sm text-stone-300 max-w-lg mx-auto font-light leading-relaxed">
                Đơn hàng COD của bạn đã được tiếp nhận thành công. Chuyên viên chăm sóc khách hàng sẽ liên hệ qua số điện thoại để xác nhận chi tiết trước khi đóng gói và điều phối vận chuyển.
              </p>
            </div>

            {/* Order Details Badge */}
            <div className="bg-[#12151c] border border-white/10 p-5 rounded-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-widest block font-mono">
                    MÃ ĐƠN HÀNG
                  </span>
                  <span className="text-lg font-mono font-bold text-[#E2C99B] tracking-wider">
                    {confirmedOrder.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-widest block font-mono">
                    PHƯƠNG THỨC THANH TOÁN
                  </span>
                  <span className="text-sm text-white font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                    Thanh toán khi nhận hàng (COD)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-widest block font-mono">
                    TỔNG THANH TOÁN KHI NHẬN
                  </span>
                  <span className="text-lg font-semibold text-[#E2C99B]">
                    {confirmedOrder.financials.finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Recipient Snapshot */}
              <div className="text-xs text-stone-300 space-y-1 font-light">
                <p>
                  <strong className="text-white font-normal">Người nhận:</strong> {confirmedOrder.recipient.name} ({confirmedOrder.recipient.phone})
                </p>
                <p>
                  <strong className="text-white font-normal">Địa chỉ giao:</strong> {confirmedOrder.recipient.address}
                  {confirmedOrder.recipient.ward ? `, ${confirmedOrder.recipient.ward}` : ''}
                  {confirmedOrder.recipient.district ? `, ${confirmedOrder.recipient.district}` : ''}
                  {confirmedOrder.recipient.city ? `, ${confirmedOrder.recipient.city}` : ''}
                </p>
                {confirmedOrder.recipient.note && (
                  <p>
                    <strong className="text-white font-normal">Ghi chú:</strong> {confirmedOrder.recipient.note}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <button
                onClick={handleModalClose}
                className="px-8 py-3.5 bg-[#E2C99B] hover:bg-[#ebd8b3] text-[#0A0B0E] font-medium text-xs uppercase tracking-[0.2em] transition-colors rounded-sm shadow-lg text-center"
              >
                TIẾP TỤC MUA SẮM
              </button>
            </div>
          </div>
        ) : (
          /* ================= CHECKOUT FORM VIEW ================= */
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Left Column: Shipping Form */}
            <div className="md:col-span-7 p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  1. THÔNG TIN GIAO HÀNG
                </span>
                <span className="text-[11px] text-[#E2C99B]/80 font-mono">
                  GIAO TẬN NƠI • ĐỒNG KIỂM
                </span>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs rounded-sm leading-relaxed flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Họ và tên người nhận <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#12151c] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Số điện thoại <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full bg-[#12151c] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    className="w-full bg-[#12151c] border border-white/15 px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={shippingDistrict}
                    onChange={(e) => setShippingDistrict(e.target.value)}
                    placeholder="Quận 1"
                    className="w-full bg-[#12151c] border border-white/15 px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Phường / Xã
                  </label>
                  <input
                    type="text"
                    value={shippingWard}
                    onChange={(e) => setShippingWard(e.target.value)}
                    placeholder="Phường Bến Nghé"
                    className="w-full bg-[#12151c] border border-white/15 px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Đường Đồng Khởi, Tòa nhà Vincom"
                  className="w-full bg-[#12151c] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                  Ghi chú giao hàng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao 15 phút..."
                  className="w-full bg-[#12151c] border border-white/15 px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm resize-none"
                />
              </div>

              {/* Payment Method Badge */}
              <div className="pt-2">
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-2">
                  2. PHƯƠNG THỨC THANH TOÁN
                </span>
                <div className="p-3.5 bg-[#12151c] border border-[#E2C99B]/40 rounded-sm flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-[#E2C99B] flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#E2C99B]"></div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Được kiểm tra hàng cùng nhân viên bưu tá trước khi thanh toán. Miễn phí thu hộ toàn quốc.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="md:col-span-5 p-6 sm:p-8 bg-[#090b0e] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                    ĐƠN HÀNG ({cart?.totalItemCount || 0})
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    TỔNG TẠM TÍNH
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-1 border-b border-white/5 last:border-0">
                      <div className="w-12 h-14 bg-stone-900 border border-white/10 shrink-0 overflow-hidden rounded-sm">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-600">IVRE</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs text-white font-medium truncate">{item.productName}</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Size {item.size} • {item.colorName} • SL: {item.quantity}
                        </p>
                        <p className="text-xs text-[#E2C99B] font-mono mt-1">
                          {item.lineTotal.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher Input */}
                <div className="pt-2">
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Mã ưu đãi (Voucher)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="WELCOME10"
                      className="flex-1 bg-[#12151c] border border-white/15 px-3 py-2 text-xs text-white placeholder-stone-600 uppercase font-mono tracking-wider focus:outline-none focus:border-[#E2C99B] transition-colors rounded-sm"
                    />
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-300">
                    <span>Tạm tính hàng hóa:</span>
                    <span className="font-mono">{subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between text-stone-300">
                    <span>Phí vận chuyển COD:</span>
                    <span className="font-mono">
                      {isFreeship ? (
                        <span className="text-emerald-400 uppercase text-[11px]">Miễn phí (Freeship)</span>
                      ) : (
                        `${shippingFee.toLocaleString('vi-VN')} đ`
                      )}
                    </span>
                  </div>

                  {!isFreeship && amountToFreeship > 0 && (
                    <p className="text-[10px] text-stone-400 italic">
                      Mua thêm {amountToFreeship.toLocaleString('vi-VN')} đ để được Freeship toàn quốc (Đơn từ 1.000.000 đ).
                    </p>
                  )}

                  {couponCode && (
                    <div className="flex justify-between text-[#E2C99B]">
                      <span>Mã giảm giá đã nhập:</span>
                      <span className="font-mono font-medium">{couponCode} (Sẽ đối soát tại máy chủ)</span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3 flex justify-between items-baseline text-white">
                    <span className="font-medium tracking-wide">TỔNG THANH TOÁN (COD):</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-[#E2C99B]">
                      {estimatedFinal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSubmitting || !cart || cart.items.length === 0}
                  className="w-full py-4 bg-[#E2C99B] hover:bg-[#ebd8b3] text-[#0A0B0E] font-medium text-xs uppercase tracking-[0.2em] transition-all rounded-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-[#0A0B0E]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN ĐẶT HÀNG COD</span>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center mt-2.5">
                  Bằng việc bấm xác nhận, bạn đồng ý nhận hàng và thanh toán trực tiếp cho bưu tá khi bưu tá giao tới.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
