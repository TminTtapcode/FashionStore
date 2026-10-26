-- =====================================================
-- V2__create_coupons_and_welcome_voucher.sql
-- Promotion & Welcome Incentive schema
-- =====================================================

CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    discount_type VARCHAR(30) NOT NULL, -- 'PERCENTAGE' or 'FIXED_AMOUNT'
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    max_discount DECIMAL(12, 2) NULL,
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    usage_limit INT NULL,
    per_user_limit INT NOT NULL DEFAULT 1,
    first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Welcome Coupon for new users (10% off for first order)
INSERT INTO coupons (
    code, description, discount_type, discount_value, min_order_amount,
    per_user_limit, first_order_only, status
) VALUES (
    'WELCOME10',
    'Mã giảm giá chào mừng 10% dành cho khách hàng mới trong đơn hàng đầu tiên',
    'PERCENTAGE',
    10.00,
    0.00,
    1,
    TRUE,
    'ACTIVE'
) ON DUPLICATE KEY UPDATE code=code;
