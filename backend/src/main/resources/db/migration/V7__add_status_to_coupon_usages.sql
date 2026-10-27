-- =====================================================
-- V7__add_status_to_coupon_usages.sql
-- Adds status tracking and release timestamps to coupon usages
-- for immutable audit logs and accurate quota recovery
-- =====================================================

ALTER TABLE coupon_usages 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPLIED' AFTER discount_amount,
ADD COLUMN released_at TIMESTAMP NULL AFTER status,
ADD INDEX idx_coupon_usages_coupon_status (coupon_id, status),
ADD INDEX idx_coupon_usages_user_status (user_id, status);
