# PROJECT_CONTEXT.md

## 1. Sứ mệnh
Xây dựng website thương mại điện tử bán quần áo cho một cửa hàng, có thể triển khai dùng thật. Đồng thời đây là dự án học tập: người phát triển cần hiểu yêu cầu, thiết kế dữ liệu, business logic, kiến trúc, bảo mật, kiểm thử và vận hành, không chỉ chấp nhận code do AI sinh ra.

## 2. Phạm vi phiên bản đầu
- Một cửa hàng (single-store), nhưng dữ liệu sản phẩm/đơn hàng phải có ranh giới shop rõ ràng để không khóa đường mở rộng.
- Giao diện storefront responsive cho desktop, tablet và mobile.
- Guest: duyệt sản phẩm, tìm kiếm, lọc, xem chi tiết.
- Customer: đăng ký/đăng nhập, hồ sơ, địa chỉ, giỏ hàng, checkout, lịch sử/chi tiết đơn hàng, hủy theo điều kiện, đánh giá sản phẩm đã mua.
- Shop Owner: dashboard, CRUD sản phẩm và biến thể, quản lý ảnh, tồn kho, đơn hàng, mã giảm giá, báo cáo cơ bản.
- Admin: quản lý tài khoản/role, khóa/mở khóa tài khoản, xem audit log và cấu hình vận hành cần thiết.
- Quản lý trạng thái đơn hàng và thanh toán nhất quán.
- Có migration DB, test tự động, logging, health check, backup/restore và hướng dẫn deploy.

## 3. Ngoài phạm vi MVP
- Marketplace nhiều người bán hoàn chỉnh.
- Microservices, Kubernetes, service mesh, event streaming.
- Recommendation/AI personalization.
- Loyalty points, affiliate, livestream, warehouse nhiều địa điểm.
- Redis, message broker, search engine riêng khi chưa chứng minh được nhu cầu.
- Tích hợp nhiều cổng thanh toán ngay từ đầu.

## 4. Stack baseline
- Java 21 LTS.
- Spring Boot 3.x tương thích với Java 21; chọn một phiên bản ổn định còn được hỗ trợ tại thời điểm bắt đầu và khóa version rõ ràng.
- Maven Wrapper.
- Spring Web, Spring Validation, Spring Data JPA, Spring Security.
- MySQL 8.x.
- Flyway cho database migration; không dùng `ddl-auto=update` làm cơ chế migration production.
- React + TypeScript + Vite.
- React Router, TanStack Query, React Hook Form + Zod.
- CSS Modules hoặc Tailwind CSS; chọn một hướng sau khi thử nghiệm ngắn, không trộn nhiều hệ thống styling tùy tiện.
- JUnit 5, Mockito; Testcontainers cho test tích hợp DB khi môi trường hỗ trợ.
- Docker Compose cho local development.
- Cloudinary hoặc object storage tương đương cho ảnh.
- GitHub Actions hoặc CI tương đương.
- OpenAPI/Swagger cho API documentation.

## 5. Vai trò
- `GUEST`: chưa đăng nhập; quyền đọc catalog công khai.
- `CUSTOMER`: hành động mua sắm và chỉ truy cập dữ liệu cá nhân của mình.
- `SHOP_OWNER`: quản lý dữ liệu thuộc shop được gán.
- `ADMIN`: quản trị nền tảng, tài khoản và quyền hệ thống.
Một user có thể có nhiều role nếu nghiệp vụ cần. Không mặc định rằng `SHOP_OWNER` được phép cấp role `ADMIN`. Không cho client tự gửi role để tự nâng quyền.

## 6. Nguyên tắc kỹ thuật
- Modular Monolith: một backend deployable, module theo nghiệp vụ.
- Controller mỏng; business rule nằm ở service/use-case.
- DTO request/response riêng; không trả JPA entity trực tiếp.
- Transaction được đặt quanh use-case ghi dữ liệu cần tính nhất quán.
- Tiền dùng `DECIMAL` trong DB và `BigDecimal` trong Java; không dùng float/double.
- Thời gian lưu theo UTC (hoặc Instant); hiển thị theo múi giờ người dùng/cấu hình.
- Pagination, sorting và filter có giới hạn.
- API validate input ở server.
- Secrets không commit vào Git.
- Mọi quyết định kiến trúc đáng kể ghi trong `docs/decisions/` dưới dạng ADR.
- Không thêm abstraction/framework nếu chưa giải quyết vấn đề cụ thể.

## 7. Quy tắc nghiệp vụ nền tảng
- SKU/variant là đơn vị bán và trừ tồn kho; sản phẩm cha chỉ là thông tin hiển thị.
- Giá trong order item là snapshot tại thời điểm đặt hàng.
- Địa chỉ giao hàng là snapshot trong order để thay đổi hồ sơ không sửa đơn cũ.
- Tổng tiền được tính lại ở backend; không tin giá/tổng tiền từ frontend.
- Áp dụng coupon và phí vận chuyển ở backend.
- Cập nhật tồn kho phải an toàn trước hai checkout đồng thời.
- Webhook thanh toán phải xác minh chữ ký, chống xử lý lặp và không tin redirect của trình duyệt là bằng chứng thanh toán.
- Mọi thao tác chuyển trạng thái order phải tuân theo state transition hợp lệ.
- Customer chỉ xem/sửa/hủy đơn thuộc mình; shop owner chỉ quản lý đơn thuộc shop.
- Không xóa cứng dữ liệu nghiệp vụ đã phát sinh giao dịch nếu cần lưu lịch sử/audit.

## 8. Hướng dẫn cho agent
Trước mỗi feature:
1. Khảo sát code hiện có và báo cáo file/flow liên quan.
2. Nêu yêu cầu, assumptions, edge cases, ảnh hưởng DB/API/UI.
3. Đề xuất phương án tối thiểu phù hợp; nêu trade-off.
4. Chờ người dùng duyệt nếu có quyết định nghiệp vụ hoặc thay đổi schema/API lớn.
5. Triển khai theo lát dọc backend + frontend + tests.
6. Chạy build/lint/tests phù hợp; không tuyên bố pass nếu chưa chạy.
7. Cập nhật docs và ghi rõ file đã thay đổi, quyết định, test, rủi ro còn lại.

Không giả định repository đang trống. Không xóa code hoặc đổi dependency lớn khi chưa giải thích tác động.
