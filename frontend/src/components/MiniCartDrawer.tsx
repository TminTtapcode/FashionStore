import { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const FREESHIP_THRESHOLD = 1000000; // 1.000.000 VND

interface MiniCartDrawerProps {
  onProceedToCheckout?: () => void;
}

export default function MiniCartDrawer({ onProceedToCheckout }: MiniCartDrawerProps) {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem, isLoading } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const items = cart?.items || [];
  const totalCount = cart?.totalItemCount || 0;
  const subtotal = cart?.subtotal || 0;
  const freeshipProgress = Math.min(100, (subtotal / FREESHIP_THRESHOLD) * 100);
  const remainingForFreeship = Math.max(0, FREESHIP_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-[#0D0E12] text-[#F7F7F4] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300"
        >
          {/* Top Gold Accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C7AD83] to-transparent shrink-0" />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <span className="font-editorial text-lg tracking-tight font-medium uppercase text-white">
                GIỎ HÀNG THỜI TRANG
              </span>
              <span className="font-mono text-xs text-[#C7AD83] font-bold bg-[#C7AD83]/15 px-2 py-0.5 rounded-2xs border border-[#C7AD83]/30">
                {totalCount}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Đóng giỏ hàng"
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1L13 13M1 13L13 1" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Free Shipping Incentive Progress Bar */}
          <div className="bg-white/[0.03] px-4 py-3 border-b border-white/10 text-xs font-mono">
            {remainingForFreeship === 0 ? (
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>CHÚC MỪNG! BẠN ĐÃ ĐƯỢC FREESHIP TOÀN QUỐC</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-white/60 text-[11px]">
                  <span>Mua thêm <strong className="text-[#C7AD83]">{formatVND(remainingForFreeship)}</strong> để nhận Freeship</span>
                  <span className="text-[#C7AD83] font-bold">{Math.round(freeshipProgress)}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C7AD83]/70 to-[#C7AD83] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${freeshipProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {isLoading && items.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center font-mono text-xs text-white/40 space-y-2">
                <span className="animate-spin w-5 h-5 border-2 border-[#C7AD83] border-t-transparent rounded-full"></span>
                <span>ĐANG TẢI GIỎ HÀNG...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center font-mono text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40 text-sm">
                  0
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-sans uppercase tracking-wider text-white">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-white/40 font-mono">Chưa có mẫu trang phục nào được chọn</p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 border border-[#C7AD83] bg-[#C7AD83]/15 text-[#C7AD83] hover:bg-[#C7AD83] hover:text-[#0D0E12] px-5 py-2.5 text-xs uppercase tracking-widest font-mono font-bold transition-all cursor-pointer rounded-xs"
                >
                  KHÁM PHÁ BỘ SƯU TẬP ✦
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 pb-4 border-b border-white/10 transition-opacity ${
                    !item.isAvailable ? 'opacity-60 bg-red-950/20 p-2 border border-red-500/30' : ''
                  }`}
                >
                  {/* Thumbnail (3:4 ratio) */}
                  <div className="w-20 h-26 bg-[#16171B] shrink-0 overflow-hidden border border-white/10 rounded-2xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/30">
                        NO PIC
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <h3 className="font-sans text-sm font-medium leading-tight text-white truncate">
                        {item.productName}
                      </h3>

                      {/* Variant metadata */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                            style={{ backgroundColor: item.colorHex || '#CCCCCC' }}
                          />
                          <span>{item.colorName}</span>
                        </span>
                        <span>·</span>
                        <span>Size {item.size}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 font-mono text-xs">
                        <span className="font-bold text-white">{formatVND(item.unitPrice)}</span>
                        {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
                          <span className="text-[10px] text-white/40 line-through">
                            {formatVND(item.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock Warning */}
                      {item.isAvailable && item.stockQuantity <= 3 && (
                        <p className="text-[10px] font-mono text-amber-400">
                          (Chỉ còn {item.stockQuantity} sản phẩm trong kho)
                        </p>
                      )}

                      {/* Unavailable Alert */}
                      {!item.isAvailable && (
                        <p className="text-[10px] font-mono font-bold text-red-400 uppercase">
                          [{item.unavailableReason || 'Tạm hết hàng'}]
                        </p>
                      )}
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-white/20 bg-white/5 font-mono text-xs h-7 rounded-2xs">
                        <button
                          type="button"
                          disabled={item.quantity <= 1 || isLoading}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-0.5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-[11px] text-white">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={item.quantity >= 10 || item.quantity >= item.stockQuantity || isLoading}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-0.5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-xs font-bold text-[#C7AD83]">
                          {formatVND(item.lineTotal)}
                        </span>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => removeItem(item.id)}
                          aria-label={`Xóa ${item.productName}`}
                          className="text-[11px] text-white/40 hover:text-red-400 uppercase tracking-wider underline cursor-pointer transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action Bar */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-white/50 uppercase tracking-wider">TẠM TÍNH:</span>
                <span className="text-lg font-bold text-[#C7AD83]">{formatVND(subtotal)}</span>
              </div>

              {cart?.hasUnavailableItems && (
                <div className="bg-amber-950/30 border border-amber-500/40 p-2.5 text-[11px] font-mono text-amber-300 rounded-xs">
                  Một số sản phẩm trong giỏ tạm thời không còn khả dụng. Vui lòng xóa trước khi tiến hành thanh toán.
                </div>
              )}

              <p className="text-[10px] font-mono text-white/40 leading-tight">
                * Giá và tồn kho có thể thay đổi trước khi hoàn tất đặt hàng. Phí vận chuyển và voucher sẽ được áp dụng tại bước tiếp theo.
              </p>

              {/* Checkout CTA */}
              <button
                type="button"
                disabled={items.length === 0 || cart?.hasUnavailableItems}
                onClick={() => {
                  if (onProceedToCheckout) {
                    onProceedToCheckout();
                  } else {
                    alert('Chức năng Checkout COD đang được chuẩn bị ở Phase 4!');
                  }
                }}
                className="w-full h-11 bg-[#C7AD83] hover:bg-[#D9C09A] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_20px_rgba(199,173,131,0.25)] hover:shadow-[0_6px_28px_rgba(199,173,131,0.4)]"
              >
                <span>TIẾN HÀNH ĐẶT HÀNG COD</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
