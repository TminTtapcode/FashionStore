-- =====================================================
-- V8__create_inventory_ledger.sql
-- Immutable Inventory Audit Ledger & Opening Balance Cutover
-- Phase 5C.3: Tracks all Available-to-Sell (ATS) stock mutations
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    movement_type VARCHAR(40) NOT NULL,
    quantity_delta INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100) NULL,
    movement_key VARCHAR(120) NOT NULL UNIQUE,
    actor_user_id BIGINT NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_movement_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_movement_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_inv_movement_variant_created (variant_id, created_at),
    INDEX idx_inv_movement_type (movement_type),
    INDEX idx_inv_movement_ref (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opening Balance Cutover: Seed initial audit movement for all existing variants
INSERT INTO inventory_movements (
    variant_id,
    movement_type,
    quantity_delta,
    stock_before,
    stock_after,
    reference_type,
    reference_id,
    movement_key,
    actor_user_id,
    reason,
    created_at
)
SELECT
    id,
    'OPENING_BALANCE',
    stock_quantity,
    0,
    stock_quantity,
    'SYSTEM',
    'CUTOVER-V8',
    CONCAT('OPENING-', id),
    NULL,
    'Số dư tồn kho khởi tạo tại thời điểm kích hoạt Sổ cái Kiểm toán (Cutover)',
    CURRENT_TIMESTAMP
FROM product_variants;
