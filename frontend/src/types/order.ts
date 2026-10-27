export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'DELIVERY_FAILED'
  | 'RETURNED'
  | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO';

export interface OrderStatusHistoryItem {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedBy: string;
  createdAt: string;
}

export interface CheckoutRequest {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingNote?: string;
  couponCode?: string;
}

export interface Recipient {
  name: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  note?: string;
}

export interface Financials {
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  couponCode?: string;
}

export interface OrderItemSnapshot {
  id: number;
  productId?: number;
  variantId?: number;
  productName: string;
  brand?: string;
  sku: string;
  size: string;
  colorName: string;
  thumbnailUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  recipient: Recipient;
  financials: Financials;
  items: OrderItemSnapshot[];
  createdAt: string;
  idempotentReplay: boolean;
  statusHistory?: OrderStatusHistoryItem[];
}

