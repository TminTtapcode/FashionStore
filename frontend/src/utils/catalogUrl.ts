import type { ProductFilterParams } from '../types/catalog';

export const DEFAULT_FILTERS: ProductFilterParams = {
  sort: 'newest',
  page: 0,
  limit: 12,
};

/**
 * Parse browser URL search query string into ProductFilterParams.
 * Friendly URL mapping:
 * - category -> categorySlug
 * - q -> search
 * - inStock -> inStockOnly
 * - page is 1-based in URL, converted to 0-based in backend state
 */
export function parseCatalogUrl(searchString: string): ProductFilterParams {
  const searchParams = new URLSearchParams(searchString);
  const filters: ProductFilterParams = { ...DEFAULT_FILTERS };

  const category = searchParams.get('category');
  if (category) filters.categorySlug = category;

  const size = searchParams.get('size');
  if (size) filters.size = size;

  const color = searchParams.get('color');
  if (color) filters.color = color;

  const minPrice = searchParams.get('minPrice');
  if (minPrice && !isNaN(Number(minPrice))) filters.minPrice = Number(minPrice);

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice && !isNaN(Number(maxPrice))) filters.maxPrice = Number(maxPrice);

  const q = searchParams.get('q');
  if (q && q.trim()) filters.search = q.trim();

  const inStock = searchParams.get('inStock');
  if (inStock === 'true') filters.inStockOnly = true;

  const sort = searchParams.get('sort');
  if (sort && ['newest', 'price_asc', 'price_desc', 'name_asc'].includes(sort)) {
    filters.sort = sort;
  }

  const page = searchParams.get('page');
  if (page && !isNaN(Number(page))) {
    const pageNum = Number(page);
    filters.page = Math.max(0, pageNum - 1);
  }

  return filters;
}

/**
 * Serialize ProductFilterParams into clean URL search string.
 * Omits defaults (newest, page=1, empty values) to keep URL clean and shareable.
 */
export function serializeCatalogUrl(filters: ProductFilterParams): string {
  const params = new URLSearchParams();

  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.size) params.set('size', filters.size);
  if (filters.color) params.set('color', filters.color);
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.set('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
