import type { ApiResponse } from '../types/auth';
import type { OrderConfirmation, OrderStatus } from '../types/order';
import type { PageResponse } from '../types/catalog';

const BASE_URL = '/api/v1/owner/orders';

export interface OwnerOrderFilterParams {
  page?: number;
  size?: number;
  status?: OrderStatus | '';
  search?: string;
}

/**
 * List, filter, search, and paginate orders for shop management.
 */
export async function getOwnerOrdersApi(
  params: OwnerOrderFilterParams = {},
  signal?: AbortSignal
): Promise<PageResponse<OrderConfirmation>> {
  const query = new URLSearchParams();
  if (params.page !== undefined && params.page >= 0) query.set('page', String(params.page));
  if (params.size !== undefined && params.size > 0) query.set('size', String(params.size));
  if (params.status) query.set('status', params.status);
  if (params.search && params.search.trim()) query.set('search', params.search.trim());

  const qs = query.toString();
  const url = `${BASE_URL}${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<PageResponse<OrderConfirmation>> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách đơn hàng quản trị');
  }

  return body.data;
}

/**
 * Retrieve full order details including timeline status history.
 */
export async function getOwnerOrderDetailApi(
  orderNumber: string,
  signal?: AbortSignal
): Promise<OrderConfirmation> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(orderNumber)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<OrderConfirmation> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải chi tiết đơn hàng quản trị');
  }

  return body.data;
}

/**
 * Update order status with lifecycle validations and atomic inventory / payment updates.
 */
export async function updateOwnerOrderStatusApi(
  orderNumber: string,
  status: OrderStatus,
  note?: string
): Promise<OrderConfirmation> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(orderNumber)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      status,
      note: note && note.trim() ? note.trim() : undefined,
    }),
  });

  const body: ApiResponse<OrderConfirmation> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể cập nhật trạng thái đơn hàng');
  }

  return body.data;
}

/**
 * Confirm physical return of failed delivery package at warehouse and safely restore stock.
 */
export async function confirmReturnOwnerOrderApi(
  orderNumber: string,
  note?: string
): Promise<OrderConfirmation> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(orderNumber)}/confirm-return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      note: note && note.trim() ? note.trim() : undefined,
    }),
  });

  const body: ApiResponse<OrderConfirmation> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể xác nhận nhận hàng hoàn về kho');
  }

  return body.data;
}
