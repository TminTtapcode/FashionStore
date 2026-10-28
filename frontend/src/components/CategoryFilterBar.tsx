import { useState, useEffect, useRef } from 'react';
import type { Category, ProductFilterParams } from '../types/catalog';
import { DEFAULT_FILTERS } from '../utils/catalogUrl';

interface CategoryFilterBarProps {
  categories: Category[];
  filters: ProductFilterParams;
  onFilterChange: (newFilters: ProductFilterParams, options?: { replace?: boolean }) => void;
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

interface PricePreset {
  label: string;
  min?: number;
  max?: number;
}

const PRICE_PRESETS: PricePreset[] = [
  { label: '≤ 500k', max: 500000 },
  { label: '500k - 1 triệu', min: 500000, max: 1000000 },
  { label: '1 - 2 triệu', min: 1000000, max: 2000000 },
  { label: '≥ 2 triệu', min: 2000000 },
];

function findCategoryName(categories: Category[], slug?: string): string | null {
  if (!slug) return null;
  for (const cat of categories) {
    if (cat.slug === slug) return cat.name;
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryName(cat.children, slug);
      if (found) return found;
    }
  }
  return null;
}

function formatPriceCompact(price: number): string {
  if (price >= 1000000) {
    const tr = price / 1000000;
    return `${tr % 1 === 0 ? tr : tr.toFixed(1)} triệu`;
  }
  return `${price / 1000}k`;
}

export default function CategoryFilterBar({
  categories,
  filters,
  onFilterChange,
  totalProducts = 0,
}: CategoryFilterBarProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [prevSearch, setPrevSearch] = useState(filters.search);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const [prevMinPrice, setPrevMinPrice] = useState(filters.minPrice);
  const [prevMaxPrice, setPrevMaxPrice] = useState(filters.maxPrice);
  const [customMinPrice, setCustomMinPrice] = useState(
    filters.minPrice !== undefined ? filters.minPrice.toString() : ''
  );
  const [customMaxPrice, setCustomMaxPrice] = useState(
    filters.maxPrice !== undefined ? filters.maxPrice.toString() : ''
  );

  const [priceInputError, setPriceInputError] = useState<string | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust state during render when props change (Official React Pattern: You Might Not Need an Effect)
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchInput(filters.search || '');
  }

  if (filters.minPrice !== prevMinPrice || filters.maxPrice !== prevMaxPrice) {
    setPrevMinPrice(filters.minPrice);
    setPrevMaxPrice(filters.maxPrice);
    setCustomMinPrice(filters.minPrice !== undefined ? filters.minPrice.toString() : '');
    setCustomMaxPrice(filters.maxPrice !== undefined ? filters.maxPrice.toString() : '');
    setPriceInputError(null);
  }

  // Cancel search timer when external search prop updates (e.g. popstate back/forward)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, [filters.search]);

  // Clean up search timer on component unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const activeCategorySlug = filters.categorySlug || '';
  const activeCategoryName = findCategoryName(categories, activeCategorySlug);

  const activeFiltersCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.size ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  // Debounced search handler: 350ms with replaceState
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      onFilterChange(
        {
          ...filters,
          search: val.trim() || undefined,
          page: 0,
        },
        { replace: true }
      );
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      search: undefined,
      page: 0,
    });
  };

  const handleCategorySelect = (slug: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      categorySlug: slug || undefined,
      page: 0,
    });
  };

  const handleSizeSelect = (size: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      size: filters.size === size ? undefined : size,
      page: 0,
    });
  };

  const handleColorSelect = (colorName: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      color: filters.color === colorName ? undefined : colorName,
      page: 0,
    });
  };

  const handlePricePresetSelect = (preset: PricePreset) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setPriceInputError(null);
    const isCurrent = filters.minPrice === preset.min && filters.maxPrice === preset.max;
    if (isCurrent) {
      onFilterChange({
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
        page: 0,
      });
    } else {
      onFilterChange({
        ...filters,
        minPrice: preset.min,
        maxPrice: preset.max,
        page: 0,
      });
    }
  };

  const handleApplyCustomPrice = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const minStr = customMinPrice.trim();
    const maxStr = customMaxPrice.trim();

    const min = minStr !== '' ? Number(minStr) : undefined;
    const max = maxStr !== '' ? Number(maxStr) : undefined;

    if (min !== undefined && (!Number.isFinite(min) || min < 0)) {
      setPriceInputError('Giá tối thiểu không hợp lệ (phải ≥ 0)');
      return;
    }
    if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
      setPriceInputError('Giá tối đa không hợp lệ (phải ≥ 0)');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceInputError('Giá tối thiểu không được lớn hơn giá tối đa');
      return;
    }

    setPriceInputError(null);
    onFilterChange({
      ...filters,
      minPrice: min !== undefined && min > 0 ? min : undefined,
      maxPrice: max !== undefined ? max : undefined,
      page: 0,
    });
  };

  const handleSortChange = (sort: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      sort,
      page: 0,
    });
  };

  const handleInStockToggle = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    onFilterChange({
      ...filters,
      inStockOnly: !filters.inStockOnly,
      page: 0,
    });
  };

  const handleClearAllFilters = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setSearchInput('');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setPriceInputError(null);
    onFilterChange(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-4">
      {/* 1. Category Tabs Navigation & Quick Search Bar */}
      <div className="border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 md:pb-0">
        {/* Navigation Category Tabs */}
        <nav aria-label="Danh mục trang phục" className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`py-3 px-3.5 text-xs font-mono uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeCategorySlug === ''
                ? 'border-[#C7AD83] font-bold text-[#C7AD83]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            TẤT CẢ SẢN PHẨM
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`py-3 px-3.5 text-xs font-mono uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeCategorySlug === cat.slug
                    ? 'border-[#C7AD83] font-bold text-[#C7AD83]'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            </div>
          ))}
        </nav>

        {/* Search Bar & Filter Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0 py-2">
          {/* Instant Search Input with 350ms Debounce */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-white/40 pointer-events-none text-xs">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm trang phục, chất liệu..."
              className="w-48 sm:w-64 h-8 pl-8 pr-7 text-xs font-mono bg-white/5 border border-white/15 focus:border-[#C7AD83] focus:bg-black/60 focus:outline-none text-white placeholder:text-white/40 rounded-xs transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2 text-white/50 hover:text-white text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-gray-400 hidden lg:inline tracking-wider">
            {totalProducts} SẢN PHẨM
          </span>

          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-3.5 py-1.5 border text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer rounded-xs ${
              isFilterDrawerOpen || activeFiltersCount > 0
                ? 'border-[#C7AD83] bg-[#C7AD83] text-[#151518] font-bold shadow-xs'
                : 'border-white/20 bg-white/5 text-white hover:border-white/50'
            }`}
          >
            <span className="text-[10px]">⚙</span>
            <span>BỘ LỌC</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#151518] text-[#C7AD83] text-[10px] flex items-center justify-center font-bold">
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
              <span className="text-[#C7AD83] uppercase tracking-wider text-[11px]">DÒNG HÀNG:</span>
              {cat.children.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleCategorySelect(sub.slug)}
                  className="px-3 py-1 bg-white/10 hover:bg-[#C7AD83] hover:text-[#151518] text-white transition-colors cursor-pointer text-[11px] uppercase tracking-wider rounded-xs border border-white/10"
                >
                  {sub.name}
                </button>
              ))}
            </div>
          );
        }
        return null;
      })}

      {/* 3. Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          <span className="text-white/40 uppercase tracking-widest text-[10px]">ĐANG LỌC:</span>

          {/* Category Chip */}
          {activeCategoryName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C7AD83]/15 text-[#C7AD83] border border-[#C7AD83]/40 rounded-xs">
              <span>Danh mục: {activeCategoryName}</span>
              <button
                type="button"
                onClick={() => handleCategorySelect('')}
                className="hover:text-white cursor-pointer ml-0.5"
                title="Bỏ lọc danh mục"
              >
                ✕
              </button>
            </span>
          )}

          {/* Search Chip */}
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-xs">
              <span>Tìm: "{filters.search}"</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="hover:text-[#C7AD83] cursor-pointer ml-0.5"
                title="Xóa từ khóa tìm kiếm"
              >
                ✕
              </button>
            </span>
          )}

          {/* Size Chip */}
          {filters.size && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-xs">
              <span>Size: {filters.size}</span>
              <button
                type="button"
                onClick={() => handleSizeSelect(filters.size!)}
                className="hover:text-[#C7AD83] cursor-pointer ml-0.5"
                title="Bỏ chọn size"
              >
                ✕
              </button>
            </span>
          )}

          {/* Color Chip */}
          {filters.color && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-xs">
              <span>Màu: {filters.color}</span>
              <button
                type="button"
                onClick={() => handleColorSelect(filters.color!)}
                className="hover:text-[#C7AD83] cursor-pointer ml-0.5"
                title="Bỏ chọn màu"
              >
                ✕
              </button>
            </span>
          )}

          {/* Price Chip */}
          {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-xs">
              <span>
                Giá: {filters.minPrice !== undefined && filters.maxPrice !== undefined
                  ? `${formatPriceCompact(filters.minPrice)} - ${formatPriceCompact(filters.maxPrice)}`
                  : filters.minPrice !== undefined
                  ? `≥ ${formatPriceCompact(filters.minPrice)}`
                  : `≤ ${formatPriceCompact(filters.maxPrice!)}`}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined, page: 0 })}
                className="hover:text-[#C7AD83] cursor-pointer ml-0.5"
                title="Bỏ lọc khoảng giá"
              >
                ✕
              </button>
            </span>
          )}

          {/* In-stock Chip */}
          {filters.inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-xs">
              <span>Còn hàng</span>
              <button
                type="button"
                onClick={handleInStockToggle}
                className="hover:text-[#C7AD83] cursor-pointer ml-0.5"
                title="Bỏ lọc chỉ còn hàng"
              >
                ✕
              </button>
            </span>
          )}

          {/* Clear All Action */}
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-[#C7AD83] hover:underline text-[11px] tracking-wider uppercase cursor-pointer ml-2 font-bold"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* 4. Expandable Filter Drawer (Size, Color, Price Range, Sort) */}
      {isFilterDrawerOpen && (
        <div className="bg-[#121316]/90 backdrop-blur-md border border-white/10 p-5 shadow-2xl animate-in fade-in-50 duration-200 space-y-5 rounded-xs text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 1. Filter by Size */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#C7AD83]">
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
                      className={`h-8 px-2.5 border text-xs font-mono transition-all cursor-pointer rounded-xs ${
                        isSelected
                          ? 'border-[#C7AD83] bg-[#C7AD83] text-[#151518] font-bold'
                          : 'border-white/15 bg-white/5 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Filter by Color */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#C7AD83]">
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono cursor-pointer transition-all rounded-xs ${
                        isSelected
                          ? 'border-[#C7AD83] bg-[#C7AD83] text-[#151518] font-bold'
                          : 'border-white/15 bg-white/5 text-gray-300 hover:border-white/40'
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

            {/* 3. Filter by Price Range */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#C7AD83]">
                KHOẢNG GIÁ (VND)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePricePresetSelect(preset)}
                      className={`h-8 px-2 border text-[11px] font-mono transition-all cursor-pointer rounded-xs text-center truncate ${
                        isSelected
                          ? 'border-[#C7AD83] bg-[#C7AD83] text-[#151518] font-bold'
                          : 'border-white/15 bg-white/5 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min / Max Price Inputs */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="number"
                  placeholder="Từ..."
                  value={customMinPrice}
                  onChange={(e) => setCustomMinPrice(e.target.value)}
                  className="w-1/2 h-7 px-2 bg-white/5 border border-white/15 text-xs font-mono text-white placeholder:text-white/30 rounded-xs focus:border-[#C7AD83] focus:outline-none"
                />
                <span className="text-white/30 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Đến..."
                  value={customMaxPrice}
                  onChange={(e) => setCustomMaxPrice(e.target.value)}
                  className="w-1/2 h-7 px-2 bg-white/5 border border-white/15 text-xs font-mono text-white placeholder:text-white/30 rounded-xs focus:border-[#C7AD83] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomPrice}
                  className="h-7 px-2 border border-[#C7AD83] text-[#C7AD83] hover:bg-[#C7AD83] hover:text-[#151518] text-[11px] font-mono uppercase cursor-pointer rounded-xs font-bold shrink-0"
                >
                  Lọc
                </button>
              </div>
              {priceInputError && (
                <p className="text-[10px] font-mono text-red-400 pt-1 leading-tight">{priceInputError}</p>
              )}
            </div>

            {/* 4. Sort Options & Actions */}
            <div className="space-y-2.5">
              <span className="font-mono text-xs uppercase tracking-wider font-bold block text-[#C7AD83]">
                SẮP XẾP THEO
              </span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full h-8 border border-white/15 bg-[#18191D] text-white px-2.5 font-mono text-xs uppercase tracking-wider cursor-pointer focus:border-[#C7AD83] focus:outline-none rounded-xs"
              >
                <option value="newest" className="bg-[#18191D] text-white">MỚI NHẤT (NEW ARRIVALS)</option>
                <option value="price_asc" className="bg-[#18191D] text-white">GIÁ: TĂNG DẦN</option>
                <option value="price_desc" className="bg-[#18191D] text-white">GIÁ: GIẢM DẦN</option>
                <option value="name_asc" className="bg-[#18191D] text-white">TÊN: A — Z</option>
              </select>

              {/* In-stock toggle */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer font-mono text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly || false}
                  onChange={handleInStockToggle}
                  className="rounded border-white/20 bg-white/10 text-[#C7AD83] focus:ring-0 cursor-pointer"
                />
                <span>Chỉ hiển thị còn hàng</span>
              </label>

              {/* Reset Actions */}
              <div className="pt-2 flex gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="w-1/2 h-8 border border-white/20 text-[11px] font-mono uppercase tracking-wider hover:bg-white/10 text-white transition-colors cursor-pointer rounded-xs"
                  >
                    XÓA TẤT CẢ
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full h-8 bg-[#C7AD83] text-[#151518] text-[11px] font-mono uppercase tracking-wider hover:bg-white transition-colors cursor-pointer rounded-xs font-bold"
                >
                  ÁP DỤNG & ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
