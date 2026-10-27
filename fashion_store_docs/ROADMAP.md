# Roadmap

## Phase 0 — Repository discovery & project skeleton
Deliverables:
- Audit repo, Git status, versions and existing code.
- Agree on Java/Spring/React versions and folder structure.
- Build/run instructions, `.env.example`, Compose for local MySQL.
- CI skeleton and ADR for architecture/auth decision.
Acceptance: clean checkout can run following README; no secrets committed.

## Phase 1 — Foundation
- Global error handling, validation, logging, API docs.
- Flyway migration baseline.
- Security design and roles; seed admin safely for dev only.
- Frontend routing, layout, design tokens, API client, error/loading states.
Acceptance: health endpoint, build/test pipeline, auth security tests.

## Phase 2 — Catalog read experience (Thời trang may mặc)
Deliverables:
- Database Schema & Flyway migration `V3__create_catalog_schema.sql`:
  - Bảng `categories` (hỗ trợ phân cấp 2 tầng: Thời trang Nữ, Thời trang Nam -> Đầm váy, Áo, Quần, Set đồ; có index và chống chu trình cha-con).
  - Bảng `products` (chất liệu `material`, form dáng `fit_style`, bảo quản `care_instructions`, `specifications` JSON).
  - Bảng `product_variants` (SKU unique, `size`, `color_name`, `color_hex`, `price`, `compare_at_price`, `stock_quantity`, unique `(product_id, size, color_name)`).
  - Bảng `product_images` (ràng buộc toàn vẹn `(product_id, variant_id)` composite foreign key, 1 ảnh `is_primary`).
- Seed data mẫu 100% thời trang may mặc thực tế (Áo sơ mi Oxford, Áo thun Cotton Premium, Quần Jeans ống đứng, Đầm lụa Maxi dự tiệc, Set đồ Blazer dạo phố), loại bỏ hoàn toàn ngành hàng khác.
- Backend API RESTful:
  - `GET /api/v1/categories`: danh mục dạng cây.
  - `GET /api/v1/products`: phân trang, tìm kiếm, lọc theo category, size, color, khoảng giá, inStockOnly, sắp xếp theo whitelist (`newest`, `price_asc`, `price_desc`, `name_asc`).
  - `GET /api/v1/products/{slug}`: chi tiết trang phục, danh sách variant, gallery ảnh, bảng size guide.
- Frontend Storefront & Lookbook Experience:
  - Grid sản phẩm tỉ lệ ảnh 3:4 chuẩn thời trang, hiển thị mini color swatch dots và badge giá gạch ngang.
  - Trang chi tiết: Gallery ảnh đồng bộ theo màu click, bộ nút chọn Size trực quan (size hết hàng có gạch chéo mờ), Drawer Size Guide tra cứu số đo ngực/eo/mông theo cm.
Acceptance: Chỉ sản phẩm và variant `ACTIVE` hiển thị trên storefront; lọc size/màu/giá chính xác; biến thể hết hàng hiển thị rõ và vô hiệu hóa nút mua; unit & integration tests đạt 100% pass.

## Phase 3 — Shopping Cart Module (Giỏ hàng thời trang & Purchase Intent)
Deliverables:
- Database Schema & Flyway migration `V4__create_cart_schema.sql`:
  - Bảng `carts` (1 giỏ hàng duy nhất/người dùng: `user_id BIGINT UNIQUE`).
  - Bảng `cart_items` (`quantity` CHECK 1..10, `UNIQUE KEY uk_cart_variant (cart_id, variant_id)`).
  - Không lưu giá cố định trong DB giỏ hàng; chỉ lưu ý định mua sắm (purchase intent), không khóa hay trừ kho.
- Backend API RESTful:
  - `GET /api/v1/cart`: đọc giỏ hàng, tính subtotal động, kiểm tra tình trạng khả dụng và cảnh báo tồn kho.
  - `POST /api/v1/cart/items`: thêm sản phẩm, tự động cộng dồn (merge policy), chặn số lượng > 10, xử lý an toàn race condition.
  - `PATCH /api/v1/cart/items/{itemId}`: cập nhật số lượng có xác thực quyền sở hữu nghiêm ngặt.
  - `DELETE /api/v1/cart/items/{itemId}`: xóa dòng hàng khỏi giỏ.
  - `DELETE /api/v1/cart`: dọn sạch giỏ hàng.
- Tối ưu hóa truy vấn:
  - `hibernate.default_batch_fetch_size: 25` và `JOIN FETCH` trong repository loại bỏ N+1 query.
- Test Suite (66 tests passed):
  - `CartServiceTest` (Unit tests cho merge, max quantity, inactive variant, ownership).
  - `CartIntegrationTest` (MockMvc integration tests cho 401 Unauthorized, cross-user 404 isolation, merge & calculations).
  - `CartConcurrencyTest` (Multi-threaded race condition tests với CountDownLatch đảm bảo tính duy nhất và không crash).
- Frontend Mini-Cart Lookbook Experience:
  - Component `MiniCartDrawer.tsx` trượt mượt mà từ cạnh phải, thanh tiến độ Freeship trực quan (mốc 1.000.000₫).
  - Kết nối Add-to-Cart từ `ProductDetailModal.tsx` và Header Cart Badge đếm số lượng.
Acceptance: 66 backend tests passed; frontend build thành công (429ms); bảo vệ quyền sở hữu; không trừ kho trong giỏ; giá thẩm quyền lấy từ backend.

## Phase 4A — Checkout & COD Order Creation
- Thu thập địa chỉ giao hàng, phương thức thanh toán COD.
- Snapshot toàn diện thông tin variant (`product_name`, `sku`, `size`, `color`, `unit_price`).
- Trừ tồn kho nguyên tử (`deductStock` có điều kiện) bên trong ACID Transaction.
- Tạo order và order items; dọn sạch giỏ hàng sau khi đặt thành công.

## Phase 4B — Order Management & Operations
- Tra cứu lịch sử đơn hàng của khách (`GET /api/v1/me/orders`).
- Hủy đơn hàng và hoàn tồn kho nguyên tử (`restoreStock`).
- Trang quản lý đơn hàng cho chủ shop.

## Phase 5 — Shop owner operations
- Product/variant CRUD and image management.
- Inventory adjustment with audit/history as needed.
- Order list/detail and allowed status transitions.
- Basic dashboard reports based on defined calculations.
Acceptance: owner cannot modify other shop data; every transition is validated.

## Phase 6 — Payment gateway
- Choose provider based on merchant eligibility, fees and official docs.
- Sandbox integration, callback verification, idempotency, reconciliation.
Acceptance: duplicate/invalid webhook tests; browser redirect alone cannot mark paid.

## Phase 7 — Admin, promotions, reviews
- User management, roles, block/unblock, audit logs.
- Coupons and usage constraints.
- Verified-purchase reviews and moderation.
Acceptance: privilege escalation tests and coupon concurrency tests.

## Phase 8 — Production hardening
- E2E critical flows, security checklist, upload limits, rate limits.
- CI/CD, domain/TLS, monitoring, backup/restore drill, runbooks.
- Privacy, shipping, returns, contact and terms pages reviewed by owner.
Acceptance: go-live checklist signed off; rollback procedure exists.

## Scope discipline
Do not implement all phases in parallel. Deliver a thin vertical slice at a time. Prefer the next feature that validates a critical business assumption. Payment and returns must be based on the selected provider and real shop policy, not invented details.
