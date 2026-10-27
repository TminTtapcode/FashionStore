import { useEffect, useState, useMemo } from 'react';
import { getProductDetailApi } from '../api/catalogApi';
import type { ProductDetail, ProductVariant } from '../types/catalog';
import SizeGuideDrawer from './SizeGuideDrawer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (variant: ProductVariant, quantity: number) => void;
}

export default function ProductDetailModal({
  slug,
  isOpen,
  onClose,
  onAddToCart,
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
      await addToCart(currentVariant.id, quantity);
      if (onAddToCart) {
        onAddToCart(currentVariant, quantity);
      }
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
      <div className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-6">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-5xl bg-[#FAF9F6] text-[#121212] h-full md:h-[90vh] md:max-h-[820px] shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden border border-[#E6E4DF] animate-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-[#121212] hover:text-white border border-[#E6E4DF] font-mono text-xs px-2.5 py-1 transition-colors cursor-pointer"
          >
            [X] ĐÓNG
          </button>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 font-mono text-sm space-y-3">
              <span className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></span>
              <span className="text-[#666666] tracking-widest uppercase">ĐANG TẢI THÔNG TIN SẢN PHẨM...</span>
            </div>
          ) : error || !product ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 font-mono text-sm space-y-4">
              <p className="text-red-600 tracking-wider">{error || 'Không tìm thấy sản phẩm'}</p>
              <button
                type="button"
                onClick={onClose}
                className="border border-[#121212] px-4 py-1.5 text-xs font-mono uppercase hover:bg-[#121212] hover:text-white"
              >
                QUAY LẠI
              </button>
            </div>
          ) : (
            <>
              {/* Left Column: Image Gallery (Lookbook style) */}
              <div className="w-full md:w-1/2 bg-[#F0EEE9] flex flex-col h-[45vh] md:h-full border-b md:border-b-0 md:border-r border-[#E6E4DF]">
                {/* Main Large Image */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={product.images[selectedImageIndex]?.imageUrl || product.images[0]?.imageUrl}
                    alt={product.images[selectedImageIndex]?.altText || product.name}
                    className="w-full h-full object-cover object-top transition-all duration-300"
                  />
                  {product.images[selectedImageIndex]?.altText && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 backdrop-blur-xs">
                      {product.images[selectedImageIndex].altText}
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {product.images.length > 1 && (
                  <div className="p-3 bg-white/70 border-t border-[#E6E4DF] flex items-center gap-2 overflow-x-auto">
                    {product.images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-18 shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                          selectedImageIndex === idx ? 'border-[#121212] scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Purchase Info & Selection */}
              <div className="w-full md:w-1/2 flex flex-col h-[55vh] md:h-full overflow-y-auto p-6 md:p-8 justify-between">
                <div className="space-y-6">
                  {/* Category & Name */}
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888] tracking-widest uppercase mb-1">
                      <span>{product.categoryName}</span>
                      <span>·</span>
                      <span>{product.brand || 'ATELIER'}</span>
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl tracking-tight font-medium text-[#121212]">
                      {product.name}
                    </h1>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-3 border-y border-[#E6E4DF] py-3 font-mono">
                    <span className="text-2xl font-bold text-[#121212]">
                      {currentVariant ? formatVND(currentVariant.price) : formatVND(product.minPrice)}
                    </span>
                    {(currentVariant?.compareAtPrice || product.compareAtPrice) && (
                      <span className="text-sm text-[#999999] line-through">
                        {formatVND(currentVariant?.compareAtPrice || product.compareAtPrice!)}
                      </span>
                    )}
                    {currentVariant && currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price && (
                      <span className="bg-red-700 text-white text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold">
                        GIẢM {Math.round(((currentVariant.compareAtPrice - currentVariant.price) / currentVariant.compareAtPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#666666] uppercase tracking-wider">MÀU SẮC:</span>
                      <span className="font-bold text-[#121212]">{selectedColor}</span>
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
                              isSelected ? 'border-[#121212] scale-110 shadow-sm' : 'border-transparent hover:border-black/30'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full border border-black/20 block"
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
                      <span className="text-[#666666] uppercase tracking-wider">KÍCH CỠ:</span>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="underline text-[#121212] hover:text-emerald-700 cursor-pointer flex items-center gap-1 font-medium"
                      >
                        [ BẢNG SIZE GUIDE ]
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
                            className={`relative h-10 border text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'border-[#121212] bg-[#121212] text-[#FAF9F6]'
                                : isStockAvailable
                                ? 'border-[#E6E4DF] bg-white text-[#121212] hover:border-[#121212]'
                                : 'border-[#E6E4DF] bg-[#F5F4F0] text-[#AAAAAA] cursor-not-allowed'
                            }`}
                          >
                            <span>{size}</span>
                            {!isStockAvailable && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full border-t border-[#AAAAAA] rotate-[-25deg] transform"></span>
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
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 inline-block">
                            Chỉ còn {currentVariant.stockQuantity} sản phẩm trong kho
                          </span>
                        ) : (
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 inline-block">
                            Sẵn sàng giao hàng
                          </span>
                        )
                      ) : (
                        <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 inline-block font-bold">
                          Biến thể {currentVariant.colorName} / {currentVariant.size} tạm thời hết hàng
                        </span>
                      )
                    ) : (
                      <span className="text-[#888888]">Vui lòng chọn size và màu</span>
                    )}
                  </div>

                  {/* Accordion Tabs for Material & Care */}
                  <div className="border-t border-[#E6E4DF] pt-4 space-y-3">
                    <div className="flex border-b border-[#E6E4DF] text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'details' ? 'border-[#121212] text-[#121212]' : 'border-transparent text-[#888888]'
                        }`}
                      >
                        CHẤT LIỆU & PHOM DÁNG
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('care')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'care' ? 'border-[#121212] text-[#121212]' : 'border-transparent text-[#888888]'
                        }`}
                      >
                        BẢO QUẢN
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('delivery')}
                        className={`pb-2 px-3 border-b-2 font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'delivery' ? 'border-[#121212] text-[#121212]' : 'border-transparent text-[#888888]'
                        }`}
                      >
                        GIAO HÀNG & ĐỔI TRẢ
                      </button>
                    </div>

                    <div className="text-xs text-[#555555] leading-relaxed pt-1">
                      {activeTab === 'details' && (
                        <div className="space-y-2">
                          <p><strong>Chất liệu:</strong> {product.material || 'Vải cao cấp'}</p>
                          <p><strong>Form dáng:</strong> {product.fitStyle || 'Tiêu chuẩn'}</p>
                          <p>{product.description}</p>
                        </div>
                      )}
                      {activeTab === 'care' && (
                        <div className="space-y-1">
                          <p>{product.careInstructions || 'Giặt nhẹ bằng tay, phơi trong bóng râm, không dùng chất tẩy mạnh.'}</p>
                        </div>
                      )}
                      {activeTab === 'delivery' && (
                        <div className="space-y-1">
                          <p>• Thanh toán COD khi nhận hàng toàn quốc.</p>
                          <p>• Đổi kích cỡ miễn phí trong 7 ngày nếu không vừa vặn.</p>
                          <p>• Kiểm tra hàng trước khi thanh toán.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar: Quantity & Add to Cart */}
                <div className="mt-6 pt-4 border-t border-[#E6E4DF] flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#121212] bg-white font-mono text-sm h-11">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 hover:bg-[#F0EEE9] disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{quantity}</span>
                    <button
                      type="button"
                      disabled={!currentVariant || quantity >= currentVariant.stockQuantity}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 hover:bg-[#F0EEE9] disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    disabled={!currentVariant || !currentVariant.inStock || isSubmitting}
                    onClick={handleAddToCart}
                    className="flex-1 h-11 bg-[#121212] text-[#FAF9F6] font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#2A2A2A] transition-colors disabled:bg-[#CCCCCC] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>{currentVariant?.inStock ? 'THÊM VÀO GIỎ HÀNG' : 'HẾT HÀNG'}</span>
                        {currentVariant?.inStock && (
                          <span className="text-[#999999]">({formatVND(currentVariant.price * quantity)})</span>
                        )}
                      </>
                    )}
                  </button>
                </div>
                {submitError && (
                  <p className="mt-2 text-xs font-mono text-red-600 bg-red-50 p-2 border border-red-200">
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
