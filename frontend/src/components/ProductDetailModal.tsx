import { useEffect, useState, useMemo, useRef } from 'react';
import { getProductDetailApi, getProductsApi } from '../api/catalogApi';
import type { ProductDetail, ProductSummary } from '../types/catalog';
import SizeGuideDrawer from './SizeGuideDrawer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (slug: string) => void;
}

export default function ProductDetailModal({
  slug,
  isOpen,
  onClose,
  onSelectProduct,
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
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    material: true,
    fit: false,
    care: false,
    delivery: false,
  });

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const isSizeGuideOpenRef = useRef(isSizeGuideOpen);

  useEffect(() => {
    isSizeGuideOpenRef.current = isSizeGuideOpen;
  }, [isSizeGuideOpen]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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

  // Fetch "You May Also Like" related curated products from same category
  useEffect(() => {
    if (!isOpen || !product) {
      setRelatedProducts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingRelated(true);

    getProductsApi({ categoryId: product.categoryId, limit: 6 })
      .then((res) => {
        if (!isMounted) return;
        const filtered = (res.items || []).filter((item) => item.slug !== product.slug).slice(0, 4);
        if (filtered.length >= 2) {
          setRelatedProducts(filtered);
        } else {
          // Fallback: fetch general products if category has fewer than 2 companion pieces
          getProductsApi({ limit: 6 })
            .then((allRes) => {
              if (!isMounted) return;
              const generalFiltered = (allRes.items || [])
                .filter((item) => item.slug !== product.slug)
                .slice(0, 4);
              setRelatedProducts(generalFiltered);
            })
            .catch(() => {
              if (isMounted) setRelatedProducts(filtered);
            });
        }
      })
      .catch(() => {
        if (isMounted) setRelatedProducts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRelated(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product?.id, product?.slug, product?.categoryId]);

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
    const maxTotalAllowed = Math.min(MAX_PER_LINE, currentVariant.stockQuantity);
    return Math.max(0, maxTotalAllowed - existingCartQuantity);
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

  const handlePrevImage = () => {
    if (activeGalleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : activeGalleryImages.length - 1));
  };

  const handleNextImage = () => {
    if (activeGalleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev < activeGalleryImages.length - 1 ? prev + 1 : 0));
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
        className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-4 lg:p-6 outline-none overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#0A0B0E]/85 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-6xl bg-[#0D0E12] text-[#F7F7F4] min-h-screen md:min-h-0 md:max-h-[92vh] shadow-[0_24px_80px_rgba(0,0,0,0.95)] z-10 flex flex-col overflow-y-auto border border-white/10 rounded-sm scrollbar-thin scrollbar-thumb-white/10 animate-in zoom-in-95 duration-200">
          {/* Top Gold Line */}
          <div className="sticky top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6B27C] to-transparent z-40" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết sản phẩm"
            className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center bg-black/70 hover:bg-[#D6B27C] text-white hover:text-[#0A0B0E] border border-white/20 hover:border-[#D6B27C] rounded-full transition-all cursor-pointer backdrop-blur-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L13 13M1 13L1" strokeLinecap="round" />
            </svg>
          </button>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16 font-mono text-sm space-y-3 min-h-[400px]">
              <span className="animate-spin w-7 h-7 border-2 border-[#D6B27C] border-t-transparent rounded-full"></span>
              <span className="text-[#D6B27C] tracking-widest uppercase text-xs">ĐANG TẢI THÔNG TIN SẢN PHẨM...</span>
            </div>
          ) : error || !product ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16 font-mono text-sm space-y-4 min-h-[400px]">
              <p className="text-red-400 tracking-wider text-xs">{error || 'Không tìm thấy sản phẩm'}</p>
              <button
                type="button"
                onClick={onClose}
                className="border border-white/20 text-white px-5 py-2 text-xs font-mono uppercase hover:border-[#D6B27C] hover:text-[#D6B27C] rounded-xs cursor-pointer transition-colors"
              >
                QUAY LẠI CỬA HÀNG
              </button>
            </div>
          ) : (
            <>
              {/* Main Product Section: 58% Gallery / 42% Purchase Panel */}
              <div className="flex flex-col lg:flex-row flex-1">
                {/* Left Column: Image Gallery (Editorial Lookbook Style, ~58%) */}
                <div className="w-full lg:w-[58%] bg-[#121316] flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 relative">
                  {/* Localized Flash on Add-to-Cart */}
                  {isFlashActive && (
                    <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-studio-flash" />
                  )}

                  {/* Main Large Image Viewport */}
                  <div className="relative overflow-hidden flex items-center justify-center bg-[#15161A] min-h-[380px] sm:min-h-[460px] lg:min-h-[580px] flex-1">
                    {currentImage ? (
                      <img
                        src={currentImage.imageUrl}
                        alt={currentImage.altText || product.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80';
                        }}
                        className="w-full h-full max-h-[70vh] object-cover object-top transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs">
                        IVRE ATELIER LOOKBOOK
                      </div>
                    )}

                    {/* Gradient Overlay for subtle editorial atmosphere */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                    {/* Gallery Navigation Arrows */}
                    {activeGalleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          aria-label="Ảnh trước"
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#D6B27C] text-white hover:text-black flex items-center justify-center border border-white/15 transition-all cursor-pointer backdrop-blur-xs opacity-75 hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          aria-label="Ảnh kế tiếp"
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#D6B27C] text-white hover:text-black flex items-center justify-center border border-white/15 transition-all cursor-pointer backdrop-blur-xs opacity-75 hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Color Fallback Notice */}
                    {isColorFallback && (
                      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/85 backdrop-blur-sm border border-amber-500/30 text-[11px] font-mono tracking-wider text-amber-200/90 rounded-xs">
                        Ảnh minh họa kiểu dáng (Chưa có ảnh riêng cho màu {selectedColor})
                      </div>
                    )}

                    {/* Image Counter & Alt text */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      {currentImage?.altText ? (
                        <div className="bg-black/75 text-white/80 font-mono text-[10px] px-2.5 py-1 backdrop-blur-xs rounded-xs border border-white/10 max-w-[70%] truncate">
                          {currentImage.altText}
                        </div>
                      ) : (
                        <div />
                      )}
                      {activeGalleryImages.length > 1 && (
                        <div className="bg-black/75 text-[#D6B27C] font-mono text-[11px] px-2.5 py-1 backdrop-blur-xs rounded-xs border border-white/10">
                          {String(safeImageIndex + 1).padStart(2, '0')} / {String(activeGalleryImages.length).padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnails Row */}
                  {activeGalleryImages.length > 1 && (
                    <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2.5 overflow-x-auto scrollbar-thin">
                      {activeGalleryImages.map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => handleThumbnailClick(idx)}
                          aria-label={`Xem ảnh ${idx + 1}`}
                          className={`w-14 h-16 shrink-0 border rounded-xs overflow-hidden transition-all cursor-pointer ${
                            safeImageIndex === idx
                              ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/60 scale-102'
                              : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/40'
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

                {/* Right Column: Sticky Purchase Panel & Editorial Accordions (~42%) */}
                <div className="w-full lg:w-[42%] p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-[#0D0E12] pb-24 lg:pb-10">
                  <div className="space-y-6">
                    {/* Eyebrow & Brand Header */}
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#D6B27C] uppercase mb-1.5 font-semibold">
                        <span>IVRE / THE ATELIER EDIT</span>
                        {product.categoryName && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="text-white/60">{product.categoryName}</span>
                          </>
                        )}
                      </div>
                      <h1 id="product-modal-title" className="font-editorial text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-white leading-tight">
                        {product.name}
                      </h1>
                      {product.description && (
                        <p className="text-sm text-white/60 font-sans mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing Block with Variant-specific Price */}
                    <div className="flex items-baseline gap-3.5 pb-2 border-b border-white/10">
                      <span className="font-mono text-2xl sm:text-3xl font-bold text-[#D6B27C]">
                        {currentVariant
                          ? formatVND(currentVariant.price)
                          : formatVND(product.minPrice)}
                      </span>
                      {currentVariant?.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                        <>
                          <span className="font-mono text-sm text-white/40 line-through">
                            {formatVND(currentVariant.compareAtPrice)}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-red-950/60 text-red-300 border border-red-500/30 rounded-2xs font-semibold">
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
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-white/50 uppercase tracking-wider">MÀU SẮC:</span>
                        <span className="text-white font-medium">{selectedColor}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {product.availableColors.map((color) => {
                          const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                          return (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => handleColorChange(color.name)}
                              aria-label={`Chọn màu ${color.name}`}
                              title={color.name}
                              className={`group relative p-1 rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/50 scale-110 shadow-sm'
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
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-white/50 uppercase tracking-wider">KÍCH CỠ:</span>
                        <button
                          type="button"
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="text-[#D6B27C] hover:text-white cursor-pointer flex items-center gap-1 font-medium transition-colors"
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
                                  ? 'border-[#D6B27C] bg-[#D6B27C]/20 text-[#D6B27C] font-bold shadow-xs cursor-pointer'
                                  : !isOffered
                                  ? 'border-white/5 bg-white/[0.01] text-white/15 cursor-not-allowed opacity-30'
                                  : isStockAvailable
                                  ? 'border-white/15 bg-white/5 text-white hover:border-[#D6B27C] cursor-pointer'
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
                            <span className="text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 inline-block rounded-2xs">
                              Đã có {existingCartQuantity}/{MAX_PER_LINE} sản phẩm trong giỏ (tối đa theo quy định)
                            </span>
                          ) : currentVariant.stockQuantity <= 5 ? (
                            <span className="text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 inline-block rounded-2xs">
                              Chỉ còn {currentVariant.stockQuantity} sản phẩm trong kho
                              {existingCartQuantity > 0 && ` (Đã có ${existingCartQuantity} trong giỏ)`}
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 inline-block rounded-2xs">
                              Sẵn sàng giao hàng (Tại xưởng may Hà Nội)
                              {existingCartQuantity > 0 && ` (Đã có ${existingCartQuantity} trong giỏ)`}
                            </span>
                          )
                        ) : (
                          <span className="text-red-400 bg-red-950/30 border border-red-500/30 px-2.5 py-1 inline-block font-bold rounded-2xs">
                            Biến thể {currentVariant.colorName} / {currentVariant.size} tạm thời hết hàng
                          </span>
                        )
                      ) : (
                        <span className="text-white/40">Vui lòng chọn size và màu khả dụng</span>
                      )}
                    </div>

                    {/* Desktop Purchase Action Bar: Quantity & Add to Cart CTA */}
                    <div className="hidden lg:flex items-center gap-3 pt-2">
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
                        className="flex-1 h-11 bg-[#D6B27C] hover:bg-[#E2C496] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_20px_rgba(214,178,124,0.25)] hover:shadow-[0_6px_28px_rgba(214,178,124,0.4)]"
                      >
                        {isSubmitting ? (
                          <span className="animate-spin w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full"></span>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-[#0A0B0E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
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
                              <span className="text-[#0A0B0E]/80 font-bold ml-1">
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

                    {/* Trust Badges Strip (Daylog / Luxury Studio Style) */}
                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-white/10 my-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <svg className="w-4 h-4 text-[#D6B27C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM3 9h11v8H3zM14 9h4l3 3v5h-7z" />
                        </svg>
                        <span className="text-[11px] font-mono text-white font-medium">Giao COD Toàn Quốc</span>
                        <span className="text-[10px] text-white/40">Thanh toán khi nhận</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <svg className="w-4 h-4 text-[#D6B27C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-[11px] font-mono text-white font-medium">Đổi Size 7 Ngày</span>
                        <span className="text-[10px] text-white/40">Hỗ trợ thử & đổi size</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <svg className="w-4 h-4 text-[#D6B27C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[11px] font-mono text-white font-medium">100% Chính Hãng</span>
                        <span className="text-[10px] text-white/40">Kiểm tra trước khi nhận</span>
                      </div>
                    </div>

                    {/* Editorial Rich Accordions */}
                    <div className="divide-y divide-white/10 border-b border-white/10 text-xs">
                      {/* Accordion 1: Description */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAccordion('description')}
                          className="w-full py-3.5 flex items-center justify-between text-left font-mono uppercase tracking-wider text-white hover:text-[#D6B27C] transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">MÔ TẢ & CẢM HỨNG THIẾT KẾ</span>
                          <span className="text-[#D6B27C] text-sm">{openAccordions.description ? '−' : '+'}</span>
                        </button>
                        {openAccordions.description && (
                          <div className="pb-4 text-white/70 font-sans leading-relaxed space-y-2">
                            <p>{product.description || 'Thiết kế tinh xảo từ xưởng may IVRE Atelier với sự kết hợp hài hòa giữa cấu trúc may đo hiện đại và chất liệu thượng hạng.'}</p>
                            <p className="text-white/50 text-[11px]">
                              Sản phẩm được chế tác thủ công với đường kim mũi chỉ chuẩn mực cao cấp, giữ phom dáng bền đẹp qua thời gian.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Accordion 2: Materials & Composition */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAccordion('material')}
                          className="w-full py-3.5 flex items-center justify-between text-left font-mono uppercase tracking-wider text-white hover:text-[#D6B27C] transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">CHẤT LIỆU & CẤU TRÚC SỢI</span>
                          <span className="text-[#D6B27C] text-sm">{openAccordions.material ? '−' : '+'}</span>
                        </button>
                        {openAccordions.material && (
                          <div className="pb-4 text-white/70 font-sans leading-relaxed space-y-1.5">
                            <p>
                              <strong className="text-white font-mono uppercase text-[11px]">Thành phần chính:</strong>{' '}
                              {product.material || 'Vải cao cấp độc quyền IVRE Atelier'}
                            </p>
                            <p className="text-white/50 text-[11px]">
                              Sợi dệt tự nhiên thoáng khí, thấm hút mồ hôi tối ưu, có độ rũ mềm mại và bề mặt bắt sáng tự nhiên.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Accordion 3: Fit & Sizing */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAccordion('fit')}
                          className="w-full py-3.5 flex items-center justify-between text-left font-mono uppercase tracking-wider text-white hover:text-[#D6B27C] transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">FORM DÁNG & THÔNG SỐ KÍCH CỠ</span>
                          <span className="text-[#D6B27C] text-sm">{openAccordions.fit ? '−' : '+'}</span>
                        </button>
                        {openAccordions.fit && (
                          <div className="pb-4 text-white/70 font-sans leading-relaxed space-y-2">
                            <p>
                              <strong className="text-white font-mono uppercase text-[11px]">Phom dáng:</strong>{' '}
                              {product.fitStyle || 'Tailored Regular Fit — Phom chuẩn tôn dáng người mặc'}
                            </p>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setIsSizeGuideOpen(true)}
                                className="text-[#D6B27C] hover:underline font-mono text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                Xem thông số chi tiết số đo 3 vòng trong bảng quy đổi size ↗
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accordion 4: Care Instructions */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAccordion('care')}
                          className="w-full py-3.5 flex items-center justify-between text-left font-mono uppercase tracking-wider text-white hover:text-[#D6B27C] transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">HƯỚNG DẪN BẢO QUẢN & GIẶT LÀ</span>
                          <span className="text-[#D6B27C] text-sm">{openAccordions.care ? '−' : '+'}</span>
                        </button>
                        {openAccordions.care && (
                          <div className="pb-4 text-white/70 font-sans leading-relaxed space-y-1 text-xs">
                            <p>
                              {product.careInstructions ||
                                'Giặt hấp khô hoặc giặt nhẹ bằng tay với nước lạnh. Phơi trên móc bản to trong bóng râm, tránh ánh nắng trực tiếp. Ủi ở nhiệt độ thấp mặt trái vải.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Accordion 5: Shipping & Delivery */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAccordion('delivery')}
                          className="w-full py-3.5 flex items-center justify-between text-left font-mono uppercase tracking-wider text-white hover:text-[#D6B27C] transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">CHÍNH SÁCH GIAO NHẬN & ĐỔI TRẢ</span>
                          <span className="text-[#D6B27C] text-sm">{openAccordions.delivery ? '−' : '+'}</span>
                        </button>
                        {openAccordions.delivery && (
                          <div className="pb-4 text-white/70 font-sans leading-relaxed space-y-1.5 text-xs">
                            <p>• <strong>Giao hàng:</strong> 1-2 ngày đối với nội thành Hà Nội & TP.HCM; 2-4 ngày đối với các tỉnh thành khác.</p>
                            <p>• <strong>Thanh toán COD:</strong> Quý khách được đồng kiểm hàng trước khi thanh toán tiền mặt cho nhân viên giao hàng.</p>
                            <p>• <strong>Đổi hàng:</strong> Đổi size/màu miễn phí trong 7 ngày đối với sản phẩm còn nguyên tem mác và chưa qua sử dụng.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* "You May Also Like" (Sản phẩm gợi ý liên quan) Curated Section */}
              {isLoadingRelated ? (
                <div className="p-8 border-t border-white/10 bg-[#090A0D] flex items-center justify-center font-mono text-xs text-[#D6B27C] gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-[#D6B27C] border-t-transparent rounded-full" />
                  <span>ĐANG TUYỂN CHỌN BỘ SƯU TẬP TƯƠNG THÍCH...</span>
                </div>
              ) : relatedProducts.length > 0 ? (
                <div className="p-6 sm:p-8 lg:p-10 border-t border-white/10 bg-[#090A0D]">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-mono tracking-[0.25em] text-[#D6B27C] uppercase block mb-1">
                        IVRE CURATED SELECTION
                      </span>
                      <h2 className="font-editorial text-xl sm:text-2xl text-white font-medium tracking-tight">
                        Gợi Ý Hoàn Thiện Phong Cách
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-white/40 mt-1 sm:mt-0">
                      Sản phẩm tương thích cùng bộ sưu tập
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {relatedProducts.map((relProduct) => (
                      <div
                        key={relProduct.id}
                        onClick={() => onSelectProduct && onSelectProduct(relProduct.slug)}
                        className="group bg-[#111215] border border-white/10 hover:border-[#D6B27C]/60 rounded-xs overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#17181D]">
                          <img
                            src={relProduct.primaryImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80'}
                            alt={relProduct.name}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1 bg-black/80 text-[#D6B27C] text-[10px] font-mono uppercase tracking-widest border border-[#D6B27C]/40 rounded-xs">
                              XEM CHI TIẾT
                            </span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3.5 flex flex-col flex-1 justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-1">
                              {relProduct.categoryName || 'ATELIER'}
                            </span>
                            <h3 className="font-editorial text-sm sm:text-base text-white font-normal line-clamp-1 group-hover:text-[#D6B27C] transition-colors">
                              {relProduct.name}
                            </h3>
                          </div>
                          <div className="mt-2.5 flex items-baseline justify-between">
                            <span className="font-mono text-xs sm:text-sm font-bold text-[#D6B27C]">
                              {formatVND(relProduct.minPrice)}
                            </span>
                            {relProduct.availableColors && relProduct.availableColors.length > 0 && (
                              <div className="flex items-center gap-1">
                                {relProduct.availableColors.slice(0, 3).map((c) => (
                                  <span
                                    key={c.name}
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: c.hex }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Mobile Sticky Bottom Action Bar with Safe-area padding */}
              <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0D0E12]/95 backdrop-blur-md p-3 sm:p-4 border-t border-white/15 z-30 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.8)]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">TỔNG CỘNG</span>
                  <span className="font-mono text-base font-bold text-[#D6B27C]">
                    {currentVariant
                      ? formatVND(currentVariant.price * effectiveQuantity)
                      : formatVND(product.minPrice)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={
                    !currentVariant ||
                    !currentVariant.inStock ||
                    maxAddableQuantity <= 0 ||
                    isSubmitting
                  }
                  onClick={handleAddToCart}
                  className="flex-1 h-11 bg-[#D6B27C] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-widest font-bold rounded-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(214,178,124,0.3)]"
                >
                  {isSubmitting ? (
                    <span className="animate-spin w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full" />
                  ) : (
                    <span>
                      {!currentVariant
                        ? 'KHÔNG KHẢ DỤNG'
                        : !currentVariant.inStock
                        ? 'HẾT HÀNG'
                        : maxAddableQuantity <= 0
                        ? 'ĐÃ ĐẠT GIỚI HẠN GIỎ'
                        : 'THÊM VÀO GIỎ'}
                    </span>
                  )}
                </button>
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
