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
   - Khoảng giá định sẵn (Price Presets): 4 mức giá chuẩn (`≤ 500k`, `500k – 1 triệu`, `1 – 2 triệu`, `≥ 2 triệu`), hỗ trợ click chọn hoặc click lại để bỏ chọn (toggle-off).
   - Khoảng giá tùy chỉnh (Custom Price): Nhập giá tối thiểu/tối đa, hỗ trợ phím Enter để áp dụng ngay, kiểm tra validation chặt chẽ (không âm, không NaN/Infinity, min <= max, giữ nguyên giá trị 0).
   - Sắp xếp (Sort dropdown): Mới nhất (`newest`), Giá tăng dần (`price_asc`), Giá giảm dần (`price_desc`), Tên A-Z (`name_asc`).
   - Thanh Active Filter Chips: Hiển thị đầy đủ chip cho các tiêu chí đang áp dụng (Danh mục, Kích cỡ, Màu sắc, Khoảng giá, Sắp xếp không mặc định, Chỉ còn hàng, Từ khóa tìm kiếm). Mỗi chip có nút `✕` để xóa độc lập. Xóa chip Sort sẽ hoàn về `newest`.
   - Nút "XÓA TẤT CẢ": Reset toàn bộ bộ lọc catalog về mặc định, xóa draft ô tìm kiếm, hủy timer debounce đang chờ, bảo tồn query param ngoại lai (`utm_source`...).
   - Cơ chế bảo vệ Search Debounce (Version Guard): Sử dụng `searchVersionRef` thế hệ tăng dần để triệt tiêu race condition giữa `setTimeout` và render cycle, đảm bảo callback cũ bị hủy hoàn toàn khi bộ lọc thay đổi.
   - Phân trang chuẩn với metadata rõ ràng.
3. Product Detail Lookbook Experience (Chi tiết trang phục & Điều phối biến thể - Phase 5B):
   - **Mô hình Modal Lookbook vs Standalone Page**:
     - *Quyết định thiết kế*: Sử dụng Modal Overlay cao cấp kết hợp URL Search Param `?product=<slug>` thay vì chuyển trang sang route riêng biệt.
     - *Lý do kỹ thuật & thẩm mỹ*:
       1. Tránh unmount component tree chứa WebGL Canvas Living Shader, bảo toàn 100% tài nguyên GPU context, ngăn chặn hiện tượng chớp màn hình (flicker) và gián đoạn nhịp thở animation loop.
       2. Giữ nguyên vị trí cuộn trang (scroll position), dữ liệu catalog đã tải và toàn bộ trạng thái bộ lọc của danh mục. Khi đóng modal, người dùng quay lại đúng sản phẩm vừa duyệt mà không phải tải lại API.
       3. Hỗ trợ đầy đủ Web History API: URL tự đổi thành `/?product=<slug>`, có thể copy link chia sẻ (deep-linking), hỗ trợ nút Back/Forward của trình duyệt và phím `Escape` đóng nhanh.
   - **Dynamic Gallery đồng bộ theo Màu (Color Swatches)**:
     - Gallery ảnh tỉ lệ chuẩn thời trang dọc (3:4), hỗ trợ ảnh chính kích thước lớn và dải ảnh thu nhỏ (thumbnails) bên dưới.
     - Khi chọn Color Swatch, gallery tự động lọc hiển thị ảnh gán riêng cho biến thể màu đó (`img.variantId === variant.id`) kết hợp cùng các ảnh chụp chung (`!img.variantId`).
     - Tự động fallback về toàn bộ gallery nếu biến thể chưa có ảnh chuyên biệt.
   - **Bộ chọn Kích cỡ 4 Trạng thái (4-State Size Selector)**:
     - Phân định rõ 4 trạng thái trực quan:
       1. `Active / Selected`: Khung viền vàng champagne `#C7AD83`, nền đen sang trọng, text trắng đậm.
       2. `In-Stock`: Viền mảnh `#262626`, hover chuyển viền `#C7AD83`, text `#D4D4D4`, sẵn sàng chọn.
       3. `Out-of-Stock`: Viền mờ `#1F1F1F`, text gạch ngang mờ `#525252`, vô hiệu hóa click kèm tooltip "Tạm hết hàng".
       4. `Not Offered`: Làm mờ sâu (`opacity-25`), viền đứt đoạn hoặc mờ, không thể click.
   - **Quy tắc Giải quyết Kích cỡ & Bảo toàn Ý định Khách hàng (Size Intent Preservation vs Ghost Variant)**:
     - Khi khách hàng đổi màu sắc (`selectedColor`), nếu kích cỡ hiện tại (`selectedSize`) vẫn **được sản xuất** ở màu mới (dù tạm hết hàng `stock === 0`), UI **giữ nguyên kích cỡ**, hiển thị nhãn cảnh báo *"Biến thể [Màu] / [Size] tạm thời hết hàng"* và đổi nút CTA thành *"HẾT HÀNG"* (disabled).
     - Chỉ kích hoạt cơ chế **Auto-resolve** sang kích cỡ khả dụng đầu tiên còn hàng khi kích cỡ hiện tại là **Biến thể ma thực sự** (màu mới hoàn toàn không sản xuất kích cỡ đó).
     - Biến thể không hoạt động (`status !== 'ACTIVE'`) bị loại trừ tuyệt đối.
   - **Bảng tra cứu số đo (Size Guide Drawer)**:
     - Mở slide-over drawer từ cạnh phải hiển thị bảng số đo (ngực, eo, mông, dài trang phục) theo cm kèm hướng dẫn cách đo vòng đo cơ thể.
     - Ưu tiên đọc thông số từ `product.specifications` JSON; tự động fallback theo loại danh mục (Đầm/Váy, Áo sơ mi/Áo thun, Quần/Chân váy).
     - Phím `Escape` đóng drawer trước mà không làm tắt modal chi tiết bên dưới nhờ cơ chế `e.stopImmediatePropagation()` và `isSizeGuideOpenRef`.
   - **Bảo vệ Hạn mức Số lượng Giỏ hàng (Cart Quantity Limits)**:
     - Đồng bộ với ràng buộc cơ sở dữ liệu và ADR-011: Mỗi dòng hàng tối đa 10 sản phẩm (`MAX_PER_LINE = 10`).
     - Modal tự động đối chiếu số lượng đã có trong giỏ hàng của biến thể (`existingCartQuantity`), tính toán `maxAddableQuantity = Math.min(10 - existingCartQuantity, stockQuantity)`.
     - Bộ tăng giảm số lượng (stepper) và nút CTA tự động vô hiệu hóa khi người dùng đã đạt hạn mức tối đa trong giỏ.
   - **Cách ly Hình ảnh Biến thể & Fallback Minh bạch (Honest Gallery Fallback)**:
     - Khi chọn màu, chỉ hiển thị ảnh của biến thể màu đó kết hợp ảnh chung của sản phẩm (`!img.variantId`), tuyệt đối không hiển thị tràn ảnh của màu khác.
     - Nếu không có cả ảnh màu lẫn ảnh chung, chỉ fallback về 1 ảnh đại diện kèm badge nhãn rõ ràng: *"Ảnh minh họa kiểu dáng (Chưa có ảnh riêng cho màu [Tên màu])"*.
   - **Khả năng Tiếp cận & Focus Trap (A11y)**:
     - Modal áp dụng đầy đủ `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
     - Khi mở modal, tự động focus vào nút đóng; phím `Tab` và `Shift+Tab` bị bẫy tuần hoàn bên trong các phần tử tương tác của modal; khi đóng modal, tiêu điểm được khôi phục chính xác về phần tử đã kích hoạt ban đầu.
   - **Khối thông tin chi tiết**: Chất liệu vải (`material`), Form dáng (`fit_style`), Hướng dẫn giặt ủi (`care_instructions`) và thông số chi tiết từ `specifications` JSON.
   - **Phản hồi Thêm vào giỏ hàng (Add to Cart Feedback)**:
     - Khách vãng lai: Kích hoạt modal Đăng nhập/Đăng ký tinh tế kèm thông báo giải thích.
     - Khách đã đăng nhập: Gọi API thêm vào giỏ, đóng modal sản phẩm và tự động trượt mở Mini-Cart Drawer (`openCart()`) từ cạnh phải với thanh tiến độ Freeship trực quan.
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

## 9. Hệ thống Thiết kế IVRE Atelier — Dark Editorial Luxury (Shop Owner Portal)

### 9.1. Triết lý Thiết kế & Bảng Màu Thương hiệu (Brand Color Palette)
Owner Portal được thiết kế theo phong cách **IVRE Atelier — Dark Editorial Luxury**, lấy cảm hứng từ không gian làm việc của các nhà mốt may đo cao cấp tại Paris/Milan:
- **Nền sâu thẳm (`--color-atelier-bg`)**: `#0E0F11` — tạo chiều sâu tĩnh lặng, tôn vinh hình ảnh và số liệu kinh doanh.
- **Bề mặt chính (`--color-atelier-surface`)**: `#191A1D` — khối container chứa bảng biểu, bộ lọc và biểu đồ.
- **Bề mặt nổi (`--color-atelier-surface-raised`)**: `#212226` — các thẻ KPI, ô input, dropdown và card con.
- **Đường viền tinh xảo (`--color-atelier-border`)**: `#333235` — viền siêu mảnh 1px phân tách các khối nội dung.
- **Vàng Champagne Hoàng gia (`--color-atelier-gold`)**: `#D6B27C` (Hover: `#E5C592`, Active: `#C5A16B`) — điểm nhấn cho nút CTA chính, tiêu đề danh mục, tab active và chỉ số quan trọng.
- **Văn bản Ánh kim (`--color-atelier-text`)**: `#F5F0E9` — độ tương phản cao, dễ đọc trên nền tối.
- **Văn bản Thứ cấp (`--color-atelier-muted`)**: `#AAA5A0` — chú thích, nhãn phụ, ngày giờ tạo.
- **Màu trạng thái Nghiệp vụ**:
  - *Xanh Ngọc Bích (`#8BC9A8`)*: Tồn kho an toàn, Đơn hoàn tất, Đã xác nhận, Thanh toán thành công.
  - *Hổ Phách Ấm (`#E4BB78`)*: Tồn sắp hết, Chờ xác nhận, Chưa thu tiền COD, Nhận hàng hoàn.
  - *Đỏ San Hô Trầm (`#DF8D84`)*: Hết hàng, Đơn đã hủy, Lưu trữ vĩnh viễn, Cảnh báo nguy cấp.

### 9.2. Hệ thống Kiểu chữ (Editorial Typography System)
- **Tiêu đề phân khu (`font-serif`)**: Tiêu đề trang, tên modal mang nét cổ điển quý phái của các tạp chí thời trang Vogue/Harper's Bazaar.
- **Thân bài & Nhãn thao tác (`font-sans`)**: Sans-serif trung tính, chuẩn mực, tối ưu hóa hiển thị trên màn hình Retina/OLED.
- **Chỉ số, SKU & Đối soát (`font-mono`)**: Mã đơn hàng (`#ORD-...`), mã SKU biến thể, số lượng tồn kho, giá trị tiền tệ VNĐ và mốc thời gian ISO được đặt trong font đơn cách, giúp người quản trị dễ dàng quét mắt so sánh theo cột dọc.

### 9.3. Kiến trúc Bố cục Đáp ứng Đa thiết bị (Responsive Layout Architecture)
- **Desktop ($\ge 1280\text{px}$)**:
  - Sidebar cố định 256px với logo Atelier sang trọng, trạng thái phiên bản (`5C.1`, `5C.2`, `5C.3`) và gradient active ánh vàng.
  - Sticky Topbar 72px hiển thị breadcrumb động, tên cửa hàng, profile pill chủ shop và nút chuyển nhanh Storefront.
  - Nội dung chính mở rộng toàn chiều rộng không bị giới hạn nhân tạo, 4 thẻ KPI đồng chiều cao, 2 panel biểu đồ tỷ lệ đối xứng (Donut sức khỏe tồn kho + Nhịp vận hành 7 ngày), bảng dữ liệu full-width với thao tác nhanh inline.
- **Tablet ($768\text{px} - 1279\text{px}$)**:
  - 4 thẻ KPI tự động xếp thành lưới $2 \times 2$.
  - Ẩn bớt các cột ít quan trọng trên bảng dữ liệu để tránh cuộn ngang khó chịu.
- **Mobile ($320\text{px} - 767\text{px}$)**:
  - Header thu gọn tối đa (Compact Header) hiển thị avatar chủ shop và tiêu đề trang.
  - Sidebar cố định được ẩn hoàn toàn; thay thế bằng **Thanh điều hướng đáy (Bottom Navigation Bar)** cao 64px với hiệu ứng mờ nền (`backdrop-blur-md`), hỗ trợ vùng an toàn `safe-area-inset-bottom`.
  - Bảng dữ liệu tự động chuyển hóa thành **Danh sách Thẻ SKU/Đơn hàng (Card List)**: Mỗi thẻ gói trọn ảnh thumbnail, thông tin phân loại, số dư tồn kho nổi bật và nút bấm thao tác dễ dàng bằng một ngón tay cái.
  - Các modal nghiệp vụ (Nhập kho, Điều chỉnh kiểm kê, Chi tiết đơn hàng) tự động chuyển hóa thành **Bottom Sheet Drawer** trượt từ dưới lên, cuộn mượt mà không xung đột scrollbar lồng nhau.

### 9.4. Chuẩn mực Dữ liệu & Tính Trung thực Toán học (Data Integrity Standards)
- **Thống kê toàn cửa hàng (Global Catalog Math)**:
  - Khắc phục triệt để lỗi phân trang cục bộ: 4 thẻ KPI đọc trực tiếp từ API `/api/v1/owner/inventory/stats`, bảo đảm bất biến toán học:
    $$\text{Tổng biến thể (32)} = \text{An toàn (22)} + \text{Sắp hết (8)} + \text{Hết hàng (2)}$$
    luôn chính xác trên toàn bộ danh mục, không phụ thuộc vào kích thước trang đang hiển thị.
- **Phương trình Đối soát Sổ cái Minh bạch (Ledger Reconciliation Equation)**:
  - Trình bày công thức đối soát mạch lạc với người dùng:
    $$\text{Tồn khả dụng (ATS)} = \text{Số dư mở sổ} + \text{Biến động sau mở sổ}$$
    Ví dụ: $23 = 10 + (+13)$, triệt tiêu mọi sự nhầm lẫn giữa tổng delta lũy kế và số dư mở sổ cutover.
- **Minh bạch Dữ liệu Thời gian thực**:
  - Biểu đồ nhịp vận hành 7 ngày mang nhãn ghi chú minh bạch *"Dữ liệu minh họa nhịp vận hành"* tránh gây hiểu nhầm cho chủ shop trước khi module phân tích chuyên sâu được triển khai.

