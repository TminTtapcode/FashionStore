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
Ban đầu, `PROJECT_CONTEXT.md` dự kiến sử dụng React Router, TanStack Query, React Hook Form và Zod. Tuy nhiên, giao diện storefront mang phong cách Minimalist Editorial Lookbook có tích hợp Living Runway Shader (WebGL Canvas 3D). Việc cài đặt router và thư viện quản lý query bên thứ ba mang lại các rủi ro:
1. Gia tăng kích thước bundle từ 15KB - 40KB gzipped (hiện tại bundle production chỉ ~99KB gzipped).
2. `<RouterProvider>` remount lại DOM tree khi chuyển route, dễ gây gián đoạn WebGL animation loop, chớp nháy màn hình (flicker) và rò rỉ bộ nhớ GPU context.
3. Độ phức tạp phụ thuộc vào chu kỳ phát hành của thư viện bên thứ ba với React 19 stable.

**Decision:**  
1. **Lightweight SPA Baseline:** Giữ nguyên kiến trúc SPA nhẹ dựa trên React 19 native hooks (`useState`, `useRef`, `useContext`), API client tách biệt (`fetch` chuẩn với credentials `include`), và React Context (`AuthContext`, `CartContext`).
2. **Bi-directional URL Sync via Web APIs:** Sử dụng `URLSearchParams` kết hợp `window.history.pushState` (cho các thay đổi bộ lọc, phân trang, chip) và `window.history.replaceState` (cho debounce search và chuẩn hóa URL).
3. **Defense-in-Depth Coordination & Version Guard:** Kiểm soát hủy debounce timer, phòng chống stale closure qua `filtersRef`, và ngăn chặn timer rò rỉ bằng bộ đếm thế hệ `searchVersionRef`.

**Consequences:**  
- *Tích cực:* Giữ nguyên 100% hiệu năng mượt mà của WebGL Living Shader; bundle production cực kỳ gọn nhẹ (<100 kB gzip); kiểm soát chi tiết từng lời gọi history.
- *Lưu ý:* Phải tự quản lý sự kiện `popstate` và dọn dẹp timer debounce khi điều hướng Back/Forward (đã được bao phủ và chứng minh qua bộ 23 tests tự động và Chrome DevTools MCP).

