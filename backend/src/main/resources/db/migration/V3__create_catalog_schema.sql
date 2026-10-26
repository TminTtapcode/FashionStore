-- =====================================================
-- V3__create_catalog_schema.sql
-- Dedicated Fashion Apparel Catalog Schema
-- Categories, Products, Variants & Product Images
-- =====================================================

-- 1. Categories Table (2-level hierarchy: e.g. Thời trang Nữ -> Đầm & Váy)
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL,
    INDEX idx_categories_parent_status (parent_id, status),
    INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Products Table (Fashion apparel specific attributes)
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description TEXT NULL,
    brand VARCHAR(100) NULL,
    material VARCHAR(150) NULL,           -- e.g. '100% Cotton Organic', 'Lụa Satin', 'Linen tơ tằm'
    fit_style VARCHAR(100) NULL,          -- e.g. 'Slim-fit', 'Regular fit', 'Oversized', 'Dáng chữ A'
    care_instructions TEXT NULL,          -- e.g. 'Giặt tay nhẹ, không tẩy, ủi nhiệt độ thấp'
    specifications JSON NULL,             -- Extensible specs (stretchability, detailed measurements)
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_shop FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    INDEX idx_products_category_status (category_id, status),
    INDEX idx_products_shop_status (shop_id, status),
    INDEX idx_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Product Variants Table (Structured size, color, SKU, price & stock)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku VARCHAR(60) NOT NULL UNIQUE,
    size VARCHAR(20) NOT NULL,            -- e.g. 'XS', 'S', 'M', 'L', 'XL', '28', '29', 'FREESIZE'
    color_name VARCHAR(50) NOT NULL,      -- e.g. 'Trắng', 'Đen', 'Be', 'Xanh Pastel'
    color_hex VARCHAR(7) NULL,            -- e.g. '#FFFFFF', '#1A1A1A' for visual swatch
    price DECIMAL(12, 2) NOT NULL,
    compare_at_price DECIMAL(12, 2) NULL, -- Original/list price for strikethrough comparison
    stock_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_variant_composite (product_id, id),
    UNIQUE KEY uk_product_size_color (product_id, size, color_name),
    INDEX idx_variants_product_status_price (product_id, status, price),
    INDEX idx_variants_size (size),
    INDEX idx_variants_color (color_name),
    INDEX idx_variants_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Images Table (Enforces variant belongs to product via composite FK)
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    variant_id BIGINT NULL,
    image_url VARCHAR(500) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_images_product_variant FOREIGN KEY (product_id, variant_id) REFERENCES product_variants (product_id, id) ON DELETE CASCADE,
    INDEX idx_images_product_primary (product_id, is_primary),
    INDEX idx_images_product_sort (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed default Shop if not exists
INSERT INTO shops (id, name, slug, status)
VALUES (1, 'Fashion Store Atelier', 'fashion-store-atelier', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=name;

-- 6. Seed Fashion Apparel Categories
INSERT INTO categories (id, parent_id, name, slug, description, sort_order) VALUES
(1, NULL, 'Thời trang Nữ', 'thoi-trang-nu', 'Bộ sưu tập trang phục nữ thanh lịch và hiện đại', 1),
(2, NULL, 'Thời trang Nam', 'thoi-trang-nam', 'Thời trang nam tối giản, tinh tế và cao cấp', 2),
(3, 1, 'Đầm & Váy', 'dam-va-vay', 'Đầm maxi, đầm dự tiệc, chân váy chữ A, chân váy midi', 1),
(4, 1, 'Áo Nữ', 'ao-nu', 'Áo sơ mi lụa, áo thun cotton, áo blazer nữ', 2),
(5, 1, 'Quần Nữ', 'quan-nu', 'Quần jeans ống suông, quần tây công sở, quần short', 3),
(6, 1, 'Set Đồ & Jumpsuit', 'set-do-jumpsuit', 'Set trang phục dạo phố, set công sở, jumpsuit liền thân', 4),
(7, 2, 'Áo Nam', 'ao-nam', 'Áo sơ mi Oxford, áo thun heavyweight, áo polo', 1),
(8, 2, 'Quần Nam', 'quan-nam', 'Quần jeans vintage, quần tây xếp ly, quần kaki', 2)
ON DUPLICATE KEY UPDATE name=name;

-- 7. Seed Real Fashion Apparel Products
-- Product 1: Đầm Lụa Maxi Dự Tiệc Cổ Chữ V
INSERT INTO products (id, shop_id, category_id, name, slug, description, brand, material, fit_style, care_instructions, specifications, status) VALUES
(1, 1, 3, 'Đầm Lụa Maxi Cổ Chữ V Dáng Xòe', 'dam-lua-maxi-co-chu-v-dang-xoe', 
 'Thiết kế đầm lụa maxi dáng xòe bay bổng, đường cắt may tinh tế tôn vòng eo và xương quai xanh. Phù hợp cho các buổi dạ tiệc sang trọng hoặc dạo phố cuối tuần.',
 'Atelier Signature', '100% Lụa Satin Cao Cấp', 'Dáng xòe bay bổng (Flared Fit)', 
 'Giặt tay nhẹ nhàng bằng nước lạnh, dùng nước giặt chuyên dụng cho lụa, không vắt xoắn, phơi trong bóng râm, ủi hơi nước ở nhiệt độ thấp.',
 '{"stretchability": "Không co giãn", "lining": "Lót lụa habutai 2 lớp", "length": "125cm", "size_guide": [{"size": "S", "bust": "82-86", "waist": "64-68", "hips": "88-92"}, {"size": "M", "bust": "86-90", "waist": "68-72", "hips": "92-96"}, {"size": "L", "bust": "90-94", "waist": "72-76", "hips": "96-100"}]}',
 'ACTIVE');

-- Variants for Product 1 (Trắng Ngọc, Xanh Rêu Nhạt)
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity, status) VALUES
(1, 1, 'DAM-MAXI-TRANG-S', 'S', 'Trắng Ngọc', '#FDFBF7', 650000.00, 750000.00, 15, 'ACTIVE'),
(2, 1, 'DAM-MAXI-TRANG-M', 'M', 'Trắng Ngọc', '#FDFBF7', 650000.00, 750000.00, 20, 'ACTIVE'),
(3, 1, 'DAM-MAXI-TRANG-L', 'L', 'Trắng Ngọc', '#FDFBF7', 650000.00, 750000.00, 8, 'ACTIVE'),
(4, 1, 'DAM-MAXI-REU-S', 'S', 'Xanh Rêu Nhạt', '#7A8B7B', 680000.00, 790000.00, 12, 'ACTIVE'),
(5, 1, 'DAM-MAXI-REU-M', 'M', 'Xanh Rêu Nhạt', '#7A8B7B', 680000.00, 790000.00, 0, 'ACTIVE') -- Hết hàng để test out-of-stock
ON DUPLICATE KEY UPDATE sku=sku;

-- Images for Product 1
INSERT INTO product_images (id, product_id, variant_id, image_url, storage_key, alt_text, sort_order, is_primary) VALUES
(1, 1, 1, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80', 'img_dam_maxi_white_front', 'Đầm lụa maxi trắng ngọc mặt trước', 1, TRUE),
(2, 1, 1, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80', 'img_dam_maxi_white_back', 'Đầm lụa maxi trắng ngọc chi tiết lưng đầm', 2, FALSE),
(3, 1, 4, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80', 'img_dam_maxi_sage_front', 'Đầm lụa maxi xanh rêu nhạt dáng xòe', 3, FALSE)
ON DUPLICATE KEY UPDATE image_url=image_url;

-- Product 2: Áo Sơ Mi Oxford Cotton Regular Fit
INSERT INTO products (id, shop_id, category_id, name, slug, description, brand, material, fit_style, care_instructions, specifications, status) VALUES
(2, 1, 7, 'Áo Sơ Mi Oxford Cotton Cổ Button-Down', 'ao-so-mi-oxford-cotton-co-button-down',
 'Áo sơ mi nam chất liệu Oxford dệt vân nổi cổ điển, phom regular fit lịch lãm, thấm hút mồ hôi tốt. Cổ áo button-down định hình chuẩn mực cho cả đi làm lẫn dạo phố.',
 'Heritage Line', '100% Cotton Oxford 80/2', 'Regular Fit',
 'Giặt máy ở chế độ nhẹ dưới 40 độ C, lộn trái khi giặt, ủi ở nhiệt độ trung bình khi vải còn ẩm nhẹ.',
 '{"weave": "Dệt Oxford 2 sợi", "collar": "Button-Down", "size_guide": [{"size": "S", "shoulder": "44", "chest": "100", "length": "72"}, {"size": "M", "shoulder": "46", "chest": "104", "length": "74"}, {"size": "L", "shoulder": "48", "chest": "108", "length": "76"}, {"size": "XL", "shoulder": "50", "chest": "112", "length": "78"}]}',
 'ACTIVE');

-- Variants for Product 2 (Trắng, Xanh Nhạt)
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity, status) VALUES
(6, 2, 'SOMI-OXFORD-TRANG-S', 'S', 'Trắng', '#FFFFFF', 450000.00, NULL, 30, 'ACTIVE'),
(7, 2, 'SOMI-OXFORD-TRANG-M', 'M', 'Trắng', '#FFFFFF', 450000.00, NULL, 45, 'ACTIVE'),
(8, 2, 'SOMI-OXFORD-TRANG-L', 'L', 'Trắng', '#FFFFFF', 450000.00, NULL, 25, 'ACTIVE'),
(9, 2, 'SOMI-OXFORD-TRANG-XL', 'XL', 'Trắng', '#FFFFFF', 450000.00, NULL, 10, 'ACTIVE'),
(10, 2, 'SOMI-OXFORD-XANH-M', 'M', 'Xanh Nhạt', '#BFD7ED', 450000.00, NULL, 20, 'ACTIVE'),
(11, 2, 'SOMI-OXFORD-XANH-L', 'L', 'Xanh Nhạt', '#BFD7ED', 450000.00, NULL, 15, 'ACTIVE')
ON DUPLICATE KEY UPDATE sku=sku;

-- Images for Product 2
INSERT INTO product_images (id, product_id, variant_id, image_url, storage_key, alt_text, sort_order, is_primary) VALUES
(4, 2, 6, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80', 'img_somi_oxford_white_1', 'Áo sơ mi Oxford trắng chính diện', 1, TRUE),
(5, 2, 6, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80', 'img_somi_oxford_white_zoom', 'Cận cảnh vân dệt Oxford và cổ button-down', 2, FALSE),
(6, 2, 10, 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=900&q=80', 'img_somi_oxford_blue', 'Áo sơ mi Oxford màu xanh nhạt', 3, FALSE)
ON DUPLICATE KEY UPDATE image_url=image_url;

-- Product 3: Áo Blazer Linen Dáng Rộng Minimalist
INSERT INTO products (id, shop_id, category_id, name, slug, description, brand, material, fit_style, care_instructions, specifications, status) VALUES
(3, 1, 4, 'Áo Blazer Linen Phom Rộng Minimalist', 'ao-blazer-linen-phom-rong-minimalist',
 'Chiếc blazer mang tinh thần phóng khoáng với chất liệu linen thô dệt tự nhiên, độ rũ nhẹ đặc trưng và phom suông rộng hiện đại. Dễ phối với đầm hai dây hoặc quần tây.',
 'Atelier Signature', '100% Pure French Linen', 'Oversized Relaxed Fit',
 'Giặt hấp khô chuyên dụng hoặc giặt tay nước mát, phơi phẳng nơi thoáng gió, không ủi gắt để giữ nếp gãy tự nhiên của sợi linen.',
 '{"buttons": "Khuy sừng tự nhiên", "pockets": "2 túi nắp phía trước", "lining": "Nửa lưng thoáng mát", "size_guide": [{"size": "S", "chest": "106", "shoulder": "42", "length": "72"}, {"size": "M", "chest": "110", "shoulder": "44", "length": "74"}, {"size": "L", "chest": "114", "shoulder": "46", "length": "76"}]}',
 'ACTIVE');

-- Variants for Product 3 (Be Cát, Đen Than)
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity, status) VALUES
(12, 3, 'BLAZER-LINEN-BE-S', 'S', 'Be Cát', '#D8C7B5', 850000.00, 990000.00, 10, 'ACTIVE'),
(13, 3, 'BLAZER-LINEN-BE-M', 'M', 'Be Cát', '#D8C7B5', 850000.00, 990000.00, 18, 'ACTIVE'),
(14, 3, 'BLAZER-LINEN-BE-L', 'L', 'Be Cát', '#D8C7B5', 850000.00, 990000.00, 6, 'ACTIVE'),
(15, 3, 'BLAZER-LINEN-DEN-S', 'S', 'Đen Than', '#1C1C1C', 890000.00, 1050000.00, 8, 'ACTIVE'),
(16, 3, 'BLAZER-LINEN-DEN-M', 'M', 'Đen Than', '#1C1C1C', 890000.00, 1050000.00, 12, 'ACTIVE')
ON DUPLICATE KEY UPDATE sku=sku;

-- Images for Product 3
INSERT INTO product_images (id, product_id, variant_id, image_url, storage_key, alt_text, sort_order, is_primary) VALUES
(7, 3, 12, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 'img_blazer_sand_front', 'Áo blazer linen be cát phom rộng', 1, TRUE),
(8, 3, 12, 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=900&q=80', 'img_blazer_sand_texture', 'Cận cảnh thớ vải linen và đường kim mũi chỉ', 2, FALSE),
(9, 3, 15, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', 'img_blazer_black_lookbook', 'Blazer linen đen than phối đồ lookbook', 3, FALSE)
ON DUPLICATE KEY UPDATE image_url=image_url;

-- Product 4: Quần Jeans Ống Suông Vintage Denim
INSERT INTO products (id, shop_id, category_id, name, slug, description, brand, material, fit_style, care_instructions, specifications, status) VALUES
(4, 1, 5, 'Quần Jeans Ống Suông Cạp Cao Vintage Denim', 'quan-jeans-ong-suong-cap-cao-vintage-denim',
 'Quần jeans nữ ống suông cạp cao, tôn chân dài và che khuyết điểm hoàn hảo. Xử lý wash màu thủ công vintage tạo hiệu ứng phai màu thời thượng.',
 'Urban Denim', '100% Heavy Denim Cotton 13.5oz', 'Straight-Leg High-Waist (Ống suông cạp cao)',
 'Lộn mặt trái khi giặt, không ngâm xà phòng mạnh, giặt nước lạnh để giữ độ bền màu wash nguyên bản.',
 '{"rise": "Cạp cao 31cm", "fly": "Khóa kéo kim loại YKK", "size_guide": [{"size": "28", "waist": "66", "hips": "92", "length": "100"}, {"size": "29", "waist": "69", "hips": "95", "length": "101"}, {"size": "30", "waist": "72", "hips": "98", "length": "102"}, {"size": "31", "waist": "75", "hips": "101", "length": "103"}]}',
 'ACTIVE');

-- Variants for Product 4 (Size số: 28, 29, 30, 31)
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity, status) VALUES
(17, 4, 'JEANS-SUONG-XANH-28', '28', 'Xanh Vintage', '#4E6E8E', 520000.00, 590000.00, 14, 'ACTIVE'),
(18, 4, 'JEANS-SUONG-XANH-29', '29', 'Xanh Vintage', '#4E6E8E', 520000.00, 590000.00, 22, 'ACTIVE'),
(19, 4, 'JEANS-SUONG-XANH-30', '30', 'Xanh Vintage', '#4E6E8E', 520000.00, 590000.00, 18, 'ACTIVE'),
(20, 4, 'JEANS-SUONG-XANH-31', '31', 'Xanh Vintage', '#4E6E8E', 520000.00, 590000.00, 7, 'ACTIVE')
ON DUPLICATE KEY UPDATE sku=sku;

-- Images for Product 4
INSERT INTO product_images (id, product_id, variant_id, image_url, storage_key, alt_text, sort_order, is_primary) VALUES
(10, 4, 17, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', 'img_jeans_vintage_front', 'Quần jeans ống suông cạp cao mặt trước', 1, TRUE),
(11, 4, 17, 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80', 'img_jeans_vintage_back', 'Quần jeans ống suông cạp cao mặt sau', 2, FALSE)
ON DUPLICATE KEY UPDATE image_url=image_url;

-- Product 5: Áo Thun Heavyweight Cotton 260GSM
INSERT INTO products (id, shop_id, category_id, name, slug, description, brand, material, fit_style, care_instructions, specifications, status) VALUES
(5, 1, 7, 'Áo Thun Heavyweight Cotton 260GSM Unisex', 'ao-thun-heavyweight-cotton-260gsm-unisex',
 'Áo thun cơ bản dáng drop-shoulder trẻ trung. Định lượng vải 260GSM dày dặn, không bai dão sau nhiều lần giặt, bo cổ dệt 2 kim chắc chắn.',
 'Heritage Line', '100% Combed Cotton 260GSM', 'Drop-Shoulder Boxy Fit',
 'Giặt máy bình thường, phơi ngang áo để tránh giãn cổ áo, không sấy nhiệt độ cao.',
 '{"gsm": "260 GSM", "rib": "Bo cổ dệt 1x1 co giãn", "size_guide": [{"size": "S", "chest": "104", "length": "68"}, {"size": "M", "chest": "108", "length": "70"}, {"size": "L", "chest": "112", "length": "72"}, {"size": "XL", "chest": "116", "length": "74"}]}',
 'ACTIVE');

-- Variants for Product 5 (Trắng, Đen Than, Xanh Rêu)
INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity, status) VALUES
(21, 5, 'TEE-HW-TRANG-S', 'S', 'Trắng', '#FFFFFF', 320000.00, NULL, 50, 'ACTIVE'),
(22, 5, 'TEE-HW-TRANG-M', 'M', 'Trắng', '#FFFFFF', 320000.00, NULL, 60, 'ACTIVE'),
(23, 5, 'TEE-HW-TRANG-L', 'L', 'Trắng', '#FFFFFF', 320000.00, NULL, 40, 'ACTIVE'),
(24, 5, 'TEE-HW-DEN-M', 'M', 'Đen Than', '#1C1C1C', 320000.00, NULL, 45, 'ACTIVE'),
(25, 5, 'TEE-HW-DEN-L', 'L', 'Đen Than', '#1C1C1C', 320000.00, NULL, 35, 'ACTIVE'),
(26, 5, 'TEE-HW-REU-L', 'L', 'Xanh Rêu Đậm', '#3F4A3C', 320000.00, NULL, 20, 'ACTIVE')
ON DUPLICATE KEY UPDATE sku=sku;

-- Images for Product 5
INSERT INTO product_images (id, product_id, variant_id, image_url, storage_key, alt_text, sort_order, is_primary) VALUES
(12, 5, 21, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'img_tee_white_1', 'Áo thun heavyweight trắng', 1, TRUE),
(13, 5, 21, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80', 'img_tee_black_2', 'Áo thun heavyweight đen than', 2, FALSE),
(14, 5, 26, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80', 'img_tee_olive_3', 'Áo thun heavyweight xanh rêu cận cảnh', 3, FALSE)
ON DUPLICATE KEY UPDATE image_url=image_url;
