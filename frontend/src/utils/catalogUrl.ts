import type { ProductFilterParams } from '../types/catalog';

export const DEFAULT_FILTERS: ProductFilterParams = {
  sort: 'newest',
  page: 0,
  limit: 12,
};

export const VALID_SORTS = ['newest', 'price_asc', 'price_desc', 'name_asc'] as const;
export type ValidSort = (typeof VALID_SORTS)[number];

export const CATALOG_PARAM_KEYS = [
  'category',
  'size',
  'color',
  'minPrice',
  'maxPrice',
  'q',
  'inStock',
  'sort',
  'page',
] as const;

/**
 * Parse browser URL search query string into ProductFilterParams with strict validation.
 *
 * Rules:
 * 1. Page must be a positive integer (>= 1, <= 10000). Decimals, negatives, NaN fallback to page 1 (0-based: 0).
 * 2. Prices must be finite, non-negative numbers. If minPrice > maxPrice, both are discarded.
 * 3. Sort is strictly whitelisted (accepts kebab-case or snake_case, normalized to snake_case).
 * 4. Strings (category, size, color, search) are trimmed. Empty strings are ignored.
 * 5. Limit is pinned to 12.
 */
export function parseCatalogUrl(searchString: string): ProductFilterParams {
  const query = searchString.startsWith('?') ? searchString.slice(1) : searchString;
  const searchParams = new URLSearchParams(query);
  const filters: ProductFilterParams = { ...DEFAULT_FILTERS };

  // 1. Category
  const category = searchParams.get('category');
  if (category && category.trim()) {
    filters.categorySlug = category.trim();
  }

  // 2. Size
  const size = searchParams.get('size');
  if (size && size.trim()) {
    filters.size = size.trim();
  }

  // 3. Color (preserves original UTF-8 name or hex code, trimmed)
  const color = searchParams.get('color');
  if (color && color.trim()) {
    filters.color = color.trim();
  }

  // 4. Price range validation: finite, >= 0, and min <= max
  const rawMinPrice = searchParams.get('minPrice');
  const rawMaxPrice = searchParams.get('maxPrice');

  let validMinPrice: number | undefined;
  if (rawMinPrice !== null && rawMinPrice.trim() !== '') {
    const num = Number(rawMinPrice);
    if (Number.isFinite(num) && num >= 0) {
      validMinPrice = num;
    }
  }

  let validMaxPrice: number | undefined;
  if (rawMaxPrice !== null && rawMaxPrice.trim() !== '') {
    const num = Number(rawMaxPrice);
    if (Number.isFinite(num) && num >= 0) {
      validMaxPrice = num;
    }
  }

  // Drop both bounds if minPrice > maxPrice
  if (validMinPrice !== undefined && validMaxPrice !== undefined && validMinPrice > validMaxPrice) {
    validMinPrice = undefined;
    validMaxPrice = undefined;
  }

  if (validMinPrice !== undefined) filters.minPrice = validMinPrice;
  if (validMaxPrice !== undefined) filters.maxPrice = validMaxPrice;

  // 5. Search query (q -> search)
  const q = searchParams.get('q');
  if (q && q.trim()) {
    filters.search = q.trim();
  }

  // 6. In-stock only
  const inStock = searchParams.get('inStock');
  if (inStock === 'true') {
    filters.inStockOnly = true;
  }

  // 7. Sort whitelist validation (normalize '-' to '_')
  const sort = searchParams.get('sort');
  if (sort && sort.trim()) {
    const normalized = sort.trim().toLowerCase().replace(/-/g, '_') as ValidSort;
    if (VALID_SORTS.includes(normalized)) {
      filters.sort = normalized;
    } else {
      filters.sort = 'newest';
    }
  }

  // 8. Page validation: strictly positive integer in range [1, 10000]
  const rawPage = searchParams.get('page');
  if (rawPage !== null && rawPage.trim() !== '') {
    const pageNum = Number(rawPage);
    if (Number.isInteger(pageNum) && pageNum >= 1 && pageNum <= 10000) {
      filters.page = pageNum - 1; // Convert 1-based URL to 0-based backend state
    } else {
      filters.page = 0;
    }
  } else {
    filters.page = 0;
  }

  filters.limit = 12;
  return filters;
}

/**
 * Serialize ProductFilterParams into clean URL query string.
 *
 * Rules:
 * 1. Modifies ONLY catalog-related keys; preserves all external query parameters (e.g. utm_source, ref).
 * 2. Omits defaults to keep URL clean (page=1 omitted, sort='newest' omitted, empty values omitted).
 * 3. Correctly preserves maxPrice=0 if specified.
 */
export function serializeCatalogUrl(
  filters: ProductFilterParams,
  currentSearch: string = typeof window !== 'undefined' ? window.location.search : ''
): string {
  const query = currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch;
  const params = new URLSearchParams(query);

  // Remove existing catalog keys first so we don't leave stale catalog parameters
  for (const key of CATALOG_PARAM_KEYS) {
    params.delete(key);
  }

  // Set active catalog parameters if non-default
  if (filters.categorySlug && filters.categorySlug.trim()) {
    params.set('category', filters.categorySlug.trim());
  }
  if (filters.size && filters.size.trim()) {
    params.set('size', filters.size.trim());
  }
  if (filters.color && filters.color.trim()) {
    params.set('color', filters.color.trim());
  }
  if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice) && filters.minPrice > 0) {
    params.set('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice) && filters.maxPrice >= 0) {
    params.set('maxPrice', filters.maxPrice.toString());
  }
  if (filters.search && filters.search.trim()) {
    params.set('q', filters.search.trim());
  }
  if (filters.inStockOnly) {
    params.set('inStock', 'true');
  }
  if (filters.sort && filters.sort !== 'newest') {
    params.set('sort', filters.sort);
  }
  if (filters.page !== undefined && filters.page > 0) {
    params.set('page', (filters.page + 1).toString());
  }

  const result = params.toString();
  return result ? `?${result}` : '';
}

/**
 * Build complete URL string with updated catalog query while preserving pathname, hash, and foreign parameters.
 */
export function buildCatalogUrl(
  filters: ProductFilterParams,
  currentLocation = typeof window !== 'undefined'
    ? {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      }
    : { pathname: '/', search: '', hash: '' }
): string {
  const newQuery = serializeCatalogUrl(filters, currentLocation.search);
  return `${currentLocation.pathname}${newQuery}${currentLocation.hash}`;
}
