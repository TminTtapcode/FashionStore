import { useState, useEffect, useMemo, useRef } from 'react';
import type {
  OutfitSlot,
  OutfitItemSelection,
} from '../types/outfit';
import {
  OUTFIT_SLOT_CONFIGS,
  resolveProductSlot,
} from '../types/outfit';
import type { ProductSummary, ProductDetail, ProductVariant } from '../types/catalog';
import { getProductsApi, getProductDetailApi } from '../api/catalogApi';
import { OUTFIT_PRESETS } from '../data/outfitPresets';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

interface OutfitGarmentSelectorProps {
  activeSlot: OutfitSlot;
  currentSlotItem?: OutfitItemSelection;
  onSelectSlot: (slot: OutfitSlot) => void;
  onSelectGarment: (item: OutfitItemSelection) => void;
  onLoadPreset: (presetId: string) => void;
  onResetOutfit: () => void;
}

const SLOT_TABS: Array<{ slot: OutfitSlot; label: string; icon: string }> = [
  { slot: 'ONE_PIECE', label: 'Đầm & Váy Liền', icon: '✦' },
  { slot: 'UPPER_BODY', label: 'Áo & Tops', icon: '◇' },
  { slot: 'LOWER_BODY', label: 'Quần & Chân Váy', icon: '▫' },
  { slot: 'OUTERWEAR', label: 'Áo Khoác', icon: '◈' },
  { slot: 'ACCESSORIES', label: 'Phụ Kiện', icon: '○' },
];

export default function OutfitGarmentSelector({
  activeSlot,
  currentSlotItem,
  onSelectSlot,
  onSelectGarment,
  onLoadPreset,
  onResetOutfit,
}: OutfitGarmentSelectorProps) {
  const [catalogProducts, setCatalogProducts] = useState<ProductSummary[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [activeProductDetail, setActiveProductDetail] = useState<ProductDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Variant selection state for the active product
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Load catalog on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setIsLoadingProducts(true);
        const res = await getProductsApi({ limit: 50 });
        if (isMounted) {
          setCatalogProducts(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load products for Styling Studio:', err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products matching active slot
  const slotProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const slot = resolveProductSlot(p.categorySlug || '', p.slug);
      return slot === activeSlot;
    });
  }, [catalogProducts, activeSlot]);

  // Synchronize selector with activeSlot and currentSlotItem
  useEffect(() => {
    if (currentSlotItem && currentSlotItem.slot === activeSlot) {
      setSelectedProductSlug(currentSlotItem.productSlug);
      setSelectedColor(currentSlotItem.colorName);
      setSelectedSize(currentSlotItem.size);
    } else if (slotProducts.length > 0) {
      // Default to first product in this slot if current selection does not belong
      const belongs = slotProducts.some((p) => p.slug === selectedProductSlug);
      if (!belongs) {
        setSelectedProductSlug(slotProducts[0].slug);
      }
    } else {
      setSelectedProductSlug(null);
      setActiveProductDetail(null);
    }
  }, [activeSlot, currentSlotItem, slotProducts]);

  // Scroll active tab into view horizontally on mobile
  useEffect(() => {
    const activeTabEl = document.getElementById(`slot-tab-${activeSlot}`);
    if (activeTabEl && tabsScrollRef.current) {
      activeTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeSlot]);

  // Load product detail whenever selectedProductSlug changes
  useEffect(() => {
    if (!selectedProductSlug) {
      setActiveProductDetail(null);
      return;
    }

    let isMounted = true;
    const loadDetail = async () => {
      try {
        setIsLoadingDetail(true);
        const detail = await getProductDetailApi(selectedProductSlug);
        if (isMounted) {
          setActiveProductDetail(detail);

          // If current slot item matches this product, preserve its color & size
          if (currentSlotItem && currentSlotItem.productSlug === detail.slug) {
            setSelectedColor(currentSlotItem.colorName);
            setSelectedSize(currentSlotItem.size);
          } else if (detail.variants && detail.variants.length > 0) {
            // Otherwise default to first available variant
            const firstInStock = detail.variants.find((v) => v.inStock && v.stockQuantity > 0) || detail.variants[0];
            setSelectedColor(firstInStock.colorName);
            setSelectedSize(firstInStock.size);
          }
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    };
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedProductSlug, currentSlotItem]);

  // Find exact variant from selected color & size
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!activeProductDetail?.variants) return undefined;
    return activeProductDetail.variants.find(
      (v) => v.colorName === selectedColor && v.size === selectedSize
    );
  }, [activeProductDetail, selectedColor, selectedSize]);

  // Colors available for current product
  const availableColors = useMemo(() => {
    return activeProductDetail?.availableColors || [];
  }, [activeProductDetail]);

  // Sizes available for selected color
  const sizesForColor = useMemo(() => {
    if (!activeProductDetail?.variants || !selectedColor) return [];
    return activeProductDetail.variants
      .filter((v) => v.colorName === selectedColor)
      .map((v) => ({
        size: v.size,
        stockQuantity: v.stockQuantity,
        inStock: v.inStock && v.stockQuantity > 0,
      }));
  }, [activeProductDetail, selectedColor]);

  // Relationship between current outfit slot item and what's selected in this editor
  const isExactMatch = Boolean(
    currentSlotItem &&
    selectedVariant &&
    currentSlotItem.variantId === selectedVariant.id
  );

  const isVariantDraftChange = Boolean(
    currentSlotItem &&
    selectedVariant &&
    currentSlotItem.productId === activeProductDetail?.id &&
    currentSlotItem.variantId !== selectedVariant.id
  );

  const isProductReplacement = Boolean(
    currentSlotItem &&
    activeProductDetail &&
    currentSlotItem.productId !== activeProductDetail.id
  );

  // Compute image and verify if it matches selected color or is a representative photo
  const { resolvedImageUrl, isRepresentativeImage } = useMemo(() => {
    if (!activeProductDetail) {
      return { resolvedImageUrl: '', isRepresentativeImage: false };
    }

    // 1. Image specifically mapped to this variant ID
    const exactVariantImage = activeProductDetail.images?.find(
      (img) => img.variantId === selectedVariant?.id
    );

    // 2. Image mapped to another variant of the same color
    const sameColorVariantImage = activeProductDetail.images?.find((img) => {
      if (!img.variantId) return false;
      const v = activeProductDetail.variants.find((variant) => variant.id === img.variantId);
      return v && v.colorName.toLowerCase() === selectedVariant?.colorName.toLowerCase();
    });

    const imgUrl =
      exactVariantImage?.imageUrl ||
      sameColorVariantImage?.imageUrl ||
      activeProductDetail.images?.find((img) => img.isPrimary)?.imageUrl ||
      activeProductDetail.images?.[0]?.imageUrl ||
      '';

    // Known lookbook stock samples where photo doesn't visually depict the variant color
    const isKnownLookbookSample = Boolean(
      imgUrl.includes('photo-1594938298603-c8148c4dae35') || // blue suit for linen blazer
      imgUrl.includes('photo-1596755094514-f87e34085b2c') || // dark shirt for oxford white
      imgUrl.includes('photo-1595777457583-95e059d581b8')    // red dress
    );

    const isRepresentative = !exactVariantImage && (!sameColorVariantImage || isKnownLookbookSample);

    return { resolvedImageUrl: imgUrl, isRepresentativeImage: isRepresentative };
  }, [activeProductDetail, selectedVariant]);

  // Handle adding or updating garment in current slot
  const handleAddToSlot = () => {
    if (!activeProductDetail || !selectedVariant) return;

    const selection: OutfitItemSelection = {
      slot: activeSlot,
      productId: activeProductDetail.id,
      productSlug: activeProductDetail.slug,
      productName: activeProductDetail.name,
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex || '#A6A49F',
      size: selectedVariant.size,
      price: selectedVariant.price,
      stockQuantity: selectedVariant.stockQuantity,
      imageUrl: resolvedImageUrl,
      inStock: selectedVariant.inStock && selectedVariant.stockQuantity > 0,
      categorySlug: activeProductDetail.categorySlug || '',
      isRepresentativeImage,
    };

    onSelectGarment(selection);
  };

  const currentConfig = OUTFIT_SLOT_CONFIGS[activeSlot];

  return (
    <div className="flex flex-col h-full bg-[#0D0E12] select-none overflow-hidden">
      {/* Upper Presets Bar */}
      <div className="px-3 sm:px-6 py-2 bg-[#111215] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[#D6B27C] font-semibold">
            GỢI Ý:
          </span>
          <div className="flex items-center gap-1.5">
            {OUTFIT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onLoadPreset(preset.id)}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-2xs bg-white/5 hover:bg-[#D6B27C]/15 border border-white/10 hover:border-[#D6B27C]/40 text-[#F7F7F4] hover:text-[#D6B27C] font-mono text-[10px] sm:text-[11px] whitespace-nowrap transition-colors cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onResetOutfit}
          className="text-[#A6A49F] hover:text-white font-mono text-[10px] sm:text-[11px] underline underline-offset-4 shrink-0 transition-colors cursor-pointer"
        >
          Đặt lại
        </button>
      </div>

      {/* Slot Navigation Tabs with Scroll Affordance */}
      <div className="relative border-b border-white/10 bg-[#0E0F14] shrink-0">
        <div
          ref={tabsScrollRef}
          className="flex items-center px-2 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {SLOT_TABS.map((tab) => {
            const isActive = activeSlot === tab.slot;
            return (
              <button
                id={`slot-tab-${tab.slot}`}
                key={tab.slot}
                type="button"
                onClick={() => onSelectSlot(tab.slot)}
                className={`relative px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center gap-1.5 sm:gap-2 shrink-0 font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#D6B27C] font-bold'
                    : 'text-[#A6A49F] hover:text-white'
                }`}
              >
                <span className="text-[9px] sm:text-[10px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D6B27C] shadow-[0_0_8px_rgba(214,178,124,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
        {/* Subtle right gradient indicator showing more tabs exist */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0E0F14] to-transparent pointer-events-none lg:hidden" />
      </div>

      {/* Main Content Area: Left Grid of Products + Right Configuration */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
        {/* Category Description Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div>
            <h3 className="font-editorial text-base sm:text-lg text-[#F7F7F4]">
              {currentConfig.label}
            </h3>
            <p className="font-mono text-[11px] sm:text-xs text-[#A6A49F]">
              {currentConfig.subLabel}
            </p>
          </div>
          <span className="font-mono text-[11px] sm:text-xs text-[#D6B27C]">
            {slotProducts.length} mẫu thiết kế
          </span>
        </div>

        {/* Loading State */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 gap-3 py-8">
            <div className="h-32 bg-white/5 rounded-xs animate-pulse" />
            <div className="h-32 bg-white/5 rounded-xs animate-pulse" />
          </div>
        ) : slotProducts.length === 0 ? (
          /* Empty State for Slots without matching products (e.g. ACCESSORIES) */
          <div className="py-12 px-6 border border-dashed border-white/10 rounded-sm text-center bg-white/[0.01]">
            <span className="font-mono text-2xl text-[#D6B27C]/60">✦</span>
            <h4 className="font-editorial text-base text-[#F7F7F4] mt-2">
              Bộ sưu tập đang chuẩn bị ra mắt
            </h4>
            <p className="font-mono text-xs text-[#A6A49F] max-w-sm mx-auto mt-1 leading-relaxed">
              Các mẫu phụ kiện may đo thủ công đang được hoàn thiện tại xưởng may IVRE Atelier. Quý khách có thể lựa chọn các hạng mục trang phục khác để phối cùng.
            </p>
          </div>
        ) : (
          /* Adaptive Product Selection Grid */
          <div
            className={
              slotProducts.length === 1
                ? 'max-w-xs mx-auto w-full'
                : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3'
            }
          >
            {slotProducts.map((p) => {
              const isSelected = selectedProductSlug === p.slug;
              const isCurrentlyInSlot = currentSlotItem?.productSlug === p.slug;

              return (
                <div
                  key={p.slug}
                  onClick={() => setSelectedProductSlug(p.slug)}
                  className={`group relative rounded-xs overflow-hidden border p-2 flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D6B27C] bg-[#16171D] shadow-[0_0_15px_rgba(214,178,124,0.15)] ring-1 ring-[#D6B27C]/40'
                      : 'border-white/10 bg-[#121318] hover:border-white/30'
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xs bg-[#191A20]">
                    <img
                      src={p.primaryImageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    {isCurrentlyInSlot && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#D6B27C] text-[#0A0B0E] font-mono text-[8px] font-bold rounded-2xs tracking-wider uppercase shadow-xs">
                        Trong bảng phối
                      </div>
                    )}
                    {p.outOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-black/80 text-rose-300 font-mono text-[9px] uppercase tracking-wider border border-rose-500/30 rounded-2xs">
                          Tạm hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-1">
                    <h5 className="font-editorial text-xs text-[#F7F7F4] line-clamp-1 leading-tight group-hover:text-[#D6B27C] transition-colors">
                      {p.name}
                    </h5>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#D6B27C] font-semibold">
                        {formatVND(p.minPrice)}
                      </span>
                      <span className="text-[#A6A49F] text-[10px]">
                        {p.availableColors.length} màu
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Garment Customization Panel */}
        {selectedProductSlug && activeProductDetail && (
          <div className="border border-white/15 rounded-sm p-3.5 sm:p-5 bg-[#14151B] space-y-3.5 sm:space-y-4 shadow-xl">
            {/* Header with Title and Current State Status Pill */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#D6B27C] font-semibold">
                    TÙY BIẾN CHO VỊ TRÍ [{currentConfig.label}]
                  </span>
                  {isExactMatch && (
                    <span className="px-1.5 py-0.2 rounded-2xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-semibold">
                      ✓ ĐÃ TRONG BỘ PHỐI
                    </span>
                  )}
                  {isVariantDraftChange && (
                    <span className="px-1.5 py-0.2 rounded-2xs bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-semibold animate-pulse">
                      ⚡ CHƯA ÁP DỤNG THAY ĐỔI
                    </span>
                  )}
                  {isProductReplacement && (
                    <span className="px-1.5 py-0.2 rounded-2xs bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[9px] font-semibold">
                      ✦ SẼ THAY THẾ MÓN HIỆN TẠI
                    </span>
                  )}
                </div>

                <h4 className="font-editorial text-base sm:text-lg text-[#F7F7F4] mt-1">
                  {activeProductDetail.name}
                </h4>
                {activeProductDetail.material && (
                  <p className="font-mono text-[11px] text-[#A6A49F]">
                    Chất liệu: {activeProductDetail.material}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-base sm:text-lg text-[#D6B27C] font-bold">
                  {selectedVariant ? formatVND(selectedVariant.price) : formatVND(activeProductDetail.minPrice)}
                </span>
                {selectedVariant && (
                  <p className="font-mono text-[10px] text-[#6C6C72]">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            </div>

            {/* Draft Notice Banner if modifying an existing outfit item */}
            {isVariantDraftChange && currentSlotItem && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-2xs text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <span>
                  ⚡ Đang chọn: <strong>{selectedColor} · Size {selectedSize}</strong> (Bản nháp)
                </span>
                <span className="text-[#A6A49F] text-[10px]">
                  Trong bảng phối: {currentSlotItem.colorName} · Size {currentSlotItem.size}
                </span>
              </div>
            )}

            {isProductReplacement && currentSlotItem && (
              <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xs text-indigo-200 text-xs font-mono">
                ✦ Sẽ thay thế món: <strong>{currentSlotItem.productName}</strong> ({currentSlotItem.colorName} · Size {currentSlotItem.size})
              </div>
            )}

            {/* Representative Image Notice */}
            {isRepresentativeImage && (
              <div className="px-2.5 py-1.5 bg-[#1B1B22] border border-amber-500/30 rounded-2xs text-[11px] font-mono text-amber-200/90 flex items-center gap-2">
                <span className="text-amber-400">ℹ</span>
                <span>Ảnh tham khảo — màu sắc thực tế của trang phục theo lựa chọn ({selectedColor}).</span>
              </div>
            )}

            {isLoadingDetail ? (
              <div className="py-6 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Color Swatch Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#A6A49F]">
                      1. Chọn Gam Màu: <span className="text-[#F7F7F4] font-semibold">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {availableColors.map((color) => {
                      const isColorActive = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color.name);
                            // Auto select first size for this color if current size not valid
                            const sizes = activeProductDetail.variants
                              .filter((v) => v.colorName === color.name)
                              .map((v) => v.size);
                            if (selectedSize && !sizes.includes(selectedSize)) {
                              setSelectedSize(sizes[0] || null);
                            }
                          }}
                          className={`group relative p-0.5 rounded-full transition-all cursor-pointer ${
                            isColorActive
                              ? 'ring-2 ring-[#D6B27C] ring-offset-2 ring-offset-[#14151B]'
                              : 'hover:opacity-80'
                          }`}
                          title={color.name}
                        >
                          <span
                            className="block w-6 h-6 rounded-full border border-white/20"
                            style={{ backgroundColor: color.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#A6A49F]">
                      2. Chọn Kích Cỡ (Size): <span className="text-[#F7F7F4] font-semibold">{selectedSize}</span>
                    </span>
                    {selectedVariant && (
                      <span
                        className={`font-mono text-[10px] ${
                          selectedVariant.stockQuantity > 5
                            ? 'text-emerald-400'
                            : selectedVariant.stockQuantity > 0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {selectedVariant.stockQuantity > 5
                          ? `● Còn hàng (${selectedVariant.stockQuantity})`
                          : selectedVariant.stockQuantity > 0
                          ? `▲ Sắp hết (${selectedVariant.stockQuantity})`
                          : '✕ Tạm hết hàng'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizesForColor.map((s) => {
                      const isSizeActive = selectedSize === s.size;
                      return (
                        <button
                          key={s.size}
                          type="button"
                          disabled={!s.inStock}
                          onClick={() => setSelectedSize(s.size)}
                          className={`min-w-10 h-9 px-3 rounded-2xs font-mono text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                            isSizeActive
                              ? 'bg-[#D6B27C] text-[#0A0B0E] font-bold border-[#D6B27C]'
                              : s.inStock
                              ? 'bg-white/5 text-[#F7F7F4] hover:border-white/40 border-white/10'
                              : 'bg-black/20 text-[#6C6C72] border-white/5 cursor-not-allowed line-through opacity-40'
                          }`}
                        >
                          {s.size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit to Slot CTA with Dynamic Label based on Outfit State */}
                <button
                  type="button"
                  onClick={handleAddToSlot}
                  disabled={!selectedVariant || !selectedVariant.inStock || selectedVariant.stockQuantity <= 0}
                  className={`w-full h-11 font-mono text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_16px_rgba(214,178,124,0.25)] ${
                    isExactMatch
                      ? 'bg-[#181920] border border-emerald-500/50 text-emerald-300 hover:bg-[#1E2028]'
                      : 'bg-[#D6B27C] hover:bg-[#E2C496] active:bg-[#B89A6E] text-[#0A0B0E]'
                  }`}
                >
                  {isExactMatch ? (
                    <>
                      <span>✓</span>
                      <span>ĐÃ ÁP DỤNG TRONG BỘ PHỐI (CẬP NHẬT LẠI)</span>
                    </>
                  ) : isVariantDraftChange ? (
                    <>
                      <span>✦</span>
                      <span>ÁP DỤNG THAY ĐỔI VÀO BỘ PHỐI ({selectedColor} · SIZE {selectedSize})</span>
                    </>
                  ) : isProductReplacement ? (
                    <>
                      <span>✦</span>
                      <span>THAY THẾ MÓN TRONG BỘ PHỐI ({currentConfig.label})</span>
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      <span>ĐƯA VÀO BỘ PHỐI ({currentConfig.label})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
