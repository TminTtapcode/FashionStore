import { useState, useEffect } from 'react';
import { useOutfitBuilder } from '../hooks/useOutfitBuilder';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EditorialOutfitCanvas from './EditorialOutfitCanvas';
import OutfitGarmentSelector from './OutfitGarmentSelector';

interface VirtualStylingStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VirtualStylingStudio({ isOpen, onClose }: VirtualStylingStudioProps) {
  const { user, openAuthModal } = useAuth();
  const { cart, refreshCart, openCart } = useCart();
  const [mobileTab, setMobileTab] = useState<'canvas' | 'selector'>('canvas');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  const {
    slots,
    activeSlot,
    summary,
    notification,
    isSubmitting,
    batchResults,
    selectSlot,
    setSlotItem,
    removeSlotItem,
    loadPreset,
    resetOutfit,
    addEntireOutfitToCart,
  } = useOutfitBuilder();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when studio modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddOutfit = async () => {
    const res = await addEntireOutfitToCart({
      cart,
      user,
      openAuthModal,
      refreshCart,
      openCart,
    });

    if (res && res.results) {
      setShowBatchModal(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="styling-studio-title"
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0B0E] text-[#F7F7F4] animate-fade-in overflow-hidden"
    >
      {/* Studio Top Navigation Bar */}
      <header className="min-h-14 sm:h-16 py-2 px-3 sm:px-6 border-b border-white/10 bg-[#0D0E12] flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D6B27C]/40 bg-[#D6B27C]/10 flex items-center justify-center text-[#D6B27C] text-xs font-mono font-bold shrink-0">
            ✦
          </div>
          <div className="min-w-0">
            <h2
              id="styling-studio-title"
              className="font-editorial text-xs sm:text-base tracking-wide text-[#F7F7F4] font-medium truncate"
            >
              <span className="inline sm:hidden">IVRE STUDIO</span>
              <span className="hidden sm:inline">IVRE ATELIER · EDITORIAL STYLING STUDIO</span>
            </h2>
            <p className="hidden sm:block font-mono text-[10px] sm:text-[11px] text-[#A6A49F]">
              Bảng Phối Đồ Lookbook & Tùy Biến Trang Phục Trực Quan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile View Toggle Switcher (Visible on < lg) */}
          <div className="flex lg:hidden items-center bg-[#14151B] p-0.5 rounded-sm border border-white/10">
            <button
              type="button"
              onClick={() => setMobileTab('canvas')}
              className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-2xs transition-colors cursor-pointer ${
                mobileTab === 'canvas'
                  ? 'bg-[#D6B27C] text-[#0A0B0E] font-bold shadow-xs'
                  : 'text-[#A6A49F] hover:text-white'
              }`}
            >
              ✦ Bảng Phối
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('selector')}
              className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-2xs transition-colors cursor-pointer ${
                mobileTab === 'selector'
                  ? 'bg-[#D6B27C] text-[#0A0B0E] font-bold shadow-xs'
                  : 'text-[#A6A49F] hover:text-white'
              }`}
            >
              🛍️ Chọn Món
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Styling Studio"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="text-sm sm:text-base font-light">✕</span>
          </button>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-11/12">
          <div className="px-4 py-2.5 rounded-sm bg-[#16171D]/95 border border-[#D6B27C]/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center justify-between gap-3 text-center">
            <span className="text-[#D6B27C] text-xs">✦</span>
            <p className="font-mono text-xs text-[#F7F7F4] flex-1">{notification}</p>
          </div>
        </div>
      )}

      {/* Main Two-Column Editorial Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Editorial Collage Canvas (58% desktop) */}
        <div
          className={`flex-1 lg:w-[58%] h-full ${
            mobileTab === 'canvas' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <EditorialOutfitCanvas
            slots={slots}
            activeSlot={activeSlot}
            onSelectSlot={(slot) => {
              selectSlot(slot);
              // On mobile, automatically jump to garment selector when clicking an empty or active slot
              setMobileTab('selector');
            }}
            onRemoveSlotItem={removeSlotItem}
            totalPrice={summary.totalPrice}
            itemCount={summary.itemCount}
            isAllAvailable={summary.isAllAvailable}
            unavailableCount={summary.unavailableItemCount}
            isSubmitting={isSubmitting}
            onAddEntireOutfit={handleAddOutfit}
          />
        </div>

        {/* Right Column: Garment Selector & Customizer (42% desktop) */}
        <div
          className={`flex-1 lg:w-[42%] h-full ${
            mobileTab === 'selector' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <OutfitGarmentSelector
            activeSlot={activeSlot}
            currentSlotItem={slots[activeSlot]}
            onSelectSlot={selectSlot}
            onSelectGarment={(item) => {
              setSlotItem(item);
              // On mobile, return back to canvas to see outfit effect
              setMobileTab('canvas');
            }}
            onLoadPreset={loadPreset}
            onResetOutfit={resetOutfit}
          />
        </div>
      </div>

      {/* Sequential Batch Results Feedback Modal */}
      {showBatchModal && batchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#111216] border border-white/15 rounded-sm p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#D6B27C] font-semibold">
                  KẾT QUẢ THÊM VÀO GIỎ HÀNG
                </span>
                <h3 className="font-editorial text-xl text-[#F7F7F4] mt-1">
                  {batchResults.successCount === batchResults.totalRequested
                    ? 'Thêm trọn bộ outfit thành công!'
                    : batchResults.successCount > 0
                    ? `Hoàn tất thêm một phần (${batchResults.successCount}/${batchResults.totalRequested} món)`
                    : 'Không thể thêm outfit vào giỏ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-[#A6A49F] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Itemized List */}
            <div className="divide-y divide-white/5 border border-white/10 rounded-xs bg-[#0D0E12] max-h-60 overflow-y-auto">
              {batchResults.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-editorial text-sm text-[#F7F7F4]">{item.productName}</p>
                    <p className="font-mono text-[10px] text-[#A6A49F]">SKU: {item.sku}</p>
                    {item.errorMessage && (
                      <p className="font-mono text-[10px] text-rose-400">{item.errorMessage}</p>
                    )}
                  </div>
                  <span
                    className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-2xs border ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {item.status === 'SUCCESS' ? '✓ Đã thêm' : '✕ Thất bại'}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[#A6A49F] hover:text-white border border-white/10 hover:border-white/30 rounded-2xs cursor-pointer"
              >
                Tiếp tục phối đồ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBatchModal(false);
                  onClose();
                  openCart();
                }}
                className="px-6 py-2.5 bg-[#D6B27C] hover:bg-[#E2C496] text-[#0A0B0E] font-mono text-xs uppercase tracking-wider font-bold rounded-2xs cursor-pointer shadow-[0_2px_12px_rgba(214,178,124,0.3)]"
              >
                Xem giỏ hàng →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
