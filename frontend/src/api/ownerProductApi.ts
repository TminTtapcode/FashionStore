import type { ApiResponse } from '../types/auth';
import type { PageResponse, ProductImage } from '../types/catalog';

const BASE_URL = '/api/v1/owner/products';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE';

export interface OwnerVariant {
  id: number;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  status: ProductVariantStatus;
  hasOrders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerProductSummary {
  id: number;
  shopId: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  brand?: string;
  status: ProductStatus;
  variantCount: number;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  primaryImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerProductDetail {
  id: number;
  shopId: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  material?: string;
  fitStyle?: string;
  careInstructions?: string;
  specifications?: string;
  status: ProductStatus;
  variants: OwnerVariant[];
  images: ProductImage[];
  hasOrders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantPayload {
  sku?: string;
  size: string;
  colorName: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  status?: ProductVariantStatus;
}

export interface UpdateVariantPayload {
  sku?: string;
  size: string;
  colorName: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number | null;
  status: ProductVariantStatus;
}

export interface CreateProductPayload {
  categoryId: number;
  name: string;
  slug?: string;
  description?: string;
  brand?: string;
  material?: string;
  fitStyle?: string;
  careInstructions?: string;
  specifications?: string;
  status?: ProductStatus;
  variants?: CreateVariantPayload[];
}

export interface UpdateProductPayload {
  categoryId: number;
  name: string;
  slug?: string;
  description?: string;
  brand?: string;
  material?: string;
  fitStyle?: string;
  careInstructions?: string;
  specifications?: string;
}

export interface UpdateProductStatusPayload {
  status: ProductStatus;
  note?: string;
}

export interface OwnerProductFilterParams {
  page?: number;
  size?: number;
  status?: ProductStatus | '';
  categoryId?: number;
  search?: string;
}

export async function getOwnerProductsApi(
  params: OwnerProductFilterParams = {},
  signal?: AbortSignal
): Promise<PageResponse<OwnerProductSummary>> {
  const query = new URLSearchParams();
  if (params.page !== undefined && params.page >= 0) query.set('page', String(params.page));
  if (params.size !== undefined && params.size > 0) query.set('size', String(params.size));
  if (params.status) query.set('status', params.status);
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  if (params.search && params.search.trim()) query.set('search', params.search.trim());

  const qs = query.toString();
  const url = `${BASE_URL}${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<PageResponse<OwnerProductSummary>> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách sản phẩm quản trị');
  }

  return body.data;
}

export async function getOwnerProductDetailApi(
  id: number,
  signal?: AbortSignal
): Promise<OwnerProductDetail> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<OwnerProductDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải chi tiết sản phẩm');
  }

  return body.data;
}

export async function createOwnerProductApi(
  payload: CreateProductPayload
): Promise<OwnerProductDetail> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<OwnerProductDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tạo sản phẩm mới');
  }

  return body.data;
}

export async function updateOwnerProductApi(
  id: number,
  payload: UpdateProductPayload
): Promise<OwnerProductDetail> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<OwnerProductDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật sản phẩm');
  }

  return body.data;
}

export async function updateOwnerProductStatusApi(
  id: number,
  payload: UpdateProductStatusPayload
): Promise<OwnerProductDetail> {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<OwnerProductDetail> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật trạng thái sản phẩm');
  }

  return body.data;
}

export async function addOwnerVariantApi(
  productId: number,
  payload: CreateVariantPayload
): Promise<OwnerVariant> {
  const response = await fetch(`${BASE_URL}/${productId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<OwnerVariant> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể thêm biến thể mới');
  }

  return body.data;
}

export async function updateOwnerVariantApi(
  productId: number,
  variantId: number,
  payload: UpdateVariantPayload
): Promise<OwnerVariant> {
  const response = await fetch(`${BASE_URL}/${productId}/variants/${variantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body: ApiResponse<OwnerVariant> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật biến thể');
  }

  return body.data;
}

export async function deleteOwnerProductApi(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body: ApiResponse<void> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể xóa sản phẩm');
  }
}

