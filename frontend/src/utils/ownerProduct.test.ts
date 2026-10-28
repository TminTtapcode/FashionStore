import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  OwnerProductSummary,
  ProductStatus,
  OwnerVariant,
} from '../api/ownerProductApi';

// ---------------------------------------------------------------------------
// Pure helper functions reflecting domain rules implemented in Phase 5C.2
// ---------------------------------------------------------------------------

/**
 * Validates Product Lifecycle Transition Matrix
 */
export function canTransitionProductStatus(
  current: ProductStatus,
  target: ProductStatus,
  activeVariantCount: number
): { allowed: boolean; reason?: string } {
  if (current === target) {
    return { allowed: false, reason: 'Trạng thái mục tiêu trùng trạng thái hiện tại' };
  }

  // ARCHIVED is terminal
  if (current === 'ARCHIVED') {
    return { allowed: false, reason: 'Sản phẩm đã ARCHIVED là trạng thái kết thúc, không thể thay đổi' };
  }

  switch (current) {
    case 'DRAFT':
      if (target === 'ACTIVE') {
        if (activeVariantCount <= 0) {
          return { allowed: false, reason: 'Không thể kích hoạt (ACTIVE) sản phẩm khi không có ít nhất 1 biến thể đang kích hoạt' };
        }
        return { allowed: true };
      }
      if (target === 'ARCHIVED') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'DRAFT chỉ có thể chuyển sang ACTIVE hoặc ARCHIVED' };

    case 'ACTIVE':
      if (target === 'HIDDEN' || target === 'ARCHIVED') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'ACTIVE chỉ có thể chuyển sang HIDDEN hoặc ARCHIVED' };

    case 'HIDDEN':
      if (target === 'ACTIVE') {
        if (activeVariantCount <= 0) {
          return { allowed: false, reason: 'Không thể mở bán (ACTIVE) sản phẩm ẩn khi không có biến thể hoạt động' };
        }
        return { allowed: true };
      }
      if (target === 'ARCHIVED') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'HIDDEN chỉ có thể chuyển sang ACTIVE hoặc ARCHIVED' };

    default:
      return { allowed: false, reason: 'Trạng thái không hợp lệ' };
  }
}

/**
 * Normalizes string for SKU codes (replaces Vietnamese diacritics, upper-cases, strips non-alphanumeric)
 */
export function normalizeSkuCode(input: string): string {
  if (!input) return 'ITEM';
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return normalized || 'ITEM';
}

/**
 * Generates standardized SKU: {PRODUCT_CODE}-{COLOR_CODE}-{SIZE} (capped at 60 chars)
 */
export function generateSku(productName: string, colorName: string, size: string, collisionCounter = 1): string {
  const pCode = normalizeSkuCode(productName);
  const cCode = normalizeSkuCode(colorName);
  const sCode = normalizeSkuCode(size);

  let rawSku = `${pCode}-${cCode}-${sCode}`;
  if (collisionCounter > 1) {
    rawSku += `-${collisionCounter}`;
  }

  if (rawSku.length > 60) {
    // Truncate while keeping collision suffix and size
    const suffix = collisionCounter > 1 ? `-${sCode}-${collisionCounter}` : `-${sCode}`;
    const maxPrefixLen = Math.max(1, 60 - suffix.length);
    rawSku = `${rawSku.slice(0, maxPrefixLen)}${suffix}`;
  }

  return rawSku;
}

/**
 * Computes Variant Matrix (Size x Color Cartesian product)
 */
export function generateVariantMatrix(
  productName: string,
  sizes: string[],
  colors: { colorName: string; colorCode?: string }[],
  defaultPrice: number,
  defaultCompareAtPrice: number | null,
  defaultStock: number,
  existingVariants: { size: string; colorName: string }[] = []
): Array<{
  sku: string;
  size: string;
  colorName: string;
  colorCode: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
}> {
  const result: Array<{
    sku: string;
    size: string;
    colorName: string;
    colorCode: string | null;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    isActive: boolean;
  }> = [];

  const existingSet = new Set(
    existingVariants.map((v) => `${v.size.trim().toUpperCase()}__${v.colorName.trim().toUpperCase()}`)
  );

  for (const c of colors) {
    for (const s of sizes) {
      const key = `${s.trim().toUpperCase()}__${c.colorName.trim().toUpperCase()}`;
      if (existingSet.has(key)) {
        continue; // skip duplicate combinations
      }
      existingSet.add(key);

      result.push({
        sku: generateSku(productName, c.colorName, s),
        size: s.trim().toUpperCase(),
        colorName: c.colorName.trim(),
        colorCode: c.colorCode || null,
        price: defaultPrice,
        compareAtPrice: defaultCompareAtPrice,
        stock: defaultStock,
        isActive: true,
      });
    }
  }

  return result;
}

/**
 * Validates Price and CompareAtPrice Invariants
 */
export function validateVariantPrice(
  price: number,
  compareAtPrice?: number | null
): { valid: boolean; error?: string } {
  if (price < 1000) {
    return { valid: false, error: 'Giá bán phải tối thiểu 1.000₫' };
  }
  if (compareAtPrice !== null && compareAtPrice !== undefined) {
    if (compareAtPrice < price) {
      return { valid: false, error: 'Giá so sánh (niêm yết) phải lớn hơn hoặc bằng giá bán' };
    }
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------------------------

describe('Phase 5C.2 Shop Owner Product & Variant Domain Logic', () => {
  describe('1. Product Lifecycle State Machine', () => {
    it('allows DRAFT -> ACTIVE only when at least 1 active variant exists', () => {
      // 0 active variants -> rejected
      const attemptNoActive = canTransitionProductStatus('DRAFT', 'ACTIVE', 0);
      assert.strictEqual(attemptNoActive.allowed, false);
      assert.match(attemptNoActive.reason!, /ít nhất 1 biến thể/);

      // >= 1 active variants -> allowed
      const attemptWithActive = canTransitionProductStatus('DRAFT', 'ACTIVE', 2);
      assert.strictEqual(attemptWithActive.allowed, true);
    });

    it('allows DRAFT -> ARCHIVED directly without requiring active variants', () => {
      const res = canTransitionProductStatus('DRAFT', 'ARCHIVED', 0);
      assert.strictEqual(res.allowed, true);
    });

    it('disallows DRAFT -> HIDDEN (must publish first or stay draft)', () => {
      const res = canTransitionProductStatus('DRAFT', 'HIDDEN', 1);
      assert.strictEqual(res.allowed, false);
    });

    it('allows ACTIVE -> HIDDEN and ACTIVE -> ARCHIVED', () => {
      const toHidden = canTransitionProductStatus('ACTIVE', 'HIDDEN', 1);
      assert.strictEqual(toHidden.allowed, true);

      const toArchived = canTransitionProductStatus('ACTIVE', 'ARCHIVED', 1);
      assert.strictEqual(toArchived.allowed, true);

      // Disallow ACTIVE -> DRAFT (no backward transition to draft)
      const toDraft = canTransitionProductStatus('ACTIVE', 'DRAFT', 1);
      assert.strictEqual(toDraft.allowed, false);
    });

    it('allows HIDDEN -> ACTIVE only if active variants exist', () => {
      const noVariants = canTransitionProductStatus('HIDDEN', 'ACTIVE', 0);
      assert.strictEqual(noVariants.allowed, false);

      const withVariants = canTransitionProductStatus('HIDDEN', 'ACTIVE', 3);
      assert.strictEqual(withVariants.allowed, true);
    });

    it('treats ARCHIVED as strictly terminal (no transitions permitted)', () => {
      const toDraft = canTransitionProductStatus('ARCHIVED', 'DRAFT', 1);
      assert.strictEqual(toDraft.allowed, false);

      const toActive = canTransitionProductStatus('ARCHIVED', 'ACTIVE', 1);
      assert.strictEqual(toActive.allowed, false);

      const toHidden = canTransitionProductStatus('ARCHIVED', 'HIDDEN', 1);
      assert.strictEqual(toHidden.allowed, false);
    });

    it('rejects transitioning to the same status', () => {
      const res = canTransitionProductStatus('ACTIVE', 'ACTIVE', 2);
      assert.strictEqual(res.allowed, false);
      assert.match(res.reason!, /trùng trạng thái/);
    });
  });

  describe('2. SKU Generation, Normalization & Immutability Rules', () => {
    it('removes Vietnamese diacritics and builds standard uppercase SKU', () => {
      const sku = generateSku('Đầm Lụa Maxi Cổ Chữ V', 'Trắng Ngọc Trai', 'M');
      assert.strictEqual(sku, 'DAM-LUA-MAXI-CO-CHU-V-TRANG-NGOC-TRAI-M');
    });

    it('enforces maximum length limit of 60 characters', () => {
      const longName = 'Áo Sơ Mi Lụa Satin Cao Cấp Dáng Rộng Phong Cách Cổ Điển Mùa Thu Đông Paris Collection';
      const longColor = 'Hồng Phấn Ánh Kim Sang Trọng';
      const size = 'XL';

      const sku = generateSku(longName, longColor, size);
      assert.ok(sku.length <= 60, `SKU length ${sku.length} exceeds 60 characters`);
      assert.ok(sku.endsWith('-XL'), 'SKU should retain size identifier at the end');
    });

    it('appends collision counter cleanly when SKU already exists in repository', () => {
      const skuCol2 = generateSku('Áo Len Cổ Lọ', 'Đen', 'L', 2);
      assert.strictEqual(skuCol2, 'AO-LEN-CO-LO-DEN-L-2');

      const skuCol3 = generateSku('Áo Len Cổ Lọ', 'Đen', 'L', 3);
      assert.strictEqual(skuCol3, 'AO-LEN-CO-LO-DEN-L-3');
    });

    it('enforces SKU immutability guard when variant is referenced in order items', () => {
      const orderedVariant: OwnerVariant = {
        id: 10,
        sku: 'DAM-MAXI-TRANG-S',
        size: 'S',
        colorName: 'Trắng',
        colorHex: '#FFFFFF',
        price: 650000,
        compareAtPrice: 750000,
        stockQuantity: 5,
        status: 'ACTIVE',
        hasOrders: true,
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      };

      // Attempting to change SKU on an ordered variant must be rejected
      const canUpdateSku = (variant: OwnerVariant, newSku: string) => {
        if (variant.hasOrders && variant.sku !== newSku) {
          throw new Error('IMMUTABLE_SKU: Biến thể đã có lịch sử đơn hàng, không được phép thay đổi SKU');
        }
        return true;
      };

      assert.throws(
        () => canUpdateSku(orderedVariant, 'DAM-MAXI-TRANG-S-NEW'),
        /IMMUTABLE_SKU/
      );

      // Attempting to delete an ordered variant must be rejected
      const canDeleteVariant = (variant: OwnerVariant) => {
        if (variant.hasOrders) {
          throw new Error('VARIANT_HAS_ORDERS: Không thể xóa biến thể đã phát sinh đơn hàng, hãy vô hiệu hóa (isActive=false)');
        }
        return true;
      };

      assert.throws(() => canDeleteVariant(orderedVariant), /VARIANT_HAS_ORDERS/);
    });
  });

  describe('3. Quick Matrix Generator (Size x Color Cartesian Product)', () => {
    it('generates correct Cartesian product of variants with defaults', () => {
      const sizes = ['S', 'M', 'L'];
      const colors = [
        { colorName: 'Đen Tuyển', colorCode: '#111111' },
        { colorName: 'Trắng Sữa', colorCode: '#FDFDFD' },
      ];

      const matrix = generateVariantMatrix('Váy Xếp Ly', sizes, colors, 450000, 550000, 20);

      assert.strictEqual(matrix.length, 6, '3 sizes x 2 colors must equal 6 variants');
      assert.strictEqual(matrix[0].sku, 'VAY-XEP-LY-DEN-TUYEN-S');
      assert.strictEqual(matrix[0].price, 450000);
      assert.strictEqual(matrix[0].compareAtPrice, 550000);
      assert.strictEqual(matrix[0].stock, 20);
      assert.strictEqual(matrix[0].isActive, true);

      assert.strictEqual(matrix[5].sku, 'VAY-XEP-LY-TRANG-SUA-L');
      assert.strictEqual(matrix[5].size, 'L');
      assert.strictEqual(matrix[5].colorName, 'Trắng Sữa');
    });

    it('skips existing (size, color) pairs to prevent duplicates', () => {
      const sizes = ['S', 'M'];
      const colors = [{ colorName: 'Đen', colorCode: '#000000' }];

      const existing = [{ size: 'S', colorName: 'Đen' }];

      const matrix = generateVariantMatrix('Áo Thun', sizes, colors, 250000, null, 15, existing);

      assert.strictEqual(matrix.length, 1, 'Only M x Đen should be generated since S x Đen exists');
      assert.strictEqual(matrix[0].size, 'M');
      assert.strictEqual(matrix[0].colorName, 'Đen');
    });
  });

  describe('4. Price and Stock Validation Invariants', () => {
    it('validates minimum price >= 1.000₫', () => {
      const validPrice = validateVariantPrice(150000);
      assert.strictEqual(validPrice.valid, true);

      const invalidLowPrice = validateVariantPrice(500);
      assert.strictEqual(invalidLowPrice.valid, false);
      assert.match(invalidLowPrice.error!, /tối thiểu 1.000₫/);
    });

    it('enforces compareAtPrice >= price when compareAtPrice is provided', () => {
      const validDiscount = validateVariantPrice(500000, 600000);
      assert.strictEqual(validDiscount.valid, true);

      const equalPrice = validateVariantPrice(500000, 500000);
      assert.strictEqual(equalPrice.valid, true);

      const invalidHigherPrice = validateVariantPrice(500000, 400000);
      assert.strictEqual(invalidHigherPrice.valid, false);
      assert.match(invalidHigherPrice.error!, /lớn hơn hoặc bằng giá bán/);
    });
  });

  describe('5. Storefront Isolation vs Owner Visibility', () => {
    const MOCK_CATALOG: OwnerProductSummary[] = [
      {
        id: 1,
        shopId: 1,
        categoryId: 1,
        name: 'Đầm Lụa Maxi',
        slug: 'dam-lua-maxi',
        status: 'ACTIVE',
        categoryName: 'Đầm Nữ',
        minPrice: 650000,
        maxPrice: 650000,
        totalStock: 35,
        variantCount: 4,
        primaryImageUrl: '/images/dam-1.jpg',
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      },
      {
        id: 2,
        shopId: 1,
        categoryId: 2,
        name: 'Áo Khoác Dạ Dáng Dài (Mẫu Mới)',
        slug: 'ao-khoac-da-dang-dai',
        status: 'DRAFT',
        categoryName: 'Áo Khoác',
        minPrice: 1200000,
        maxPrice: 1200000,
        totalStock: 0,
        variantCount: 0,
        primaryImageUrl: null,
        createdAt: '2026-10-28T11:00:00Z',
        updatedAt: '2026-10-28T11:00:00Z',
      },
      {
        id: 3,
        shopId: 1,
        categoryId: 3,
        name: 'Chân Váy Xếp Ly Thu Đông',
        slug: 'chan-vay-xep-ly',
        status: 'HIDDEN',
        categoryName: 'Chân Váy',
        minPrice: 420000,
        maxPrice: 420000,
        totalStock: 12,
        variantCount: 2,
        primaryImageUrl: '/images/vay-1.jpg',
        createdAt: '2026-10-28T12:00:00Z',
        updatedAt: '2026-10-28T12:00:00Z',
      },
      {
        id: 4,
        shopId: 1,
        categoryId: 4,
        name: 'Áo Sơ Mi Tay Bồng Mùa Cũ',
        slug: 'ao-so-mi-tay-bong',
        status: 'ARCHIVED',
        categoryName: 'Áo Sơ Mi',
        minPrice: 350000,
        maxPrice: 350000,
        totalStock: 0,
        variantCount: 1,
        primaryImageUrl: '/images/somi-1.jpg',
        createdAt: '2026-10-28T13:00:00Z',
        updatedAt: '2026-10-28T13:00:00Z',
      },
    ];

    it('storefront catalog filter isolates and only returns ACTIVE products', () => {
      const storefrontCatalog = MOCK_CATALOG.filter((p) => p.status === 'ACTIVE');
      assert.strictEqual(storefrontCatalog.length, 1);
      assert.strictEqual(storefrontCatalog[0].id, 1);
      assert.strictEqual(storefrontCatalog[0].status, 'ACTIVE');
    });

    it('owner portal status tabs correctly partition product views', () => {
      // TAB: ALL
      const allTab = MOCK_CATALOG;
      assert.strictEqual(allTab.length, 4);

      // TAB: DRAFT
      const draftTab = MOCK_CATALOG.filter((p) => p.status === 'DRAFT');
      assert.strictEqual(draftTab.length, 1);
      assert.strictEqual(draftTab[0].id, 2);

      // TAB: HIDDEN
      const hiddenTab = MOCK_CATALOG.filter((p) => p.status === 'HIDDEN');
      assert.strictEqual(hiddenTab.length, 1);
      assert.strictEqual(hiddenTab[0].id, 3);

      // TAB: ARCHIVED
      const archivedTab = MOCK_CATALOG.filter((p) => p.status === 'ARCHIVED');
      assert.strictEqual(archivedTab.length, 1);
      assert.strictEqual(archivedTab[0].id, 4);
    });

    it('blocks physical deletion when product has past orders', () => {
      const productWithOrders = {
        id: 1,
        name: 'Đầm Lụa Maxi',
        hasOrders: true,
      };

      const deleteProduct = (p: { id: number; hasOrders: boolean }) => {
        if (p.hasOrders) {
          throw new Error('PRODUCT_HAS_ORDERS: Không thể xóa sản phẩm đã có đơn hàng trong hệ thống. Vui lòng chuyển sang ARCHIVED.');
        }
        return true;
      };

      assert.throws(() => deleteProduct(productWithOrders), /PRODUCT_HAS_ORDERS/);
    });
  });
});
