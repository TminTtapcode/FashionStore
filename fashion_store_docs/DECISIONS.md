# Architecture Decision Records (ADR) index

Mỗi ADR ghi: Context, Decision, Alternatives, Consequences, Status, Date.

## ADR-001 — Modular Monolith
**Status:** Accepted  
**Decision:** Một Spring Boot application, chia module nghiệp vụ; chưa tách microservices.  
**Reason:** Giảm chi phí vận hành và độ phức tạp phân tán; vẫn giữ ranh giới module.

## ADR-002 — MySQL + Flyway
**Status:** Accepted  
**Decision:** MySQL cho dữ liệu giao dịch; Flyway quản lý schema migration.  
**Reason:** Dữ liệu order/payment/inventory có quan hệ và cần transaction. Production không dựa vào `ddl-auto=update`.

## ADR-003 — Customer/Shop Owner/Admin
**Status:** Accepted  
**Decision:** Một identity system và role-based authorization; kiểm tra ownership trên từng resource.  
**Reason:** Tránh tách hệ thống không cần thiết nhưng giữ ranh giới quyền.

## ADR-004 — Auth strategy
**Status:** Accepted  
**Decision:** Sử dụng HttpOnly Cookie để lưu trữ session/token xác thực, kết hợp CSRF token cho các mutating request (POST, PUT, PATCH, DELETE).  
**Reason:** Bảo vệ tuyệt đối trước nguy cơ đánh cắp token qua XSS so với việc lưu trữ token trong localStorage.

## ADR-005 — First payment method
**Status:** Accepted  
**Decision:** Khởi đầu với phương thức COD (Cash on Delivery - Thanh toán khi nhận hàng).  
**Reason:** Phù hợp với giai đoạn MVP, hoàn thiện bộ state machine của đơn hàng và quản lý tồn kho trước khi tích hợp cổng thanh toán trực tuyến.

## ADR-006 — Image storage
**Status:** Accepted  
**Decision:** Dùng managed image/object storage (Cloudinary hoặc S3-compatible); DB chỉ lưu URL, public ID và metadata.

## ADR-007 — Customer Onboarding & Welcome Incentive
**Status:** Accepted  
**Decision:** Bắt buộc đăng nhập để hoàn tất đơn hàng (Guest chỉ duyệt catalog và giỏ hàng tạm). Tự động cấp một mã giảm giá chào mừng (Welcome Coupon) khi tài khoản đăng ký thành công lần đầu.  
**Reason:** Quản lý dữ liệu người dùng và lịch sử đơn hàng chặt chẽ, đồng thời kích thích tỉ lệ chuyển đổi đơn hàng đầu tiên.

## ADR-008 — Frontend Styling & Visual Language
**Status:** Accepted  
**Decision:** Sử dụng Tailwind CSS đồng nhất. Phong cách thẩm mỹ là Minimalist Editorial / Contemporary Fashion, typography sắc nét, badge/nhãn dán tối giản mang dấu ấn riêng (signature), tránh giao diện generic kiểu AI template lòe loẹt.

## ADR-009 — Monorepo Architecture
**Status:** Accepted  
**Decision:** Tổ chức repository theo dạng Monorepo với `backend/` (Spring Boot 3.x), `frontend/` (React + TypeScript + Vite), và `docker-compose.yml` tại thư mục gốc.

## ADR-010 — Dedicated Apparel Catalog Architecture (Reject Generic EAV)
**Status:** Accepted  
**Date:** 2026-10-26  
**Context:**  
Ban đầu, hệ thống cân nhắc hỗ trợ catalog tổng quát cho nhiều ngành hàng (quần áo, đồng hồ, điện tử, phụ kiện) với hệ thống thuộc tính động (EAV hoặc Attribute Engine) hoặc lưu toàn bộ biến thể vào JSON. Tuy nhiên, điều này tạo ra độ phức tạp khổng lồ về mặt truy vấn (nhiều phép JOIN phức tạp, khó đánh index, phân trang/lọc chậm, nguy cơ mất toàn vẹn tồn kho lúc checkout) trong khi cửa hàng thực tế chỉ chuyên kinh doanh thời trang may mặc (quần, áo, đầm, váy, áo khoác, jumpsuit, set đồ).

**Decision:**  
1. Thu hẹp phạm vi MVP 100% vào thời trang may mặc và trang phục; loại bỏ hoàn toàn ngành hàng đồng hồ, điện tử, phụ kiện kim hoàn khỏi MVP.
2. Từ chối xây dựng bộ máy thuộc tính động tổng quát (Dynamic Attribute Engine) hoặc mô hình Entity-Attribute-Value (EAV).
3. Sử dụng mô hình quan hệ kết hợp JSON thực dụng (Pragmatic Relational + JSON):
   - Bảng `product_variants` sở hữu các cột quan hệ cố định cho hai thuộc tính giao dịch cốt lõi: `size`, `color_name`, `color_hex`.
   - Bảng `products` lưu các cột định danh sản phẩm thời trang: `material` (chất liệu vải), `fit_style` (form dáng), `care_instructions` (hướng dẫn giặt ủi).
   - Trường `specifications` dạng JSON trong bảng `products` chỉ dùng để lưu các thông số kỹ thuật mở rộng tùy biến theo nhóm trang phục (ví dụ: độ co giãn, độ dày vải, chiều dài váy/quần, bảng kích thước mẫu ngực/eo/mông của size guide).
   - Bảng `product_images` được ràng buộc chặt chẽ với `product_id` và `variant_id` thông qua composite foreign key, đảm bảo không thể gán ảnh chéo giữa các sản phẩm.

## ADR-011 — Shopping Cart Architecture (Purchase Intent Only & Authoritative Pricing)
**Status:** Accepted  
**Date:** 2026-10-27  
**Context:**  
Khi thiết kế giỏ hàng (Cart), cần chốt nguyên tắc: liệu có trừ hoặc giữ chỗ tồn kho khi khách hàng thêm sản phẩm vào giỏ không? Và giá hiển thị trong giỏ hàng được tính toán và lưu trữ như thế nào?

**Decision:**  
1. **Purchase Intent Only**: Giỏ hàng chỉ lưu ý định mua sắm của khách hàng. Thêm, sửa số lượng hoặc xóa mục trong giỏ **tuyệt đối không trừ kho, giữ chỗ (reserve), hay khóa (lock) số lượng tồn kho** trong database.
2. **Authoritative Pricing**: Bảng `cart_items` không lưu cột `unit_price`. Giá bán và tổng tiền luôn được backend tính toán động dựa trên `product_variants.price` hiện hành tại thời điểm đọc giỏ hàng (`GET /api/v1/cart`). Frontend không có thẩm quyền gửi giá tiền lên server.
3. **Merge & Max Quantity Policy**: Thêm lại biến thể đã có trong giỏ sẽ tự động cộng dồn số lượng. Giới hạn tối đa 10 sản phẩm/dòng hàng (`CHECK (quantity > 0 AND quantity <= 10)`).
4. **Race Condition Protection**: Ràng buộc duy nhất `UNIQUE KEY uk_cart_variant (cart_id, variant_id)` kết hợp với cơ chế bắt lỗi `DataIntegrityViolationException` để thực hiện retry merge an toàn, triệt tiêu nguy cơ sinh trùng dòng hàng khi click nhanh hoặc concurrent requests.
5. **Strict Ownership Isolation**: Mọi thao tác đọc, cập nhật hoặc xóa dòng hàng đều xác thực quyền sở hữu thông qua `principal.getId()` và query kiểm tra `cart.user.id = :userId`.

**Consequences:**  
- *Tích cực*: Ngăn chặn triệt để tình trạng đầu cơ găm hàng ảo (inventory hoarding); giá giỏ hàng luôn cập nhật chính xác theo catalog; dữ liệu an toàn trước race condition.
- *Lưu ý*: Khách hàng cần được cảnh báo tồn kho có thể thay đổi và hết hàng trước khi checkout. Việc trừ kho nguyên tử được dồn toàn bộ vào transaction của Phase 4 (Checkout).

## ADR-012 — Lightweight Single Page Application Architecture (Native Web APIs over Router/Query Libraries)
**Status:** Accepted  
**Date:** 2026-10-28  
**Context:**  
Ban đầu, `PROJECT_CONTEXT.md` dự kiến sử dụng React Router, TanStack Query, React Hook Form và Zod. Tuy nhiên, giao diện storefront mang phong cách Minimalist Editorial Lookbook có tích hợp Living Runway Shader (WebGL Canvas 3D). Việc cài đặt router và thư viện quản lý query bên thứ ba mang lại các rủi ro và đánh đổi:
1. Gia tăng kích thước bundle từ 15KB - 40KB gzipped (hiện tại bundle production chỉ ~100KB gzipped).
2. Hiện tượng unmount/remount của WebGL Canvas: Về bản chất kỹ thuật, việc `<canvas>` bị remount hay không phụ thuộc vào vị trí của nó trong cây component (component tree hierarchy), chứ không phải do bản thân thư viện routing. Tuy nhiên, trong các thiết kế route phân tách thông thường (ví dụ: chuyển từ `/` sang `/products/:slug`), nếu canvas không được neo vào một persistent layout cấp cao nhất mà gắn liền với trang, WebGL context sẽ bị hủy và phải biên dịch lại shaders, textures, gây gián đoạn animation loop và sụt giảm khung hình.
3. Việc kết hợp Modal Lookbook với URL Search Parameter (`?product=<slug>`) cho phép giữ nguyên 100% component tree, bảo toàn WebGL Canvas sống liên tục, giữ nguyên vị trí cuộn trang danh mục, đồng thời vẫn đáp ứng trọn vẹn yêu cầu deep-linking và Web History API (Back/Forward `popstate`).
4. Giảm thiểu rủi ro xung đột tương thích phụ thuộc giữa các thư viện bên thứ ba với React 19 stable.

**Decision:**  
1. **Lightweight SPA Baseline:** Giữ nguyên kiến trúc SPA nhẹ dựa trên React 19 native hooks (`useState`, `useRef`, `useContext`), API client tách biệt (`fetch` chuẩn với credentials `include`), và React Context (`AuthContext`, `CartContext`).
2. **Bi-directional URL Sync via Web APIs:** Sử dụng `URLSearchParams` kết hợp `window.history.pushState` (cho các thay đổi bộ lọc, phân trang, chip, mở modal `?product=<slug>`) và `window.history.replaceState` (cho debounce search và chuẩn hóa URL).
3. **Defense-in-Depth Coordination & Version Guard:** Kiểm soát hủy debounce timer, phòng chống stale closure qua `filtersRef`, và ngăn chặn timer rò rỉ bằng bộ đếm thế hệ `searchVersionRef` (kiểm tra thế hệ logic trước khi commit state).
4. **Network Microtask Abort Guard:** Trong các Promise chain gọi API (`getProductsApi`), luôn kiểm tra điều kiện `if (controller.signal.aborted) return;` bên trong callback `.then()` để loại bỏ hoàn toàn các cuộc đua vi tác vụ (microtask race) khi phản hồi mạng đến đúng lúc request bị hủy.

**Consequences:**  
- *Tích cực:* Giữ nguyên 100% hiệu năng mượt mà của WebGL Living Shader; bundle production cực kỳ gọn nhẹ (<101 kB gzip); kiểm soát chi tiết từng lời gọi history mà không phụ thuộc package ngoài.
- *Lưu ý:* Phải tự quản lý sự kiện `popstate` và dọn dẹp timer debounce khi điều hướng Back/Forward (đã được bao phủ và chứng minh qua bộ 32 tests tự động và Chrome DevTools MCP).

## ADR-013 — Lookbook Detail Experience, Ghost Variant Prevention & Modal Coordination Hardening
**Status:** Accepted  
**Date:** 2026-10-28  
**Context:**  
Trong ngành thời trang may mặc, sản phẩm có nhiều biến thể theo 2 chiều (Màu sắc và Kích cỡ). Một vấn đề thực tế rất phổ biến là tính bất đối xứng giữa các màu: một mẫu đầm màu Trắng có đủ size S, M, L; nhưng màu Xanh Rêu chỉ sản xuất size M, L; hoặc màu Đen chỉ còn size L. Nếu UI cho phép người dùng giữ nguyên size S khi chuyển từ màu Trắng sang màu Xanh Rêu, hệ thống sẽ rơi vào trạng thái "Biến thể ma" (Ghost Variant) — một tổ hợp (Xanh Rêu, S) không tồn tại trong database, dẫn đến hiển thị sai giá, sai tồn kho, hoặc lỗi 400 Bad Request khi bấm thêm vào giỏ.
Tuy nhiên, trong quá trình hardening Phase 5B.1, các tình huống biên phức tạp hơn đã được nhận diện:
1. **Bảo toàn Ý định Kích cỡ (Size Intent Preservation vs Ghost Variant):** Nếu khách hàng chọn size M màu Trắng và chuyển sang màu Xanh Rêu (màu này có sản xuất size M nhưng tạm thời hết hàng tồn kho = 0), việc tự động nhảy sang size S là vi phạm ý định người dùng (khách mặc size M bị âm thầm đổi sang size S dẫn tới mua nhầm kích cỡ).
2. **Xung đột phím Escape giữa các tầng giao diện (Layered Escape Handling):** Khi mở Bảng quy đổi kích cỡ (`SizeGuideDrawer`) đè lên `ProductDetailModal`, phím Escape nhấn một lần có nguy cơ đóng cả hai tầng giao diện nếu listener bắt chung trên window không có cơ chế chặn tầng.
3. **Vòng lặp History khi đóng Modal (Modal History Coordination):** Nếu mở modal từ catalog bằng `pushState`, việc đóng modal bằng `pushState` tạo ra lịch sử `[Catalog, Modal, Catalog]`, khiến nút Back của trình duyệt mở lại modal vừa đóng.
4. **Bảo vệ Bất biến Số lượng Giỏ hàng (ADR-011 Invariant):** Database giới hạn `CHECK (quantity > 0 AND quantity <= 10)` cho mỗi dòng hàng. Nếu giỏ đã có sẵn 8 sản phẩm của variant này, modal không được cho phép chọn quá 2 sản phẩm.
5. **Cách ly Hình ảnh Biến thể (Gallery Isolation & Honest Fallback):** Khi màu đang chọn không có ảnh riêng, tuyệt đối không hiển thị tràn ảnh của màu sắc khác gây nhầm lẫn thị giác cho khách hàng.

**Decision:**  
1. **Lookbook Modal Presentation & Deep-Linking:** Chi tiết sản phẩm hiển thị dạng Lookbook Modal kết hợp URL search param `?product=<slug>`, đồng bộ 2 chiều với history và hỗ trợ phím `Escape`.
2. **Size Intent Preservation vs Ghost Variant Auto-resolution:**
   - Khi đổi màu, nếu kích cỡ hiện tại **được sản xuất** ở màu mới (dù `stock_quantity === 0`), **bảo toàn kích cỡ hiện tại**, hiển thị trạng thái Hết hàng và vô hiệu hóa nút Mua.
   - Chỉ kích hoạt cơ chế **Auto-resolve** sang size đầu tiên còn hàng khi kích cỡ hiện tại là **Biến thể ma thực sự** (kích cỡ đó không hề được sản xuất cho màu mới).
   - Biến thể không hoạt động (`status !== 'ACTIVE'`) bị loại trừ hoàn toàn khỏi danh sách biến thể khả dụng và không bao giờ được auto-resolve tới.
3. **Dual-Layer Escape Handling (Topmost Consumption):**
   - Tầng giao diện trên cùng (`SizeGuideDrawer`) tiêu thụ sự kiện Escape trước bằng `e.stopImmediatePropagation()` và `e.stopPropagation()`.
   - `ProductDetailModal` sử dụng `isSizeGuideOpenRef` làm chốt chặn bảo vệ (defense-in-depth); nếu drawer đang mở, modal lập tức bỏ qua sự kiện Escape.
4. **Modal History Coordination Contract:**
   - Mở modal từ trong ứng dụng (In-app navigation): Ghi nhận `{ isProductModalPushed: true, product: slug }` vào `history.state`. Khi đóng modal, gọi `window.history.back()` để pop state sạch sẽ, loại bỏ triệt để vòng lặp lịch sử.
   - Mở modal qua Deep-link (`/?product=slug`): Không có state in-app trước đó (`isProductModalPushed: false`). Khi đóng modal, gọi `window.history.replaceState` gỡ bỏ param `product`, bảo đảm không làm người dùng bị văng ra khỏi website.
5. **Cart Quantity Invariant Enforcement:**
   - Modal truy vấn `useCart()` để lấy số lượng đã có của biến thể: `maxAddableQuantity = Math.min(Math.max(0, 10 - existingCartQuantity), variant.stockQuantity)`.
   - Tính toán `effectiveQuantity` theo thời gian thực trong render, vô hiệu hóa nút tăng số lượng và nút Thêm vào giỏ khi `maxAddableQuantity <= 0`.
6. **Gallery Visual Isolation & Honest Fallback Indicator:**
   - Khi chọn màu, chỉ gom ảnh của biến thể màu đó (`img.variantId === variant.id`) và ảnh chung (`!img.variantId`).
   - Nếu không có ảnh màu lẫn ảnh chung, chỉ fallback về 1 ảnh đại diện duy nhất của sản phẩm kèm badge thông báo minh bạch: `"Ảnh minh họa kiểu dáng (Chưa có ảnh riêng cho màu [Tên màu])"`.
7. **Modal Focus Trap & Accessibility (A11y):**
   - Modal áp dụng `role="dialog"`, `aria-modal="true"`.
   - Bắt phím `Tab` và `Shift+Tab` để giữ focus tuần hoàn bên trong modal, tự động focus vào nút đóng khi mở và khôi phục focus về element kích hoạt ban đầu khi đóng.

**Consequences:**  
- *Tích cực:* Loại bỏ hoàn toàn lỗi chọn biến thể không tồn tại, tôn trọng ý định kích cỡ của người mua thời trang, triệt tiêu 100% bug lặp history và xung đột escape 2 tầng; dữ liệu giỏ hàng luôn tuân thủ nghiêm ngặt ràng buộc cơ sở dữ liệu.
- *Lưu ý:* Cần duy trì bộ test tích hợp Node VM và browser verification cho mọi thay đổi liên quan đến history và dialog layers.

