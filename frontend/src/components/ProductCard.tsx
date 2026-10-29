import { useState } from 'react';
import type { ProductSummary } from '../types/catalog';

interface ProductCardProps {
  product: ProductSummary;
  onSelect: (slug: string) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeColorHex, setActiveColorHex] = useState<string | null>(null);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const hasMultiplePrices = product.minPrice < product.maxPrice;
  const isDiscounted = product.compareAtPrice && product.compareAtPrice > product.minPrice;
  const discountPercent = isDiscounted && product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.minPrice) / product.compareAtPrice) * 100)
    : 0;

  // Determine current image: use secondary image on hover if present
  const fallbackImage = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80';
  const currentImage = (isHovered && product.secondaryImageUrl)
    ? product.secondaryImageUrl
    : (product.primaryImageUrl || fallbackImage);

  const activeColor = product.availableColors.find((c) => c.hex === activeColorHex);

  return (
    <article
      data-product-card="true"
      onClick={() => onSelect(product.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveColorHex(null);
      }}
      className="group cursor-pointer flex flex-col bg-[#111216]/85 backdrop-blur-md border border-white/10 hover:border-[#D6B27C]/70 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.65)] hover:-translate-y-1 rounded-xs overflow-hidden"
    >
      {/* 3:4 Aspect Ratio Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#18191E]">
        <img
          src={currentImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Minimalist Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.outOfStock ? (
            <span className="bg-[#151518]/95 backdrop-blur-xs text-[#F7F7F4] text-[10px] font-mono uppercase px-2 py-0.5 tracking-widest font-semibold rounded-2xs border border-white/15">
              HẾT HÀNG
            </span>
          ) : isDiscounted ? (
            <span className="bg-[#C9184A] text-white text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold rounded-2xs shadow-xs">
              -{discountPercent}%
            </span>
          ) : (
            <span className="bg-black/75 backdrop-blur-xs text-[#D6B27C] text-[10px] font-mono uppercase px-2 py-0.5 tracking-widest font-medium border border-[#D6B27C]/40 rounded-2xs">
              ATELIER DROP
            </span>
          )}
        </div>

        {/* Studio Flash Quick Indicator on Card Hover */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="w-6 h-6 rounded-full bg-black/70 backdrop-blur-xs flex items-center justify-center text-[10px] text-[#D6B27C] shadow-xs border border-white/15">
            ✦
          </span>
        </div>

        {/* Sleek Quick View Pill on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden sm:flex justify-center z-10">
          <span className="w-full text-center py-2 bg-[#D6B27C] hover:bg-white text-[#151518] text-xs font-mono uppercase tracking-[0.2em] shadow-sm backdrop-blur-xs transition-colors rounded-2xs font-bold">
            XEM CHI TIẾT
          </span>
        </div>
      </div>

      {/* Card Information: Clean, Breathable Hierarchy based on Fashion Editorial Standards */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* 1. Category & Brand Kicker */}
          <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase">
            <span className="text-[#D6B27C] font-semibold">
              {product.categoryName || 'COUTURE'} · {product.brand || 'ATELIER'}
            </span>
          </div>

          {/* 2. Full Product Name (2 Lines Max, No awkward truncations) */}
          <h3 className="font-sans text-sm font-medium tracking-tight text-white line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-[#D6B27C] transition-colors">
            {product.name}
          </h3>

          {/* 3. Material & Fit Microcopy */}
          {product.material && (
            <p className="text-[11px] text-zinc-400 font-sans line-clamp-1">
              {product.material}
              {product.fitStyle ? ` · ${product.fitStyle}` : ''}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-1">
          {/* 4. High-Contrast Pricing */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-base font-bold text-white tracking-tight">
              {hasMultiplePrices ? `Từ ${formatVND(product.minPrice)}` : formatVND(product.minPrice)}
            </span>
            {isDiscounted && product.compareAtPrice && (
              <span className="text-xs text-zinc-500 line-through">
                {formatVND(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* 5. Available Sizes Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.availableSizes.map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 text-[10px] font-mono bg-white/[0.06] border border-white/10 rounded-2xs text-zinc-300"
              >
                {size}
              </span>
            ))}
          </div>

          {/* 6. Color Selection Swatches with Dynamic Color Indicator */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            {/* Color Swatch Dots */}
            <div className="flex items-center gap-1.5" title="Màu sắc sẵn có">
              {product.availableColors.slice(0, 4).map((color, idx) => {
                const isCurrent = activeColorHex === color.hex;
                return (
                  <span
                    key={idx}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setActiveColorHex(color.hex);
                    }}
                    className={`w-3.5 h-3.5 rounded-full border shadow-inner inline-block transition-transform ${
                      isCurrent ? 'scale-125 ring-1 ring-[#D6B27C]' : 'border-white/25 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex || '#E0E0E0' }}
                    title={color.name}
                  />
                );
              })}
              {product.availableColors.length > 4 && (
                <span className="text-[10px] font-mono text-zinc-500">
                  +{product.availableColors.length - 4}
                </span>
              )}
            </div>

            {/* Color Label or Prompt */}
            <span className="text-[10px] font-mono text-zinc-400 tracking-wider">
              {activeColor ? activeColor.name : 'Chọn màu'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
