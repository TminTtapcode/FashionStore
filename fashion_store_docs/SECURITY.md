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
