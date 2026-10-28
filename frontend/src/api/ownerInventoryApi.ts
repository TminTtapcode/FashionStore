import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/catalog';

const BASE_URL = '/api/v1/owner/inventory';

export interface InventorySummaryDto {
  variantId: number;
  productId: number;
  productName: string;
  categoryName: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string | null;
  price: number;
  currentStock: number;
  status: string;
  primaryImageUrl?: string | null;
  lastMovementAt?: string | null;
  lastMovementType?: string | null;
}

export interface InventoryMovementDto {
  id: number;
  variantId: number;
  sku: string;
  productName: string;
  size: string;
  colorName: string;
  movementType: 'OPENING_BALANCE' | 'INITIAL_STOCK' | 'ORDER_DEDUCT' | 'CANCEL_RESTORE' | 'RETURN_RESTORE' | 'STOCK_RECEIPT' | 'MANUAL_ADJUSTMENT' | string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  movementKey: string;
  actorName: string;
  reason?: string | null;
  createdAt: string;
}

export interface InventoryReconciliationDto {
  variantId: number;
  sku: string;
  productName: string;
  currentStock: number;
  openingBalance: number;
  totalDelta: number;
  calculatedStock: number;
  discrepancy: number;
  isBalanced: boolean;
}

export interface StockReceiptRequest {
  variantId: number;
  quantity: number;
  referenceNumber?: string;
  reason?: string;
}

export interface ManualAdjustmentRequest {
  variantId: number;
  quantityDelta: number;
  reason: string;
}

export interface OwnerInventoryFilterParams {
  page?: number;
  size?: number;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | '';
  categoryId?: number;
  search?: string;
}

/**
 * List, filter, search, and paginate variant inventory overview.
 */
export async function getOwnerInventoryOverviewApi(
  params: OwnerInventoryFilterParams = {},
  signal?: AbortSignal
): Promise<PageResponse<InventorySummaryDto>> {
  const query = new URLSearchParams();
  if (params.page !== undefined && params.page >= 0) query.set('page', String(params.page));
  if (params.size !== undefined && params.size > 0) query.set('size', String(params.size));
  if (params.stockStatus) query.set('stockStatus', params.stockStatus);
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
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

  const body: ApiResponse<PageResponse<InventorySummaryDto>> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải danh sách tồn kho quản trị');
  }

  return body.data;
}

/**
 * Fetch paginated audit ledger history for a specific variant.
 */
export async function getVariantLedgerApi(
  variantId: number,
  page: number = 0,
  size: number = 20,
  signal?: AbortSignal
): Promise<PageResponse<InventoryMovementDto>> {
  const url = `${BASE_URL}/variants/${variantId}/ledger?page=${page}&size=${size}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<PageResponse<InventoryMovementDto>> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể tải sổ cái biến động kho');
  }

  return body.data;
}

/**
 * Reconcile variant stock against cumulative movements (currentStock == sum(deltas)).
 */
export async function reconcileVariantApi(
  variantId: number,
  signal?: AbortSignal
): Promise<InventoryReconciliationDto> {
  const url = `${BASE_URL}/variants/${variantId}/reconcile`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
  });

  const body: ApiResponse<InventoryReconciliationDto> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể đối soát tồn kho biến thể');
  }

  return body.data;
}

/**
 * Record newly received stock from supplier/factory.
 */
export async function recordStockReceiptApi(
  request: StockReceiptRequest,
  signal?: AbortSignal
): Promise<InventoryMovementDto> {
  const response = await fetch(`${BASE_URL}/receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
    signal,
  });

  const body: ApiResponse<InventoryMovementDto> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể ghi nhận phiếu nhập kho');
  }

  return body.data;
}

/**
 * Record manual inventory audit adjustment.
 */
export async function recordManualAdjustmentApi(
  request: ManualAdjustmentRequest,
  signal?: AbortSignal
): Promise<InventoryMovementDto> {
  const response = await fetch(`${BASE_URL}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
    signal,
  });

  const body: ApiResponse<InventoryMovementDto> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Không thể ghi nhận phiếu điều chỉnh kiểm kê');
  }

  return body.data;
}
