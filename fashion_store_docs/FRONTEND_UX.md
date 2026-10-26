# Frontend UX & Visual Direction

## 1. Mục tiêu trải nghiệm
Fashion storefront cần có cảm giác editorial/lookbook, hình ảnh sản phẩm nổi bật, typography rõ và lựa chọn variant dễ hiểu. Tránh làm mọi khu vực đều chuyển động; animation phải hỗ trợ hành vi mua sắm chứ không cản trở.

## 2. Hướng art direction đề xuất
- Phong cách: minimalist streetwear / contemporary fashion.
- Nền trung tính (trắng/ngà/xám rất nhạt), chữ đen, một màu accent được chọn sau khi có logo/brand.
- Typography: một sans-serif dễ đọc cho UI; có thể dùng serif/italic có kiểm soát cho tiêu đề editorial.
- Ảnh sản phẩm nhất quán về tỉ lệ, nền, crop và ánh sáng.
- Product card: ảnh lớn, tên ngắn, giá rõ, badge giảm giá chỉ khi đúng.
- Không dùng quá nhiều shadow, gradient, glassmorphism hoặc animation cùng lúc.
- Mobile-first: vùng chạm đủ lớn, sticky CTA chỉ khi không che nội dung, cart/checkout không bị cuộn ngang.

## 3. Trang storefront
1. Home: hero/lookbook, category entry points, sản phẩm mới/bán chạy, campaign có thể cấu hình.
2. Listing: breadcrumb, category, filter size/color/price/availability, sort, pagination/load-more.
3. Product detail: gallery, tên/giá, size selector, color swatches, size guide, stock/availability, quantity, add-to-cart, delivery/return info.
4. Cart: ảnh nhỏ, variant rõ, quantity stepper, remove, subtotal, lưu ý giá/tồn kho có thể thay đổi.
5. Checkout: địa chỉ, phương thức giao hàng/thanh toán, coupon, breakdown tiền, xác nhận đơn.
6. Account: profile, addresses, orders, order detail/status history.
7. Search: autocomplete có thể thêm sau; MVP có search results + empty state tốt.

## 4. Ý tưởng tăng sức hút khi chọn sản phẩm
- Ảnh thứ hai khi hover trên desktop; trên mobile dùng swipe gallery.
- Zoom/lightbox cho ảnh chi tiết, không tự động mở.
- Swatches màu hiển thị ảnh/variant tương ứng nếu có dữ liệu.
- Chọn size dạng button; disabled nếu variant không tồn tại/hết hàng; hiển thị rõ trạng thái.
- Size guide dạng modal/drawer, có hướng dẫn đo.
- Hiển thị model height/size chỉ khi thông tin được cung cấp thật.
- Thumbnail gallery và ảnh responsive; dùng lazy loading cho ảnh ngoài màn hình.
- Skeleton loading và empty state thay vì spinner toàn trang kéo dài.
- Add-to-cart confirmation dạng drawer/toast; không bắt khách chuyển trang bất ngờ.
- Giữ lựa chọn size/color khi quay lại trang sản phẩm.
- Motion nhỏ 150–250ms, hỗ trợ `prefers-reduced-motion`; không dùng hiệu ứng làm layout nhảy.
- Tối ưu Core Web Vitals; ảnh đẹp nhưng không để file quá lớn làm chậm trang.

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
