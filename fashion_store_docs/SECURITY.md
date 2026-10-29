# Security Baseline

## 1. Authentication & authorization

- Password hash bằng thuật toán phù hợp như BCrypt/Argon2 qua thư viện tin cậy; không mã hóa reversible, không tự thiết kế crypto.
- Đăng nhập/đăng ký/forgot password có rate limiting và response không tiết lộ email có tồn tại ở các flow nhạy cảm.
- Quyền kiểm tra ở backend cho từng endpoint và từng tài nguyên.
- Role-based access không thay thế resource ownership check.
- Customer chỉ đọc order/profile/address của mình.
- Shop owner chỉ tác động dữ liệu shop được gán trong DB; không tin `shopId` do client gửi.
- Admin role chỉ được cấp bằng flow quản trị bảo vệ; không cho user tự sửa role.
- Bảo vệ CSRF nếu dùng cookie auth; CORS không phải biện pháp chống CSRF.

### Ma trận Phân quyền Vai trò (Role-Based Access Control Matrix - Phase 5C)

| Thao tác / Tài nguyên                                                    |   Guest (Vãng lai)    | Customer (Khách mua)  | Shop Owner (Chủ shop) | Admin (Quản trị viên) |
| :----------------------------------------------------------------------- | :-------------------: | :-------------------: | :-------------------: | :-------------------: |
| Duyệt Catalog, xem Lookbook, Lọc sản phẩm                                |       Cho phép        |       Cho phép        |       Cho phép        |       Cho phép        |
| Thêm vào Giỏ hàng, sửa Cart Items                                        | Chặn (Yêu cầu login)  |   Cho phép (Sở hữu)   |       Cho phép        |       Cho phép        |
| Đặt hàng COD (Checkout)                                                  |         Chặn          |       Cho phép        |       Cho phép        |       Cho phép        |
| Xem lịch sử đơn hàng của mình (`/api/v1/orders/my-orders`)               |      Chặn (401)       |   Cho phép (Sở hữu)   |   Cho phép (Sở hữu)   |   Cho phép (Sở hữu)   |
| Hủy đơn hàng ở trạng thái `PENDING`                                      |         Chặn          | Cho phép (Chính chủ)  |       Cho phép        |       Cho phép        |
| Truy cập Cổng Quản trị (`/owner`)                                        |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Xem danh sách đơn toàn shop (`/api/v1/owner/orders`)                     |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Chuyển trạng thái đơn (`PENDING -> CONFIRMED -> PROCESSING...`)          |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Xác nhận hàng hoàn vật lý về kho (`POST /confirm-return`)                |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Quản lý Catalog & Biến thể (`/api/v1/owner/products/**`)                 |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Khởi tạo Sản phẩm mới (`POST /api/v1/owner/products`)                    |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Đổi trạng thái Sản phẩm (`PATCH /status`)                                |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Thêm/Sửa/Xóa Biến thể (`/variants/**`)                                   |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Xóa cứng Sản phẩm/Biến thể đã có đơn hàng                                |     Bị cấm (400)      |     Bị cấm (400)      |     Bị cấm (400)      |     Bị cấm (400)      |
| Xem Tổng quan Tồn kho (`GET /api/v1/owner/inventory`)                    |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Xem Sổ cái Biến thể (`GET /api/v1/owner/inventory/variants/{id}/ledger`) |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Đối soát Toán học Sổ cái (`GET /variants/{id}/reconciliation`)           |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Nhập kho Hàng hóa (`POST /api/v1/owner/inventory/receipt`)               |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Điều chỉnh Kiểm kê Thủ công (`POST /api/v1/owner/inventory/adjust`)      |      Chặn (401)       | Chặn (403 Forbidden)  |       Cho phép        |       Cho phép        |
| Sửa / Xóa Bản ghi Sổ cái (`inventory_movements`)                         | Bị cấm (Không hỗ trợ) | Bị cấm (Không hỗ trợ) | Bị cấm (Không hỗ trợ) | Bị cấm (Không hỗ trợ) |

### Phân định Rạch ròi giữa Role-level và Object-level Authorization:

- **Role-level Security**: Sử dụng Spring Security `@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")` ở cấp controller/method để chặn toàn bộ user không có thẩm quyền quản trị.
- **Object-level Security (Resource Ownership)**:
  - Khách hàng gọi `GET /api/v1/orders/{orderNumber}`: Backend bắt buộc kiểm tra `order.getUserId().equals(principal.getId())`. Nếu không khớp, trả về 404/403 để ngăn chặn lỗi IDOR (Insecure Direct Object Reference).
  - Chủ shop gọi `/api/v1/owner/orders/**`, `/api/v1/owner/products/**`, `/api/v1/owner/inventory/**`: Backend xác thực tài nguyên thuộc quyền quản lý của shop do owner phụ trách (`shopId = 1`).

### Bảo Mật Sổ Cái Kiểm Toán & Chống Gian Lận Tồn Kho (Phase 5C.3 Inventory Security)

1. **Append-Only Immutability (Bất biến Tuyệt đối)**:
   - Cơ sở dữ liệu và Spring Boot backend tuyệt đối không có endpoint `PUT`, `PATCH`, `DELETE` trên bảng `inventory_movements`.
   - Khóa ngoại `fk_inv_movement_variant` áp dụng `ON DELETE RESTRICT`. Biến thể đã có bản ghi sổ cái kiểm toán không thể bị xóa khỏi hệ thống.
2. **Actor Traceability (Lưu vết Tác nhân Đích danh)**:
   - Mọi bản ghi `inventory_movements` đều gắn với `created_by` (khóa ngoại trỏ đến `users.id` của người đăng nhập thực hiện thao tác).
   - Với giao dịch tự động của hệ thống (Checkout, Cancel, Confirm Return), hệ thống lưu vết ID của User kích hoạt sự kiện đó.
3. **Idempotency Protection (Phòng chống Ghi trùng Lặp)**:
   - Mỗi bản ghi có `movement_key` duy nhất (`UNIQUE KEY uk_inv_movement_key`).
   - Các giao dịch vòng đời đơn hàng sinh khóa xác định: `ORDER-{orderNumber}-VAR-{variantId}`, `CANCEL-{orderNumber}-VAR-{variantId}`, `RETURN-{orderNumber}-VAR-{variantId}`.
   - Khi mạng bị chập chờn hoặc client gửi lặp request, câu lệnh `INSERT` thứ hai sẽ bị chặn ngay bởi ràng buộc Unique Index, ngăn chặn triệt để tình trạng trừ kho hoặc hoàn kho 2 lần.
4. **Input Sanitization & Giá trị Tồn Hợp lệ**:
   - Nghiêm cấm hoàn toàn hành vi điều chỉnh với $\Delta = 0$ (`ZERO_DELTA_NOT_ALLOWED`).
   - Bắt buộc kiểm tra điều kiện tồn kho sau điều chỉnh `stock_after = stock_before + delta >= 0`. Nếu số lượng xuất kho lớn hơn số tồn hiện tại, backend ném ngoại lệ `INSUFFICIENT_STOCK` (HTTP 400).
   - Thao tác điều chỉnh thủ công bắt buộc phải có nội dung giải trình (`reason` không được để trống, $\ge 5$ ký tự).
5. **Chính sách Không Tiết lộ Bí Mật & Mật khẩu trong Tài liệu & Logs**:
   - Tuyệt đối không lưu mật khẩu, JWT token, bcrypt hashes hay bearer tokens trong bất kỳ tài liệu kiến trúc, sơ đồ sequence hay commit log. Mọi ví dụ chỉ dùng định danh giả định an toàn: `<OWNER_EMAIL>`, `<SECURE_PASSWORD>`.

### Phòng vệ Mass-Assignment & Khai thác Giá (Over-Posting Defense):

- Mọi endpoint cập nhật sản phẩm/biến thể đều sử dụng các Java Records DTO chuyên dụng với Bean Validation (`@NotNull`, `@Size`, `@DecimalMin`).
- Tuyệt đối không nhận trực tiếp JPA Entity từ Request Body. Các trường nội bộ như `id`, `shop_id`, `created_at`, `updated_at` hoàn toàn do Server kiểm soát.
- Giá bán bắt buộc $\ge 1.000₫$, giá niêm yết $\ge$ giá bán, tồn kho ban đầu $\ge 0$. Mọi giá trị sai lệch đều bị từ chối ngay tại tầng validation trước khi chạm tới tầng cơ sở dữ liệu.

## 2. Input & browser security

- Bean Validation, parameterized queries/JPA, output encoding và policy CSP phù hợp.
- Không render HTML do user nhập trực tiếp nếu chưa sanitize.
- Giới hạn request body, file upload size/type và số lần gọi endpoint.
- Không tin MIME type từ client; xác minh nội dung file ở mức phù hợp.
- CORS production chỉ cho origin cần thiết.
- HTTPS bắt buộc cho credential/session/payment.

## 3. Secrets & privacy

- `.env` local không commit; cung cấp `.env.example` không chứa secret.
- Secret production dùng secret manager/environment do nền tảng quản lý.
- Không log password, access/refresh token, session cookie, private payment data hoặc payload webhook chứa secret.
- Thu thập tối thiểu dữ liệu cá nhân; có chính sách lưu giữ/xóa theo nhu cầu kinh doanh và luật áp dụng.
- Không ghi toàn bộ request body vào log một cách mặc định.

## 4. Payment security

- Verify chữ ký callback/webhook theo tài liệu chính thức của provider.
- Kiểm tra order reference, amount, currency, merchant account, trạng thái và tính hợp lệ của transition.
- Chống replay/duplicate event bằng idempotency/event record.
- Không tin query parameter từ trang redirect.
- Không lưu thông tin thẻ thanh toán nếu không thuộc phạm vi và chứng nhận phù hợp.

## 5. Operational security

- Dependency scanning và cập nhật bản vá.
- Tách dev/test/prod credentials và database.
- DB không mở public internet nếu có thể tránh.
- Least privilege cho DB user.
- Audit log cho hành động nhạy cảm: thay role, khóa user, thay đổi trạng thái đơn thủ công, điều chỉnh tồn kho.
- Có backup, kiểm tra restore và quy trình xử lý sự cố.
- Error page không để lộ framework version, stack trace hoặc cấu hình nội bộ.

## 6. Checklist trước public launch

- [ ] HTTPS và domain cấu hình đúng.
- [ ] Admin mặc định không dùng password yếu/seed credential công khai.
- [ ] Authorization test cho user khác nhau và shop khác nhau.
- [ ] Secrets không xuất hiện trong Git/history/log.
- [ ] Upload kiểm soát type/size.
- [ ] Rate limiting cho login/forgot password.
- [ ] Payment webhook được xác minh.
- [ ] Backup restore đã diễn tập.
- [ ] Privacy/return/shipping/contact policies đã được chủ shop duyệt.
