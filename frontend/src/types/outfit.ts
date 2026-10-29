export type OutfitSlot = 'ONE_PIECE' | 'UPPER_BODY' | 'LOWER_BODY' | 'OUTERWEAR' | 'ACCESSORIES';

export interface OutfitSlotConfig {
  slot: OutfitSlot;
  label: string;
  subLabel: string;
  order: number;
}

export const OUTFIT_SLOT_CONFIGS: Record<OutfitSlot, OutfitSlotConfig> = {
  ONE_PIECE: {
    slot: 'ONE_PIECE',
    label: 'ĐẦM & VÁY LIỀN',
    subLabel: 'Maxi · Dạ hội · Váy dáng xòe',
    order: 1,
  },
  UPPER_BODY: {
    slot: 'UPPER_BODY',
    label: 'ÁO & TOPS',
    subLabel: 'Sơ mi · Áo thun · Dệt kim',
    order: 2,
  },
  LOWER_BODY: {
    slot: 'LOWER_BODY',
    label: 'QUẦN & CHÂN VÁY',
    subLabel: 'Jeans · Quần tây · Short',
    order: 3,
  },
  OUTERWEAR: {
    slot: 'OUTERWEAR',
    label: 'ÁO KHOÁC',
    subLabel: 'Blazer · Măng-tô · Trench coat',
    order: 4,
  },
  ACCESSORIES: {
    slot: 'ACCESSORIES',
    label: 'PHỤ KIỆN',
    subLabel: 'Túi xách · Khăn lụa · Thắt lưng',
    order: 5,
  },
};

export interface OutfitItemSelection {
  slot: OutfitSlot;
  productId: number;
  productSlug: string;
  productName: string;
  variantId: number;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  inStock: boolean;
  categorySlug: string;
}

export type OutfitSlotsMap = Partial<Record<OutfitSlot, OutfitItemSelection>>;

export interface OutfitCalculation {
  totalPrice: number;
  itemCount: number;
  isAllAvailable: boolean;
  unavailableItemCount: number;
}

export interface OutfitBatchAddResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  items: Array<{
    variantId: number;
    sku: string;
    productName: string;
    slot: OutfitSlot;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }>;
}

// Category and product-level slot resolution tables
export const CATEGORY_TO_SLOT_MAP: Record<string, OutfitSlot> = {
  'dam-va-vay': 'ONE_PIECE',
  'set-do-jumpsuit': 'ONE_PIECE',
  'quan-nu': 'LOWER_BODY',
  'quan-nam': 'LOWER_BODY',
  'ao-nam': 'UPPER_BODY',
  'ao-nu': 'UPPER_BODY',
};

// Specific product slug overrides where parent category is broad
export const PRODUCT_SLOT_OVERRIDES: Record<string, OutfitSlot> = {
  'ao-blazer-linen-phom-rong-minimalist': 'OUTERWEAR',
};

/**
 * Resolves the appropriate outfit slot for a product using category taxonomy and specific overrides.
 * Returns null if the product cannot be classified into any styling studio slot.
 */
export function resolveProductSlot(
  categorySlug: string,
  productSlug?: string
): OutfitSlot | null {
  if (productSlug && PRODUCT_SLOT_OVERRIDES[productSlug]) {
    return PRODUCT_SLOT_OVERRIDES[productSlug];
  }
  if (CATEGORY_TO_SLOT_MAP[categorySlug]) {
    return CATEGORY_TO_SLOT_MAP[categorySlug];
  }
  return null;
}

/**
 * Calculates total price and availability from active slot selections.
 */
export function calculateOutfitSummary(slots: OutfitSlotsMap): OutfitCalculation {
  const selectedList = Object.values(slots).filter((s): s is OutfitItemSelection => Boolean(s));
  const totalPrice = selectedList.reduce((sum, item) => sum + item.price, 0);
  const itemCount = selectedList.length;
  const unavailableItems = selectedList.filter(
    (item) => !item.inStock || item.stockQuantity <= 0
  );

  return {
    totalPrice,
    itemCount,
    isAllAvailable: unavailableItems.length === 0,
    unavailableItemCount: unavailableItems.length,
  };
}

/**
 * Resolves slot compatibility rules:
 * - ONE_PIECE conflicts with UPPER_BODY and LOWER_BODY.
 * - Selecting ONE_PIECE clears UPPER_BODY and LOWER_BODY with notification.
 * - Selecting UPPER_BODY or LOWER_BODY clears ONE_PIECE with notification.
 * - OUTERWEAR and ACCESSORIES are compatible with both modes.
 */
export function applySlotCompatibility(
  currentSlots: OutfitSlotsMap,
  newItem: OutfitItemSelection
): {
  updatedSlots: OutfitSlotsMap;
  conflictMessage: string | null;
} {
  const updated: OutfitSlotsMap = { ...currentSlots };
  let conflictMessage: string | null = null;

  if (newItem.slot === 'ONE_PIECE') {
    const hasSeparates = Boolean(updated.UPPER_BODY || updated.LOWER_BODY);
    if (hasSeparates) {
      conflictMessage = 'Đầm liền thân đã thay thế Áo và Quần trong bảng phối.';
      delete updated.UPPER_BODY;
      delete updated.LOWER_BODY;
    }
    updated.ONE_PIECE = newItem;
  } else if (newItem.slot === 'UPPER_BODY' || newItem.slot === 'LOWER_BODY') {
    const hasOnePiece = Boolean(updated.ONE_PIECE);
    if (hasOnePiece) {
      conflictMessage = 'Trang phục rời (Áo/Quần) đã thay thế Đầm liền thân trong bảng phối.';
      delete updated.ONE_PIECE;
    }
    updated[newItem.slot] = newItem;
  } else {
    // OUTERWEAR and ACCESSORIES compatible with all configurations
    updated[newItem.slot] = newItem;
  }

  return { updatedSlots: updated, conflictMessage };
}
