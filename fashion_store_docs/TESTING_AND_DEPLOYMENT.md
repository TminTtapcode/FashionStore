# Testing, Deployment & Operations

## 1. Testing pyramid
- Unit tests: price/coupon calculations, state transitions, permission policies, validation.
- Integration tests: repository/transaction với MySQL-compatible environment, API + Security, stock concurrency.
- Contract/API tests: request/response/error schema và OpenAPI.
- Frontend tests: critical components/forms and route states.
- E2E smoke: browse product → select variant → add cart → checkout → view order (payment sandbox nếu có).
- Manual acceptance: mobile, desktop, keyboard, network failure, retry, double-click.

Không cố đạt coverage cao bằng test vô nghĩa. Tập trung vào rủi ro tiền, tồn kho, quyền truy cập và trạng thái đơn.

## 2. Local environment
- Maven Wrapper để khóa phiên bản Maven.
- Docker Compose cho MySQL; app có thể chạy từ IDE.
- `.env.example` mô tả tên biến cần thiết nhưng không chứa secret.
- Flyway migration chạy trên DB local; seed data chỉ cho dev/test.
- Có README commands rõ: setup, run, test, build, migration, reset dev database.

## 3. CI
Mỗi pull request nên chạy:
1. Backend compile + unit tests.
2. Backend integration tests theo cấu hình CI.
3. Frontend install lockfile + lint + typecheck + tests + build.
4. Dependency/security scan khi khả thi.
5. Kiểm tra format/migration naming.
Không deploy nếu pipeline critical fail.

## 4. Deployment baseline
- Frontend static hosting/CDN.
- Backend container hoặc managed application runtime.
- Managed MySQL nếu ngân sách cho phép; nếu tự host, phải có backup, monitoring, firewall và restore plan.
- Object storage/CDN cho ảnh.
- Domain + HTTPS.
- Cấu hình production tách khỏi dev.
- Health/readiness checks và graceful shutdown.
- Không cần load balancer nhiều instance cho MVP nếu traffic chưa đòi hỏi.

## 5. Observability
- Structured logs có timestamp, level, request/trace ID.
- Metrics cơ bản: request count, latency p50/p95/p99, 4xx/5xx, DB pool saturation, CPU/RAM, disk, payment failure.
- Không log secrets/PII không cần thiết.
- Alert cho lỗi 5xx tăng, DB unavailable, disk gần đầy, backup thất bại, webhook lỗi kéo dài.
- Error tracking có thể thêm sau khi chọn provider.

## 6. Backup & recovery
- Backup DB tự động theo RPO/RTO đã chọn.
- Lưu backup ngoài máy/volume chính.
- Thử restore sang môi trường tách biệt theo lịch.
- Ghi runbook: phát hiện sự cố, ngăn ghi dữ liệu nếu cần, restore, kiểm tra order/payment, thông báo người dùng.
- File ảnh phải có policy backup/retention hoặc dùng storage có durability phù hợp.
- Không tuyên bố HA 99.9% nếu chưa có đo lường, dự phòng và quy trình vận hành tương ứng.

## 7. Go-live checklist
- [ ] Domain/HTTPS, redirect và CORS chính xác.
- [ ] Database migrations đã được test trên bản sao dữ liệu.
- [ ] Backup và restore đã thử.
- [ ] Seed admin an toàn; không có mật khẩu mặc định công khai.
- [ ] Payment sandbox test và đối soát; production credentials được bảo vệ.
- [ ] Test checkout lỗi/timeout/webhook trùng.
- [ ] Chính sách giao hàng, đổi trả, bảo mật, liên hệ và điều khoản đã được chủ shop kiểm tra.
- [ ] Trang lỗi/404/empty state phù hợp.
- [ ] Theo dõi logs/alerts sau deploy.
- [ ] Có cách rollback frontend/backend và xử lý migration tương thích.
