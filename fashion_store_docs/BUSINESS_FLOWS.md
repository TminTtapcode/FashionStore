# Business Flows & State Machines

## 1. Catalog (Chuyên ngành Thời trang may mặc)
- **Duyệt và Lọc chuyên biệt cho thời trang**:
  - Chỉ sản phẩm `ACTIVE` và variant có trạng thái `ACTIVE` mới xuất hiện trên storefront.
  - Phân cấp danh mục thời trang: Khi chọn danh mục cha (ví dụ `Thời trang Nữ`), hệ thống tự động tải sản phẩm của danh mục cha và tất cả danh mục con (Đầm maxi, Chân váy, Áo blazer...).
  - Bộ lọc đa chiều:
    - Lọc theo Size: Danh sách kích thước may mặc phổ biến (XS, S, M, L, XL, XXL, FreeSize hoặc size số 28-34).
    - Lọc theo Màu sắc: Lọc theo mã màu Hex hoặc tên màu (Trắng, Đen, Be, Xanh Navy...).
    - Lọc theo Khoảng giá (`minPrice`, `maxPrice`).
    - Lọc theo Tình trạng tồn kho (`inStockOnly=true`).
  - Sắp xếp (Sorting) server-side với whitelist chặt chẽ: `newest` (mới nhất), `price_asc` (giá tăng dần), `price_desc` (giá giảm dần), `name_asc` (tên sản phẩm A-Z). Không chấp nhận param sort tùy tiện.
- **Trải nghiệm chọn biến thể thời trang (Product Detail Flow - Phase 5B)**:
  - **Mở Lookbook Detail & Deep-linking URL**:
    - Khi click vào bất kỳ Product Card trên storefront, hệ thống cập nhật query parameter `?product=<slug>` qua `window.history.pushState` mà không reload trang.
    - Deep-linking hỗ trợ mở trực tiếp modal từ URL (khi gửi link hoặc refresh trang), hỗ trợ nút Back/Forward (`popstate`) và phím `Escape` để đóng modal mà vẫn bảo tồn 100% các bộ lọc catalog hiện hành (`category`, `size`, `color`, `price`, `sort`, `search`).
  - **Dynamic Gallery đồng bộ theo Màu (Color Swatch)**:
    - Khi khách hàng chọn một **Màu sắc** (qua Color Swatches), hệ thống lọc danh sách ảnh: ưu tiên hiển thị ảnh gán riêng cho biến thể màu đó (`variant.id`), kết hợp với các ảnh chụp chung của sản phẩm (`!img.variantId`), sắp xếp theo `sortOrder`.
    - Nếu màu đó chưa có ảnh biến thể riêng, hệ thống tự động fallback hiển thị toàn bộ gallery ảnh sản phẩm.
  - **Cơ chế Phòng chống Biến thể Ma (Ghost Variant Prevention)**:
    - Trong ngành thời trang, số lượng size của các màu thường không đối xứng (ví dụ: Màu Trắng có S, M, L; Màu Xanh chỉ có M, L; Màu Đen chỉ sản xuất L).
    - Khi người dùng đang chọn Size S của Màu Trắng và chuyển sang click Màu Xanh (vốn không có Size S), hệ thống tự động giải quyết (auto-resolve) sang size khả dụng đầu tiên còn hàng của Màu Xanh (ví dụ Size M).
    - Ngăn chặn hoàn toàn việc tồn tại tổ hợp (Màu, Size) không có thật trong database gây lỗi khi thêm giỏ hàng.
  - **Bộ chọn Size 4 Trạng thái (4-State Size Selector)**:
    - `Active / Selected`: Size đang được chọn (viền vàng gold `#C7AD83`, nền đen, text trắng).
    - `In-Stock`: Size có tồn kho (`stock_quantity > 0`), có thể click chọn.
    - `Out-of-Stock`: Size có sản xuất cho màu này nhưng tạm hết hàng (`stock_quantity = 0`), hiển thị đường gạch ngang mờ và tooltip/badge cảnh báo hết hàng, vô hiệu hóa click.
    - `Not Offered`: Size hoàn toàn không được sản xuất cho màu này, nút bị làm mờ sâu và vô hiệu hóa click.
  - **Độ chính xác Biến thể & Thẩm quyền Giá (Authoritative Variant Resolution)**:
    - Hệ thống giải quyết chính xác biến thể theo cặp `(selectedColor, selectedSize)`.
    - Hiển thị giá bán riêng của biến thể, giá niêm yết so sánh (`compare_at_price`), phần trăm giảm giá (`-X%`) và số lượng tồn kho thực tế (`stock_quantity`).
  - **Tra cứu Bảng số đo (Size Guide Drawer)**:
    - Cho phép mở slide-over drawer tra cứu bảng thông số chuẩn (dài áo/váy, vòng ngực, vòng eo, vòng mông) theo chiều cao & cân nặng.
    - Ưu tiên hiển thị bảng đo tùy biến trích xuất từ `product.specifications` JSON; nếu sản phẩm không có cấu hình riêng, tự động fallback về bảng kích thước chuẩn theo danh mục (Đầm/Váy, Áo sơ mi/Áo thun, Quần/Chân váy).
    - Drawer hỗ trợ phím `Escape` độc lập và chặn nổi bọt sự kiện để không vô tình đóng modal sản phẩm bên dưới.
  - **Luồng Thêm vào giỏ hàng (Add to Cart Workflow)**:
    - Khách hàng chưa đăng nhập (Guest): Bấm "THÊM VÀO GIỎ HÀNG" sẽ kích hoạt popup đăng nhập (`openAuthModal('login')`) kèm thông báo hướng dẫn.
    - Khách hàng đã đăng nhập: Gửi request `POST /api/v1/cart/items` với `variantId` đã giải quyết và `quantity: 1`. Khi thành công, đóng modal sản phẩm và tự động mở mini-cart drawer (`openCart()`) để khách xem lại giỏ hàng và thanh toán mà không làm mất luồng trải nghiệm.
- **Quản lý ảnh sản phẩm**:
  - Ảnh tải lên có thứ tự `sort_order` và duy nhất 1 ảnh `is_primary = true`.
  - Validate định dạng ảnh (JPG, PNG, WebP), dung lượng tối đa và kích thước tối thiểu để đảm bảo tính thẩm mỹ chuẩn lookbook.
  - Khi liên kết ảnh với biến thể, ảnh bắt buộc phải thuộc cùng `product_id`.

## 2. Cart (Giỏ hàng thời trang)
1. Customer bắt buộc phải chọn đủ **Size** và **Màu sắc** trước khi bấm thêm vào giỏ.
2. Backend xác minh variant ID tương ứng với tổ hợp (Size, Color) đó tồn tại, đang `ACTIVE`, và `quantity` <= tồn kho hiện tại.
3. Backend thêm/cập nhật cart item, liên kết với variant cụ thể.
4. Khi xem cart, server trả thông tin snapshot thời gian thực: ảnh sản phẩm/variant, tên sản phẩm, size đã chọn, màu đã chọn, giá hiện tại và trạng thái còn hàng.
5. Giỏ hàng không giữ hàng (no reservation); khách hàng được cảnh báo tồn kho có thể hết nếu không thanh toán sớm.
6. Checkout kiểm tra lại giá, coupon, phí giao hàng và trừ tồn kho nguyên tử.

## 3. Checkout
1. Client gửi địa chỉ, phương thức giao hàng, coupon code (nếu có), payment method và các variant/quantity theo hợp đồng API.
2. Backend tải dữ liệu sản phẩm/variant từ DB; không tin tên, giá, discount, shipping fee hay total từ client.
3. Validate sản phẩm còn active, quantity, coupon, giới hạn sử dụng và địa chỉ.
4. Tính subtotal/discount/shipping/grand total trên server.
5. Trong transaction: kiểm tra/trừ tồn kho an toàn, tạo order + order items snapshot (chụp lại product_name, sku, size, color, unit_price tại thời điểm mua), tạo payment intent/record theo thiết kế.
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

### Hàng hoàn do giao hàng thất bại (luồng hiện có)
- `SHIPPING -> DELIVERY_FAILED` chưa hoàn tồn kho hoặc giải phóng coupon vì hàng vẫn có thể ở đơn vị vận chuyển.
- Chỉ `SHOP_OWNER` hoặc `ADMIN` xác nhận hàng thực tế đã về kho qua `POST /api/v1/owner/orders/{orderNumber}/confirm-return`. Trong cùng transaction có khóa đơn: chuyển `DELIVERY_FAILED -> RETURNED`, hoàn tồn từng SKU, đổi lượt coupon `APPLIED -> RELEASED` nếu có và ghi một lần chuyển trạng thái vào lịch sử.
- API PATCH trạng thái chung từ chối đích `RETURNED` bằng HTTP 400, mã `RETURN_CONFIRMATION_REQUIRED`; không thay đổi đơn, tồn kho, coupon hoặc lịch sử. Giữ cạnh `DELIVERY_FAILED -> RETURNED` trong enum vòng đời cho use case xác nhận chuyên dụng.
- Xác nhận hàng hoàn lần hai trả HTTP 400, mã `INVALID_TRANSITION`; không hoàn kho, giải phóng coupon hoặc ghi lịch sử thêm lần nữa. Luồng này xử lý hàng giao thất bại, không mở rộng chính sách đổi/trả sau giao thành công.

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
