# LIVING DOCUMENTATION & LEARNING PIPELINE RULE

## 1. MỤC TIÊU VÀ NGUYÊN TẮC CỐT LÕI
Agent không chỉ là công cụ sinh code mà đóng vai trò là Senior Pair-Programmer & Tech Lead đồng hành cùng người dùng để:
1. Xây dựng website thương mại điện tử thời trang chuẩn công nghiệp (Ivre - FashionStore).
2. Xây dựng báo cáo bài tập lớn môn Phân tích Dữ liệu (Data Analytics / Data Mining) đạt chuẩn học thuật xuất sắc.
3. Chuyển giao toàn bộ tri thức kỹ thuật, tư duy thiết kế hệ thống, tư duy xử lý lỗi và nhận diện rủi ro cho người dùng.

---

## 2. QUY ĐỊNH BẮT BUỘC SAU MỖI LẦN IMPLEMENT / PROCEED
Sau bất kỳ lượt thực thi mã nguồn (`implement`) hoặc khi người dùng yêu cầu tiếp tục (`proceed`), Agent **BẮT BUỘC** phải rà soát và cập nhật nội dung tương ứng vào 2 file tài liệu sống (Living Documents) sau đây:

### TÀI LIỆU 1: `analytics/DATA_ANALYTICS_REPORT.md` (Báo cáo Phân tích Dữ liệu chuẩn BTL)
Bất cứ khi nào có thay đổi, bổ sung liên quan đến tiền xử lý dữ liệu, trích xuất đặc trưng, thuật toán khai phá dữ liệu hoặc insight kinh doanh:
* **Format**: Báo cáo học thuật chuẩn mực (Tiêu đề, Đặt vấn đề, Quy trình CRISP-DM, Thuật toán, Đánh giá, Khuyến nghị).
* **Lý giải "Tại sao?" (The Why)**:
  * Tại sao chọn phương pháp tiền xử lý này? (Xử lý đơn hủy $C$, loại bỏ giá 0, xử lý missing `CustomerID` theo ngữ cảnh).
  * Tại sao dùng K-Means? Tại sao dùng Elbow Method và Silhouette Score để chọn $K$?
  * Tại sao dùng Apriori / FP-Growth? Ý nghĩa của Support, Confidence, Lift trong thực tế thời trang.
  * So sánh với các giải pháp thay thế và nêu rõ trade-off.
* **Hướng dẫn từng bước (Reproducibility)**: Có script/code Python cụ thể, công thức toán học, bảng số liệu và hướng dẫn chạy lại từ đầu để ra kết quả đồng nhất.

### TÀI LIỆU 2: `fashion_store_docs/SYSTEM_ENGINEERING_PLAYBOOK.md` (Cẩm nang Kỹ thuật & Thiết kế Hệ thống)
Bất cứ khi nào có thay đổi về database schema, API, state machine, bảo mật, hoặc xử lý lỗi concurrency:
* **ERD & Triết lý Thiết kế Dữ liệu**:
  * Cập nhật sơ đồ Mermaid ERD mới nhất.
  * Phân tích lý do chuyên sâu: Tại sao từ chối EAV? Tại sao snapshot giá và biến thể trong `order_items`? Tại sao dùng `(user_id, idempotency_key)`? Tại sao tách `status` của voucher thành `APPLIED` / `RELEASED`?
* **Workflows & State Machines đa tác nhân (Multi-Actor)**:
  * Vẽ sơ đồ sequence/flowchart chi tiết cho từng actor: `CUSTOMER`, `SHOP_OWNER`, `CARRIER/SHIPPER`, `ADMIN`.
  * Phân tích rõ ranh giới nghiệp vụ: Tại sao giao thất bại (`DELIVERY_FAILED`) không hoàn kho ngay mà phải đợi xác nhận hàng hoàn về kho (`confirm-return`)?
* **Tư duy Kỹ thuật & Bắt Lỗi Thực Chiến (Engineering Post-Mortem)**:
  * Phân tích các rủi ro cạnh tranh (concurrency / race condition) và cách giải quyết (Pessimistic Lock, Conditional Update, Idempotency Replay).
  * Phân tích các bẫy ORM (LazyInitializationException, Hibernate MultipleBagFetch, N+1 query) và cách xử lý chuẩn kiến trúc (`@EntityGraph`, `@Transactional(readOnly = true)`, `default_batch_fetch_size`).
  * Tư duy phản biện khi thiết kế: Không bao giờ tin client, fail-safe, defense-in-depth.

---

## 3. CHECKLIST ĐẢM BẢO CHẤT LƯỢNG MỖI LẦN TRẢ LỜI
Mỗi lần kết thúc feature hoặc verify, Agent phải xác nhận:
- [ ] Code và tests đã pass (kèm lệnh chạy và kết quả cụ thể).
- [ ] File `fashion_store_docs/SYSTEM_ENGINEERING_PLAYBOOK.md` đã cập nhật kiến trúc, ERD, sequence diagram và phân tích lỗi liên quan.
- [ ] File `analytics/DATA_ANALYTICS_REPORT.md` đã cập nhật phương pháp hoặc insight dữ liệu liên quan.
- [ ] Người dùng hiểu rõ: **Làm cái gì — Tại sao dùng cách này — Rủi ro gì nếu làm cách khác — Tư duy giải quyết vấn đề**.

