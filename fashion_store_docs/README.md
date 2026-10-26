# Fashion Store — bộ tài liệu khởi tạo dự án

Bộ tài liệu này là nguồn sự thật ban đầu để phát triển website bán quần áo bằng Antigravity IDE + Gemini. Đọc theo thứ tự bên dưới trước khi yêu cầu agent sửa code.

## Thứ tự đọc
1. `PROJECT_CONTEXT.md` — mục tiêu, stack và nguyên tắc dự án.
2. `ARCHITECTURE.md` — kiến trúc và ranh giới module.
3. `DOMAIN_MODEL.md` — thực thể, quan hệ và quy tắc dữ liệu.
4. `BUSINESS_FLOWS.md` — luồng nghiệp vụ và tình huống lỗi.
5. `API_CONVENTIONS.md` — quy ước API.
6. `SECURITY.md` — xác thực, phân quyền và bảo vệ dữ liệu.
7. `FRONTEND_UX.md` — trải nghiệm mua sắm và thiết kế responsive.
8. `TESTING_AND_DEPLOYMENT.md` — kiểm thử, vận hành, backup và triển khai.
9. `AI_DEVELOPMENT_WORKFLOW.md` — cách làm việc với AI theo từng feature.
10. `ROADMAP.md` — các giai đoạn phát triển và tiêu chí hoàn thành.

## Trạng thái
Đây là baseline thiết kế, không phải tuyên bố rằng ứng dụng đã được triển khai. Agent phải khảo sát repository trước khi tạo/sửa code và cập nhật tài liệu khi quyết định được duyệt.

## Quy tắc quan trọng
- Không triển khai toàn bộ hệ thống trong một prompt.
- Mỗi feature phải đi qua: khám phá → yêu cầu → thiết kế → duyệt → triển khai → kiểm thử → cập nhật docs.
- Không tự ý thêm công nghệ/hạ tầng chỉ vì “có thể mở rộng”.
- Không coi frontend ẩn nút là bảo mật; backend phải kiểm tra quyền.
- Không đánh dấu hoàn thành nếu chưa có bằng chứng kiểm thử.
