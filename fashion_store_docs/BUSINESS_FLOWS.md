# Business Flows & State Machines

## 1. Catalog
- Chỉ sản phẩm `ACTIVE` và variant có thể bán mới xuất hiện trên storefront.
- Product detail trả variants, giá, ảnh, size/color, tình trạng còn hàng.
- Search/filter/sort/pagination được thực hiện server-side khi catalog tăng.
- Ảnh có thứ tự và một ảnh chính rõ ràng; validate loại file, dung lượng và kích thước.

## 2. Cart
1. Customer thêm variant + quantity.
2. Backend xác minh variant tồn tại, active, quantity hợp lệ.
3. Backend thêm/cập nhật cart item.
4. Khi xem cart, server trả giá hiện tại và availability hiện tại.
5. Checkout phải kiểm tra lại giá, coupon, phí giao hàng và tồn kho.
Không xem cart là cam kết giữ hàng hay cố định giá.

## 3. Checkout
1. Client gửi địa chỉ, phương thức giao hàng, coupon code (nếu có), payment method và các variant/quantity theo hợp đồng API.
2. Backend tải dữ liệu sản phẩm/variant từ DB; không tin tên, giá, discount, shipping fee hay total từ client.
3. Validate sản phẩm còn active, quantity, coupon, giới hạn sử dụng và địa chỉ.
4. Tính subtotal/discount/shipping/grand total trên server.
5. Trong transaction: kiểm tra/trừ tồn kho an toàn, tạo order + order items snapshot, tạo payment intent/record theo thiết kế.
6. Commit.
7. Với COD: order vào trạng thái phù hợp, ví dụ `PENDING_CONFIRMATION`.
8. Với gateway online: tạo payment request theo tài liệu provider, chuyển hướng hoặc hiển thị QR/flow tương ứng.
9. Nếu bước ngoài DB thất bại, có cơ chế xử lý trạng thái và hoàn tồn kho đã được định nghĩa; không để order/stock ở trạng thái mơ hồ.
10. Trả order number và trạng thái cho client.

## 4. Trạng thái đơn hàng
Đề xuất MVP:
- `PENDING_CONFIRMATION`: đã đặt, chờ shop xác nhận (COD hoặc chính sách tương ứng).
- `CONFIRMED`: shop xác nhận.
- `PROCESSING`: đang chuẩn bị.
- `SHIPPED`: đã bàn giao vận chuyển.
- `DELIVERED`: giao thành công.
- `CANCELLED`: đã hủy hợp lệ.
- `RETURN_REQUESTED`, `RETURNED` hoặc `REFUND_PENDING`, `REFUNDED` chỉ triển khai đầy đủ khi chính sách đổi trả/hoàn tiền đã chốt.

Transition mẫu:
`PENDING_CONFIRMATION -> CONFIRMED | CANCELLED`
`CONFIRMED -> PROCESSING | CANCELLED` (hủy phải kiểm tra hàng/ship policy)
`PROCESSING -> SHIPPED | CANCELLED` (chỉ nếu chưa bàn giao và chính sách cho phép)
`SHIPPED -> DELIVERED`
Không cho client tự set status. Mỗi transition phải có actor, quyền, precondition, lịch sử và kiểm thử. Admin override nếu có phải ghi audit log.

## 5. Thanh toán
Trạng thái payment tách khỏi order status:
- `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`.
- Redirect thành công trên browser không đủ để đánh dấu paid.
- Verify chữ ký webhook/IPN, amount, currency, merchant reference, order reference và trạng thái.
- Idempotency: cùng callback được gửi nhiều lần chỉ gây một hiệu ứng nghiệp vụ.
- Lưu mã giao dịch provider và kết quả đã lọc dữ liệu nhạy cảm.
- Không giữ transaction DB trong lúc chờ network call đến gateway.
- Chỉ xác nhận đơn theo chính sách sau sự kiện thanh toán đã được xác thực.
- COD có payment status riêng như `PENDING` rồi `SUCCESS` khi thu tiền, theo quy ước thống nhất.

## 6. Hủy đơn và tồn kho
- Xác định rõ ai được hủy và đến thời điểm nào.
- Việc hủy phải idempotent; không hoàn kho hai lần.
- Nếu đã thanh toán, không giả vờ đã hoàn tiền chỉ vì order status là CANCELLED.
- Tách yêu cầu hoàn tiền khỏi xác nhận hoàn tiền thật từ provider/thao tác kế toán.
- Ghi lịch sử thay đổi.

## 7. Coupon
- Kiểm tra thời gian hiệu lực, minimum spend, tổng usage limit, per-user limit, loại giảm giá, mức giảm tối đa.
- Chặn tổng discount vượt subtotal theo policy.
- Cần bảo vệ cạnh tranh khi coupon chỉ còn một lượt; xử lý trong transaction.
- Không áp dụng coupon chỉ bằng validation frontend.

## 8. Các lỗi triển khai thật cần test
- Hai khách mua variant cuối cùng cùng lúc.
- Client gửi giá 1 đồng hoặc total âm.
- Coupon hết hạn ngay lúc checkout.
- Gateway timeout sau khi order đã tạo.
- Webhook đến hai lần hoặc đến sai thứ tự.
- Khách refresh trang kết quả thanh toán.
- Shop hủy đơn đã bàn giao.
- Sản phẩm bị ẩn sau khi nằm trong cart.
- Upload ảnh thành công nhưng DB save thất bại và ngược lại.
- Email provider lỗi nhưng order vẫn được ghi nhận.
- Customer A cố truy cập order của Customer B.
- Shop owner thử sửa sản phẩm/đơn không thuộc shop.
