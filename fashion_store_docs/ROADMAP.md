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

## Phase 5A — Catalog UX & URL Synchronization (Living Shader & Debounced Search)
- **Phase 5A.1 — URL Sync & Debounce Coordination** [Hoàn tất — Commit `c3b25c7`]:
  - Đồng bộ 2 chiều qua Web History API (`pushState` vs `replaceState`).
  - Strict URL validation & sanitization (`Number.isInteger`, `Number.isFinite`, loại bỏ cận sai).
  - Khắc phục triệt để P1 Back override, P2 Price resurrect, P2 Search desync.
  - Dispatcher tập trung `applyFilter` cập nhật ref đồng bộ, semantic equality check bảo vệ typing draft.
  - Bộ 19 tests tự động PASS (11 URL tests + 8 component integration tests transpiled thật trên Node VM).
  - Đã kiểm chứng trực tiếp trên trình duyệt thật qua Chrome DevTools MCP (5/5 actions verified).
- **Phase 5A.2 — Price Presets, Filter Chips & Clear-All UX** [Hoàn tất]:
  - Hoàn thiện 4 presets giá (`≤ 500k`, `500k – 1 triệu`, `1 – 2 triệu`, `≥ 2 triệu`) với cơ chế toggle-off và input tùy chỉnh kèm phím Enter, validation chặt chẽ bảo tồn giá trị `0`.
  - Bổ sung Sort Chip trực quan trong thanh Active Filter Chips (`Xếp: ... ✕`), cho phép xóa riêng lẻ để khôi phục về sort mặc định `newest`.
  - Nút "XÓA TẤT CẢ" dọn sạch toàn bộ filters, xóa draft ô tìm kiếm, hủy debounce đang chờ, bảo tồn query param ngoại lai (`utm_source`...).
  - Thiết kế thế hệ bảo vệ Search Version Guard (`searchVersionRef`), loại trừ phụ thuộc vào giả định thứ tự giữa useEffect và setTimeout.
  - Bộ 23 tests tích hợp tự động PASS (100%), build pass sạch sẽ, 0 lỗi lint mới.
  - Đã kiểm chứng thực tế toàn diện trên trình duyệt thông qua Chrome DevTools MCP.

## Phase 5B — Product Detail Lookbook Experience [Hoàn tất]
Deliverables:
- **Lookbook Presentation & Deep-Linking (`/?product=<slug>`)**:
  - Modal chi tiết trang phục kết hợp URL search param `?product=<slug>`, đồng bộ 2 chiều với Web History API (`pushState` / `popstate`), hỗ trợ phím `Escape` và khóa cuộn nền (`document.body.style.overflow = 'hidden'`).
  - Bảo tồn 100% component tree và WebGL Living Runway Shader, tránh sụt giảm FPS và rò rỉ GPU context.
- **Dynamic Gallery đồng bộ Color Swatch**:
  - Tự động lọc ảnh theo biến thể màu đang chọn (`variant.id`), kết hợp ảnh chung của sản phẩm (`!img.variantId`), và fallback thông minh về toàn bộ ảnh.
- **Cơ chế Phòng chống Biến thể Ma (Ghost Variant Prevention)**:
  - Tự động giải quyết (auto-resolve) sang size khả dụng đầu tiên còn hàng khi chuyển màu có kích cỡ bất đối xứng, loại bỏ hoàn toàn lỗi chọn cặp (màu, size) không tồn tại.
- **Bộ chọn Size 4 Trạng thái (4-State Size Selector)**:
  - Phân định rõ ràng: Active / Selected, In-Stock, Out-of-Stock (gạch ngang mờ + disable), Not-Offered (làm mờ sâu + disable).
- **Authoritative Pricing & Stock**:
  - Hiển thị giá biến thể chính xác, giá niêm yết so sánh (`compare_at_price`), phần trăm giảm giá (`-X%`) và cảnh báo tồn kho thời gian thực.
- **Dynamic Size Guide Drawer**:
  - Slide-over drawer tra cứu bảng số đo 3 vòng (ngực, eo, mông, dài áo/váy) ưu tiên trích xuất từ `product.specifications` JSON; tự động fallback theo danh mục chuẩn (Đầm/Váy, Áo sơ mi/Áo thun, Quần/Chân váy); hỗ trợ phím `Escape` độc lập.
- **Tích hợp Add to Cart**:
  - Nhắc nhở đăng nhập cho khách vãng lai (`openAuthModal('login')`), gọi API thêm vào giỏ hàng (`POST /api/v1/cart/items`), đóng modal và tự động trượt mở Mini-Cart Drawer (`openCart()`).
- **Phòng thủ Cuộc đua Microtask Mạng**:
  - Bổ sung `if (controller.signal.aborted) return;` bên trong `.then()` của `getProductsApi` để chống microtask race condition.
- **Bằng chứng Nghiệm thu**:
  - Test Suite: **32/32 tests tự động PASS (100%)** (11 URL tests + 12 filter debounce tests + 9 product detail lookbook tests).
  - Backend Suite: **107/107 tests PASS (100%)**.
  - Code Quality: `tsc -b && vite build` hoàn tất sạch sẽ trong 762ms (~100.34 kB gzip); 0 lỗi lint.
  - Chrome DevTools MCP: 6/6 kịch bản live browser PASS (deep-linking, color switch, dynamic gallery, ghost variant prevention, size guide drawer, escape key).

## Phase 5B.1 — Product Detail Reliability & UX Hardening [Hoàn tất]
Deliverables:
- **P1 — Bảo toàn Ý định Kích cỡ (Size Intent Preservation vs Ghost Variant Auto-resolution)**:
  - Khi người dùng đổi màu, nếu kích cỡ hiện tại được sản xuất ở màu mới (dù `stock_quantity === 0`), giữ nguyên kích cỡ đã chọn và hiển thị trạng thái Hết hàng kèm vô hiệu hóa nút Mua.
  - Chỉ tự động kích hoạt auto-resolve sang size đầu tiên còn hàng khi kích cỡ hiện tại là Biến thể ma thực sự (kích cỡ không hề được sản xuất cho màu mới).
  - Loại trừ triệt để biến thể không hoạt động (`status !== 'ACTIVE'`) khỏi mọi luồng chọn và mua hàng.
- **P1 — Xử lý Phím Escape Phân tầng (Dual-Layer Escape Handling)**:
  - Đảm bảo tầng giao diện trên cùng (`SizeGuideDrawer`) tiêu thụ sự kiện Escape trước (`e.stopImmediatePropagation()`), không đóng đồng thời cả modal và drawer.
  - `ProductDetailModal` sử dụng `isSizeGuideOpenRef` làm chốt chặn bảo vệ stale closure, bỏ qua Escape khi drawer đang hiển thị.
- **P1 — Điều phối Lịch sử Modal (Modal History Coordination Contract)**:
  - Phân định rõ mở modal trong ứng dụng (gọi `history.back()` khi đóng, tránh vòng lặp lịch sử `[Catalog, Modal, Catalog]`) và mở modal qua Deep-link (gọi `history.replaceState()` khi đóng, tránh văng ra khỏi website).
- **P2 — Bảo vệ Bất biến Số lượng Giỏ hàng (Cart Quantity Invariant Enforcement)**:
  - Đồng bộ giới hạn tối đa 10 sản phẩm/dòng hàng theo ADR-011 và DB constraint (`CHECK (quantity > 0 AND quantity <= 10)`).
  - Modal kiểm tra số lượng hiện có trong giỏ (`existingCartQuantity`) để giới hạn `maxAddableQuantity = Math.min(10 - existingCartQuantity, stockQuantity)`. Vô hiệu hóa stepper và nút CTA khi đạt giới hạn.
- **P2 — Cách ly Hình ảnh Biến thể & Fallback Minh bạch (Gallery Fallback)**:
  - Khi màu đang chọn không có ảnh riêng, chỉ hiển thị ảnh chung (`!img.variantId`), tuyệt đối không rò rỉ ảnh của màu khác. Nếu không có cả ảnh chung, chỉ fallback về 1 ảnh đại diện kèm badge thông báo `"Ảnh minh họa kiểu dáng"`.
- **P2 — Khả năng Tiếp cận (A11y Focus Containment)**:
  - Triển khai Focus Trap cho phím `Tab` và `Shift+Tab` bên trong dialog, tự động focus nút đóng khi mở và khôi phục focus về element ban đầu khi đóng modal.
- **Bằng chứng Nghiệm thu**:
  - Test Suite: **33/33 tests tự động PASS (100%)** (11 URL tests + 12 filter debounce tests + 10 product detail lookbook hardening tests transpiled thực tế từ component source code).
  - Backend Suite: **107/107 tests PASS (100%)** trên MySQL test profile.
  - Code Quality: `tsc -b && vite build` hoàn tất sạch sẽ trong 824ms (~101.30 kB gzip); 0 lỗi lint mới.
  - Chrome DevTools MCP: 6/6 kịch bản live browser PASS (giữ size M hết hàng khi đổi màu, Escape drawer trước - modal sau, history back không lặp, stepper limit 10, clean console 0 JS error).

## Phase 5C — Shop owner operations (Layout Quản Trị Riêng)
- Cổng quản trị riêng biệt cho Shop Owner/Admin (`/owner` hoặc portal tách khỏi storefront).
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
