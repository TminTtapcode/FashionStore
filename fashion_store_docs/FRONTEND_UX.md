# Frontend UX & Visual Direction

## 1. Mục tiêu trải nghiệm
Fashion storefront cần có cảm giác editorial/lookbook, hình ảnh sản phẩm nổi bật, typography rõ và lựa chọn variant dễ hiểu. Tránh làm mọi khu vực đều chuyển động; animation phải hỗ trợ hành vi mua sắm chứ không cản trở.

## 2. Hướng art direction đề xuất
- Phong cách: Minimalist Editorial Lookbook / Contemporary Fashion.
- Nền trung tính (trắng tinh khôi, ngà thô mộc, xám đá rất nhạt), chữ đen than (`text-neutral-900`), viền siêu mảnh (`border-neutral-200`).
- Typography: Sans-serif hiện đại (Inter, Plus Jakarta Sans) cho UI và số liệu; font Serif editorial có kiểm soát cho tiêu đề bộ sưu tập (Lookbook / Seasonal Drop).
- Tỉ lệ khung ảnh sản phẩm: Tỉ lệ dọc thời trang chuẩn 3:4 hoặc 4:5, nền ảnh đồng nhất, ánh sáng tự nhiên, tôn vinh phom dáng và chất liệu vải.
- Product card:
  - Ảnh chính sắc nét; hover đổi sang ảnh mẫu mặc hoặc ảnh cận cảnh chất liệu vải (desktop).
  - Tên trang phục ngắn gọn, giá hiển thị minh bạch kèm giá niêm yết so sánh gạch ngang (nếu đang giảm giá).
  - Mini Color Swatch Dots: hàng chấm màu tròn nhỏ dưới card cho khách biết ngay các màu sắc sẵn có (Trắng, Đen, Be, Xanh pastel...).
  - Badge nhãn dán tối giản mang signature riêng: `NEW DROP`, `BESTSELLER`, `-15% SALE`, tuyệt đối không dùng icon hoạt họa hoặc đồ họa lòe loẹt kiểu AI template.
- Mobile-first: Vùng chạm tối thiểu 44px, sticky "Thêm vào giỏ hàng" ở bottom bar khi cuộn qua màn hình chọn size.

## 3. Trang storefront
1. Home: Hero lookbook banner, category navigation (Thời trang Nữ, Thời trang Nam, Đầm váy, Áo, Quần, Set đồ), bộ sưu tập mới nhất, sản phẩm bán chạy.
2. Listing / Catalog:
   - Breadcrumb phân cấp rõ ràng (Trang chủ > Thời trang Nữ > Đầm & Váy).
   - Thanh lọc (Filter bar/drawer): Lọc theo Size may mặc (S, M, L, XL...), Lọc theo Màu sắc (bảng swatch màu trực quan), Lọc theo khoảng giá, Lọc chỉ hiện sản phẩm còn hàng.
   - Sắp xếp (Sort dropdown): Mới nhất, Giá tăng dần, Giá giảm dần, Tên A-Z.
   - Phân trang chuẩn với metadata rõ ràng.
3. Product Detail (Trang chi tiết trang phục):
   - Gallery ảnh: Gallery xếp chồng (stacked) trên desktop hoặc swipe slider mượt mà trên mobile; có thể phóng to xem chi tiết thớ vải.
   - Lựa chọn màu sắc (Color Swatches): Nút tròn hiển thị màu hex thực tế kèm tên màu rõ ràng; click đổi ảnh gallery sang màu tương ứng.
   - Lựa chọn kích cỡ (Size Selector): Nút chọn size dạng ô chữ nhật tối giản; size hết hàng có đường gạch chéo mờ và vô hiệu hóa.
   - Bảng tra cứu số đo (Size Guide Drawer): Mở slide-over drawer từ cạnh phải hiển thị bảng số đo (ngực, eo, mông, dài trang phục) theo cm kèm hướng dẫn cách đo vòng đo cơ thể.
   - Khối thông tin chi tiết: Chất liệu vải (`material`), Form dáng (`fit_style`), Hướng dẫn giặt ủi (`care_instructions`) và thông số chi tiết từ `specifications` JSON.
   - Chính sách mua sắm: Cam kết hàng chính hãng, cho phép đổi size trong 7 ngày, miễn phí giao hàng đơn từ mức nhất định.
4. Cart: Xem lại ảnh trang phục, size đã chọn, màu đã chọn, thay đổi số lượng, kiểm tra giá và cảnh báo tồn kho.
5. Checkout: Nhập địa chỉ, áp dụng mã chào mừng `WELCOME10`, chọn COD, xem breakdown tiền minh bạch và xác nhận đơn.
6. Account: Hồ sơ cá nhân, sổ địa chỉ, lịch sử đơn hàng với đầy đủ snapshot size/màu của từng trang phục đã mua.
7. Search: Ô tìm kiếm nhanh theo tên trang phục, chất liệu hoặc danh mục kèm màn hình Empty State tinh tế khi không tìm thấy kết quả.

## 4. Trải nghiệm tương tác thời trang cao cấp
- Đồng bộ Màu sắc - Gallery: Chọn màu nào thì gallery ưu tiên hiển thị ảnh góc chụp của màu đó.
- Cảnh báo tồn kho tinh tế: Nếu số lượng còn ít (ví dụ `<= 3`), hiển thị nhãn nhẹ nhàng `Chỉ còn 3 sản phẩm` để kích thích quyết định mua.
- Drawer Size Guide thông minh: Cung cấp bảng số đo tùy biến theo từng loại trang phục (Bảng số đo Đầm váy khác Bảng số đo Quần jeans và Áo sơ mi).
- Add-to-cart Feedback: Khi bấm thêm vào giỏ, mở mini-cart drawer trượt từ cạnh phải hoặc toast thông báo kèm nút "Đi đến thanh toán", không điều hướng trang đột ngột.
- Micro-interactions: Hiệu ứng chuyển động mượt mà 150–200ms cho việc chọn swatch, size button và toggle drawer, tuân thủ `prefers-reduced-motion`.

## 5. Responsive
- Mobile: header gọn, search/cart dễ chạm, product grid 2 cột nếu ảnh còn đủ rõ, filter bằng bottom sheet/drawer, CTA dễ thao tác bằng một tay.
- Tablet: grid 2–3 cột tùy chiều rộng.
- Desktop: grid 3–4 cột, filter sidebar hoặc toolbar; detail gallery và purchase panel tách cột.
- Kiểm thử từ 320px trở lên, không chỉ theo tên thiết bị mà theo chiều rộng viewport.

## 6. Accessibility
- Semantic HTML, label cho input, focus state nhìn thấy, keyboard navigation, alt text có nghĩa.
- Không chỉ dùng màu để biểu thị size hết hàng/lỗi.
- Contrast đủ, nút có tên dễ hiểu.
- Kiểm tra zoom 200% và reduced motion.

## 7. Frontend architecture
- Tách route/page, reusable UI, feature modules, API client, schemas và types.
- Server state qua TanStack Query; không copy dữ liệu server vào nhiều global stores.
- Form validation client cải thiện UX nhưng backend vẫn là nguồn kiểm tra cuối.
- TypeScript strict; tránh `any` trừ khi có lý do và comment.
- Không hardcode giá, role, trạng thái hoặc dữ liệu sản phẩm demo vào production path.
- Dùng `.env.example` cho API base URL; không để secret trong frontend env.

## 8. Design acceptance
Mỗi page phải có: loading, error, empty, success, disabled, responsive states. Kiểm tra bằng dữ liệu thật từ API, không chỉ mockup. Trước khi làm hiệu ứng, bảo đảm lựa chọn variant, giá, stock, add-to-cart và checkout hoạt động đúng.
