# Architecture

## 1. Kiến trúc tổng thể

```text
Browser (mobile / tablet / desktop)
        |
     HTTPS
        |
DNS / CDN (khi deploy)
        |
Reverse proxy / platform ingress
        |
React + TypeScript storefront/admin UI
        | HTTPS JSON API
Spring Boot Modular Monolith
  ├── identity
  ├── catalog
  ├── cart
  ├── checkout
  ├── order
  ├── payment
  ├── promotion
  ├── customer
  ├── inventory
  ├── review
  └── administration / audit
        |
      MySQL
        |
External providers: image storage, email, payment gateway
```

Ở MVP, frontend và backend có thể deploy riêng hoặc frontend được phục vụ qua CDN/static hosting. Backend chỉ cần một instance nếu lưu lượng thấp. Thiết kế phải stateless để sau này có thể chạy nhiều instance, nhưng không cần mua load balancer hoặc triển khai HA ngay lập tức.

## 2. Modular Monolith
Một ứng dụng Spring Boot, một database logic ban đầu, module tách theo nghiệp vụ. Mỗi module sở hữu logic và repository của mình. Không để controller/repository của module A truy cập trực tiếp entity/repository nội bộ của module B. Giao tiếp qua service interface hoặc application-level contract có chủ đích.

Gợi ý package:
```text
com.store
  common
    api
    exception
    security
    config
    observability
  identity
    api
    application
    domain
    infrastructure
  catalog
  inventory
  cart
  checkout
  order
  payment
  promotion
  customer
  review
  administration
```
Không bắt buộc tạo bốn lớp cho mọi CRUD nhỏ nếu chỉ làm tăng boilerplate. Giữ ranh giới module, sau đó dùng cấu trúc đơn giản nhất có thể đọc và test.

## 3. Luồng request
1. Request vào controller.
2. Authentication xác định principal (nếu endpoint cần đăng nhập).
3. Authorization kiểm tra role và quyền trên tài nguyên cụ thể.
4. Bean Validation kiểm tra shape/range dữ liệu.
5. Application service thực thi use case và transaction.
6. Domain/business logic kiểm tra invariant.
7. Repository truy cập DB.
8. DTO response trả về; lỗi đi qua exception handler thống nhất.

## 4. Mở rộng theo nhu cầu
### Giai đoạn đầu
- Một backend instance.
- MySQL managed hoặc một instance được backup tự động.
- Object storage/CDN cho ảnh.
- Pagination và index hợp lý.
- Logging, metrics tối thiểu, health endpoint.

### Khi tải tăng
- Đo p95/p99 latency, CPU/RAM, slow queries, error rate trước khi tối ưu.
- Scale up instance/DB trước nếu đây là cách đơn giản và hiệu quả.
- Làm backend stateless; lưu session/token/revocation state theo thiết kế phù hợp.
- Thêm nhiều backend instances + load balancer khi có tải/availability rationale.
- Dùng Redis cho dữ liệu đọc nhiều, có chiến lược TTL/invalidation và không dùng cache làm nguồn sự thật của tồn kho/đơn hàng.
- Dùng worker/queue cho email, export báo cáo và tác vụ chậm khi thực sự cần.
- Tách module thành service riêng chỉ khi có ranh giới nghiệp vụ, tải, ownership hoặc yêu cầu triển khai độc lập đã được chứng minh.

## 5. Tính nhất quán
- MySQL là nguồn sự thật cho giá, order, payment state và inventory.
- Tồn kho và tạo order phải được bảo vệ bằng transaction/locking hoặc conditional atomic update.
- Với external payment, không giữ DB transaction mở trong lúc gọi gateway. Tạo trạng thái chờ, gọi provider, sau đó xử lý callback/webhook idempotently.
- Gửi email sau commit hoặc qua outbox/worker khi mức độ tin cậy cần thiết; tránh gửi email giữa transaction DB dài.

## 6. Các điểm cần chú ý
- CORS chỉ cho phép origin cần thiết ở production.
- TLS/HTTPS ở môi trường public.
- Không log password, token, secret, thông tin thanh toán nhạy cảm.
- Health/readiness check không tiết lộ thông tin nội bộ.
- Migration phải chạy theo release có kiểm soát.
- Backup cần thử restore định kỳ; “có file backup” chưa đủ.
