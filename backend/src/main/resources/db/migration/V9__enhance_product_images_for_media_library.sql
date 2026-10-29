-- V9__enhance_product_images_for_media_library.sql
-- Bổ sung metadata mở rộng cho Cloudinary Media Library (Phase 5C.4)

ALTER TABLE product_images
    ADD COLUMN file_size BIGINT NULL COMMENT 'Dung lượng file tính bằng bytes',
    ADD COLUMN width INT NULL COMMENT 'Chiều rộng ảnh tính bằng pixels',
    ADD COLUMN height INT NULL COMMENT 'Chiều cao ảnh tính bằng pixels',
    ADD COLUMN format VARCHAR(20) NULL COMMENT 'Định dạng file (jpg, png, webp, ...)';
