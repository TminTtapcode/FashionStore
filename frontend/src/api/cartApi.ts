import type { ApiResponse } from '../types/auth';
import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from '../types/cart';

const BASE_URL = '/api/v1/cart';

export async function getCartApi(): Promise<Cart> {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    credentials: 'include',
  });

  const body: ApiResponse<Cart> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải giỏ hàng');
  }

  return body.data;
}

export async function addToCartApi(data: AddCartItemRequest): Promise<Cart> {
  const response = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body: ApiResponse<Cart> = await response.json();
  if (!response.ok || body.error) {
    const errorMsg = body.error?.message || 'Không thể thêm vào giỏ hàng';
    const fieldErrors = body.error?.details?.fieldErrors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      throw new Error(Object.values(fieldErrors)[0]);
    }
    throw new Error(errorMsg);
  }

  return body.data;
}

export async function updateCartItemApi(itemId: number, data: UpdateCartItemRequest): Promise<Cart> {
  const response = await fetch(`${BASE_URL}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body: ApiResponse<Cart> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật số lượng');
  }

  return body.data;
}

export async function removeCartItemApi(itemId: number): Promise<Cart> {
  const response = await fetch(`${BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const body: ApiResponse<Cart> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
  }

  return body.data;
}

export async function clearCartApi(): Promise<Cart> {
  const response = await fetch(BASE_URL, {
    method: 'DELETE',
    credentials: 'include',
  });

  const body: ApiResponse<Cart> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể làm sạch giỏ hàng');
  }

  return body.data;
}
