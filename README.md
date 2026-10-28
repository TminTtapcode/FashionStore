# Fashion Store — Modular Monolith E-Commerce Platform

Dự án website thương mại điện tử thời trang được phát triển theo kiến trúc **Modular Monolith** sử dụng **Spring Boot 3 (Java 21)** và **React (Vite + TypeScript + Tailwind CSS)**.

---

## 1. Cấu trúc Monorepo

```text
FashionStore/
├── backend/                  # Spring Boot 3.3.x + Java 21 LTS + Maven Wrapper
│   ├── src/main/java/com/fashionstore/
│   │   ├── common/           # Error handling, API envelope, Security, CORS
│   │   ├── identity/         # Users, roles, HttpOnly cookie auth
│   │   ├── catalog/          # Products, variants, categories, images
│   │   ├── cart/             # Shopping cart logic
│   │   ├── order/            # Orders, order items snapshot, transitions
│   │   ├── payment/          # COD reconciliation, payment records
│   │   └── promotion/        # Coupons, Welcome Voucher logic
│   └── src/main/resources/   # application.yml & Flyway migrations
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/                  # Minimalist editorial fashion UI
│   └── package.json
├── fashion_store_docs/       # 12 tài liệu kiến trúc, nghiệp vụ & ADRs
├── docker-compose.yml        # MySQL 8.x local development
├── .env.example              # Mẫu biến môi trường dev
└── README.md
```

---

## 2. Yêu cầu môi trường (Prerequisites)

* **Java:** JDK 21 LTS (`java -version`)
* **Docker & Docker Compose:** (`docker -v` hoặc Docker Desktop)
* **Node.js:** v20+ / v22+ (`node -v`, `npm -v`)

---

## 3. Hướng dẫn khởi chạy nhanh (Quick Start)

### Bước 1: Chuẩn bị biến môi trường & Database

Sao chép file `.env.example` thành `.env` (nếu cần tùy chỉnh):
```bash
cp .env.example .env
```

Khởi động MySQL 8.x bằng Docker Compose:
```bash
docker compose up -d
```
> Kiểm tra MySQL: `docker compose ps` (container `fashion_store_mysql` ở trạng thái Healthy trên port 3307).

---

### Bước 2: Khởi chạy Backend (Spring Boot)

Di chuyển vào thư mục `backend/` và dùng Maven Wrapper:

* Trên Windows (PowerShell / CMD):
  ```powershell
  cd backend
  .\mvnw.cmd spring-boot:run
  ```
* Trên Linux / macOS:
  ```bash
  cd backend
  ./mvnw spring-boot:run
  ```

* Endpoint kiểm tra hệ thống: `http://localhost:8080/api/v1/health`
* Actuator Health: `http://localhost:8080/actuator/health`

---

### Bước 3: Khởi chạy Frontend (React + Vite)

Mở terminal mới và di chuyển vào thư mục `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

* Ứng dụng chạy tại: `http://localhost:5173` (đã cấu hình proxy `/api` sang backend `http://localhost:8080`).

---

## 4. Chạy Kiểm thử (Testing)

* **Backend Tests:**
  ```powershell
  cd backend
  .\mvnw.cmd test
  ```
* **Frontend Build & Typecheck:**
  ```bash
  cd frontend
  npm run build
  ```

---

## 5. Tài liệu kiến trúc & nghiệp vụ

Xem chi tiết trong thư mục `fashion_store_docs/`:
1. `PROJECT_CONTEXT.md` — Mục tiêu, stack và nguyên tắc.
2. `ARCHITECTURE.md` — Kiến trúc Modular Monolith và ranh giới module.
3. `DOMAIN_MODEL.md` — Thực thể, quan hệ và thiết kế bảng.
4. `BUSINESS_FLOWS.md` — Quy trình nghiệp vụ, COD và quản lý đơn hàng.
5. `SECURITY.md` — Bảo mật, HttpOnly Cookie, CSRF và kiểm tra quyền.
6. `DECISIONS.md` — Tổng hợp các Architecture Decision Records (ADR).
