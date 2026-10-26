# Domain Model & Data Design

Đây là mô hình khởi đầu cần được xác minh khi thiết kế từng feature. Agent phải đề xuất ERD/migration trước khi triển khai schema lớn.

## 1. Các bảng đề xuất

### Identity & customer
- `users`: id, email (unique chuẩn hóa), password_hash, full_name, phone, status, created_at, updated_at.
- `roles`: id, code (`CUSTOMER`, `SHOP_OWNER`, `ADMIN`).
- `user_roles`: user_id, role_id.
- `customer_addresses`: user_id, recipient_name, phone, province/district/ward/address_line, is_default.
- `shops`: id, name, slug, status, owner_user_id, created_at. MVP chỉ có một shop active; giữ shop_id ở các bảng shop-owned nếu điều này giúp mở rộng thực tế.

### Catalog
- `categories`: id, parent_id nullable, name, slug, status, sort_order.
- `products`: id, shop_id, category_id, name, slug, description, brand nullable, status (`DRAFT`, `ACTIVE`, `HIDDEN`, `ARCHIVED`), created_at, updated_at.
- `product_variants`: id, product_id, sku unique, size, color_name, color_hex nullable, price, compare_at_price nullable, stock_quantity, status.
- `product_images`: id, product_id, variant_id nullable, image_url, storage_key/public_id, alt_text, sort_order, is_primary.
- Có thể thêm `product_attributes` sau nếu cần thuộc tính linh hoạt; MVP quần áo nên ưu tiên variant có size/color rõ ràng.

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
- Index dựa trên truy vấn: products(status, category_id), products(shop_id, status), orders(user_id, created_at), orders(shop_id, status, created_at), cart_items(cart_id), order_items(order_id).
- Không tạo mọi index theo cảm tính; xác minh bằng query plan/slow query.
- Dùng decimal cho giá và tổng tiền. Quy định rõ currency (MVP VND).
- Giá và thông tin hiển thị trong order item phải là snapshot để đơn cũ không thay đổi khi sản phẩm sửa tên/giá.
- Lưu public ID/key của dịch vụ ảnh để xóa/thay ảnh đúng cách.
- Không dựa vào `stock_quantity` từ frontend.
- Quyết định soft delete/status phải nhất quán; sản phẩm đã xuất hiện trong đơn không nên bị xóa cứng gây mất lịch sử.

## 3. Tồn kho và cạnh tranh
Không dùng mô hình “đọc stock = 1, sau đó trừ 1” mà không khóa/cập nhật có điều kiện. Hai request đồng thời có thể cùng mua đơn vị cuối cùng.

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
Category --< Product
User -- Cart --< CartItem >-- ProductVariant
User --< Order --< OrderItem
Order --< Payment
Order --< OrderStatusHistory
Product --< Review >-- User
Coupon --< CouponRedemption >-- Order
```

## 5. Những quyết định phải chốt trước migration
- Có cho guest checkout không? Khuyến nghị MVP: yêu cầu đăng nhập để đơn hàng và lịch sử đơn giản hơn, nhưng cho guest duyệt catalog.
- Có giữ hàng trong giỏ không? Không; tồn kho chỉ được xác nhận lúc checkout.
- Hủy đơn đến trạng thái nào? Chốt trong `BUSINESS_FLOWS.md`.
- Có thanh toán COD ngay từ MVP không? Khuyến nghị có nếu phù hợp mô hình kinh doanh.
- Đơn hàng có cần hoàn tiền/đổi trả ngay không? Cần ít nhất trạng thái và chính sách thủ công rõ ràng trước khi bán thật; automation có thể làm sau.
