# Domain Model & Data Design

Đây là mô hình khởi đầu cần được xác minh khi thiết kế từng feature. Agent phải đề xuất ERD/migration trước khi triển khai schema lớn.

## 1. Các bảng đề xuất

### Identity & customer
- `users`: id, email (unique chuẩn hóa), password_hash, full_name, phone, status, created_at, updated_at.
- `roles`: id, code (`CUSTOMER`, `SHOP_OWNER`, `ADMIN`).
- `user_roles`: user_id, role_id.
- `customer_addresses`: user_id, recipient_name, phone, province/district/ward/address_line, is_default.
- `shops`: id, name, slug, status, owner_user_id, created_at. MVP chỉ có một shop active; giữ shop_id ở các bảng shop-owned nếu điều này giúp mở rộng thực tế.

### Catalog (Chuyên biệt ngành Thời trang & Trang phục)
- `categories`:
  - `id`: BIGINT AUTO_INCREMENT PRIMARY KEY.
  - `parent_id`: BIGINT nullable, FK đến `categories(id)` (có ràng buộc `parent_id != id` và không tạo chu trình lặp).
  - `name`: VARCHAR(100) NOT NULL.
  - `slug`: VARCHAR(120) NOT NULL UNIQUE.
  - `description`: TEXT nullable.
  - `status`: VARCHAR(20) DEFAULT 'ACTIVE' (`ACTIVE`, `INACTIVE`).
  - `sort_order`: INT DEFAULT 0.
  - *Cấu trúc danh mục thời trang thực tế*:
    - Thời trang Nữ: Đầm & Váy (Đầm maxi, đầm dự tiệc, chân váy chữ A, chân váy midi), Áo nữ (Áo sơ mi, áo thun, croptop, blazer), Quần nữ (Quần jeans, quần tây ống suông, quần short), Trang phục phối bộ (Jumpsuit, set đồ dạo phố, set đồ công sở).
    - Thời trang Nam: Áo nam (Áo polo, áo sơ mi, áo thun basic, áo khoác), Quần nam (Quần jeans, quần tây, quần kaki, quần short).
- `products`:
  - `id`: BIGINT AUTO_INCREMENT PRIMARY KEY.
  - `shop_id`: BIGINT NOT NULL, FK đến `shops(id)`.
  - `category_id`: BIGINT NOT NULL, FK đến `categories(id)`.
  - `name`: VARCHAR(255) NOT NULL.
  - `slug`: VARCHAR(280) NOT NULL UNIQUE.
  - `description`: TEXT nullable (mô tả kiểu dáng, hoàn cảnh sử dụng: dạo phố, công sở, dự tiệc).
  - `brand`: VARCHAR(100) nullable.
  - `material`: VARCHAR(150) nullable (chất liệu vải: 100% Cotton, Lụa Satin, Linen tơ tằm, Kaki co giãn...).
  - `fit_style`: VARCHAR(100) nullable (form dáng: Slim fit, Regular fit, Oversized, Dáng chữ A, Dáng xòe...).
  - `care_instructions`: TEXT nullable (hướng dẫn giặt ủi: Giặt tay, không giặt sấy nhiệt độ cao, ủi ở nhiệt độ trung bình...).
  - `specifications`: JSON nullable (lưu thông số kỹ thuật mở rộng linh hoạt theo nhóm trang phục như độ co giãn, độ dày vải, chiều dài váy/quần, bảng kích thước mẫu ngực/eo/mông).
  - `status`: VARCHAR(20) DEFAULT 'DRAFT' (`DRAFT`, `ACTIVE`, `HIDDEN`, `ARCHIVED`).
  - `created_at`, `updated_at`: TIMESTAMP.
- `product_variants`:
  - `id`: BIGINT AUTO_INCREMENT PRIMARY KEY.
  - `product_id`: BIGINT NOT NULL, FK đến `products(id)`.
  - `sku`: VARCHAR(60) NOT NULL UNIQUE (định dạng gợi nhớ: `{PRODUCT_SLUG}-{COLOR}-{SIZE}`, ví dụ `DAM-MAXI-LUA-TRANG-M`).
  - `size`: VARCHAR(20) NOT NULL (kích cỡ may mặc: XS, S, M, L, XL, XXL, FreeSize hoặc size số 28, 29, 30, 31, 32).
  - `color_name`: VARCHAR(50) NOT NULL (tên màu sắc: Trắng kem, Đen tuyền, Xanh Navy, Be, Hồng Pastel...).
  - `color_hex`: VARCHAR(7) nullable (mã màu Hex dạng `#FFFFFF` phục vụ hiển thị Color Swatch trực quan).
  - `price`: DECIMAL(12,2) NOT NULL (giá bán hiện hành, > 0).
  - `compare_at_price`: DECIMAL(12,2) nullable (giá niêm yết/giá gốc dùng để hiển thị giá gạch ngang khuyến mãi, >= price).
  - `stock_quantity`: INT NOT NULL DEFAULT 0 (tồn kho nguyên tử, >= 0).
  - `status`: VARCHAR(20) DEFAULT 'ACTIVE' (`ACTIVE`, `INACTIVE`).
  - `created_at`, `updated_at`: TIMESTAMP.
  - *Ràng buộc tính toàn vẹn*:
    - `UNIQUE KEY uk_product_size_color (product_id, size, color_name)` (chặn tạo 2 biến thể trùng tổ hợp size và màu trong cùng một sản phẩm).
    - `UNIQUE KEY uk_product_variant_composite (product_id, id)` (dùng làm đích tham chiếu composite FK cho ảnh).
- `product_images`:
  - `id`: BIGINT AUTO_INCREMENT PRIMARY KEY.
  - `product_id`: BIGINT NOT NULL, FK đến `products(id)`.
  - `variant_id`: BIGINT nullable, FK đến `product_variants(id)`.
  - `image_url`: VARCHAR(500) NOT NULL.
  - `storage_key`: VARCHAR(255) NOT NULL (public ID lưu trên Cloudinary/S3 để quản lý vòng đời file).
  - `alt_text`: VARCHAR(255) nullable (mô tả ảnh cho SEO và trợ năng accessibility).
  - `sort_order`: INT DEFAULT 0 (thứ tự hiển thị trong bộ sưu tập gallery).
  - `is_primary`: BOOLEAN NOT NULL DEFAULT FALSE (ảnh đại diện chính cho sản phẩm trên card catalog).
  - `created_at`: TIMESTAMP.
  - *Ràng buộc toàn vẹn ảnh*:
    - `CONSTRAINT fk_image_product_variant FOREIGN KEY (product_id, variant_id) REFERENCES product_variants(product_id, id) ON DELETE CASCADE` (đảm bảo variant_id nếu gán thì bắt buộc phải thuộc cùng sản phẩm đó, không thể trỏ chéo sang sản phẩm khác).
    - Mỗi sản phẩm có tối đa 1 ảnh `is_primary = true` (được đảm bảo bằng transactional application service logic).

### Kiến trúc thuộc tính thời trang (Fashion Attribute Architecture)
- **TỪ CHỐI EAV / Generic Attribute Engine**: Tuyệt đối không xây dựng các bảng thuộc tính động tổng quát (`attributes`, `attribute_values`, `product_attribute_values`) trong MVP. Mô hình EAV khiến câu lệnh query trở nên cực kỳ cồng kềnh với nhiều phép `LEFT JOIN`, làm suy giảm nghiêm trọng hiệu năng indexing, phân trang và sắp xếp.
- **Mô hình Quan hệ kết hợp JSON (Pragmatic Relational + JSON)**:
  - `size` và `color_name` / `color_hex` được lưu bằng cột quan hệ chuẩn trong `product_variants` để tối ưu hóa indexing, tìm kiếm, lọc nhanh theo kích cỡ/màu sắc và kiểm tra tồn kho nguyên tử lúc đặt hàng.
  - Các thuộc tính định danh thời trang chung (`material`, `fit_style`, `care_instructions`) được lưu thành các cột chuẩn trong `products`.
  - Các thông số mô tả chuyên biệt cho từng dòng trang phục (ví dụ: độ dài đầm, độ co giãn sợi vải, số đo 3 vòng mẫu của size guide) được lưu trong trường `specifications` dạng JSON của bảng `products`.
- **Ranh giới ngành hàng**:
  - MVP chỉ tập trung 100% vào thời trang may mặc và trang phục (quần, áo, đầm, váy, áo khoác, jumpsuit, set đồ).
  - Loại bỏ hoàn toàn các thực thể, thuộc tính hoặc seed data liên quan đến đồng hồ, đồ điện tử, trang sức kim hoàn hay đồ gia dụng.

### Cart & promotion
- `carts`: id, user_id nullable (nếu hỗ trợ guest cart persistence), status, created_at, updated_at.
- `cart_items`: id, cart_id, variant_id, quantity; unique(cart_id, variant_id).
- `coupons`: id, code unique, discount_type, discount_value, min_order_amount, max_discount nullable, starts_at, expires_at, usage_limit, per_user_limit, status.
- `coupon_redemptions`: coupon_id, user_id, order_id, redeemed_at.

### Order & payment
- `orders`: id/public_order_number, user_id, shop_id, status, payment_status, subtotal, discount_total, shipping_fee, grand_total, coupon_id nullable, shipping snapshot fields, note nullable, created_at, updated_at.
- `order_items`: id, order_id, variant_id nullable, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price_snapshot, quantity, line_total.
- `payments`: id, order_id, provider, provider_transaction_id nullable, amount, status, idempotency/provider reference, created_at, updated_at.
- `order_status_history`: order_id, old_status, new_status, actor_user_id nullable, note, created_at.
- Có thể thêm `payment_webhook_events` hoặc bảng inbox/idempotency khi tích hợp gateway để theo dõi sự kiện đã xử lý.

### Reviews & audit
- `reviews`: id, product_id, user_id, order_item_id, rating 1..5, title nullable, content, status, created_at. Chỉ cho đánh giá khi đơn hợp lệ đã giao/hoàn tất và có item tương ứng.
- `audit_logs`: actor_user_id, action, resource_type, resource_id, metadata đã lọc dữ liệu nhạy cảm, created_at.

## 2. Quy tắc dữ liệu
- Dùng khóa chính ổn định; không dùng tên sản phẩm làm ID.
- Unique index: email chuẩn hóa, slug trong phạm vi phù hợp, SKU, coupon code.
- Index dựa trên truy vấn: `products(status, category_id)`, `products(shop_id, status)`, `product_variants(product_id, status, price)`, `product_variants(size)`, `product_variants(color_name)`, `categories(parent_id, status)`, `orders(user_id, created_at)`, `orders(shop_id, status, created_at)`, `cart_items(cart_id)`, `order_items(order_id)`.
- Không tạo mọi index theo cảm tính; xác minh bằng query plan/slow query.
- Dùng decimal cho giá và tổng tiền (`DECIMAL(12,2)`). Quy định rõ currency (MVP VND).
- Giá và thông tin hiển thị trong order item phải là snapshot (lưu `product_name_snapshot`, `sku_snapshot`, `size_snapshot`, `color_snapshot`, `unit_price_snapshot`) để đơn cũ không thay đổi khi sản phẩm sửa tên/giá/biến thể.
- Lưu public ID/key của dịch vụ ảnh để xóa/thay ảnh đúng cách.
- Không dựa vào `stock_quantity` từ frontend.
- Quyết định soft delete/status phải nhất quán; sản phẩm đã xuất hiện trong đơn không được xóa cứng gây mất lịch sử.

## 3. Tồn kho và cạnh tranh
Không dùng mô hình “đọc stock = 1, sau đó trừ 1” mà không khóa/cập nhật có điều kiện. Hai request đồng thời có thể cùng mua đơn vị cuối cùng của một size/màu.

Các phương án:
- Conditional atomic update: `UPDATE product_variants SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`; kiểm tra số row update.
- Hoặc pessimistic lock trong transaction nếu use case cần đọc rồi quyết định.
- Nếu có reservation/giữ hàng, cần định nghĩa thời hạn giữ, job hết hạn và cách giải phóng hàng. Không thêm reservation nếu MVP chưa cần.
- Đặt transaction boundary rõ ràng và test race condition bằng test tích hợp.

## 4. ERD quan hệ cốt lõi
```text
User --< UserRole >-- Role
User --< CustomerAddress
Shop --< Product --< ProductVariant
Product --< ProductImage
ProductVariant --< ProductImage (optional 1:N binding qua variant_id)
Category --< Product
Category --< Category (cha-con nội bộ)
User -- Cart --< CartItem >-- ProductVariant
User --< Order --< OrderItem
Order --< Payment
Order --< OrderStatusHistory
Product --< Review >-- User
Coupon --< CouponRedemption >-- Order
```

## 5. Trạng thái các quyết định thiết kế
- **Guest checkout**: Đã chốt theo ADR-007 (bắt buộc đăng nhập để checkout, tặng voucher `WELCOME10`; guest chỉ duyệt catalog).
- **Giữ hàng trong giỏ**: Không; tồn kho chỉ được kiểm tra và trừ lúc checkout.
- **Thanh toán ban đầu**: Đã chốt theo ADR-005 (khởi đầu với COD).
- **Phạm vi catalog**: Đã chốt theo ADR-010 (chuyên biệt 100% thời trang may mặc, loại bỏ đồng hồ/thiết bị khác, dùng size/color có cấu trúc rõ ràng thay cho EAV).
- **Quyết định còn cần chủ shop xác nhận trước migration Phase 2**:
  1. Quy chuẩn danh sách size: Dùng size chữ chuẩn quốc tế (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `FreeSize`) và size số (`28`, `29`, `30`, `31`, `32`, `33`, `34` cho quần/áo vest) hay cho phép nhập size tùy do? Khuyến nghị: Chuẩn hóa bộ enum/whitelist size phổ biến để tối ưu bộ lọc.
  2. Quy định số lượng ảnh tối đa cho mỗi sản phẩm (ví dụ: tối đa 8 ảnh/sản phẩm) và kích thước dung lượng file cho phép.
  3. Chính sách hiển thị `compare_at_price`: Chỉ hiển thị giá gạch ngang khi `compare_at_price > price`.
