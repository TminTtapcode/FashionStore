-- =====================================================
-- V4__create_cart_schema.sql
-- Shopping Cart Schema for Fashion Store
-- =====================================================

-- 1. Carts Table (Mỗi tài khoản có tối đa 1 giỏ hàng)
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_carts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Cart Items Table (Tham chiếu biến thể, không lưu giá cố định)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    variant_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0 AND quantity <= 10),
    UNIQUE KEY uk_cart_variant (cart_id, variant_id),
    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_variant (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
