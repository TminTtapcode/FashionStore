# API Conventions

## 1. Base path
`/api/v1`

Ví dụ:
- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `POST /api/v1/checkout`
- `GET /api/v1/me/orders`
- `GET /api/v1/owner/products`
- `PATCH /api/v1/owner/orders/{orderNumber}/status`
- `POST /api/v1/owner/orders/{orderNumber}/confirm-return`
- `GET /api/v1/admin/users`

## 2. Quy tắc
- Dùng danh từ và HTTP method đúng nghĩa; không dùng endpoint tùy tiện kiểu `/doUpdate`.
- Dùng DTO request/response, không trả JPA entity.
- Validate server-side; giới hạn page size.
- Dùng `PATCH` cho cập nhật một phần, `PUT` khi thay toàn bộ resource theo contract.
- Dùng HTTP status có nghĩa: 200, 201, 204, 400, 401, 403, 404, 409, 422 nếu policy dự án dùng, 429, 500.
- Lỗi có schema thống nhất, ví dụ `timestamp`, `status`, `code`, `message`, `path`, `fieldErrors`, `traceId`. Không trả stack trace/SQL cho client.
- Dùng OpenAPI để ghi rõ request, response, error và quyền truy cập.
- Phân trang có metadata rõ ràng; mặc định sort ổn định.
- Search/filter phải whitelist trường sort để tránh query tùy tiện.
- Các endpoint tạo thanh toán/checkout cần idempotency strategy phù hợp.
- Không nhận `userId`, `shopId`, `role`, `price`, `total` từ client làm nguồn sự thật nếu các giá trị đó phải được xác định từ principal/database.

## 3. Response envelope
Chọn một convention và dùng nhất quán. Đề xuất:
```json
{
  "data": {},
  "meta": {},
  "error": null
}
```
Không bắt buộc envelope cho mọi endpoint nếu framework/client convention được chốt khác; quan trọng là nhất quán. Error response có thể dùng schema riêng theo RFC 9457 Problem Details nếu muốn tiêu chuẩn hóa.

## 4. Authentication
Chốt chiến lược trước khi code:
- Nếu frontend/backend cùng site và có thể dùng cookie session hoặc cookie HttpOnly an toàn, cân nhắc cookie-based auth.
- Nếu chọn JWT: access token ngắn hạn, refresh token rotation/revocation được thiết kế rõ; tránh lưu token dài hạn trong localStorage nếu có lựa chọn an toàn hơn. Cookie HttpOnly cần CSRF defense phù hợp.
- Không xây OAuth provider nếu không có yêu cầu đăng nhập bên thứ ba.
- Đăng xuất phải có hành vi rõ với refresh/session credential.

## 5. API versioning
Giữ `/v1` cho contract đầu tiên. Không tăng version chỉ vì đổi implementation nội bộ; thay đổi breaking phải có kế hoạch tương thích.

## 6. Xác nhận hàng hoàn do giao hàng thất bại
- Hai endpoint sau yêu cầu role `SHOP_OWNER` hoặc `ADMIN`; chưa đăng nhập nhận HTTP 401, customer nhận HTTP 403.
- `PATCH /api/v1/owner/orders/{orderNumber}/status` không nhận đích `RETURNED`: với đơn tồn tại, trả HTTP 400, `error.code = RETURN_CONFIRMATION_REQUIRED`, yêu cầu dùng `confirm-return`. Đơn không tồn tại vẫn trả HTTP 404. Yêu cầu bị từ chối không đổi trạng thái, tồn kho, coupon hoặc lịch sử.
- `POST /api/v1/owner/orders/{orderNumber}/confirm-return` là endpoint duy nhất chuyển `DELIVERY_FAILED -> RETURNED` sau khi xác nhận hàng thực tế về kho. Body tùy chọn: `{ "note": "Đã nhận hàng hoàn về kho" }` (note tối đa 255 ký tự). Thành công trả HTTP 200 và DTO đơn hàng trong `data`.
- Xác nhận hàng hoàn thực hiện chuyển trạng thái, hoàn tồn kho, giải phóng lượt coupon và ghi lịch sử trong cùng transaction. Nếu đơn không ở `DELIVERY_FAILED`, kể cả khi xác nhận lần hai, trả HTTP 400, `error.code = INVALID_TRANSITION`, không lặp lại các tác dụng nghiệp vụ.
