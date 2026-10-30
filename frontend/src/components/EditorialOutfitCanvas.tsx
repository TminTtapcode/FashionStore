import type { OutfitSlotsMap, OutfitSlot } from '../types/outfit';
import { OUTFIT_SLOT_CONFIGS } from '../types/outfit';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

interface EditorialOutfitCanvasProps {
  slots: OutfitSlotsMap;
  activeSlot: OutfitSlot;
  onSelectSlot: (slot: OutfitSlot) => void;
  onRemoveSlotItem: (slot: OutfitSlot) => void;
  totalPrice: number;
  itemCount: number;
  isAllAvailable: boolean;
  unavailableCount: number;
  isSubmitting: boolean;
  onAddEntireOutfit: () => void;
}

export default function EditorialOutfitCanvas({
  slots,
  activeSlot,
  onSelectSlot,
  onRemoveSlotItem,
  totalPrice,
  itemCount,
  isAllAvailable,
  unavailableCount,
  isSubmitting,
  onAddEntireOutfit,
}: EditorialOutfitCanvasProps) {
  const isOnePieceMode = Boolean(slots.ONE_PIECE);

  return (
    <div className="flex flex-col h-full bg-[#0A0B0E] border-b lg:border-b-0 lg:border-r border-white/10 select-none overflow-hidden relative">
      {/* Editorial Canvas Header */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-1.5 bg-[#0D0E12]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#D6B27C] animate-pulse" />
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[1.5px] sm:tracking-[2.5px] uppercase text-[#D6B27C] font-bold">
            IVRE ATELIER · LOOKBOOK CANVAS
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px]">
          <span className="text-[#A6A49F]">
            {isOnePieceMode ? 'Đầm Liền Thân' : 'Trang Phục Rời'}
          </span>
          <span className="text-[#333235]">·</span>
          <span className="text-[#D6B27C] font-semibold">
            {itemCount} món
          </span>
        </div>
      </div>

      {/* Main Collage Stage */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
        {/* Collage Display Area */}
        {isOnePieceMode ? (
          // One-Piece Layout: Hero Dress on Left, Outerwear/Accessories on Right (Compact 2-col below on mobile)
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 h-full">
            {/* Primary One-Piece Slot (7 cols desktop) */}
            <div className="sm:col-span-7 h-full">
              {slots.ONE_PIECE ? (
                <div
                  onClick={() => onSelectSlot('ONE_PIECE')}
                  className={`group relative h-full min-h-[260px] sm:min-h-[360px] bg-[#111214] border rounded-sm overflow-hidden p-2.5 sm:p-3 flex flex-col justify-between transition-all cursor-pointer ${
                    activeSlot === 'ONE_PIECE'
                      ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/30 shadow-[0_0_25px_rgba(214,178,124,0.15)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xs bg-[#15161A]">
                    <img
                      src={slots.ONE_PIECE.imageUrl}
                      alt={slots.ONE_PIECE.productName}
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 bg-black/70 backdrop-blur-xs border border-[#D6B27C]/40 text-[#D6B27C] font-mono text-[9px] uppercase tracking-wider font-bold rounded-2xs w-fit">
                        ĐẦM & VÁY CHÍNH
                      </span>
                      {slots.ONE_PIECE.isRepresentativeImage && (
                        <span className="px-1.5 py-0.5 bg-black/80 border border-amber-500/40 text-amber-300 font-mono text-[8px] rounded-2xs w-fit">
                          Ảnh tham khảo
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSlotItem('ONE_PIECE');
                      }}
                      title="Gỡ khỏi bảng phối"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-900/80 text-white flex items-center justify-center text-xs transition-colors cursor-pointer border border-white/20"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="pt-2 sm:pt-3 space-y-1">
                    <h4 className="font-editorial text-sm sm:text-base text-[#F7F7F4] font-medium leading-snug line-clamp-1">
                      {slots.ONE_PIECE.productName}
                    </h4>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-[#A6A49F] text-[11px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: slots.ONE_PIECE.colorHex }}
                        />
                        <span>{slots.ONE_PIECE.colorName}</span>
                        <span>·</span>
                        <span className="text-[#D6B27C] font-bold">Size {slots.ONE_PIECE.size}</span>
                      </div>
                      <span className="text-[#D6B27C] font-bold text-xs sm:text-sm">
                        {formatVND(slots.ONE_PIECE.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onSelectSlot('ONE_PIECE')}
                  className="h-full min-h-[240px] sm:min-h-[360px] border border-dashed border-white/15 hover:border-[#D6B27C]/50 rounded-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center cursor-pointer transition-colors bg-white/[0.01]"
                >
                  <span className="font-mono text-xl sm:text-2xl text-[#D6B27C]/60 mb-2">✦</span>
                  <p className="font-editorial text-base sm:text-lg text-[#F7F7F4]">Đầm Liền Thân</p>
                  <p className="font-mono text-xs text-[#A6A49F] mt-1">Chọn một mẫu đầm maxi hoặc dạ tiệc</p>
                </div>
              )}
            </div>

            {/* Companion Slots on Right (5 cols desktop, 2-cols side-by-side on mobile) */}
            <div className="sm:col-span-5 grid grid-cols-2 sm:flex sm:flex-col gap-2.5 sm:gap-4">
              {/* Outerwear Slot */}
              <div className="flex-1">
                {slots.OUTERWEAR ? (
                  <div
                    onClick={() => onSelectSlot('OUTERWEAR')}
                    className={`group relative h-full min-h-[140px] sm:min-h-[170px] bg-[#111214] border rounded-sm overflow-hidden p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2 sm:gap-3 transition-all cursor-pointer ${
                      activeSlot === 'OUTERWEAR'
                        ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative w-full sm:w-24 shrink-0 aspect-[4/3] sm:aspect-[3/4] overflow-hidden rounded-xs bg-[#15161A]">
                      <img
                        src={slots.OUTERWEAR.imageUrl}
                        alt={slots.OUTERWEAR.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSlotItem('OUTERWEAR');
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-900/80 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-col justify-between py-0.5 sm:py-1 flex-1 min-w-0">
                      <div>
                        <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-[#D6B27C] font-bold">
                          ÁO KHOÁC NGOÀI
                        </span>
                        <h5 className="font-editorial text-xs sm:text-sm text-[#F7F7F4] line-clamp-1 mt-0.5">
                          {slots.OUTERWEAR.productName}
                        </h5>
                        <p className="font-mono text-[10px] sm:text-[11px] text-[#A6A49F] mt-0.5 truncate">
                          {slots.OUTERWEAR.colorName} · Size {slots.OUTERWEAR.size}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] sm:text-xs text-[#D6B27C] font-bold mt-1">
                        {formatVND(slots.OUTERWEAR.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectSlot('OUTERWEAR')}
                    className="h-full min-h-[140px] sm:min-h-[170px] border border-dashed border-white/15 hover:border-[#D6B27C]/50 rounded-sm flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#A6A49F]">
                      + ÁO KHOÁC
                    </span>
                    <span className="font-mono text-[9px] text-[#6C6C72] mt-0.5">Khoác ngoài</span>
                  </div>
                )}
              </div>

              {/* Accessories Slot */}
              <div className="flex-1">
                {slots.ACCESSORIES ? (
                  <div
                    onClick={() => onSelectSlot('ACCESSORIES')}
                    className={`group relative h-full min-h-[140px] sm:min-h-[170px] bg-[#111214] border rounded-sm overflow-hidden p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2 sm:gap-3 transition-all cursor-pointer ${
                      activeSlot === 'ACCESSORIES'
                        ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative w-full sm:w-24 shrink-0 aspect-[4/3] sm:aspect-[3/4] overflow-hidden rounded-xs bg-[#15161A]">
                      <img
                        src={slots.ACCESSORIES.imageUrl}
                        alt={slots.ACCESSORIES.productName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSlotItem('ACCESSORIES');
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-900/80 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-col justify-between py-0.5 sm:py-1 flex-1 min-w-0">
                      <div>
                        <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-[#D6B27C] font-bold">
                          PHỤ KIỆN
                        </span>
                        <h5 className="font-editorial text-xs sm:text-sm text-[#F7F7F4] line-clamp-1 mt-0.5">
                          {slots.ACCESSORIES.productName}
                        </h5>
                        <p className="font-mono text-[10px] sm:text-[11px] text-[#A6A49F] mt-0.5 truncate">
                          {slots.ACCESSORIES.colorName}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] sm:text-xs text-[#D6B27C] font-bold mt-1">
                        {formatVND(slots.ACCESSORIES.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectSlot('ACCESSORIES')}
                    className="h-full min-h-[140px] sm:min-h-[170px] border border-dashed border-white/15 hover:border-[#D6B27C]/50 rounded-sm flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#A6A49F]">
                      + PHỤ KIỆN
                    </span>
                    <span className="font-mono text-[9px] text-[#6C6C72] mt-0.5">Túi xách · Khăn</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Separates Layout: 2-Column Compact Grid on Both Mobile & Desktop (eliminates tall scrolling on mobile)
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {(['OUTERWEAR', 'UPPER_BODY', 'LOWER_BODY', 'ACCESSORIES'] as OutfitSlot[]).map((slotKey) => {
              const item = slots[slotKey];
              const config = OUTFIT_SLOT_CONFIGS[slotKey];
              const isActive = activeSlot === slotKey;

              if (item) {
                return (
                  <div
                    key={slotKey}
                    onClick={() => onSelectSlot(slotKey)}
                    className={`group relative bg-[#111214] border rounded-sm overflow-hidden p-2 sm:p-3 flex flex-col justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/30 shadow-[0_0_20px_rgba(214,178,124,0.12)]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xs bg-[#15161A]">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                        <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-xs border border-[#D6B27C]/40 text-[#D6B27C] font-mono text-[8px] sm:text-[9px] uppercase tracking-wider font-bold rounded-2xs w-fit">
                          {config.label}
                        </span>
                        {item.isRepresentativeImage && (
                          <span className="px-1.5 py-0.5 bg-black/80 border border-amber-500/40 text-amber-300 font-mono text-[7px] sm:text-[8px] rounded-2xs w-fit">
                            Ảnh tham khảo
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSlotItem(slotKey);
                        }}
                        title="Gỡ khỏi bảng phối"
                        className="absolute top-1.5 right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 hover:bg-rose-900/80 text-white flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer border border-white/20"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="pt-2 space-y-0.5 sm:space-y-1">
                      <h4 className="font-editorial text-xs sm:text-sm text-[#F7F7F4] font-medium leading-snug line-clamp-1">
                        {item.productName}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between font-mono text-[10px] sm:text-[11px] gap-0.5">
                        <div className="flex items-center gap-1 text-[#A6A49F] truncate">
                          <span
                            className="w-2 h-2 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="truncate">{item.colorName}</span>
                          <span>·</span>
                          <span className="text-[#D6B27C] font-bold shrink-0">{item.size}</span>
                        </div>
                        <span className="text-[#D6B27C] font-bold shrink-0">{formatVND(item.price)}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slotKey}
                  onClick={() => onSelectSlot(slotKey)}
                  className={`min-h-[160px] sm:min-h-[220px] border border-dashed rounded-sm flex flex-col items-center justify-center p-3 sm:p-4 text-center cursor-pointer transition-all ${
                    isActive
                      ? 'border-[#D6B27C] bg-[#D6B27C]/5'
                      : 'border-white/15 hover:border-white/40 bg-white/[0.01]'
                  }`}
                >
                  <span className="font-mono text-sm sm:text-base text-[#D6B27C] mb-1">+</span>
                  <p className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#F7F7F4] font-semibold">
                    {config.label}
                  </p>
                  <p className="font-mono text-[9px] sm:text-[10px] text-[#A6A49F] mt-0.5">{config.subLabel}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary & CTA Bar (Compact horizontal on mobile) */}
      <div className="px-3 py-2 sm:px-6 sm:py-3.5 bg-[#0D0E12] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#A6A49F]">TỔNG CỘNG</span>
            {!isAllAvailable && (
              <span className="px-1 py-0.2 bg-rose-900/60 border border-rose-500/50 text-rose-300 font-mono text-[8px] rounded-2xs">
                {unavailableCount} hết hàng
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-base sm:text-2xl text-[#D6B27C] font-bold">
              {formatVND(totalPrice)}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-[#A6A49F]">
              ({itemCount} món)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddEntireOutfit}
          disabled={isSubmitting || itemCount === 0 || !isAllAvailable}
          className="px-4 sm:px-8 h-10 sm:h-12 bg-[#D6B27C] hover:bg-[#E2C496] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_24px_rgba(214,178,124,0.3)] hover:shadow-[0_6px_32px_rgba(214,178,124,0.45)] shrink-0"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#0A0B0E] border-t-transparent rounded-full animate-spin" />
              <span>ĐANG THÊM...</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>THÊM CẢ BỘ VÀO GIỎ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
