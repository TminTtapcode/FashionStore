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

**Consequences:**  
- *Tích cực*: Schema cực kỳ rõ ràng, dễ hiểu, trực quan; tốc độ truy vấn lọc theo size/màu cực nhanh với B-Tree index; kiểm tra tồn kho nguyên tử chính xác; UI chọn size và màu swatch được thiết kế mượt mà chuẩn lookbook thời trang.
- *Hạn chế*: Nếu sau này shop muốn mở rộng sang các ngành hàng hoàn toàn khác ngoài may mặc (như đồng hồ, thiết bị số), sẽ cần thiết kế thêm bảng hoặc migration mới thay vì cấu hình động ngay lập tức. Tuy nhiên, đây là sự đánh đổi hoàn toàn hợp lý và có chủ đích để hệ thống nhanh chóng hoàn thiện đưa vào kinh doanh thật.

