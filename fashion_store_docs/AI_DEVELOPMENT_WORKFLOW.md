# AI Development Workflow — Antigravity

## 1. Vai trò
AI là coding partner/mentor, không phải người tự quyết định nghiệp vụ. User là người duyệt requirement và trade-off. Không giao một prompt “build toàn bộ ecommerce”.

## 2. Prompt khởi động repository
Dán prompt sau vào Antigravity:

> Đọc lần lượt `README.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `BUSINESS_FLOWS.md`, `API_CONVENTIONS.md`, `SECURITY.md`, `FRONTEND_UX.md`, `TESTING_AND_DEPLOYMENT.md`, `ROADMAP.md` và `AI_DEVELOPMENT_WORKFLOW.md`.
> Chưa sửa code. Khảo sát repository hiện có, stack/version, cấu trúc folder, migration, API, tests và trạng thái Git. Báo cáo:
> 1. Những gì đã tồn tại và bằng chứng file cụ thể.
> 2. Chênh lệch so với docs.
> 3. Rủi ro dữ liệu/bảo mật.
> 4. Đề xuất bước nhỏ tiếp theo.
> Không tự ý cài dependency, đổi kiến trúc hoặc xóa file.

## 3. Prompt làm một feature
> Thực hiện feature: [TÊN FEATURE].
> Bước 1 — Discovery: đọc code liên quan, chỉ ra API/UI/DB/service/tests hiện tại.
> Bước 2 — Requirements: viết user story, acceptance criteria, validation, quyền truy cập và edge cases.
> Bước 3 — Design: mô tả DB changes, API contract, business flow, UI states và test plan. Nêu ít nhất một phương án đơn giản và trade-off.
> Dừng để tôi duyệt nếu có quyết định nghiệp vụ, thay schema/API breaking hoặc thay dependency/kiến trúc.
> Bước 4 — Implement sau khi được duyệt: làm vertical slice backend + frontend, không chỉ tạo UI giả.
> Bước 5 — Verify: chạy các test/build/lint liên quan và báo chính xác command/kết quả; nếu không chạy được, nói rõ.
> Bước 6 — Docs: cập nhật docs, ghi file thay đổi, assumptions và rủi ro còn lại.
> Tuân thủ PROJECT_CONTEXT và SECURITY; không thêm công nghệ ngoài baseline nếu chưa giải thích.

## 4. Chế độ học cùng AI
Sau mỗi feature, yêu cầu agent giải thích theo thứ tự:
1. Requirement và actor.
2. Data model và quan hệ.
3. Request/response sequence.
4. Business rules và state transitions.
5. Transaction/concurrency.
6. Security/authorization.
7. Tests và lý do chọn từng loại.
8. Production failure modes.
9. Có thể đơn giản hóa gì, và khi nào cần nâng cấp.
Yêu cầu giải thích file/class cụ thể và một request chạy xuyên suốt frontend → backend → DB.

## 5. Quy tắc code agent
- Không sửa file ngoài phạm vi feature nếu không giải thích.
- Không dùng TODO/mock để giả vờ hoàn tất nghiệp vụ.
- Không catch exception rồi bỏ qua.
- Không trả entity trực tiếp.
- Không tin dữ liệu nhạy cảm/giá/role/shopId từ client.
- Không thêm Redis/queue/microservice chỉ vì “scalability”.
- Không sửa migration đã chạy ở môi trường dùng chung; tạo migration mới.
- Không xóa test để làm pipeline xanh.
- Không báo test pass nếu chưa chạy.
- Trước khi đổi dependency lớn, nêu lợi ích, rủi ro, phương án không thêm dependency.
- Nếu docs và code mâu thuẫn, báo cáo mâu thuẫn và xin quyết định thay vì đoán.

## 6. Definition of Done
Feature chỉ xong khi:
- Acceptance criteria được đáp ứng.
- Loading/error/empty/success UI đã được xử lý nếu có UI.
- Backend validation + authorization có test.
- Các edge cases quan trọng có test.
- Migration/API docs được cập nhật.
- Không có secret trong code.
- Build/test phù hợp đã chạy.
- Có hướng dẫn manual verification.
- User hiểu được luồng chính và lý do thiết kế.
