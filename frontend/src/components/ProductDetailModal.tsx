import { useEffect, useState, useMemo, useRef } from 'react';
import { getProductDetailApi } from '../api/catalogApi';
import type { ProductDetail } from '../types/catalog';
import SizeGuideDrawer from './SizeGuideDrawer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  slug,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { user, openAuthModal } = useAuth();
  const { cart, addToCart, openCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'care' | 'delivery'>('details');
  const [isFlashActive, setIsFlashActive] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const isSizeGuideOpenRef = useRef(isSizeGuideOpen);

  useEffect(() => {
    isSizeGuideOpenRef.current = isSizeGuideOpen;
  }, [isSizeGuideOpen]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Keyboard Escape listener to dismiss modal (layered: ignores Escape if size guide is open)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSizeGuideOpenRef.current) {
          // Size Guide drawer is on top and consumes this Escape; modal remains open
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Store previously focused element on mount and restore on unmount/close
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined') {
        previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      }
    }
    return () => {
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function'
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Initial focus into modal dialog
  useEffect(() => {
    if (isOpen && modalContainerRef.current) {
      const closeButton = modalContainerRef.current.querySelector<HTMLElement>(
        'button[aria-label="Đóng chi tiết sản phẩm"]'
      );
      if (closeButton) {
        closeButton.focus();
      } else {
        modalContainerRef.current.focus();
      }
    }
  }, [isOpen, product]);

  // Focus trap: Tab and Shift+Tab containment within modal
  const handleKeyDownTrap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || isSizeGuideOpen || !modalContainerRef.current) return;

    const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Load product detail when modal opens with a valid slug
  useEffect(() => {
    if (!isOpen || !slug) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setSubmitError(null);

    getProductDetailApi(slug)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);

        // Auto-select initial color and valid matching size
        if (data.availableColors.length > 0) {
          const initialColor = data.availableColors[0].name;
          setSelectedColor(initialColor);

          const matchingVariants = data.variants.filter(
            (v) =>
              v.colorName.toLowerCase() === initialColor.toLowerCase() &&
              v.status === 'ACTIVE'
          );
          if (matchingVariants.length > 0) {
            const inStockVar = matchingVariants.find((v) => v.inStock && v.stockQuantity > 0);
            setSelectedSize(inStockVar ? inStockVar.size : matchingVariants[0].size);
          } else if (data.availableSizes.length > 0) {
            setSelectedSize(data.availableSizes[0]);
          }
        } else if (data.availableSizes.length > 0) {
          setSelectedSize(data.availableSizes[0]);
        }

        setSelectedImageIndex(0);
        setQuantity(1);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin sản phẩm');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, slug]);

  // Active variants of the currently selected color
  const variantsOfColor = useMemo(() => {
    if (!product) return [];
    return product.variants.filter(
      (v) =>
        v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
        v.status === 'ACTIVE'
    );
  }, [product, selectedColor]);

  const variantIdsOfColor = useMemo(
    () => new Set(variantsOfColor.map((v) => v.id)),
    [variantsOfColor]
  );

  // Active gallery images: color-specific tagged images first, then general images, or single representative fallback
  const { activeGalleryImages, isColorFallback } = useMemo(() => {
    if (!product || product.images.length === 0) {
      return { activeGalleryImages: [], isColorFallback: false };
    }

    const colorImages = product.images.filter(
      (img) => img.variantId && variantIdsOfColor.has(img.variantId)
    );
    const generalImages = product.images.filter((img) => !img.variantId);

    // 1. If color-specific images exist, show them combined with general lookbook images
    if (colorImages.length > 0) {
      return {
        activeGalleryImages: [...colorImages, ...generalImages],
        isColorFallback: false,
      };
    }

    // 2. If no color-specific images, but general lookbook images exist, show general images only
    if (generalImages.length > 0) {
      return {
        activeGalleryImages: generalImages,
        isColorFallback: false,
      };
    }

    // 3. Fallback: No color images AND no general images (all images belong to other colors)
    // Only return the primary/representative image, and mark isColorFallback = true
    const repImg = product.images.find((img) => img.isPrimary) || product.images[0];
    return {
      activeGalleryImages: repImg ? [repImg] : [],
      isColorFallback: true,
    };
  }, [product, variantIdsOfColor]);

  // Find exact active variant corresponding to (selectedColor, selectedSize)
  const currentVariant = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
    return (
      product.variants.find(
        (v) =>
          v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
          v.size.toUpperCase() === selectedSize.toUpperCase() &&
          v.status === 'ACTIVE'
      ) || null
    );
  }, [product, selectedColor, selectedSize]);

  // Existing item in cart for this variant
  const existingCartItem = useMemo(() => {
    if (!cart || !currentVariant) return null;
    return cart.items.find((item) => item.variantId === currentVariant.id) || null;
  }, [cart, currentVariant]);

  const existingCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const MAX_PER_LINE = 10;
  const maxAddableQuantity = useMemo(() => {
    if (!currentVariant || !currentVariant.inStock || currentVariant.stockQuantity <= 0) {
      return 0;
    }
    const remainingByPolicy = Math.max(0, MAX_PER_LINE - existingCartQuantity);
    return Math.min(remainingByPolicy, currentVariant.stockQuantity);
  }, [currentVariant, existingCartQuantity]);

  // Derived effective quantity clamped to valid bounds
  const effectiveQuantity = maxAddableQuantity > 0 ? Math.min(Math.max(1, quantity), maxAddableQuantity) : 1;

  // When clicking a color swatch, switch gallery and ensure selected size follows UX rules:
  // 1. If current size is offered in the new color -> preserve current size (shows out-of-stock if 0 stock)
  // 2. If current size is not offered in the new color (Ghost Variant) -> auto-resolve to first in-stock size
  const handleColorChange = (newColorName: string) => {
    setSelectedColor(newColorName);
    setSelectedImageIndex(0);
    if (!product) return;

    const activeVariantsOfNewColor = product.variants.filter(
      (v) =>
        v.colorName.toLowerCase() === newColorName.toLowerCase() &&
        v.status === 'ACTIVE'
    );

    // Rule 1: Does current size exist in the new color?
    const currentSizeOffered = activeVariantsOfNewColor.find(
      (v) => v.size.toUpperCase() === selectedSize.toUpperCase()
    );

    if (currentSizeOffered) {
      // Size intent preserved!
      return;
    }

    // Rule 2: Current size does NOT exist in new color (Ghost Variant Prevention)
    if (activeVariantsOfNewColor.length > 0) {
      const firstInStock = activeVariantsOfNewColor.find(
        (v) => v.inStock && v.stockQuantity > 0
      );
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      } else {
        // If all offered sizes are out of stock, select first offered size
        setSelectedSize(activeVariantsOfNewColor[0].size);
      }
    } else {
      // Color has no active variants
      setSelectedSize('');
    }
  };

  const handleThumbnailClick = (idx: number) => {
    setSelectedImageIndex(idx);
    const clickedImg = activeGalleryImages[idx];
    if (clickedImg && clickedImg.variantId) {
      const matchingVariant = product?.variants.find((v) => v.id === clickedImg.variantId);
      if (matchingVariant && matchingVariant.colorName.toLowerCase() !== selectedColor.toLowerCase()) {
        setSelectedColor(matchingVariant.colorName);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant || !currentVariant.inStock || maxAddableQuantity <= 0 || isSubmitting) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 150);

      await addToCart(currentVariant.id, effectiveQuantity);
      onClose();
      openCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thêm vào giỏ hàng';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const safeImageIndex = selectedImageIndex < activeGalleryImages.length ? selectedImageIndex : 0;
  const currentImage = activeGalleryImages[safeImageIndex] || activeGalleryImages[0];

  return (
    <>
      <div
        ref={modalContainerRef}
        onKeyDown={handleKeyDownTrap}
        tabIndex={-1}
        className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-6 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-5xl bg-[#0D0E12] text-[#F7F7F4] h-full md:h-[90vh] md:max-h-[820px] shadow-[0_24px_80px_rgba(0,0,0,0.95)] z-10 flex flex-col md:flex-row overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200 rounded-xs">
          {/* Top Gold Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C7AD83] to-transparent z-30" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết sản phẩm"
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-[#C7AD83] text-white hover:text-[#0A0B0E] border border-white/20 hover:border-[#C7AD83] rounded-full transition-all cursor-pointer backdrop-blur-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L13 13M1 13L13 1" strokeLinecap="round" />
            </svg>
          </button>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 font-mono text-sm space-y-3">
              <span className="animate-spin w-6 h-6 border-2 border-[#C7AD83] border-t-transparent rounded-full"></span>
              <span className="text-[#C7AD83] tracking-widest uppercase text-xs">ĐANG TẢI THÔNG TIN SẢN PHẨM...</span>
            </div>
          ) : error || !product ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 font-mono text-sm space-y-4">
              <p className="text-red-400 tracking-wider text-xs">{error || 'Không tìm thấy sản phẩm'}</p>
              <button
                type="button"
                onClick={onClose}
                className="border border-white/20 text-white px-4 py-1.5 text-xs font-mono uppercase hover:border-[#C7AD83] hover:text-[#C7AD83] rounded-xs cursor-pointer"
              >
                QUAY LẠI
              </button>
            </div>
          ) : (
            <>
              {/* Left Column: Image Gallery (Lookbook style) */}
              <div className="w-full md:w-1/2 bg-[#141519] flex flex-col h-[45vh] md:h-full border-b md:border-b-0 md:border-r border-white/10 relative">
                {/* Localized Flash on Add-to-Cart */}
                {isFlashActive && (
                  <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-studio-flash" />
                )}

                {/* Main Large Image */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#17181D]">
                  {currentImage ? (
                    <img
                      src={currentImage.imageUrl}
                      alt={currentImage.altText || product.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80';
                      }}
                      className="w-full h-full object-cover object-top transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs">
                      ATELIER LOOKBOOK
                    </div>
                  )}

                  {isColorFallback && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono tracking-wider text-amber-200/90 rounded-xs">
                      Ảnh minh họa kiểu dáng (Chưa có ảnh riêng cho màu {selectedColor})
                    </div>
                  )}

                  {currentImage?.altText && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/75 text-white/80 font-mono text-[10px] px-2.5 py-1 backdrop-blur-xs rounded-xs border border-white/10">
                      {currentImage.altText}
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {activeGalleryImages.length > 1 && (
                  <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto">
                    {activeGalleryImages.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => handleThumbnailClick(idx)}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        className={`w-12 h-14 shrink-0 border rounded-2xs overflow-hidden transition-all cursor-pointer ${
                          safeImageIndex === idx
                            ? 'border-[#C7AD83] ring-1 ring-[#C7AD83]'
                            : 'border-white/20 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.altText || `Ảnh thu nhỏ ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Specs & Variant Selection */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Category & Brand Header */}
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#C7AD83] uppercase mb-1 font-semibold">
                      <span>{product.brand || 'ATELIER'}</span>
                      {product.categoryName && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60">{product.categoryName}</span>
                        </>
                      )}
                    </div>
                    <h1 id="product-modal-title" className="font-editorial text-2xl md:text-3xl tracking-tight font-medium text-white">
                      {product.name}
                    </h1>
                  </div>

                  {/* Pricing Block with Variant-specific Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl font-bold text-[#C7AD83]">
                      {currentVariant
                        ? formatVND(currentVariant.price)
                        : formatVND(product.minPrice)}
                    </span>
                    {currentVariant?.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                      <>
                        <span className="font-mono text-sm text-white/40 line-through">
                          {formatVND(currentVariant.compareAtPrice)}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-red-950/60 text-red-300 border border-red-500/30 rounded-2xs">
                          -
                          {Math.round(
                            ((currentVariant.compareAtPrice - currentVariant.price) /
                              currentVariant.compareAtPrice) *
                              100
                          )}
                          %
                        </span>
                      </>
                    )}
                  </div>

                  {/* Color Swatches */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/50 uppercase tracking-wider">MÀU SẮC:</span>
                      <span className="text-white font-medium">{selectedColor}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {product.availableColors.map((color) => {
                        const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => handleColorChange(color.name)}
                            aria-label={`Chọn màu ${color.name}`}
                            title={color.name}
                            className={`group relative p-0.5 rounded-full border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#C7AD83] scale-110 shadow-sm'
                                : 'border-transparent hover:border-white/40'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full border border-white/20 block"
                              style={{ backgroundColor: color.hex || '#CCCCCC' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/50 uppercase tracking-wider">KÍCH CỠ:</span>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-[#C7AD83] hover:text-white cursor-pointer flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>Bảng quy đổi size</span>
                        <span className="text-[10px]">↗</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {product.availableSizes.map((size) => {
                        const variantForSize = product.variants.find(
                          (v) =>
                            v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
                            v.size.toUpperCase() === size.toUpperCase() &&
                            v.status === 'ACTIVE'
                        );
                        const isOffered = Boolean(variantForSize);
                        const isStockAvailable = variantForSize
                          ? variantForSize.inStock && variantForSize.stockQuantity > 0
                          : false;
                        const isSelected = selectedSize.toUpperCase() === size.toUpperCase();

                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={!isOffered || !isStockAvailable}
                            onClick={() => setSelectedSize(size)}
                            title={
                              !isOffered
                                ? `Màu ${selectedColor} không có size ${size}`
                                : !isStockAvailable
                                ? `Size ${size} tạm thời hết hàng`
                                : `Chọn size ${size}`
                            }
                            className={`relative h-10 border text-xs font-mono font-medium transition-all flex items-center justify-center rounded-2xs ${
                              isSelected
                                ? 'border-[#C7AD83] bg-[#C7AD83]/20 text-[#C7AD83] font-bold shadow-xs cursor-pointer'
                                : !isOffered
                                ? 'border-white/5 bg-white/[0.01] text-white/15 cursor-not-allowed opacity-30'
                                : isStockAvailable
                                ? 'border-white/15 bg-white/5 text-white hover:border-[#C7AD83] cursor-pointer'
                                : 'border-white/5 bg-white/[0.02] text-white/30 cursor-not-allowed'
                            }`}
                          >
                            <span>{size}</span>
                            {isOffered && !isStockAvailable && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-full border-t border-red-400/50 rotate-[-25deg] transform"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Availability Indicator */}
                  <div className="text-xs font-mono">
                    {currentVariant ? (
                      currentVariant.inStock && currentVariant.stockQuantity > 0 ? (
                        existingCartQuantity >= MAX_PER_LINE ? (
                          <span className="text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 inline-block rounded-2xs">
                            Đã có {existingCartQuantity}/{MAX_PER_LINE} sản phẩm trong giỏ (tối đa theo quy định)
                          </span>
                        ) : currentVariant.stockQuantity <= 5 ? (
                          <span className="text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 inline-block rounded-2xs">
                            Chỉ còn {currentVariant.stockQuantity} sản phẩm trong kho
                            {existingCartQuantity > 0 && ` (Đã có ${existingCartQuantity} trong giỏ)`}
                          </span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 inline-block rounded-2xs">
                            Sẵn sàng giao hàng
                            {existingCartQuantity > 0 && ` (Đã có ${existingCartQuantity} trong giỏ)`}
                          </span>
                        )
                      ) : (
                        <span className="text-red-400 bg-red-950/30 border border-red-500/30 px-2 py-0.5 inline-block font-bold rounded-2xs">
                          Biến thể {currentVariant.colorName} / {currentVariant.size} tạm thời hết hàng
                        </span>
                      )
                    ) : (
                      <span className="text-white/40">Vui lòng chọn size và màu khả dụng</span>
                    )}
                  </div>

                  {/* Accordion Tabs for Material & Care */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex border-b border-white/10 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'details'
                            ? 'border-[#C7AD83] text-[#C7AD83]'
                            : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        CHẤT LIỆU & PHOM DÁNG
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('care')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'care'
                            ? 'border-[#C7AD83] text-[#C7AD83]'
                            : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        BẢO QUẢN
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('delivery')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'delivery'
                            ? 'border-[#C7AD83] text-[#C7AD83]'
                            : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        GIAO HÀNG & ĐỔI TRẢ
                      </button>
                    </div>

                    <div className="text-xs text-white/70 leading-relaxed pt-1 font-sans">
                      {activeTab === 'details' && (
                        <div className="space-y-1.5">
                          <p>
                            <strong className="text-white">Chất liệu:</strong>{' '}
                            {product.material || 'Vải cao cấp'}
                          </p>
                          <p>
                            <strong className="text-white">Form dáng:</strong>{' '}
                            {product.fitStyle || 'Tiêu chuẩn'}
                          </p>
                          <p className="text-white/60 pt-1 leading-relaxed">{product.description}</p>
                        </div>
                      )}
                      {activeTab === 'care' && (
                        <div className="space-y-1 text-white/60 leading-relaxed">
                          <p>
                            {product.careInstructions ||
                              'Giặt nhẹ bằng tay, phơi trong bóng râm, không dùng chất tẩy mạnh.'}
                          </p>
                        </div>
                      )}
                      {activeTab === 'delivery' && (
                        <div className="space-y-1 text-white/60 leading-relaxed">
                          <p>• Thanh toán COD khi nhận hàng toàn quốc.</p>
                          <p>• Đổi kích cỡ miễn phí trong 7 ngày nếu không vừa vặn.</p>
                          <p>• Kiểm tra hàng trước khi thanh toán.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar: Quantity & Add to Cart */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-white/20 bg-white/5 font-mono text-sm h-11 rounded-xs">
                    <button
                      type="button"
                      disabled={effectiveQuantity <= 1 || maxAddableQuantity <= 0}
                      onClick={() => setQuantity((prev) => Math.max(1, Math.min(effectiveQuantity, prev) - 1))}
                      className="px-3.5 py-1 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Giảm số lượng"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-white">{effectiveQuantity}</span>
                    <button
                      type="button"
                      disabled={
                        effectiveQuantity >= maxAddableQuantity ||
                        maxAddableQuantity <= 0
                      }
                      onClick={() => setQuantity((prev) => Math.min(maxAddableQuantity, Math.max(1, prev) + 1))}
                      className="px-3.5 py-1 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    disabled={
                      !currentVariant ||
                      !currentVariant.inStock ||
                      maxAddableQuantity <= 0 ||
                      isSubmitting
                    }
                    onClick={handleAddToCart}
                    className="flex-1 h-11 bg-[#C7AD83] hover:bg-[#D9C09A] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_20px_rgba(199,173,131,0.25)] hover:shadow-[0_6px_28px_rgba(199,173,131,0.4)]"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>
                          {!currentVariant
                            ? 'KHÔNG KHẢ DỤNG'
                            : !currentVariant.inStock
                            ? 'HẾT HÀNG'
                            : maxAddableQuantity <= 0
                            ? 'ĐÃ ĐẠT GIỚI HẠN GIỎ HÀNG'
                            : 'THÊM VÀO GIỎ HÀNG'}
                        </span>
                        {currentVariant?.inStock && maxAddableQuantity > 0 && (
                          <span className="text-[#0A0B0E]/70 font-semibold">
                            ({formatVND(currentVariant.price * effectiveQuantity)})
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
                {submitError && (
                  <p className="mt-2 text-xs font-mono text-red-400 bg-red-950/30 p-2.5 border border-red-500/30 rounded-xs">
                    {submitError}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slide-over Size Guide Drawer */}
      <SizeGuideDrawer
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        categoryName={product?.categoryName || 'Thời trang'}
        specificationsJson={product?.specifications}
      />
    </>
  );
}
