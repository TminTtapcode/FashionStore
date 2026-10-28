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
- **Phase 5C.0 & 5C.1 — Kiến trúc Quản trị & Vận hành Đơn hàng MVP (Shop Owner Operations MVP)** [Hoàn tất]:
  - **Baseline Audit & Vá lỗi Tồn dư**:
    - Vá triệt để công thức hạn mức giỏ hàng: max(0, min(10, stockQuantity) - existingCartQuantity), bảo vệ bất biến kho hàng khi tồn kho vật lý thấp hơn hạn mức dòng hàng 10.
    - Hoàn thiện bẫy tiêu điểm (Focus Trap Containment) và hoàn trả focus chuẩn A11y cho SizeGuideDrawer.
  - **Kiến trúc Domain & Phân quyền RBAC**:
    - Xác lập kiến trúc Single-store MVP (bảng shops ID 1 IVRE Atelier, products.shop_id = 1) và tính sẵn sàng mở rộng Multi-shop.
    - Ma trận phân quyền RBAC đa tác nhân (CUSTOMER, SHOP_OWNER, ADMIN), bảo vệ Object-level security.
  - **Cổng Quản trị Atelier SPA (/owner)**:
    - Điều phối tuyến /owner siêu nhẹ không cài thêm thư viện router (ADR-012 compliant, Browser History API).
    - Tầng bảo vệ an ninh RBAC Gate: Atelier Brand Loading Skeleton, Màn hình 401 Unauthorized (yêu cầu đăng nhập), Màn hình 403 Forbidden (chặn Customer), và Authorized Owner Shell.
    - Atelier Top Navbar (Badge cửa hàng, user info, nút chuyển nhanh về Storefront, Đăng xuất) & Sidebar (Đơn hàng kích hoạt; Sản phẩm 5C.2, Kho hàng 5C.3, Media 5C.4, Báo cáo 5C.5 hiển thị badge Sắp ra mắt).
    - Bảng điều hành đơn hàng: 9 tab lọc trạng thái (TẤT CẢ, CHỜ XÁC NHẬN, ĐÃ XÁC NHẬN, ĐANG ĐÓNG GÓI, ĐANG GIAO, GIAO THẤT BẠI, ĐÃ GIAO, HOÀN TẤT, ĐÃ HỦY, ĐÃ HOÀN), ô tìm kiếm mã đơn/khách hàng, phân trang.
    - Modal Chi tiết Đơn hàng: Thông tin người nhận, snapshot dòng hàng, chi tiết tài chính, Dòng thời gian Lịch sử trạng thái đầy đủ (order_status_history), và các nút hành động chuyển đổi trạng thái khả dụng theo State Machine.
    - Modal Xác nhận Thao tác: Cảnh báo hệ quả nghiệp vụ (hoàn kho, giải phóng coupon, trách nhiệm vận chuyển), ô nhập ghi chú bắt buộc.
    - Tách biệt an toàn giữa giao hàng thất bại (DELIVERY_FAILED) và nhận hàng hoàn vật lý về kho (RETURNED qua POST /confirm-return).
    - Tự động hoàn tất thanh toán COD (payment_status = PAID) khi đơn sang COMPLETED.
  - **Bằng chứng Nghiệm thu**:
    - Backend Suite: **107/107 tests PASS (100%)**.
    - Frontend Suite: **39/39 tests PASS (100%)** (11 URL + 12 filter debounce + 10 product lookbook + 6 owner portal integration tests).
    - Code Quality: tsc -b && vite build hoàn tất sạch sẽ trong 164ms (~109.65 kB gzip); 0 lỗi lint mới.
    - Chrome DevTools MCP: Live browser verification thành công (xác thực RBAC gate 401, nút điều hướng Storefront <-> Owner, Back/Forward browser history, 0 lỗi console).
- **Phase 5C.2 — Quản lý Sản phẩm & Biến thể (Product & Variant Management)** [Hoàn tất]:
  - **Backend Domain & CRUD**:
    - State Machine vòng đời sản phẩm: DRAFT -> ACTIVE -> HIDDEN -> ARCHIVED với điều kiện tiên quyết chặt chẽ (ACTIVE yêu cầu ít nhất 1 biến thể active; ARCHIVED là trạng thái kết thúc).
    - Chuẩn hóa mã SKU tự động: `{PRODUCT_CODE}-{COLOR_CODE}-{SIZE}`, Unicode NFD diacritics stripping, max length 60, tự động tăng hậu tố giải quyết va chạm `-2`, `-3`.
    - Bảo vệ tính bất biến SKU: Biến thể đã có trong `order_items` tuyệt đối không được phép đổi SKU hoặc xóa cứng (`IMMUTABLE_SKU` / `VARIANT_HAS_ORDERS`).
    - Bảo vệ tính toàn vẹn dữ liệu: Chặn xóa cứng sản phẩm đã có đơn hàng lịch sử (`PRODUCT_HAS_ORDERS`).
    - API Endpoints chuyên dụng tại `/api/v1/owner/products/**`, bảo vệ bằng `@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")`.
    - 14 integration tests mới bổ sung, nâng tổng số backend tests lên **121/121 tests PASS (100%)**.
  - **Frontend UI & Quick Matrix Generator**:
    - Kích hoạt mục "Sản phẩm & Biến thể" trên Sidebar của `OwnerPortal.tsx`.
    - `OwnerProductsView.tsx`: Bộ lọc 5 tab trạng thái (TẤT CẢ, ACTIVE, DRAFT, HIDDEN, ARCHIVED), dropdown danh mục cha-con, tìm kiếm tên/thương hiệu/slug, bảng hiển thị ảnh thumbnail, khoảng giá, tổng tồn kho và số biến thể.
    - `OwnerProductDetailModal.tsx`: Chế độ tạo mới & chỉnh sửa, công cụ Quick Matrix Generator sinh tích Descartes (Size × Màu sắc), bảng biến thể hỗ trợ xóa và sửa inline, cảnh báo thay đổi chưa lưu (unsaved changes guard).
    - `OwnerProductStatusModal.tsx`: Hộp thoại chuyển đổi trạng thái vòng đời sản phẩm, phân tích hệ quả vận hành và ghi chú kiểm toán.
    - 18 frontend unit/integration tests mới bổ sung, nâng tổng số frontend tests lên **57/57 tests PASS (100%)**.
    - Frontend build hoàn tất sạch sẽ (`tsc -b && vite build`) trong 473ms; 0 lint errors mới.
    - Chrome DevTools MCP: 6/6 kịch bản live browser PASS (đăng nhập SHOP_OWNER, xem bảng sản phẩm, tạo sản phẩm mới bằng ma trận biến thể, chuyển DRAFT -> ACTIVE, phản chiếu tức thì trên Storefront, mở modal và thêm vào giỏ hàng).
- **Phase 5C.3 — Quản lý Tồn kho & Nhật ký Nhập/Xuất (Inventory Audit Trail)** [Kế tiếp].
- **Phase 5C.4 — Quản lý Thư viện Media & Tích hợp Cloudinary** [Dự kiến].
- **Phase 5C.5 — Đối soát COD & Báo cáo Vận hành Doanh thu** [Dự kiến].

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
