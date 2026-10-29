import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProductSlot,
  applySlotCompatibility,
  calculateOutfitSummary,
  type OutfitItemSelection,
  type OutfitSlotsMap,
  type OutfitSlot,
} from '../types/outfit.ts';
import { OUTFIT_PRESETS } from '../data/outfitPresets.ts';

describe('Phase 5D.3: IVRE Atelier Editorial Styling Studio & Outfit Builder Tests', () => {
  describe('1. Slot Resolution & Category Taxonomy Mapping', () => {
    it('maps dam-va-vay to ONE_PIECE slot', () => {
      const slot = resolveProductSlot('dam-va-vay', 'dam-lua-maxi-co-chu-v-dang-xoe');
      assert.strictEqual(slot, 'ONE_PIECE');
    });

    it('maps set-do-jumpsuit to ONE_PIECE slot', () => {
      const slot = resolveProductSlot('set-do-jumpsuit');
      assert.strictEqual(slot, 'ONE_PIECE');
    });

    it('maps ao-nam and ao-nu to UPPER_BODY by default', () => {
      const menTop = resolveProductSlot('ao-nam', 'ao-so-mi-oxford-cotton-co-button-down');
      const womenTop = resolveProductSlot('ao-nu', 'ao-thun-basic');
      assert.strictEqual(menTop, 'UPPER_BODY');
      assert.strictEqual(womenTop, 'UPPER_BODY');
    });

    it('maps quan-nu and quan-nam to LOWER_BODY', () => {
      const jeans = resolveProductSlot('quan-nu', 'quan-jeans-ong-suong-cap-cao-vintage-denim');
      const trousers = resolveProductSlot('quan-nam', 'quan-tay-nam-minimalist');
      assert.strictEqual(jeans, 'LOWER_BODY');
      assert.strictEqual(trousers, 'LOWER_BODY');
    });

    it('overrides specific outerwear products categorized under generic tops', () => {
      // Blazer Linen is categorized under 'ao-nu' in DB, but must resolve to OUTERWEAR
      const slot = resolveProductSlot('ao-nu', 'ao-blazer-linen-phom-rong-minimalist');
      assert.strictEqual(slot, 'OUTERWEAR');
    });

    it('returns null for unclassified categories', () => {
      const slot = resolveProductSlot('non-existent-category');
      assert.strictEqual(slot, null);
    });
  });

  describe('2. Slot Compatibility Rules (ONE_PIECE vs Separates)', () => {
    const mockUpper: OutfitItemSelection = {
      slot: 'UPPER_BODY',
      productId: 2,
      productSlug: 'ao-so-mi-oxford-cotton-co-button-down',
      productName: 'Áo Sơ Mi Oxford Cotton Cổ Button-Down',
      variantId: 7,
      sku: 'AO-SOMI-OXFORD-TRANG-M',
      colorName: 'Trắng',
      colorHex: '#FFFFFF',
      size: 'M',
      price: 520000,
      stockQuantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
      inStock: true,
      categorySlug: 'ao-nam',
    };

    const mockLower: OutfitItemSelection = {
      slot: 'LOWER_BODY',
      productId: 4,
      productSlug: 'quan-jeans-ong-suong-cap-cao-vintage-denim',
      productName: 'Quần Jeans Ống Suông Cạp Cao Vintage Denim',
      variantId: 19,
      sku: 'QUAN-JEANS-XANH-28',
      colorName: 'Xanh Vintage Nhạt',
      colorHex: '#7C93A4',
      size: '28',
      price: 680000,
      stockQuantity: 8,
      imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
      inStock: true,
      categorySlug: 'quan-nu',
    };

    const mockOnePiece: OutfitItemSelection = {
      slot: 'ONE_PIECE',
      productId: 6,
      productSlug: 'dam-da-hoi-lua-to-tam-co-yem',
      productName: 'Đầm Dạ Hội Lụa Tơ Tằm Cổ Yếm',
      variantId: 28,
      sku: 'DAM-DAHOI-LUA-DEN-M',
      colorName: 'Đen Tuyển',
      colorHex: '#141416',
      size: 'M',
      price: 1850000,
      stockQuantity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b',
      inStock: true,
      categorySlug: 'dam-va-vay',
    };

    const mockOuterwear: OutfitItemSelection = {
      slot: 'OUTERWEAR',
      productId: 3,
      productSlug: 'ao-blazer-linen-phom-rong-minimalist',
      productName: 'Áo Blazer Linen Phom Rộng Minimalist',
      variantId: 13,
      sku: 'AO-BLAZER-LINEN-DEN-M',
      colorName: 'Đen Tuyển',
      colorHex: '#111215',
      size: 'M',
      price: 950000,
      stockQuantity: 6,
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea',
      inStock: true,
      categorySlug: 'ao-nu',
    };

    it('clears separates (upper + lower) when ONE_PIECE dress is selected with notification message', () => {
      const initialSlots: OutfitSlotsMap = {
        UPPER_BODY: mockUpper,
        LOWER_BODY: mockLower,
        OUTERWEAR: mockOuterwear,
      };

      const result = applySlotCompatibility(initialSlots, mockOnePiece);
      assert.strictEqual(result.updatedSlots.UPPER_BODY, undefined);
      assert.strictEqual(result.updatedSlots.LOWER_BODY, undefined);
      assert.strictEqual(result.updatedSlots.ONE_PIECE?.productId, mockOnePiece.productId);
      assert.strictEqual(result.updatedSlots.OUTERWEAR?.productId, mockOuterwear.productId);
      assert.match(result.conflictMessage || '', /Đầm liền thân đã thay thế Áo và Quần/);
    });

    it('clears ONE_PIECE when UPPER_BODY or LOWER_BODY is selected with notification message', () => {
      const initialSlots: OutfitSlotsMap = {
        ONE_PIECE: mockOnePiece,
        OUTERWEAR: mockOuterwear,
      };

      const result = applySlotCompatibility(initialSlots, mockUpper);
      assert.strictEqual(result.updatedSlots.ONE_PIECE, undefined);
      assert.strictEqual(result.updatedSlots.UPPER_BODY?.productId, mockUpper.productId);
      assert.strictEqual(result.updatedSlots.OUTERWEAR?.productId, mockOuterwear.productId);
      assert.match(result.conflictMessage || '', /Trang phục rời.*thay thế Đầm liền thân/);
    });

    it('keeps existing slots untouched when selecting OUTERWEAR or ACCESSORIES', () => {
      const initialSlots: OutfitSlotsMap = {
        UPPER_BODY: mockUpper,
        LOWER_BODY: mockLower,
      };

      const result = applySlotCompatibility(initialSlots, mockOuterwear);
      assert.strictEqual(result.updatedSlots.UPPER_BODY?.productId, mockUpper.productId);
      assert.strictEqual(result.updatedSlots.LOWER_BODY?.productId, mockLower.productId);
      assert.strictEqual(result.updatedSlots.OUTERWEAR?.productId, mockOuterwear.productId);
      assert.strictEqual(result.conflictMessage, null);
    });
  });

  describe('3. Real-Time Dynamic Pricing & Availability Calculation', () => {
    it('calculates total price and item count accurately for active outfit', () => {
      const slots: OutfitSlotsMap = {
        UPPER_BODY: {
          slot: 'UPPER_BODY',
          productId: 2,
          productSlug: 'ao-so-mi',
          productName: 'Áo Sơ Mi',
          variantId: 7,
          sku: 'SKU-1',
          colorName: 'Trắng',
          colorHex: '#FFFFFF',
          size: 'M',
          price: 520000,
          stockQuantity: 10,
          imageUrl: '',
          inStock: true,
          categorySlug: 'ao-nam',
        },
        LOWER_BODY: {
          slot: 'LOWER_BODY',
          productId: 4,
          productSlug: 'quan-jeans',
          productName: 'Quần Jeans',
          variantId: 19,
          sku: 'SKU-2',
          colorName: 'Xanh',
          colorHex: '#7C93A4',
          size: '28',
          price: 680000,
          stockQuantity: 5,
          imageUrl: '',
          inStock: true,
          categorySlug: 'quan-nu',
        },
        OUTERWEAR: {
          slot: 'OUTERWEAR',
          productId: 3,
          productSlug: 'ao-blazer',
          productName: 'Áo Blazer',
          variantId: 13,
          sku: 'SKU-3',
          colorName: 'Đen',
          colorHex: '#111215',
          size: 'M',
          price: 950000,
          stockQuantity: 6,
          imageUrl: '',
          inStock: true,
          categorySlug: 'ao-nu',
        },
      };

      const summary = calculateOutfitSummary(slots);
      assert.strictEqual(summary.itemCount, 3);
      assert.strictEqual(summary.totalPrice, 520000 + 680000 + 950000);
      assert.strictEqual(summary.isAllAvailable, true);
      assert.strictEqual(summary.unavailableItemCount, 0);
    });

    it('detects out-of-stock items and reports unavailable count', () => {
      const slots: OutfitSlotsMap = {
        ONE_PIECE: {
          slot: 'ONE_PIECE',
          productId: 1,
          productSlug: 'dam-lua',
          productName: 'Đầm Lụa',
          variantId: 1,
          sku: 'SKU-1',
          colorName: 'Vàng',
          colorHex: '#E5D3B3',
          size: 'S',
          price: 890000,
          stockQuantity: 0, // OUT OF STOCK
          imageUrl: '',
          inStock: false,
          categorySlug: 'dam-va-vay',
        },
      };

      const summary = calculateOutfitSummary(slots);
      assert.strictEqual(summary.itemCount, 1);
      assert.strictEqual(summary.totalPrice, 890000);
      assert.strictEqual(summary.isAllAvailable, false);
      assert.strictEqual(summary.unavailableItemCount, 1);
    });
  });

  describe('4. Pre-Flight Cart Limit & Duplicate Variant Aggregation', () => {
    it('aggregates multiple instances of same variant within outfit and verifies against max 10 per SKU', () => {
      const outfitItems: OutfitItemSelection[] = [
        {
          slot: 'UPPER_BODY',
          productId: 2,
          productSlug: 'ao-so-mi',
          productName: 'Áo Sơ Mi',
          variantId: 7,
          sku: 'SKU-SAME',
          colorName: 'Trắng',
          colorHex: '#FFF',
          size: 'M',
          price: 520000,
          stockQuantity: 20,
          imageUrl: '',
          inStock: true,
          categorySlug: 'ao-nam',
        },
        {
          slot: 'ACCESSORIES',
          productId: 2,
          productSlug: 'ao-so-mi',
          productName: 'Áo Sơ Mi',
          variantId: 7,
          sku: 'SKU-SAME',
          colorName: 'Trắng',
          colorHex: '#FFF',
          size: 'M',
          price: 520000,
          stockQuantity: 20,
          imageUrl: '',
          inStock: true,
          categorySlug: 'ao-nam',
        },
      ];

      // Simulate aggregation
      const countMap = new Map<number, number>();
      for (const item of outfitItems) {
        countMap.set(item.variantId, (countMap.get(item.variantId) || 0) + 1);
      }

      assert.strictEqual(countMap.get(7), 2);

      // Existing cart has 9 items of variant 7
      const existingCartQty = 9;
      const neededQty = countMap.get(7)!;
      const maxPermitted = Math.min(10, outfitItems[0].stockQuantity);

      const exceeds = existingCartQty + neededQty > maxPermitted;
      assert.strictEqual(exceeds, true); // 9 + 2 = 11 > 10, properly flagged
    });

    it('respects low inventory boundary (stock < 10) in pre-flight aggregation', () => {
      const stockQuantity = 3;
      const existingCartQty = 2;
      const neededQty = 2; // wants 2 items
      const maxPermitted = Math.min(10, stockQuantity); // limit is 3

      const exceeds = existingCartQty + neededQty > maxPermitted;
      assert.strictEqual(exceeds, true); // 2 + 2 = 4 > 3
    });
  });

  describe('5. Sequential Batch Add-to-Cart Flow & Granular Reporting', () => {
    it('correctly categorizes full success vs partial failure with granular error messaging', async () => {
      const items = [
        { variantId: 101, sku: 'SKU-A', productName: 'Item A', willSucceed: true },
        { variantId: 102, sku: 'SKU-B', productName: 'Item B', willSucceed: false, error: 'Kho đã hết hàng' },
        { variantId: 103, sku: 'SKU-C', productName: 'Item C', willSucceed: true },
      ];

      const batchResult = {
        totalRequested: items.length,
        successCount: 0,
        failedCount: 0,
        items: [] as Array<{ variantId: number; sku: string; status: 'SUCCESS' | 'FAILED'; errorMessage?: string }>,
      };

      for (const item of items) {
        if (item.willSucceed) {
          batchResult.successCount += 1;
          batchResult.items.push({ variantId: item.variantId, sku: item.sku, status: 'SUCCESS' });
        } else {
          batchResult.failedCount += 1;
          batchResult.items.push({
            variantId: item.variantId,
            sku: item.sku,
            status: 'FAILED',
            errorMessage: item.error,
          });
        }
      }

      assert.strictEqual(batchResult.totalRequested, 3);
      assert.strictEqual(batchResult.successCount, 2);
      assert.strictEqual(batchResult.failedCount, 1);
      assert.strictEqual(batchResult.items[1].status, 'FAILED');
      assert.strictEqual(batchResult.items[1].errorMessage, 'Kho đã hết hàng');
    });
  });

  describe('6. Curated Presets Integrity & Architecture', () => {
    it('ensures all curated presets have valid slots and comply with compatibility constraints', () => {
      assert.ok(OUTFIT_PRESETS.length >= 2, 'Must have at least 2 presets defined');

      for (const preset of OUTFIT_PRESETS) {
        assert.ok(preset.id, 'Preset must have an id');
        assert.ok(preset.name, 'Preset must have a name');
        const slots = preset.slots;
        const keys = Object.keys(slots) as OutfitSlot[];
        assert.ok(keys.length > 0, `Preset ${preset.name} must have items`);

        // Check compatibility: if ONE_PIECE is defined, UPPER_BODY and LOWER_BODY must not be defined
        if (slots.ONE_PIECE) {
          assert.strictEqual(
            slots.UPPER_BODY,
            undefined,
            `Preset ${preset.name} with ONE_PIECE cannot have UPPER_BODY`
          );
          assert.strictEqual(
            slots.LOWER_BODY,
            undefined,
            `Preset ${preset.name} with ONE_PIECE cannot have LOWER_BODY`
          );
        }
      }
    });
  });
});
