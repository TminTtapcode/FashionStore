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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-[#FAF9F6] text-[#121212] shadow-2xl flex flex-col border-l border-[#E6E4DF] animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E6E4DF] flex items-center justify-between bg-[#F4F1EA]">
            <div className="flex items-center gap-2">
              <h2 id="cart-title" className="font-serif text-lg tracking-tight font-medium uppercase">
                GIỎ HÀNG THỜI TRANG
              </h2>
              <span className="font-mono text-xs text-[#888888] font-bold">
                [{totalCount}]
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="font-mono text-xs border border-[#121212] px-2.5 py-1 uppercase tracking-wider hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer"
            >
              [X] ĐÓNG
            </button>
          </div>

          {/* Free Shipping Incentive Progress Bar */}
          <div className="bg-[#EFECE6] px-4 py-2.5 border-b border-[#E6E4DF] text-xs font-mono">
            {remainingForFreeship === 0 ? (
              <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                <span>CHÚC MỪNG! BẠN ĐÃ ĐỦ ĐIỀU KIỆN FREESHIP TOÀN QUỐC</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#555555]">
                  <span>Mua thêm <strong className="text-[#121212]">{formatVND(remainingForFreeship)}</strong> để nhận Freeship</span>
                  <span>{Math.round(freeshipProgress)}%</span>
                </div>
                <div className="w-full bg-[#D8D4CC] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#121212] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${freeshipProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {isLoading && items.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center font-mono text-xs text-[#888888] space-y-2">
                <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></span>
                <span>ĐANG TẢI GIỎ HÀNG...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center font-mono text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-dashed border-[#AAAAAA] flex items-center justify-center text-[#888888] text-sm">
                  0
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif uppercase tracking-wider text-[#121212]">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-[#888888]">Chưa có mẫu trang phục nào được chọn</p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 border border-[#121212] bg-[#121212] text-[#FAF9F6] px-4 py-2 text-xs uppercase tracking-widest font-mono hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  KHÁM PHÁ BỘ SƯU TẬP
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 pb-4 border-b border-[#E6E4DF] transition-opacity ${
                    !item.isAvailable ? 'opacity-60 bg-red-50/50 p-2 border border-red-200' : ''
                  }`}
                >
                  {/* Thumbnail (3:4 ratio) */}
                  <div className="w-20 h-26 bg-[#ECEAE4] shrink-0 overflow-hidden border border-[#E6E4DF]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#888888]">
                        NO PIC
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <h3 className="font-serif text-sm font-medium leading-tight text-[#121212] truncate">
                        {item.productName}
                      </h3>

                      {/* Variant metadata */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#666666]">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block"
                            style={{ backgroundColor: item.colorHex || '#CCCCCC' }}
                          />
                          <span>{item.colorName}</span>
                        </span>
                        <span>·</span>
                        <span>Size {item.size}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 font-mono text-xs">
                        <span className="font-bold text-[#121212]">{formatVND(item.unitPrice)}</span>
                        {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
                          <span className="text-[10px] text-[#999999] line-through">
                            {formatVND(item.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock Warning */}
                      {item.isAvailable && item.stockQuantity <= 3 && (
                        <p className="text-[10px] font-mono text-amber-700">
                          (Chỉ còn {item.stockQuantity} sản phẩm trong kho)
                        </p>
                      )}

                      {/* Unavailable Alert */}
                      {!item.isAvailable && (
                        <p className="text-[10px] font-mono font-bold text-red-600 uppercase">
                          [{item.unavailableReason || 'Tạm hết hàng'}]
                        </p>
                      )}
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[#121212] bg-white font-mono text-xs h-7">
                        <button
                          type="button"
                          disabled={item.quantity <= 1 || isLoading}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-[#F0EEE9] disabled:opacity-40 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-[11px]">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={item.quantity >= 10 || item.quantity >= item.stockQuantity || isLoading}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-[#F0EEE9] disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-xs font-bold text-[#121212]">
                          {formatVND(item.lineTotal)}
                        </span>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => removeItem(item.id)}
                          aria-label={`Xóa ${item.productName}`}
                          className="text-[11px] text-[#888888] hover:text-red-600 underline cursor-pointer"
                        >
                          XÓA
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
            <div className="p-4 sm:p-5 border-t border-[#E6E4DF] bg-[#F4F1EA] space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-[#666666] uppercase tracking-wider">TẠM TÍNH:</span>
                <span className="text-lg font-bold text-[#121212]">{formatVND(subtotal)}</span>
              </div>

              {cart?.hasUnavailableItems && (
                <div className="bg-amber-50 border border-amber-300 p-2 text-[11px] font-mono text-amber-900">
                  Một số sản phẩm trong giỏ tạm thời không còn khả dụng. Vui lòng xóa trước khi tiến hành thanh toán.
                </div>
              )}

              <p className="text-[10px] font-mono text-[#888888] leading-tight">
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
                className="w-full h-11 bg-[#121212] text-[#FAF9F6] font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#2A2A2A] transition-colors disabled:bg-[#CCCCCC] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
