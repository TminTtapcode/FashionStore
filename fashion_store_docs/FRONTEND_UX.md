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

---

## 10. IVRE Atelier Luxury Fashion Editorial Storefront (Phase 5D.1)

### 10.1. Triết lý Thiết kế: Luxury Editorial Runway × Interactive Shopping
Storefront khách hàng được tái thiết toàn diện để biến IVRE thành một **Digital Haute Couture Atelier** thay vì một website thương mại điện tử đại trà:
- **Ngôn ngữ Thẩm mỹ**: Typography Serif tráng lệ, nền bóng đêm sâu thẳm (`#0A0B0E`, `#111214`), ánh vàng Champagne (`#D6B27C`), và tương phản kiểm soát với WebGL Living Runway Shader.
- **Sản phẩm là Nhân vật Chính**: Khắc phục tình trạng shader lấn át sản phẩm bằng cách giảm độ chói nền, tăng độ tương phản của card và đưa sản phẩm lên vị trí tiêu điểm.
- **Nhịp điệu Biên tập (Editorial Rhythm)**: Homepage được tổ chức tuần tự:
  $$\text{Hero Tráng lệ} \longrightarrow \text{Trụ cột Thương hiệu} \longrightarrow \text{Danh mục Thiết kế} \longrightarrow \text{Chiến dịch Lụa \& Linen} \longrightarrow \text{Catalog Sản phẩm Mới} \longrightarrow \text{Studio Phối đồ 2.5D} \longrightarrow \text{Chân trang Atelier}$$

### 10.2. Chi tiết 8 Phân khu Kiến trúc Storefront
1. **StorefrontHeader**:
   - Monogram thương hiệu `Ivre.` với dấu chấm Champagne Gold, kèm sub-brand `DIGITAL COUTURE EST. 2026`.
   - Menu điều hướng desktop font mono uppercase: BỘ SƯU TẬP, DANH MỤC, SẢN PHẨM MỚI, STYLING STUDIO (✦ 2.5D), VỀ ATELIER.
   - Nút giỏ hàng nổi bật với badge số lượng động; cụm xác thực người dùng tích hợp phím tắt `QUẢN TRỊ ↗` cho Shop Owner.
   - Mobile Hamburger Menu Drawer trượt mượt mà, thân thiện với thao tác chạm ngón cái trên màn hình di động.
2. **StorefrontHero — The Urbanist Couture**:
   - Khối chữ tiêu đề phân cấp: `The Urbanist` trong Warm Ivory (`#F5F0E9`), `Couture` trong Champagne Gold italic (`#D6B27C`).
   - Breadcrumb chiến dịch: `CAMPAIGN 01 · DIGITAL RUNWAY DROP 2026` với chấm sáng animated pulse.
   - Nút bật/tắt WebGL Shader (`✦ SHADER: BẬT/TẮT`) giúp khách hàng chủ động kiểm soát trải nghiệm hiển thị.
   - Cặp CTA kép: *Khám phá bộ sưu tập* (nút vàng tràn viền) và *Thử phối đồ Lookbook* (nút kính mờ viền kim loại).
   - Cột phải: Chân dung người mẫu thời trang 3:4 chuẩn tạp chí kèm bộ thanh trượt lookbook tối giản `01 | 02 | 03`.
3. **BrandValueStrip**:
   - 4 thẻ kính mờ (glassmorphism) trình bày 4 giá trị thực chất: *Chất liệu tự nhiên (100% lụa & linen)*, *Form dáng chuẩn mực Á Đông*, *Hướng dẫn bảo quản tỉ mỉ*, và *Độc bản biến thể theo mã SKU*.
4. **CategoryShowcase (Khám Phá Theo Danh Mục)**:
   - 4 thẻ ảnh thời trang khổ lớn tỉ lệ 3:4 gắn liền trực tiếp với danh mục cơ sở dữ liệu (`/api/v1/categories`).
   - Khi nhấp chọn: Tự động cập nhật URL filter `?category=<slug>`, làm sáng viền vàng của danh mục đang chọn, và cuộn mượt đến lưới sản phẩm `#catalog-section`.
5. **EditorialCampaign — The Silk & Linen Edit**:
   - Câu chuyện chất liệu lụa tơ tằm & linen may đo, bố cục ảnh chụp lookbook ấm áp và nút CTA kích hoạt bộ lọc tìm kiếm trực tiếp `?q=Lụa`.
6. **Active Catalog & New Arrivals**:
   - Hiển thị danh mục sản phẩm đang mở bán (`ACTIVE`) lấy từ backend `/api/v1/products`.
   - Tự động thích ứng: 2 cột trên Mobile ($320\text{px} - 767\text{px}$), 3 cột trên Tablet, và 4-5 cột trên Desktop rộng.
   - Thẻ `ProductCard`: Tỉ lệ ảnh 3:4, nhãn phân cấp thương hiệu/chất liệu, giá niêm yết & giá giảm, hàng chấm swatch màu tương tác đổi ảnh, và pill xem nhanh khi hover trên desktop.
7. **StylingStudioTeaser**:
   - Không gian trải nghiệm phòng thử đồ ma-nơ-canh 2.5D, gợi ý tiết kiệm 10% khi phối trọn bộ trang phục, mở modal `VirtualStylingStudio`.
8. **StorefrontFooter**:
   - Chân trang 4 cột chuyên nghiệp: Tuyên ngôn thương hiệu, Liên kết danh mục, Chính sách khách hàng (Thanh toán COD, Bảng size guide, Đổi size 48h), và Thông tin Concierge Studio hỗ trợ tư vấn trang phục.

### 10.3. Ma trận Đáp ứng Đa Thiết bị (Responsive Verification Matrix)
Đã kiểm chứng thực tế bằng Chrome DevTools MCP trên toàn bộ 7 độ phân giải chuẩn mực:

| Độ phân giải | Loại thiết bị | Layout Header | Hero Section | Lưới Sản phẩm | Tràn ngang (Overflow) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **320px** | Small Mobile (iPhone SE thế hệ cũ) | Compact + Hamburger Menu | Chữ dọc, CTA xếp chồng | 2 cột gọn gàng | `scrollWidth <= clientWidth` | **PASS** |
| **375px** | iPhone SE / Compact Mobile | Compact + Hamburger Menu | Tiêu đề cân đối, nút lớn | 2 cột (gap 3.5) | `scrollWidth <= clientWidth` | **PASS** |
| **390px** | iPhone 14/15/16 Chuẩn | Full Header Mobile + Cart badge | Tỉ lệ hoàn hảo, ảnh chân dung | 2 cột (gap 3.5) | `scrollWidth <= clientWidth` | **PASS** |
| **768px** | iPad Mini / Tablet dọc | Header đầy đủ + Nav phụ | Bố cục 2 cột (7/5) | 3 cột | `scrollWidth <= clientWidth` | **PASS** |
| **1024px** | iPad Pro / Small Laptop | Desktop Nav thanh lịch | Bố cục 2 cột (7/5) | 4 cột | `scrollWidth <= clientWidth` | **PASS** |
| **1440px** | Desktop Màn hình rộng | Desktop Nav đầy đủ + Auth | Bố cục rộng 1280px | 4 cột | `scrollWidth <= clientWidth` | **PASS** |
| **1920px** | Full HD / Ultra Wide | Căn giữa Max-width 7xl | Đầy đủ chi tiết runway | 4-5 cột | `scrollWidth <= clientWidth` | **PASS** |

### 10.4. Tinh chỉnh Thị giác Storefront (Phase 5D.1.1)
1. **Header Account Dropdown**:
   - Tinh giản thanh điều hướng desktop: Thay thế hàng nút bấm rải rác và chữ bị cắt `ATELIER SHOP OW...` bằng menu popover kính mờ `AccountDropdown` gọn gàng.
   - Nhấp vào avatar monogram sẽ mở menu tùy chọn: Thông tin người dùng, Phím tắt `QUẢN TRỊ ↗` (đối với Shop Owner / Admin), Lịch sử đơn hàng, và Đăng xuất. Tự động đóng khi nhấp chuột ra ngoài.
2. **Khu biệt Phạm vi WebGL Living Runway**:
   - WebGL shader canvas được giới hạn tuyệt đối trong phạm vi section Hero.
   - Toàn bộ các phân khu phía dưới (`BrandValueStrip`, `CategoryShowcase`, `EditorialCampaign`, `#catalog-section`, `StylingStudioTeaser`, `StorefrontFooter`) được áp dụng nền đen Obsidian Black (`bg-[#0A0B0E]`) và Charcoal tĩnh với `relative z-10`, triệt tiêu hoàn toàn sự xao nhãng thị giác, giúp người dùng tập trung tối đa vào sản phẩm.
3. **Đồng bộ Hình ảnh Danh mục (Category Showcase)**:
   - Thay thế các ảnh stock ngoại cảnh bằng 4 tác phẩm nhiếp ảnh studio may đo cao cấp (Studio Tailoring) mang tông màu trung tính (charcoal, kem, ivory, be) đồng nhất với bản sắc IVRE Atelier.
4. **Cân đối Danh mục Sản phẩm khi Lọc 1–2 Món**:
   - Khi bộ lọc chỉ trả về 1 hoặc 2 sản phẩm, hệ thống tự động căn giữa trong container (`max-w-4xl mx-auto flex justify-center gap-6 sm:gap-8`), giữ chiều rộng thẻ chuẩn mực (`max-w-[340px] sm:max-w-[380px]`), loại bỏ hiện tượng dồn cụm lệch sang lề trái.

---

## 11. Trải nghiệm Chi tiết Sản phẩm Tạp chí IVRE Atelier (Phase 5D.2)

### 11.1. Bố cục 58% Gallery / 42% Sticky Purchase Panel
Lấy cảm hứng từ thiết kế Daylog / Theory Trench Coat Editorial:
- **Cột Trái — Lookbook Gallery (58%)**:
  - Không gian ảnh lớn với tỉ lệ thời trang chân dung, phủ gradient ánh sáng tinh tế.
  - Hỗ trợ duyệt ảnh qua mũi tên trái/phải, bộ đếm ảnh (`01 / 04`), và hàng thumbnail viền vàng champagne (`ring-2 ring-[#D6B27C]`).
  - Tự động lọc gallery theo biến thể màu được chọn, hiển thị nhãn cảnh báo nếu sử dụng ảnh minh họa kiểu dáng chung.
- **Cột Phải — Sticky Purchase Panel (42%)**:
  - Tiêu đề thương hiệu: `IVRE / THE ATELIER EDIT`.
  - Tên sản phẩm dùng font editorial serif trang nhã, phân tầng cùng mô tả ngắn.
  - Giá bán định dạng VND nổi bật bằng màu vàng champagne kèm giá so sánh gạch ngang và huy hiệu phần trăm giảm giá.
  - Bộ chấm chọn màu sắc tròn (`w-7 h-7`), tự động điều phối kích cỡ khả dụng để ngăn chặn Ghost Variant.
  - Bộ chọn kích cỡ 4 trạng thái (Selected, Available, Out-of-Stock gạch chéo, Not-Offered làm mờ) kèm liên kết mở nhanh Bảng quy đổi size (`SizeGuideDrawer`).
  - Thanh chỉnh số lượng stepper `[-] Qty [+]` và nút CTA `THÊM VÀO GIỎ HÀNG` vàng champagne nổi bật với hiệu ứng flash phản hồi thị giác tức thì.

### 11.2. Bộ 5 Khối Thông tin Mở rộng (Editorial Accordions)
Thay thế dạng tab truyền thống bằng các khối thông tin đóng/mở độc lập (disclosure panels):
1. **Mô tả & Cảm hứng Thiết kế**: Câu chuyện sáng tạo và giá trị chế tác thủ công.
2. **Chất liệu & Cấu trúc Sợi**: Chi tiết thành phần sợi dệt tự nhiên, độ thoáng khí và cảm giác tiếp xúc da.
3. **Form dáng & Thông số Kích cỡ**: Phom dáng may đo tiêu chuẩn kèm liên kết mở bảng đo 3 vòng.
4. **Hướng dẫn Bảo quản & Giặt là**: Quy chuẩn giặt hấp khô, giặt tay nhẹ và nhiệt độ ủi để giữ bền form dáng.
5. **Chính sách Giao nhận & Đổi trả**: Cam kết giao hàng 1-2 ngày, thanh toán COD đồng kiểm tận tay và đổi size miễn phí 7 ngày.

### 11.3. Dải Cam kết Dịch vụ Thượng hạng (Daylog Trust Badges)
Ba trụ cột an tâm mua sắm thời trang cao cấp:
- 🚚 **Giao COD Toàn Quốc**: Kiểm tra hàng trước khi thanh toán tiền mặt.
- 🔄 **Đổi Size 7 Ngày**: Hỗ trợ tư vấn và đổi kích cỡ tận tâm.
- 🛡️ **100% Chính Hãng IVRE**: Sản phẩm chế tác chuẩn mực từ xưởng may atelier.

### 11.4. Gợi Ý Hoàn Thiện Phong Cách ("You May Also Like")
- Tự động tuyển chọn tối đa 4 thiết kế tương thích từ cùng danh mục hoặc bộ sưu tập Atelier Drop.
- Mỗi card hiển thị ảnh lookbook 3:4, tên sản phẩm font serif, giá VND và các chấm swatch màu.
- Tương tác nhấp chuột kích hoạt `onSelectProduct(slug)` chuyển đổi modal sang sản phẩm mới và đồng bộ URL query (`?product=slug`) tức thì mà không gây tải lại trang hoặc phá vỡ WebGL shader.

### 11.5. Trải nghiệm Di động & Thanh Thao tác Ghim Đáy (Sticky Safe-Area Bar)
- Trên mobile ($< 1024\text{px}$), nút thêm vào giỏ hàng được ghim cố định ở đáy màn hình với hiệu ứng kính mờ (`bg-[#0D0E12]/95 backdrop-blur-md`).
- Tự động cộng khoảng đệm an toàn `pb-[max(0.75rem,env(safe-area-inset-bottom))]` tương thích hoàn hảo với thanh Home Bar của iPhone.
- Hiển thị song song tổng tiền biến thể và nút `THÊM VÀO GIỎ` lớn, giúp khách hàng mua sắm bằng một tay thuận tiện tại bất kỳ vị trí cuộn nào.

### 11.6. Kiểm chứng Độ tin cậy & Hợp đồng Lịch sử Modal (Phase 5D.2.1 Final Reliability Gate)
- **Hợp đồng Lịch sử Đa bước trong Modal (Multi-Hop In-Modal Navigation)**:
  - Khi duyệt từ sản phẩm liên quan ("You May Also Like") bên trong modal (`Catalog -> Product A -> Product B -> Product C`), mỗi bước điều hướng lưu `modalDepth` chính xác trong `window.history.state`.
  - Khi người dùng bấm phím Back/Forward của trình duyệt (`C <-> B <-> A <-> Catalog`), `modalDepth` được khôi phục chuẩn xác theo entry hiện tại (ví dụ: Back từ C về B thì entry B mang `modalDepth: 2`).
  - Nhấp nút Đóng (`X`) hoặc phím Escape thực thi `window.history.go(-depth)` để cuộn lùi đúng số bước tương đối so với entry hiện tại, đưa người dùng quay thẳng về danh mục Catalog (`/`, `modalDepth: 0`) mà không bị bẫy kẹt modal hay điều hướng quá đà vượt khỏi Catalog.
- **Thiết lập Nền tảng Deep-link Trực tiếp (Deep-link Baseline Establishment)**:
  - Khi khách hàng truy cập trực tiếp bằng đường dẫn chia sẻ (`/?product=slug`), ứng dụng tự động thiết lập Entry 0 là Catalog (`/`, `modalDepth: 0`) và đẩy Entry 1 là Sản phẩm (`modalDepth: 1`).
  - Khi khách hàng tiếp tục duyệt sản phẩm B (`modalDepth: 2`), C (`modalDepth: 3`) rồi nhấn Đóng, ứng dụng unwind toàn bộ chuỗi modal về đúng Entry 0 (Catalog).
  - Khi người dùng bấm nút Back từ Catalog, trình duyệt quay về trang trước đó (ví dụ Google hay website giới thiệu), không bị kẹt lặp lại trong các sản phẩm đã đóng.
- **Khóa Chặn Yêu cầu Lỗi thời (Stale Request & Slug Guards)**:
  - Ngoài `controller.abort()`, các callback `.then()` và `.finally()` đều kiểm tra nghiêm ngặt `currentSlug === slug` và `currentProductId === product.id`, triệt tiêu hoàn toàn nguy cơ race condition cập nhật giao diện sai lệch khi mạng chập chờn.
- **Khắc phục Lỗi Căn giữa Flexbox trên Mobile (CSS Flex Alignment Fix)**:
  - Dialog container chuyển từ `items-center` sang `items-start md:items-center`.
  - Trên màn hình di động khi chiều cao nội dung (ví dụ 2376px) lớn hơn viewport (568px), `items-center` sẽ đẩy nửa trên nội dung vào vùng tọa độ âm khiến người dùng không thể cuộn lên xem gallery và nút đóng. Căn chỉnh `items-start` trên mobile giúp trang bắt đầu tự nhiên tại `y = 0` và cuộn mượt mà không mất dữ liệu.
- **Xác minh Đo lường Viewport CSS 320px Thực tế**:
  - Phân biệt công cụ `resize_page` (bị giới hạn bởi chiều rộng tối thiểu của cửa sổ hệ điều hành ~486px) và `emulate viewport` (giả lập thiết bị di động thực sự với `320x568x2,mobile,touch`).
  - Đo đạc thực tế tại CSS viewport 320px: `innerWidth: 320`, `clientWidth: 320`, `scrollWidth: 320`, hoàn toàn không tràn ngang (`hasHorizontalOverflow: false`).

## 12. IVRE Atelier Editorial Styling Studio & Lookbook Builder (Phase 5D.3)

### 12.1. Tuyên ngôn Kiến trúc & Giới hạn Thẩm mỹ (Editorial Collage vs AI Try-on)
- **Tôn trọng Nhiếp ảnh Thực tế**: Toàn bộ hình ảnh sản phẩm trong IVRE Atelier là ảnh chụp lookbook/editorial với người mẫu và bối cảnh chân thực từ cơ sở dữ liệu và Cloudinary CDN. Tuyệt đối không giả lập ma-nơ-canh 2.5D cắt ghép biến dạng hay quảng cáo sai lệch về "AI Virtual Try-On".
- **Bảng phối Nghệ thuật (Editorial Collage / Style Moodboard)**: Cung cấp trải nghiệm studio phối đồ thanh lịch, đặt các tác phẩm trang phục cạnh nhau một cách hài hòa theo tiêu chuẩn tạp chí thời trang cao cấp (Vogue / Harper's Bazaar).

### 12.2. Cấu trúc 5 Vị trí Trang phục (5-Slot Architecture) & Quy tắc Xung đột
Hệ thống hỗ trợ 5 vị trí trang phục độc lập:
1. `ONE_PIECE`: Đầm dạ tiệc, maxi, đầm liền thân (`dam-va-vay`, `set-do-jumpsuit`).
2. `UPPER_BODY`: Áo sơ mi, áo thun, áo dệt kim (`ao-nam`, `ao-nu`).
3. `LOWER_BODY`: Quần jeans, quần tây, chân váy (`quan-nu`, `quan-nam`).
4. `OUTERWEAR`: Áo blazer may đo, áo khoác măng-tô (được phân giải theo taxonomy hoặc override đặc thù `ao-blazer-linen-phom-rong-minimalist`).
5. `ACCESSORIES`: Túi xách, khăn lụa, phụ kiện atelier.

**Quy tắc Tương thích Nghiệp vụ Thời trang (Compatibility Invariants)**:
- `ONE_PIECE` xung đột trực tiếp với trang phục rời (`UPPER_BODY` + `LOWER_BODY`).
- Khi khách hàng chọn một mẫu Đầm liền thân (`ONE_PIECE`), hệ thống tự động gỡ bỏ Áo và Quần đang có trong bảng phối và hiển thị thông báo hướng dẫn: *"Đầm liền thân đã thay thế Áo và Quần trong bảng phối."*
- Ngược lại, khi chọn Áo hoặc Quần rời, Đầm liền thân sẽ tự động được dọn dẹp để đảm bảo tính thực tế của trang phục.
- Áo khoác ngoài (`OUTERWEAR`) và Phụ kiện (`ACCESSORIES`) tương thích 100% với cả hai chế độ phối đồ (khoác ngoài đầm hoặc khoác ngoài set áo-quần).

### 12.3. Trải nghiệm Khách hàng trên Desktop & Mobile
- **Desktop (58% Lookbook Canvas / 42% Garment Selector)**:
  - Cột trái: Trực quan hóa bảng phối với ảnh người mẫu sắc nét, nhãn vị trí trang phục, nút gỡ nhanh, và thanh tổng tiền ghim đáy.
  - Cột phải: Thanh chuyển đổi danh mục/slot, hàng preset phối sẵn (The Urbanist Tailoring, Silk Gala Evening), lưới chọn sản phẩm, và panel tùy chỉnh gam màu + kích cỡ + số lượng tồn kho theo thời gian thực.
- **Mobile (< 1024px)**:
  - Thanh chuyển đổi phân đoạn thông minh trên Header: `[ ✦ BẢNG PHỐI ]` vs `[ 🛍️ CHỌN MÓN ]`.
  - Khi khách nhấp vào vị trí trống trên bảng phối, giao diện tự động chuyển sang tab chọn món; sau khi chọn màu/size và bấm đưa vào bộ phối, giao diện tự động đưa khách về bảng phối để chiêm ngưỡng tổng thể.
  - Tối ưu hóa không gian hiển thị, loại bỏ chữ phụ trên màn hình hẹp, đảm bảo 0 horizontal overflow tại viewport 320px và 390px.

### 12.4. Quy trình Thêm Cả Bộ vào Giỏ Hàng (Sequential Add-to-Cart Flow)
- **Kiểm định Hạn mức Đơn hàng Trước thực thi (Pre-flight Limit Verification)**:
  - Hệ thống gom nhóm (aggregate) số lượng các biến thể trùng nhau trong bộ phối.
  - Kiểm tra đối chiếu với số lượng hiện có trong giỏ hàng:
    $$\text{existingCartQty} + \text{outfitQty} \le \min(10, \text{stockQuantity})$$
  - Cảnh báo cụ thể tên sản phẩm nếu vượt quá trần 10 sản phẩm/dòng hoặc vượt quá tồn kho khả dụng.
- **Thực thi Tuần tự & Báo cáo Từng Món (Granular Batch Reporting)**:
  - Backend API hiện tại chỉ nhận thêm từng item đơn lẻ (`POST /api/v1/cart/items`).
  - Giao diện thực thi tuần tự có kiểm soát trạng thái, sau đó hiển thị Modal Báo cáo Chi tiết:
    - *Toàn bộ thành công*: Tự động cập nhật giỏ hàng và mở MiniCartDrawer.
    - *Thành công một phần*: Báo rõ số món đã thêm và liệt kê chính xác các món thất bại kèm nguyên nhân (hết hàng do race condition...).
    - *Xử lý Khách vãng lai (Guest Auth)*: Kích hoạt modal đăng nhập mà không làm mất trạng thái bộ phối (draft outfit state) đang chỉnh sửa dở dang.





