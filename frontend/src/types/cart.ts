export interface CartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  imageUrl?: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface Cart {
  id: number;
  totalItemCount: number;
  subtotal: number;
  hasUnavailableItems: boolean;
  items: CartItem[];
}

export interface AddCartItemRequest {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
