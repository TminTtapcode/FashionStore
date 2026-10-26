import type { ApiResponse } from '../types/auth';
import type { Category, PageResponse, ProductDetail, ProductFilterParams, ProductSummary } from '../types/catalog';

const BASE_URL = '/api/v1';

export async function getCategoriesApi(): Promise<Category[]> {
  const response = await fetch(`${BASE_URL}/categories`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<Category[]> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh mục sản phẩm');
  }

  return body.data;
}

export async function getProductsApi(params: ProductFilterParams = {}): Promise<PageResponse<ProductSummary>> {
  const query = new URLSearchParams();

  if (params.categorySlug) query.append('categorySlug', params.categorySlug);
  if (params.categoryId) query.append('categoryId', params.categoryId.toString());
  if (params.size) query.append('size', params.size);
  if (params.color) query.append('color', params.color);
  if (params.minPrice) query.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());
  if (params.inStockOnly) query.append('inStockOnly', 'true');
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.page !== undefined) query.append('page', params.page.toString());
  if (params.limit !== undefined) query.append('limit', params.limit.toString());

  const response = await fetch(`${BASE_URL}/products?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<PageResponse<ProductSummary>> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách sản phẩm');
  }

  return body.data;
}

export async function getProductDetailApi(slug: string): Promise<ProductDetail> {
  const response = await fetch(`${BASE_URL}/products/${encodeURIComponent(slug)}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<ProductDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải chi tiết sản phẩm');
  }

  return body.data;
}
