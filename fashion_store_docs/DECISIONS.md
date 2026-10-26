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
