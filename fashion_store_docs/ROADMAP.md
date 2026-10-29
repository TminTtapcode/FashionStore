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
- **Phase 5C.3 — Quản lý Tồn kho & Sổ cái Kiểm toán Bất biến (Inventory Audit Trail)** [Hoàn tất — Code Commit `a79ca5b`]:
  - **Flyway Migration V8 & Số dư Mở sổ (Cutover Baseline)**:
    - `V8__create_inventory_ledger.sql`: Bảng `inventory_movements` (append-only ledger) với khóa ngoại `variant_id` (`ON DELETE RESTRICT`), khóa chống trùng lặp `uk_inv_movement_key (movement_key)`.
    - Script migration tự động ghi nhận số dư mở sổ `OPENING_BALANCE` cho toàn bộ 32 biến thể hiện hữu.
  - **Backend Domain & Inventory Authority**:
    - Thực thể `InventoryMovement.java`, enum `InventoryMovementType.java` (7 loại: `OPENING_BALANCE`, `INITIAL_STOCK`, `STOCK_RECEIPT`, `ORDER_DEDUCT`, `CANCEL_RESTORE`, `RETURN_RESTORE`, `MANUAL_ADJUSTMENT`).
    - `InventoryService.java` đóng vai trò là cơ quan thẩm quyền trung tâm duy nhất: kiểm soát thay đổi tồn kho qua khóa bi quan `@Lock(LockModeType.PESSIMISTIC_WRITE)`, kiểm tra bất biến không âm kho và cấm delta = 0.
    - Tích hợp vòng đời đơn hàng: `CheckoutService` (trừ kho khi đặt hàng), `OrderLifecycleService` (hoàn kho khi hủy đơn hoặc nhận hàng hoàn qua `/confirm-return`), `OwnerProductService` (ghi nhận tồn kho ban đầu khi tạo biến thể).
    - API Endpoints tại `/api/v1/owner/inventory/**` được bảo vệ bằng `@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")`.
    - 12 integration tests mới tại `OwnerInventoryControllerIntegrationTest.java`, nâng tổng số test suite backend lên **133/133 tests PASS (100%)**.
  - **Frontend UI & Sổ cái Đối soát Toán học**:
    - Kích hoạt mục "🏷️ Tồn kho & Audit Trail" trên Sidebar của `OwnerPortal.tsx`.
    - `OwnerInventoryView.tsx`: Bảng quản lý 32 SKU, tìm kiếm, lọc danh mục, các tab lọc tồn kho (TẤT CẢ, AN TOÀN, SẮP HẾT < 5, HẾT HÀNG = 0) và thẻ thống kê thời gian thực.
    - `OwnerInventoryLedgerDrawer.tsx`: Ngăn kéo xem lịch sử biến động sổ cái, phân trang, thẻ đối soát toán học tự động ($\text{Current} == \text{Opening} + \sum \Delta$), cảnh báo lệch kho.
    - `OwnerStockReceiptModal.tsx`: Hộp thoại nhập hàng bổ sung kèm dự phóng tồn kho trực quan và mã phiếu chứng từ.
    - `OwnerStockAdjustmentModal.tsx`: Hộp thoại điều chỉnh kiểm kê đột xuất, xác thực âm kho và bắt buộc giải trình lý do.
    - 15 unit tests mới tại `ownerInventory.test.ts`, nâng tổng số frontend tests lên **72/72 tests PASS (100%)**.
    - Frontend build hoàn tất sạch sẽ (`tsc -b && vite build`) trong 734ms; `oxlint` 0 lỗi.
    - Chrome DevTools MCP: 5/5 kịch bản live browser PASS (đăng nhập SHOP_OWNER, xem tổng quan 32 SKU, mở sổ cái kiểm tra số dư mở sổ cân đối lệch 0, nhập kho +15 thành 25, điều chỉnh kiểm kê -2 còn 23, đối soát sổ cái 3 dòng cân đối lệch 0).
  - **Báo cáo Phân tích Dữ liệu Học thuật & Vận hành**:
    - Bản thiết kế `fashion_store_docs/DATA_ANALYTICS_REPORT.md`: Star schema Data Warehouse (`FACT_INVENTORY_MOVEMENTS`, `FACT_INVENTORY_DAILY_SNAPSHOT`, `DIM_PRODUCT_VARIANT` SCD-2), CDC streaming pipeline (Debezium + Kafka + Spark), công thức toán học tính ITR, DSI, Stockout rate, STR, RTO rate, shrinkage rate, và các thuật toán Data Mining (LightGBM/Prophet dự báo nhu cầu, FP-Growth gợi ý phối đồ lookbook, Isolation Forest phát hiện gian lận).
- **Phase 5C.3-UI — Tái thiết Toàn diện Owner Portal theo Hệ thống IVRE Atelier Dark Editorial Luxury** [Hoàn tất]:
  - **Đồng bộ Thẩm mỹ & Hệ thống Token Dark Luxe**:
    - Chấm dứt tình trạng tương phản chắp vá (sidebar tối đối lập bảng/card trắng sáng). Thống nhất bảng màu 10 token chuẩn mực (`#0E0F11` nền sâu, `#191A1D` bề mặt, `#212226` bề mặt nổi, `#333235` viền mảnh, `#D6B27C` vàng champagne hoàng gia).
    - Phân tầng Typography đẳng cấp: Editorial Serif cho tiêu đề chính, Sans-serif cho nội dung và Monospace cho số liệu kinh doanh.
  - **Bố cục Đáp ứng Đa thiết bị (Responsive Layout System)**:
    - Desktop ($\ge 1280\text{px}$): Sidebar cố định 256px, Sticky Topbar 72px, Content mở rộng toàn màn hình (full-width), 4 thẻ KPI đồng chiều cao, 2 panel biểu đồ (Donut tỷ trọng sức khỏe + Nhịp vận hành 7 ngày), bảng dữ liệu toàn chiều rộng.
    - Mobile ($320\text{px} - 767\text{px}$): Ẩn Sidebar, kích hoạt Compact Header và Bottom Navigation Bar cố định (chuẩn `safe-area-inset-bottom`). Toàn bộ bảng biến thể/đơn hàng chuyển hóa thành Card List tiện dụng; modal tự động mở dạng Bottom Sheet.
  - **Độ Chuẩn xác & Trung thực Toán học Dữ liệu**:
    - Thêm endpoint `GET /api/v1/owner/inventory/stats` tính toán chuẩn xác trên toàn bộ 32 SKU: $32 = 22 \text{ (An toàn)} + 8 \text{ (Sắp hết)} + 2 \text{ (Hết hàng)}$, không bị sai lệch bởi phân trang cục bộ.
    - Cải tiến công thức sổ cái đối soát: $\text{ATS} = \text{Số dư mở sổ} + \text{Biến động sau mở sổ}$ (VD: $23 = 10 + 13$), loại bỏ hoàn toàn sự mập mờ giữa delta tích lũy và số dư cutover.
  - **Đồng bộ Toàn diện trên Toàn bộ Phân hệ Owner**:
    - Áp dụng triệt để Dark Luxe cho Đơn hàng (`OwnerOrdersView`, `OwnerOrderDetailModal`, `OwnerActionConfirmModal`) và Quản lý Sản phẩm (`OwnerProductsView`, `OwnerProductDetailModal`, `OwnerProductStatusModal`).
    - Kiểm thử: 134/134 backend tests PASS (100%), 72/72 frontend tests PASS (100%), 0 build & lint errors.
    - Chrome DevTools MCP: Đạt 8/8 kịch bản kiểm chứng thực tế trên đa độ phân giải Desktop ($1440 \times 900$) và Mobile ($390 \times 844$).
- **Phase 5C.4 — Quản lý Thư viện Media & Tích hợp Cloudinary** [Hoàn tất]:
  - **Giao thức Ký số Bảo mật (Signed Upload Protocol)**:
    - Triển khai endpoint `POST /api/v1/owner/media/sign-upload` cấp chữ ký SHA-1 cho Cloudinary mà tuyệt đối không để lộ `api_secret` ra frontend.
    - Cơ chế Safe Mock Fallback tự động nhận biết khi thiếu credentials Cloudinary trong môi trường dev cục bộ, cung cấp cờ `isMock = true` và endpoint giả lập `dev-mock-upload`.
  - **Vòng đời Hình ảnh & Toàn vẹn Dữ liệu (Image Lifecycle & Invariants)**:
    - Bổ sung Flyway migration `V9__enhance_product_images_for_media_library.sql` thêm các trường `file_size`, `width`, `height`, `format`.
    - Bảo toàn ràng buộc khóa ngoại phức hợp `(product_id, variant_id)` ngăn gán ảnh vào biến thể của sản phẩm khác (`INVALID_VARIANT_ASSOCIATION`).
    - Quy tắc 1 ảnh chính duy nhất (`is_primary`): Tự động gán cho ảnh đầu tiên, tự động hạ cấp ảnh cũ khi đặt ảnh mới làm chính, và tự động thăng cấp ảnh kế tiếp khi xóa ảnh chính.
    - Sắp xếp thứ tự ảnh (`reorder`) và xóa ảnh tích hợp gọi lệnh Cloudinary destroy.
  - **Giao diện Media Studio IVRE Atelier (Dark Editorial Luxury)**:
    - Xây dựng component `OwnerMediaView.tsx` tích hợp Dropzone kéo thả ảnh (hỗ trợ JPG, PNG, WEBP, AVIF tối đa 10MB), thanh tiến trình tải ảnh, bộ chọn biến thể/màu sắc trực quan, và thẻ hiển thị trạng thái Signed / Mock.
    - Lưới gallery 3:4 chuẩn thời trang với huy hiệu sao vàng cho ảnh chính, tag biến thể màu, nút đổi biến thể tức thì, phím di chuyển thứ tự và nút xóa kèm xác nhận.
    - Tích hợp trực tiếp vào Sidebar và Mobile Bottom Nav của `OwnerPortal.tsx`, đồng thời bổ sung phím tắt mở thư viện ảnh từ bảng sản phẩm `OwnerProductsView.tsx` và modal chi tiết `OwnerProductDetailModal.tsx`.
  - **Tích hợp Storefront Lookbook**:
    - Đồng bộ hoàn hảo với thuật toán dynamic gallery của `ProductDetailModal.tsx`: ưu tiên ảnh theo biến thể màu được chọn kết hợp ảnh chung (`variantId = null`), và rơi về ảnh đại diện chính khi không có ảnh trùng màu.
  - **Kiểm thử & Nghiệm thu Thực tế**:
    - Backend: 9/9 integration tests mới tại `OwnerMediaControllerIntegrationTest`, nâng tổng bộ kiểm thử backend lên **143/143 tests PASS (100%)**.
    - Frontend: 10/10 tests mới tại `ownerMediaLogic.test.ts`, nâng tổng bộ kiểm thử frontend lên **82/82 tests PASS (100%)**.
    - Chrome DevTools MCP: Đạt kiểm chứng giao diện thực tế trên Desktop ($1440 \times 900$) và Mobile ($390 \times 844$, $320 \times 640$), 0 horizontal overflow.
- **Phase 5D.1 — IVRE Atelier Luxury Editorial Storefront Redesign** [Hoàn tất]:
  - **Tái thiết Toàn diện Storefront Khách hàng theo Bản sắc Luxury Fashion Editorial**:
    - Chuyển hóa giao diện khách hàng từ layout thương mại điện tử đại trà sang phong cách Tạp chí Thời trang Cao cấp (Luxury Fashion Editorial Runway) với 8 phân khu chuẩn mực.
    - Bảo toàn toàn bộ các quy tắc nghiệp vụ bất biến từ Phase 5A đến Phase 5C (Catalog, Active Variants, Giỏ hàng, Cart Merge, Size Guide, Auth Modal, Mini Cart Drawer, URL sync với 350ms search debounce, popstate history).
  - **8 Phân khu Kiến trúc Storefront**:
    1. **StorefrontHeader**: Thanh điều hướng bán trong suốt (glassmorphism) với monogram `Ivre.`, phân tầng desktop nav, huy hiệu giỏ hàng động, cụm tài khoản người dùng, phím tắt `QUẢN TRỊ ↗` cho Shop Owner, và Mobile Menu Drawer cảm ứng.
    2. **StorefrontHero — The Urbanist Couture**: Headline typography serif phân cấp (`The Urbanist` Warm Ivory, `Couture` Champagne Gold italic), trích dẫn tuyên ngôn thương hiệu, cụm CTA kép (*Khám phá bộ sưu tập* & *Thử phối đồ Lookbook*), nút gạt kiểm soát hiệu ứng WebGL (`✦ SHADER: BẬT/TẮT`), chân dung người mẫu thời trang 3:4 và bộ chỉ báo slider tối giản.
    3. **BrandValueStrip**: Dải 4 trụ cột thương hiệu gắn liền thực tế may đo (*Chất liệu tự nhiên*, *Form dáng chuẩn mực*, *Hướng dẫn bảo quản*, *Độc bản biến thể*).
    4. **CategoryShowcase**: Lưới 4 card hình ảnh danh mục lớn tỉ lệ 3:4 chuẩn thời trang kết nối trực tiếp cơ sở dữ liệu (`/api/v1/categories`), tương tác nhấp chuột lọc danh mục mượt mà và cuộn êm đến `#catalog-section`.
    5. **EditorialCampaign — The Silk & Linen Edit**: Khối biên tập câu chuyện chất liệu Lụa Tơ Tằm & Linen, bố cục 2 cột với ảnh chụp lookbook ấm áp và CTA kích hoạt tìm kiếm tức thì.
    6. **Active Catalog & New Arrivals**: Lưới sản phẩm tỉ lệ 3:4 responsive 2 cột trên mobile đến 4-5 cột trên desktop, hiển thị thông tin chất liệu/form dáng, giá phân tầng, thẻ Atelier Drop, và bộ chấm swatch màu tương tác.
    7. **StylingStudioTeaser**: Cổng dẫn trực quan sang Phòng thử đồ Studio ma-nơ-canh 2.5D, mở modal `VirtualStylingStudio`.
    8. **StorefrontFooter**: Chân trang 4 cột chuyên nghiệp với thông tin boutique, concierge studio hỗ trợ size, chính sách đổi trả minh bạch và credit kỹ thuật nền tảng.
  - **Kiểm chứng Toàn diện & Quality Gates**:
    - **Frontend tests**: 82/82 unit & component tests PASS (100%).
    - **Backend tests**: 143/143 unit & integration tests PASS (100%).
    - **Production build**: `tsc -b && vite build` hoàn tất sạch sẽ 0 lỗi.
    - **Chrome DevTools MCP Responsive Matrix**: PASS trên toàn bộ 7 độ phân giải chuẩn (320px, 375px, 390px, 768px, 1024px, 1440px, 1920px), triệt tiêu hoàn toàn horizontal overflow (`scrollWidth <= clientWidth`), không bị che nút hoặc tràn chữ.
- **Phase 5D.1.1 — Storefront Visual Polish & Background Distraction Elimination** [Hoàn tất]:
  - **Header Refinement**: Thu gọn các nút bấm rải rác thành `AccountDropdown` popover bán trong suốt (glassmorphism) gom cụm Avatar Monogram, thông tin phiên đăng nhập, phím tắt `QUẢN TRỊ ↗`, Lịch sử đơn hàng, và Đăng xuất; triệt tiêu tình trạng xuống dòng và co cụm chữ `ATELIER SHOP OW...`.
  - **Giới hạn Không gian WebGL Living Runway**: Đóng khung WebGL Living Runway strictly trong khu vực Hero; áp dụng nền đen Obsidian Black (`bg-[#0A0B0E]`) và Charcoal tĩnh cho toàn bộ các section bên dưới, triệt tiêu sự lấn át thị giác và giúp sản phẩm trở thành trung tâm thu hút.
  - **Category Showcase Đồng nhất**: Thay thế ảnh stock chụp ngoại cảnh bằng bộ 4 ảnh chụp studio may đo cao cấp (studio tailoring photography) với bảng màu trung tính (charcoal, cream, ivory, black, taupe) đồng điệu bản sắc IVRE Atelier.
  - **Cân đối Lưới Catalog 1-2 Sản phẩm**: Căn giữa danh sách sản phẩm khi bộ lọc chỉ trả về 1-2 item (`max-w-4xl mx-auto flex justify-center gap-6 sm:gap-8`), giữ độ rộng card tối ưu (`max-w-[340px] sm:max-w-[380px]`) tránh dồn cục méo mó sang lề trái.
- **Phase 5D.2 — IVRE Immersive Product Detail Experience (Trench Coat Editorial & Sticky Purchase Panel)** [Hoàn tất]:
  - **Bố cục Phân tầng Tạp chí 58% Gallery / 42% Sticky Purchase Panel**:
    - Thiết kế theo ngôn ngữ Daylog / Theory Trench Coat Editorial: Cột trái 58% Gallery Lookbook chụp studio với hiệu ứng gradient ánh sáng sang trọng, bộ đếm ảnh (`01 / 04`), mũi tên chuyển ảnh mượt mà, và hàng thumbnail viền vàng champagne.
    - Cột phải 42% Purchase Panel: Tiêu đề `font-editorial` trang nhã, nhãn `IVRE / THE ATELIER EDIT`, giá phân tầng, swatch màu tròn viền vàng (`w-7 h-7`), và bộ chọn kích cỡ 4 trạng thái (Selected, Available, Out-of-Stock gạch chéo, Not-Offered làm mờ).
  - **Xác minh Công thức Bất biến Giới hạn Giỏ hàng**:
    - Xác nhận và bảo toàn công thức kiểm soát tồn kho:
      $$\text{maxAddableQuantity} = \max(0, \min(10, \text{currentVariant.stockQuantity}) - \text{existingCartQuantity})$$
      Đảm bảo khi kho có 5 chiếc và giỏ đã có 3 chiếc thì khách chỉ được thêm tối đa 2 chiếc, không thể vượt quá giới hạn kho hoặc trần 10 sản phẩm/dòng.
  - **Bộ 5 Khối Thông tin Mở rộng (Editorial Disclosure Accordions)**:
    - `Mô tả & Cảm hứng Thiết kế`: Cảm hứng may đo thủ công và giá trị thiết kế độc bản.
    - `Chất liệu & Cấu trúc Sợi`: Chi tiết thành phần vải và đặc tính sợi dệt tự nhiên.
    - `Form dáng & Thông số Kích cỡ`: Phom dáng chuẩn và liên kết mở nhanh Bảng quy đổi size (`SizeGuideDrawer`).
    - `Hướng dẫn Bảo quản & Giặt là`: Quy chuẩn giặt là cao cấp bảo vệ sợi vải.
    - `Chính sách Giao nhận & Đổi trả`: Quy định COD kiểm hàng tận tay và đổi size miễn phí trong 7 ngày.
  - **Dải Cam kết Dịch vụ Thượng hạng (Daylog Trust Badges)**:
    - 🚚 Giao COD Toàn Quốc (Thanh toán khi nhận hàng).
    - 🔄 Đổi Size 7 Ngày (Hỗ trợ thử & đổi tận tâm).
    - 🛡️ 100% Chính Hãng (Kiểm tra hàng trước khi nhận).
  - **Bộ sưu tập Tương thích "You May Also Like" (Sản phẩm Gợi ý Hoàn thiện Phong cách)**:
    - Lưới 4 card trên desktop và 2 card trên mobile gợi ý các sản phẩm cùng bộ sưu tập / danh mục.
    - Tương tác nhấp chuột kích hoạt `onSelectProduct(slug)` chuyển đổi modal mượt mà và cập nhật URL deep-link tức thì mà không cần tải lại trang.
  - **Trải nghiệm Mobile & Thanh Thao tác Ghim Đáy (Sticky Safe-Area Purchase Bar)**:
    - Trên màn hình di động, thanh thao tác mua hàng được ghim cố định ở đáy màn hình với hiệu ứng kính mờ (`bg-[#0D0E12]/95 backdrop-blur-md`), tự động đệm `safe-area-inset-bottom`, hiển thị tổng tiền VND và nút `THÊM VÀO GIỎ` chạm ngón cái tiện lợi.
  - **Kiểm chứng Toàn diện & Quality Gates**:
    - **Frontend tests**: 83/83 unit & component tests PASS (100%).
    - **Backend tests**: 143/143 unit & integration tests PASS (100%).
    - **Production build**: `tsc -b && vite build` hoàn tất sạch sẽ 0 lỗi.
    - **Chrome DevTools MCP Matrix**: PASS trên Desktop ($1440 \times 900$) và Mobile ($390 \times 844$), chụp và lưu trữ minh chứng màn hình chi tiết.
- **Phase 5D.2.1 — Product Detail Final Acceptance & Reliability Hardening** [Hoàn tất]:
  - **Hợp đồng Lịch sử Modal Đa bước (Multi-Hop In-Modal History Coordination)**:
    - Theo dõi `modalDepth` khi duyệt sản phẩm liên quan trong modal. Nút Đóng (`X`) hoặc phím Escape thực thi `window.history.go(-depth)` cuộn lùi về thẳng Catalog (`/`) trong 1 thao tác. Phím Back/Forward trình duyệt vẫn cho phép lùi từng bước (`C <-> B <-> A <-> Catalog`).
    - Khách vào bằng Deep-link trực tiếp (`/?product=slug`) được đánh dấu `isDeepLinkOrigin = true`, khi đóng modal sử dụng `window.history.replaceState` xóa query `?product` mà không đẩy người dùng văng khỏi trang web.
  - **Hủy Yêu cầu Lỗi thời khi Duyệt Nhanh (Stale Request Cancellation with AbortController)**:
    - Bổ sung `AbortSignal` vào `getProductDetailApi`. Tự động hủy (`abort()`) request in-flight khi người dùng chuyển sản phẩm nhanh, triệt tiêu nguy cơ race condition dữ liệu.
  - **Cam kết Dịch vụ Minh bạch & Trung thực Thực tế Vận hành**:
    - Phân định rõ ràng: Giao hàng thu tiền COD, Đồng kiểm ngoại quan kiện hàng khi nhận (không thử đồ tại chỗ), Hỗ trợ đổi size qua Boutique Concierge trong 7 ngày (sản phẩm nguyên tag, chưa qua sử dụng), và Chế tác 100% IVRE Atelier.
    - Cập nhật 3 huy hiệu: 🚚 `Giao COD Toàn Quốc` (Đồng kiểm khi nhận hàng) | 🔄 `Hỗ Trợ Đổi Size` (Boutique Concierge 7 ngày) | 🛡️ `100% IVRE Atelier` (Chế tác thủ công chuẩn mực).
  - **Triệt tiêu Xung đột Giao diện Mobile**:
    - Tự động ẩn thanh thao tác ghim đáy (`hidden pointer-events-none`) khi mở Bảng quy đổi kích cỡ (`SizeGuideDrawer`), loại bỏ hoàn toàn hiện tượng che khuất nút đóng drawer.
  - **Kiểm chứng Toàn diện & Quality Gates (Final Reliability Gate)**:
    - **Frontend tests**: 89/89 unit & component tests PASS (100%).
    - **Backend tests**: 143/143 unit & integration tests PASS (100%).
    - **Production build**: `tsc -b && vite build` hoàn tất sạch sẽ 0 lỗi.
    - **Chrome DevTools MCP Matrix**: PASS trên Desktop ($1440 \times 900$), Mobile ($390 \times 844$), và True Mobile ($320 \times 568$ qua `emulate viewport`), xác nhận 0 horizontal overflow (`scrollWidth <= clientWidth`), khắc phục lỗi flex centering data-loss trên mobile.
- **Phase 5D.3 — IVRE Atelier Editorial Styling Studio & Outfit Builder** [Hoàn tất]:
  - **Kiến trúc Bảng phối Nghệ thuật (Editorial Collage / Lookbook Moodboard)**:
    - Loại bỏ mô hình ma-nơ-canh cắt ghép giả tạo và các cam kết sai lệch về "AI Virtual Try-On", tôn trọng hình ảnh nhiếp ảnh thực tế của sản phẩm từ cơ sở dữ liệu và Cloudinary CDN.
    - Cấu trúc 5 slot trang phục: `ONE_PIECE`, `UPPER_BODY`, `LOWER_BODY`, `OUTERWEAR`, `ACCESSORIES`.
    - Phân giải slot dựa trên danh mục thực tế của backend (`dam-va-vay`, `ao-nam`, `ao-nu`, `quan-nu`, `quan-nam`) và bảng quy tắc override đặc thù (`ao-blazer-linen-phom-rong-minimalist` $\rightarrow$ `OUTERWEAR`).
  - **Quy tắc Tương thích Nghiệp vụ Thời trang (Compatibility Invariants)**:
    - Hỗ trợ chế độ Đầm liền thân (`ONE_PIECE`) tự động giải phóng Áo rời (`UPPER_BODY`) và Quần rời (`LOWER_BODY`) kèm thông báo rõ ràng cho khách hàng.
    - Chọn trang phục rời tự động dọn dẹp Đầm liền thân; Áo khoác ngoài và Phụ kiện phối ghép linh hoạt với cả hai chế độ.
  - **Trực quan hóa Tùy biến & Tính toán Giá Động Thời gian Thực**:
    - Tùy chỉnh màu sắc (swatches), kích cỡ (sizes), giá bán chính xác theo biến thể và hiển thị tồn kho thực tế (`● Còn hàng`, `▲ Sắp hết`, `✕ Tạm hết hàng`).
    - Tính toán tổng tiền động và số lượng món theo thời gian thực; nút CTA ghim đáy thuận tiện cho thao tác mua sắm.
  - **Quy trình Thêm Trọn Bộ vào Giỏ Hàng & Báo cáo Từng Món (Sequential Add-to-Cart Flow)**:
    - Kiểm định hạn mức trước thực thi (Pre-flight limit check), gom nhóm biến thể trùng lặp, đảm bảo không vượt quá trần 10 sản phẩm/dòng và tồn kho kho khả dụng.
    - Xử lý khách vãng lai bằng cách kích hoạt modal đăng nhập mà không làm mất bộ phối đang chọn (draft outfit state).
    - Thực thi tuần tự có kiểm soát trạng thái và hiển thị Modal Báo cáo Chi tiết kết quả (thành công toàn bộ vs thành công một phần vs lỗi từng món).
  - **Kiểm chứng Toàn diện & Quality Gates**:
    - **Frontend tests**: 104/104 unit & component tests PASS (100%), bổ sung 15 test cases chuyên biệt trong `stylingStudio.test.ts`.
    - **Backend tests**: 143/143 unit & integration tests PASS (100%).
    - **Production build**: `tsc -b && vite build` hoàn tất sạch sẽ 0 lỗi (318ms).
    - **Chrome DevTools MCP Matrix**: PASS trên Desktop ($1440 \times 900$), Mobile ($390 \times 844$), và Ultra-narrow ($320 \times 568$), xác nhận 0 horizontal overflow (`scrollWidth <= clientWidth`).
- **Phase 5C.5 — Đối soát COD & Báo cáo Vận hành Doanh thu** [Kế tiếp].


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
