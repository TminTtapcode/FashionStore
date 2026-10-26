import { useState } from 'react';
import type { ProductSummary } from '../types/catalog';

interface ProductCardProps {
  product: ProductSummary;
  onSelect: (slug: string) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const hasMultiplePrices = product.minPrice < product.maxPrice;
  const isDiscounted = product.compareAtPrice && product.compareAtPrice > product.minPrice;
  const discountPercent = isDiscounted && product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.minPrice) / product.compareAtPrice) * 100)
    : 0;

  const currentImage = (isHovered && product.secondaryImageUrl)
    ? product.secondaryImageUrl
    : product.primaryImageUrl;

  return (
    <div
      onClick={() => onSelect(product.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col bg-white border border-[#E6E4DF] transition-all duration-300 hover:shadow-lg hover:border-[#121212]"
    >
      {/* 3:4 Aspect Ratio Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0EEE9]">
        <img
          src={currentImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.outOfStock ? (
            <span className="bg-[#121212] text-[#FAF9F6] text-[10px] font-mono uppercase px-2 py-0.5 tracking-widest font-semibold">
              HẾT HÀNG
            </span>
          ) : isDiscounted ? (
            <span className="bg-red-700 text-white text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold">
              -{discountPercent}%
            </span>
          ) : (
            <span className="bg-[#FAF9F6]/90 backdrop-blur-sm text-[#121212] text-[10px] font-mono uppercase px-2 py-0.5 tracking-widest border border-[#E6E4DF]">
              ATELIER
            </span>
          )}
        </div>

        {/* Quick View Button on Desktop Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
          <span className="bg-white text-[#121212] text-xs font-mono uppercase tracking-widest py-2 px-4 shadow-sm w-full text-center hover:bg-[#121212] hover:text-white transition-colors">
            XEM CHI TIẾT
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Category & Brand */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] tracking-wider uppercase mb-1">
            <span>{product.categoryName || 'THỜI TRANG'}</span>
            <span>{product.brand || 'ATELIER'}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-sm tracking-tight font-medium text-[#121212] line-clamp-1 group-hover:underline">
            {product.name}
          </h3>

          {/* Fabric / Material highlight */}
          {product.material && (
            <p className="text-[11px] text-[#666666] line-clamp-1 italic mt-0.5">
              {product.material}
            </p>
          )}
        </div>

        <div>
          {/* Price & Compare Price */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-sm font-bold text-[#121212]">
              {hasMultiplePrices ? `Từ ${formatVND(product.minPrice)}` : formatVND(product.minPrice)}
            </span>
            {isDiscounted && product.compareAtPrice && (
              <span className="text-xs text-[#999999] line-through">
                {formatVND(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Color Swatch Dots & Available Sizes */}
          <div className="mt-3 pt-2.5 border-t border-[#F0EEE9] flex items-center justify-between">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5" title="Màu sắc sẵn có">
              {product.availableColors.slice(0, 4).map((color, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner inline-block"
                  style={{ backgroundColor: color.hex || '#E0E0E0' }}
                  title={color.name}
                />
              ))}
              {product.availableColors.length > 4 && (
                <span className="text-[10px] font-mono text-[#888888]">
                  +{product.availableColors.length - 4}
                </span>
              )}
            </div>

            {/* Sizes */}
            <div className="text-[11px] font-mono text-[#666666] tracking-wider">
              {product.availableSizes.slice(0, 3).join(' · ')}
              {product.availableSizes.length > 3 && '...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
