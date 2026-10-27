import { useEffect, useState, useMemo } from 'react';
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
  const { addToCart } = useCart();
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

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  useEffect(() => {
    if (!isOpen || !slug) {
      setProduct(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    getProductDetailApi(slug)
      .then((data) => {
        setProduct(data);
        if (data.availableColors.length > 0) {
          setSelectedColor(data.availableColors[0].name);
        }
        if (data.availableSizes.length > 0) {
          setSelectedSize(data.availableSizes[0]);
        }
        setSelectedImageIndex(0);
        setQuantity(1);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải thông tin sản phẩm');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, slug]);

  // Find active variant corresponding to (selectedColor, selectedSize)
  const currentVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find(
      (v) =>
        v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toUpperCase() === selectedSize.toUpperCase()
    ) || null;
  }, [product, selectedColor, selectedSize]);

  // When clicking a color swatch, switch gallery to corresponding variant image if available
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    if (!product) return;

    // Check if any image has variantId matching this color
    const matchingVariant = product.variants.find(
      (v) => v.colorName.toLowerCase() === colorName.toLowerCase()
    );
    if (matchingVariant) {
      const imgIdx = product.images.findIndex((img) => img.variantId === matchingVariant.id);
      if (imgIdx >= 0) {
        setSelectedImageIndex(imgIdx);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant || !currentVariant.inStock || isSubmitting) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 120);

      await addToCart(currentVariant.id, quantity);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thêm vào giỏ hàng';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true">
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
                className="border border-white/20 text-white px-4 py-1.5 text-xs font-mono uppercase hover:border-[#C7AD83] hover:text-[#C7AD83] rounded-xs"
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
                  <img
                    src={product.images[selectedImageIndex]?.imageUrl || product.images[0]?.imageUrl}
                    alt={product.images[selectedImageIndex]?.altText || product.name}
                    className="w-full h-full object-cover object-top transition-all duration-300"
                  />
                  {product.images[selectedImageIndex]?.altText && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/75 text-white/80 font-mono text-[10px] px-2.5 py-1 backdrop-blur-xs rounded-xs border border-white/10">
                      {product.images[selectedImageIndex].altText}
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {product.images.length > 1 && (
                  <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto">
                    {product.images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-18 shrink-0 overflow-hidden border-2 transition-all cursor-pointer rounded-xs ${
                          selectedImageIndex === idx ? 'border-[#C7AD83] scale-102' : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Purchase Info & Selection */}
              <div className="w-full md:w-1/2 flex flex-col h-[55vh] md:h-full overflow-y-auto p-6 md:p-8 justify-between bg-[#0D0E12]">
                <div className="space-y-6">
                  {/* Category & Name */}
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#C7AD83] tracking-widest uppercase mb-1 font-semibold">
                      <span>{product.categoryName}</span>
                      <span>·</span>
                      <span>{product.brand || 'ATELIER'}</span>
                    </div>
                    <h1 className="font-editorial text-2xl md:text-3xl tracking-tight font-medium text-white">
                      {product.name}
                    </h1>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-3 border-y border-white/10 py-3 font-mono">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {currentVariant ? formatVND(currentVariant.price) : formatVND(product.minPrice)}
                    </span>
                    {(currentVariant?.compareAtPrice || product.compareAtPrice) && (
                      <span className="text-sm text-white/40 line-through">
                        {formatVND(currentVariant?.compareAtPrice || product.compareAtPrice!)}
                      </span>
                    )}
                    {currentVariant && currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                      <span className="bg-[#C9184A] text-white text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold rounded-2xs">
                        GIẢM {Math.round(((currentVariant.compareAtPrice - currentVariant.price) / currentVariant.compareAtPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/50 uppercase tracking-wider">MÀU SẮC:</span>
                      <span className="font-bold text-[#C7AD83]">{selectedColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.availableColors.map((color) => {
                        const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => handleColorChange(color.name)}
                            title={color.name}
                            className={`group relative p-0.5 rounded-full border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-[#C7AD83] scale-110 shadow-sm' : 'border-transparent hover:border-white/40'
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
                            v.size.toUpperCase() === size.toUpperCase() &&
                            v.colorName.toLowerCase() === selectedColor.toLowerCase()
                        );
                        const isStockAvailable = variantForSize ? variantForSize.inStock : false;
                        const isSelected = selectedSize.toUpperCase() === size.toUpperCase();

                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={!isStockAvailable}
                            onClick={() => setSelectedSize(size)}
                            className={`relative h-10 border text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center rounded-2xs ${
                              isSelected
                                ? 'border-[#C7AD83] bg-[#C7AD83]/20 text-[#C7AD83] font-bold shadow-xs'
                                : isStockAvailable
                                ? 'border-white/15 bg-white/5 text-white hover:border-[#C7AD83]'
                                : 'border-white/5 bg-white/[0.02] text-white/25 cursor-not-allowed'
                            }`}
                          >
                            <span>{size}</span>
                            {!isStockAvailable && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full border-t border-white/25 rotate-[-25deg] transform"></span>
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
                      currentVariant.inStock ? (
                        currentVariant.stockQuantity <= 5 ? (
                          <span className="text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 inline-block rounded-2xs">
                            Chỉ còn {currentVariant.stockQuantity} sản phẩm trong kho
                          </span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 inline-block rounded-2xs">
                            Sẵn sàng giao hàng
                          </span>
                        )
                      ) : (
                        <span className="text-red-400 bg-red-950/30 border border-red-500/30 px-2 py-0.5 inline-block font-bold rounded-2xs">
                          Biến thể {currentVariant.colorName} / {currentVariant.size} tạm thời hết hàng
                        </span>
                      )
                    ) : (
                      <span className="text-white/40">Vui lòng chọn size và màu</span>
                    )}
                  </div>

                  {/* Accordion Tabs for Material & Care */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex border-b border-white/10 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'details' ? 'border-[#C7AD83] text-[#C7AD83]' : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        CHẤT LIỆU & PHOM DÁNG
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('care')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'care' ? 'border-[#C7AD83] text-[#C7AD83]' : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        BẢO QUẢN
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('delivery')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'delivery' ? 'border-[#C7AD83] text-[#C7AD83]' : 'border-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        GIAO HÀNG & ĐỔI TRẢ
                      </button>
                    </div>

                    <div className="text-xs text-white/70 leading-relaxed pt-1 font-sans">
                      {activeTab === 'details' && (
                        <div className="space-y-1.5">
                          <p><strong className="text-white">Chất liệu:</strong> {product.material || 'Vải cao cấp'}</p>
                          <p><strong className="text-white">Form dáng:</strong> {product.fitStyle || 'Tiêu chuẩn'}</p>
                          <p className="text-white/60 pt-1 leading-relaxed">{product.description}</p>
                        </div>
                      )}
                      {activeTab === 'care' && (
                        <div className="space-y-1 text-white/60 leading-relaxed">
                          <p>{product.careInstructions || 'Giặt nhẹ bằng tay, phơi trong bóng râm, không dùng chất tẩy mạnh.'}</p>
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
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-1 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-white">{quantity}</span>
                    <button
                      type="button"
                      disabled={!currentVariant || quantity >= currentVariant.stockQuantity}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3.5 py-1 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    disabled={!currentVariant || !currentVariant.inStock || isSubmitting}
                    onClick={handleAddToCart}
                    className="flex-1 h-11 bg-[#C7AD83] hover:bg-[#D9C09A] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_20px_rgba(199,173,131,0.25)] hover:shadow-[0_6px_28px_rgba(199,173,131,0.4)]"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>{currentVariant?.inStock ? 'THÊM VÀO GIỎ HÀNG' : 'HẾT HÀNG'}</span>
                        {currentVariant?.inStock && (
                          <span className="text-[#0A0B0E]/70 font-semibold">({formatVND(currentVariant.price * quantity)})</span>
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
