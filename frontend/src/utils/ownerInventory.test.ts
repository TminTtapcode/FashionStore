import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  InventoryMovementDto
} from '../api/ownerInventoryApi';

// ---------------------------------------------------------------------------
// Pure helper functions reflecting domain rules implemented in Phase 5C.3
// ---------------------------------------------------------------------------

/**
 * Calculates stock balance and verifies audit reconciliation invariant.
 */
export function calculateReconciliation(
  currentStock: number,
  movements: Pick<InventoryMovementDto, 'quantityDelta' | 'movementType'>[]
): {
  openingBalance: number;
  totalDelta: number;
  calculatedStock: number;
  discrepancy: number;
  isBalanced: boolean;
} {
  let openingBalance = 0;
  let totalDelta = 0;

  for (const m of movements) {
    totalDelta += m.quantityDelta;
    if (m.movementType === 'OPENING_BALANCE' || m.movementType === 'INITIAL_STOCK') {
      openingBalance = m.quantityDelta;
    }
  }

  const calculatedStock = totalDelta;
  const discrepancy = currentStock - calculatedStock;
  const isBalanced = discrepancy === 0;

  return {
    openingBalance,
    totalDelta,
    calculatedStock,
    discrepancy,
    isBalanced,
  };
}

/**
 * Validates manual stock adjustment request against business rules.
 */
export function validateManualAdjustment(
  currentStock: number,
  delta: number,
  reason: string
): { isValid: boolean; errorCode?: string; errorMessage?: string } {
  if (delta === 0) {
    return {
      isValid: false,
      errorCode: 'INVALID_DELTA',
      errorMessage: 'Độ lệch kiểm kê phải khác 0 (dương để tăng, âm để giảm)',
    };
  }

  if (currentStock + delta < 0) {
    return {
      isValid: false,
      errorCode: 'NEGATIVE_STOCK_FORBIDDEN',
      errorMessage: `Tồn kho sau điều chỉnh không được nhỏ hơn 0 (Hiện tại: ${currentStock}, giảm: ${Math.abs(delta)})`,
    };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      isValid: false,
      errorCode: 'INVALID_REASON',
      errorMessage: 'Lý do kiểm kê phải có ít nhất 5 ký tự để phục vụ đối soát kiểm toán',
    };
  }

  return { isValid: true };
}

/**
 * Classifies inventory variant into stock status bucket.
 */
export function classifyStockStatus(currentStock: number): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= 5) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/**
 * Generates deterministic idempotency key for movement types.
 */
export function generateMovementKey(
  type: 'ORDER' | 'CANCEL' | 'RETURN' | 'OPENING' | 'INIT',
  reference: string | number,
  variantId: number
): string {
  switch (type) {
    case 'ORDER':
      return `ORDER-${reference}-${variantId}`;
    case 'CANCEL':
      return `CANCEL-${reference}-${variantId}`;
    case 'RETURN':
      return `RETURN-${reference}-${variantId}`;
    case 'OPENING':
      return `OPENING-${variantId}`;
    case 'INIT':
      return `INIT-${variantId}`;
  }
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('Phase 5C.3: Inventory Management & Immutable Audit Ledger Tests', () => {

  describe('1. Mathematical Reconciliation & Invariant: Current == Sum(Deltas)', () => {
    it('should verify perfectly balanced ledger when currentStock matches sum of deltas', () => {
      const movements = [
        { movementType: 'OPENING_BALANCE', quantityDelta: 50 },
        { movementType: 'ORDER_DEDUCT', quantityDelta: -10 },
        { movementType: 'CANCEL_RESTORE', quantityDelta: 2 },
        { movementType: 'STOCK_RECEIPT', quantityDelta: 20 },
        { movementType: 'MANUAL_ADJUSTMENT', quantityDelta: -2 },
      ];
      // Expected current: 50 - 10 + 2 + 20 - 2 = 60
      const currentStock = 60;
      const result = calculateReconciliation(currentStock, movements);

      assert.strictEqual(result.openingBalance, 50);
      assert.strictEqual(result.totalDelta, 60);
      assert.strictEqual(result.calculatedStock, 60);
      assert.strictEqual(result.discrepancy, 0);
      assert.strictEqual(result.isBalanced, true);
    });

    it('should detect discrepancy if current stock does not match cumulative deltas', () => {
      const movements = [
        { movementType: 'INITIAL_STOCK', quantityDelta: 30 },
        { movementType: 'ORDER_DEDUCT', quantityDelta: -5 },
      ];
      // Ledger says 25, but currentStock in DB is 20 (phantom loss or unrecorded update)
      const currentStock = 20;
      const result = calculateReconciliation(currentStock, movements);

      assert.strictEqual(result.totalDelta, 25);
      assert.strictEqual(result.discrepancy, -5);
      assert.strictEqual(result.isBalanced, false);
    });

    it('should handle zero-stock variants with cutover opening balance of 0', () => {
      const movements = [
        { movementType: 'OPENING_BALANCE', quantityDelta: 0 },
      ];
      const result = calculateReconciliation(0, movements);

      assert.strictEqual(result.openingBalance, 0);
      assert.strictEqual(result.totalDelta, 0);
      assert.strictEqual(result.discrepancy, 0);
      assert.strictEqual(result.isBalanced, true);
    });
  });

  describe('2. Manual Stock Adjustment Business Rules', () => {
    it('should reject adjustment with zero delta (INVALID_DELTA)', () => {
      const validation = validateManualAdjustment(15, 0, 'Không lệch gì');
      assert.strictEqual(validation.isValid, false);
      assert.strictEqual(validation.errorCode, 'INVALID_DELTA');
    });

    it('should reject adjustment that results in negative stock (NEGATIVE_STOCK_FORBIDDEN)', () => {
      const validation = validateManualAdjustment(5, -6, 'Hỏng 6 chiếc');
      assert.strictEqual(validation.isValid, false);
      assert.strictEqual(validation.errorCode, 'NEGATIVE_STOCK_FORBIDDEN');
    });

    it('should allow adjustment that reduces stock down to exactly zero', () => {
      const validation = validateManualAdjustment(5, -5, 'Hỏng toàn bộ 5 chiếc áo');
      assert.strictEqual(validation.isValid, true);
    });

    it('should allow positive adjustment for found stock', () => {
      const validation = validateManualAdjustment(10, 4, 'Tìm thấy 4 áo bỏ quên');
      assert.strictEqual(validation.isValid, true);
    });

    it('should reject adjustment with insufficient reason length', () => {
      const validation = validateManualAdjustment(10, -1, 'Lỗi');
      assert.strictEqual(validation.isValid, false);
      assert.strictEqual(validation.errorCode, 'INVALID_REASON');
    });
  });

  describe('3. Stock Status Classification Rules', () => {
    it('should classify stock = 0 as OUT_OF_STOCK', () => {
      assert.strictEqual(classifyStockStatus(0), 'OUT_OF_STOCK');
      assert.strictEqual(classifyStockStatus(-1), 'OUT_OF_STOCK');
    });

    it('should classify stock between 1 and 5 as LOW_STOCK', () => {
      assert.strictEqual(classifyStockStatus(1), 'LOW_STOCK');
      assert.strictEqual(classifyStockStatus(3), 'LOW_STOCK');
      assert.strictEqual(classifyStockStatus(5), 'LOW_STOCK');
    });

    it('should classify stock > 5 as IN_STOCK', () => {
      assert.strictEqual(classifyStockStatus(6), 'IN_STOCK');
      assert.strictEqual(classifyStockStatus(50), 'IN_STOCK');
    });
  });

  describe('4. Idempotency Key Generation Semantics', () => {
    it('should generate exact ORDER idempotency key', () => {
      const key = generateMovementKey('ORDER', 'IVRE-20261029-001', 101);
      assert.strictEqual(key, 'ORDER-IVRE-20261029-001-101');
    });

    it('should generate exact CANCEL idempotency key', () => {
      const key = generateMovementKey('CANCEL', 'IVRE-20261029-001', 101);
      assert.strictEqual(key, 'CANCEL-IVRE-20261029-001-101');
    });

    it('should generate exact RETURN idempotency key', () => {
      const key = generateMovementKey('RETURN', 'IVRE-20261029-001', 101);
      assert.strictEqual(key, 'RETURN-IVRE-20261029-001-101');
    });

    it('should generate exact OPENING and INIT keys', () => {
      assert.strictEqual(generateMovementKey('OPENING', '', 205), 'OPENING-205');
      assert.strictEqual(generateMovementKey('INIT', '', 309), 'INIT-309');
    });
  });
});
