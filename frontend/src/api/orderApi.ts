import type { ApiResponse } from '../types/auth';
import type { CheckoutRequest, OrderConfirmation } from '../types/order';

const BASE_URL = '/api/v1/checkout';

export async function checkoutCodApi(data: CheckoutRequest, idempotencyKey: string): Promise<OrderConfirmation> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body: ApiResponse<OrderConfirmation> = await response.json();
  if (!response.ok || body.error) {
    const errorMsg = body.error?.message || 'Không thể tiến hành đặt hàng COD';
    const fieldErrors = body.error?.details?.fieldErrors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      throw new Error(Object.values(fieldErrors)[0]);
    }
    throw new Error(errorMsg);
  }

  return body.data;
}

export async function getMyOrdersApi(): Promise<OrderConfirmation[]> {
  const response = await fetch('/api/v1/orders', {
    method: 'GET',
    credentials: 'include',
  });

  const body: ApiResponse<OrderConfirmation[]> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách đơn hàng');
  }

  return body.data;
}
