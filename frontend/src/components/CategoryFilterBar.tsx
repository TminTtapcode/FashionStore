import { useState } from 'react';
import type { Category, ProductFilterParams } from '../types/catalog';

interface CategoryFilterBarProps {
  categories: Category[];
  filters: ProductFilterParams;
  onFilterChange: (newFilters: ProductFilterParams) => void;
  totalProducts?: number;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '28', '29', '30', '31', '32'];
const COMMON_COLORS = [
  { name: 'Trắng', hex: '#FFFFFF' },
  { name: 'Đen Than', hex: '#1C1C1C' },
  { name: 'Be Cát', hex: '#D8C7B5' },
  { name: 'Xanh Vintage', hex: '#4E6E8E' },
  { name: 'Xanh Rêu Nhạt', hex: '#7A8B7B' },
  { name: 'Trắng Ngọc', hex: '#FDFBF7' },
];

export default function CategoryFilterBar({
  categories,
  filters,
  onFilterChange,
  totalProducts = 0,
}: CategoryFilterBarProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const activeCategorySlug = filters.categorySlug || '';
  const activeFiltersCount =
    (filters.size ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const handleCategorySelect = (slug: string) => {
    onFilterChange({
      ...filters,
      categorySlug: slug || undefined,
      page: 0,
    });
  };

  const handleSizeSelect = (size: string) => {
    onFilterChange({
      ...filters,
      size: filters.size === size ? undefined : size,
      page: 0,
    });
  };

  const handleColorSelect = (colorName: string) => {
    onFilterChange({
      ...filters,
      color: filters.color === colorName ? undefined : colorName,
      page: 0,
    });
  };

  const handleSortChange = (sort: string) => {
    onFilterChange({
      ...filters,
      sort,
      page: 0,
    });
  };

  const handleInStockToggle = () => {
    onFilterChange({
      ...filters,
      inStockOnly: !filters.inStockOnly,
      page: 0,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      categorySlug: filters.categorySlug,
      sort: 'newest',
      page: 0,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Category Tabs Navigation */}
      <div className="border-b border-[#E6E4DF] overflow-x-auto scrollbar-none flex items-center justify-between gap-4">
        <nav aria-label="Danh mục trang phục" className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`py-3 px-3.5 text-xs font-mono uppercase tracking-widest whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeCategorySlug === ''
                ? 'border-[#121212] font-bold text-[#121212]'
                : 'border-transparent text-[#666666] hover:text-[#121212]'
            }`}
          >
            TẤT CẢ SẢN PHẨM
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`py-3 px-3.5 text-xs font-mono uppercase tracking-widest whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeCategorySlug === cat.slug
                    ? 'border-[#121212] font-bold text-[#121212]'
                    : 'border-transparent text-[#666666] hover:text-[#121212]'
                }`}
              >
                {cat.name}
              </button>
            </div>
          ))}
        </nav>

        {/* Product Count & Filter Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0 py-2">
          <span className="text-[11px] font-mono text-[#888888] hidden sm:inline">
            {totalProducts} SẢN PHẨM
          </span>

          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-3 py-1.5 border text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              isFilterDrawerOpen || activeFiltersCount > 0
                ? 'border-[#121212] bg-[#121212] text-white'
                : 'border-[#E6E4DF] bg-white text-[#121212] hover:border-[#121212]'
            }`}
          >
            <span>BỘ LỌC</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Subcategory Quick Pills (if root category selected) */}
      {categories.map((cat) => {
        if (cat.slug === activeCategorySlug && cat.children && cat.children.length > 0) {
          return (
            <div key={cat.id} className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              <span className="text-[#888888] uppercase tracking-wider text-[11px]">DÒNG HÀNG:</span>
              {cat.children.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleCategorySelect(sub.slug)}
                  className="px-2.5 py-1 bg-[#F0EEE9] hover:bg-[#121212] hover:text-white transition-colors cursor-pointer text-[11px] uppercase tracking-wider"
                >
                  {sub.name}
                </button>
              ))}
            </div>
          );
        }
        return null;
      })}

      {/* 3. Expandable Filter & Sort Drawer */}
      {isFilterDrawerOpen && (
        <div className="bg-white border border-[#E6E4DF] p-5 shadow-xs animate-in fade-in-50 duration-200 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Filter by Size */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#121212]">
                KÍCH CỠ (SIZE)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SIZES.map((size) => {
                  const isSelected = filters.size === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeSelect(size)}
                      className={`h-8 px-2.5 border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#121212] bg-[#121212] text-white font-bold'
                          : 'border-[#E6E4DF] bg-[#FAF9F6] text-[#333333] hover:border-[#121212]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Color */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#121212]">
                MÀU SẮC (SWATCH)
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_COLORS.map((col) => {
                  const isSelected = filters.color === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleColorSelect(col.name)}
                      title={col.name}
                      className={`flex items-center gap-1.5 px-2 py-1 border text-xs font-mono cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#121212] bg-[#121212] text-white'
                          : 'border-[#E6E4DF] bg-[#FAF9F6] text-[#444444] hover:border-[#121212]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#121212]">
                SẮP XẾP THEO
              </span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full h-9 border border-[#E6E4DF] bg-[#FAF9F6] px-3 font-mono text-xs uppercase tracking-wider cursor-pointer focus:border-[#121212] focus:outline-none"
              >
                <option value="newest">MỚI NHẤT (NEW ARRIVALS)</option>
                <option value="price_asc">GIÁ: TĂNG DẦN</option>
                <option value="price_desc">GIÁ: GIẢM DẦN</option>
                <option value="name_asc">TÊN: A — Z</option>
              </select>

              {/* In-stock toggle */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer font-mono text-xs text-[#444444]">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly || false}
                  onChange={handleInStockToggle}
                  className="rounded border-[#CCCCCC] text-[#121212] focus:ring-0 cursor-pointer"
                />
                <span>Chỉ hiển thị sản phẩm còn hàng</span>
              </label>
            </div>

            {/* Reset Actions */}
            <div className="flex flex-col justify-end space-y-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full h-9 border border-[#121212] text-xs font-mono uppercase tracking-wider hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
                >
                  XÓA BỘ LỌC ({activeFiltersCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full h-9 bg-[#121212] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                ÁP DỤNG & ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
