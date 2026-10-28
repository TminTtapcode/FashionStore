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

## 7. Kiến trúc Giao diện Quản trị Shop Owner & Điều phối Route (`/owner`)

### 7.1. Single SPA Routing theo ADR-012
- Tuân thủ nghiêm ngặt nguyên lý kiến trúc ADR-012: Toàn bộ hệ thống frontend là một Single Page Application duy nhất, không cài đặt thêm thư viện router bên thứ ba cồng kềnh (như `react-router-dom` hay TanStack Router) nhằm giữ bundle size siêu gọn (~109 kB gzip) và tốc độ tải trang tức thì.
- Phân luồng giữa Storefront (`/`) và Cổng Quản trị Atelier (`/owner`) được điều phối qua Browser History API chuẩn mực (`window.history.pushState` và sự kiện `popstate`):
  ```typescript
  // App.tsx điều phối cấp cao nhất:
  {currentPath.startsWith('/owner') ? (
    <OwnerPortal onNavigateStorefront={() => navigateTo('/')} />
  ) : (
    <StorefrontContent onNavigateOwner={() => navigateTo('/owner')} />
  )}
  ```

### 7.2. Tầng Phòng vệ Phân quyền RBAC Gate
- Component `OwnerPortal.tsx` đóng vai trò là một chốt chặn bảo mật (Security Gate):
  1. **Loading State**: Hiển thị Atelier Brand Loader trong lúc `useAuth()` xác thực session qua cookie HttpOnly.
  2. **401 Unauthorized Screen**: Khi người dùng chưa đăng nhập (Guest), hiển thị màn hình yêu cầu xác thực với nút "ĐĂNG NHẬP ATELIER" kích hoạt `openAuthModal('login')`.
  3. **403 Forbidden Screen**: Khi người dùng đã đăng nhập nhưng chỉ có role `CUSTOMER` (không có role `SHOP_OWNER` hoặc `ADMIN`), hiển thị màn hình từ chối quyền truy cập kèm thông tin email hiện tại và nút điều hướng "VỀ TRANG CHỦ MUA SẮM".
  4. **Authorized Owner Shell**: Khi người dùng có role hợp lệ (`SHOP_OWNER` hoặc `ADMIN`), hiển thị toàn bộ giao diện quản trị Atelier Dark Luxe.

### 7.3. Cấu trúc Component Cổng Quản trị Atelier
```text
frontend/src/
  ├── components/owner/
  │     ├── OwnerPortal.tsx               # Shell quản trị, RBAC Gate, Top Header & Sidebar
  │     ├── OwnerOrdersView.tsx           # Bảng điều hành đơn hàng, bộ lọc trạng thái, pagination
  │     ├── OwnerOrderDetailModal.tsx     # Modal chi tiết đơn, thông tin giao hàng, tài chính & Timeline
  │     ├── OwnerActionConfirmModal.tsx   # Modal xác nhận thao tác chuyển trạng thái đơn hàng
  │     ├── OwnerProductsView.tsx         # Bảng catalog quản trị, tab DRAFT/ACTIVE/HIDDEN/ARCHIVED
  │     ├── OwnerProductDetailModal.tsx   # Modal tạo/sửa sản phẩm, Quick Matrix Generator, bảng biến thể
  │     └── OwnerProductStatusModal.tsx   # Modal chuyển vòng đời sản phẩm, kiểm soát điều kiện tiên quyết
  └── api/
        ├── ownerOrderApi.ts              # Client API kết nối /api/v1/owner/orders/**
        └── ownerProductApi.ts            # Client API kết nối /api/v1/owner/products/**
```

### 7.4. Ranh giới API Tách biệt giữa Storefront và Owner
- **Customer Endpoints (`/api/v1/orders/**`, `/api/v1/products/**`)**: Khách hàng chỉ xem sản phẩm `ACTIVE` có biến thể `ACTIVE`, và chỉ thao tác trên các đơn hàng gắn với `authPrincipal.getUserId()`.
- **Owner Endpoints (`/api/v1/owner/**`)**: Được bảo vệ toàn diện bởi `@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")`. Backend lọc và xác thực quyền quản trị trên dữ liệu của cửa hàng (`shopId = 1`), không cho phép truy cập trái phép.

### 7.5. Kiến trúc Quản trị Sản phẩm & Biến thể (Phase 5C.2)
- **API Boundary**: Mọi endpoint quản trị sản phẩm nằm tại `/api/v1/owner/products/**`, tách biệt hoàn toàn khỏi `/api/v1/products/**` của Storefront:
  - `GET /api/v1/owner/products`: Danh sách phân trang, tìm kiếm và lọc theo trạng thái (`ALL`, `ACTIVE`, `DRAFT`, `HIDDEN`, `ARCHIVED`) hoặc danh mục.
  - `GET /api/v1/owner/products/{id}`: Chi tiết toàn diện sản phẩm, danh sách biến thể, ảnh lookbook, cờ cảnh báo lịch sử đơn hàng (`hasOrders`).
  - `POST /api/v1/owner/products`: Tạo mới sản phẩm kèm tùy chọn ma trận biến thể ban đầu trong một transaction nguyên tử.
  - `PUT /api/v1/owner/products/{id}`: Cập nhật thông tin chung của sản phẩm (tên, danh mục, chất liệu, form dáng, bảo quản, mô tả).
  - `PATCH /api/v1/owner/products/{id}/status`: Chuyển đổi trạng thái vòng đời sản phẩm (`DRAFT`, `ACTIVE`, `HIDDEN`, `ARCHIVED`) kèm kiểm tra điều kiện tiên quyết.
  - `POST /api/v1/owner/products/{id}/variants`: Bổ sung biến thể mới vào sản phẩm đã có.
  - `PUT /api/v1/owner/products/{id}/variants/{variantId}`: Cập nhật thông tin biến thể (bảo vệ bất biến SKU nếu đã có đơn hàng).
  - `DELETE /api/v1/owner/products/{id}/variants/{variantId}`: Xóa biến thể (chặn nếu đã có đơn hàng).
  - `DELETE /api/v1/owner/products/{id}`: Xóa sản phẩm (chặn nếu đã có đơn hàng trong hệ thống).
- **Transaction Boundaries & DTO Isolation**:
  - DTOs được đóng gói riêng biệt trong `com.fashionstore.catalog.dto.owner.*`, ngăn chặn triệt để lỗ hổng Mass-Assignment và Over-Posting.
  - Toàn bộ các thao tác ghi dữ liệu được bọc trong `@Transactional(rollbackFor = Exception.class)`, bảo đảm tính toàn vẹn tuyệt đối khi sinh ma trận biến thể hoặc kiểm tra ràng buộc SKU trùng lặp.

## 8. Kiến trúc Sổ Cái Quản Trị Tồn Kho Bất Biến (Phase 5C.3 — Immutable Inventory Ledger Architecture)

### 8.1. Flyway Migration V8 & Chiến lược Chuyển đổi Số dư Mở sổ (Cutover Migration)
- Tập tin `V8__create_inventory_ledger.sql` tạo lập bảng `inventory_movements`:
  - Khóa chính `id BIGINT AUTO_INCREMENT`.
  - Khóa ngoại `variant_id BIGINT NOT NULL` tham chiếu `product_variants(id)` với hành vi `ON DELETE RESTRICT` nhằm ngăn chặn xóa mất dấu vết lịch sử kế toán.
  - Cột `quantity_delta INT NOT NULL` (giá trị biến động âm hoặc dương).
  - Cột snapshot `stock_before INT NOT NULL` và `stock_after INT NOT NULL`.
  - Chỉ mục duy nhất `uk_inv_movement_key (movement_key)` ngăn chặn nhân đôi bản ghi kiểm toán khi mạng chập chờn hoặc retry request.
  - Các chỉ mục tối ưu hóa tìm kiếm: `idx_inv_movements_variant_created (variant_id, created_at DESC)`, `idx_inv_movements_ref (reference_id)`.
- **Chiến lược Cutover**: Ngay trong script migration V8, một câu lệnh SQL tự động khởi tạo dòng `OPENING_BALANCE` cho toàn bộ 32 biến thể hiện có:
  ```sql
  INSERT INTO inventory_movements (
      variant_id, movement_type, quantity_delta, stock_before, stock_after, 
      reference_id, movement_key, reason, created_by, created_at
  )
  SELECT 
      id, 'OPENING_BALANCE', stock_quantity, 0, stock_quantity,
      'CUTOVER-V8', CONCAT('OPENING-CUTOVER-V8-VAR-', id),
      'Số dư mở sổ ban đầu khi triển khai Phase 5C.3 Inventory Ledger',
      NULL, CURRENT_TIMESTAMP
  FROM product_variants;
  ```
  Nhờ đó, tính toàn vẹn toán học $\text{Current} == \text{Opening} + \sum \Delta$ được thỏa mãn tuyệt đối 100% ngay từ giây phút đầu tiên hệ thống vận hành.

### 8.2. Mẫu Thiết kế Sổ cái Append-Only (Append-Only Ledger Pattern)
- **Tính Bất biến (Immutability)**: Bảng `inventory_movements` chỉ hỗ trợ duy nhất thao tác `INSERT`. Tuyệt đối không cung cấp bất kỳ API hoặc phương thức repository nào cho phép `UPDATE` hoặc `DELETE` dòng kiểm toán.
- **Truy xuất Nguồn gốc 2 Chiều**: Mọi giao dịch nhập/xuất đều lưu vết mã chứng từ tham chiếu (`reference_id`), người thực hiện (`created_by`), lý do (`reason`), số tồn trước (`stock_before`), số tồn sau (`stock_after`) và dấu thời gian chính xác (`created_at`).

### 8.3. Khóa Bi quan & Kiểm soát Cạnh tranh (Pessimistic Locking Concurrency)
- Trong `InventoryService`, mọi hành vi điều chỉnh tồn kho đều kích hoạt câu truy vấn khóa hàng:
  ```java
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT v FROM ProductVariant v WHERE v.id = :id")
  Optional<ProductVariant> findByIdWithLock(@Param("id") Long id);
  ```
- Lợi ích kiến trúc:
  1. Loại bỏ triệt để hiện tượng **Lost Updates** khi nhiều đơn hàng cùng mua một size hoặc khi chủ shop đang nhập hàng cùng lúc với khách checkout.
  2. Đảm bảo số lượng `stock_before` đọc được là số tồn nguyên tử tuyệt đối tại thời điểm khóa hàng, và `stock_after = stock_before + delta` luôn chính xác.
  3. Kiểm tra điều kiện tồn kho sau biến động `stock_after >= 0`; nếu vi phạm lập tức rollback transaction và ném ngoại lệ `INSUFFICIENT_STOCK`.

### 8.4. Ranh giới Phân hệ & Cấu trúc Component Quản trị Tồn kho
```text
backend/src/main/java/com/fashionstore/
  ├── inventory/
  │     ├── domain/
  │     │     ├── InventoryMovement.java         # JPA Entity ánh xạ inventory_movements
  │     │     └── InventoryMovementType.java     # Enum 7 loại nghiệp vụ kho
  │     ├── infrastructure/
  │     │     └── InventoryMovementRepository.java # Truy vấn sumDelta, findOpeningBalance, findByMovementKey
  │     ├── application/
  │     │     └── InventoryService.java          # Cơ quan thẩm quyền trung tâm duy nhất quản lý tồn kho
  │     ├── api/
  │     │     └── OwnerInventoryController.java  # REST Controller /api/v1/owner/inventory/** (RBAC Gate)
  │     └── dto/
  │           ├── InventoryMovementDto.java
  │           ├── InventorySummaryDto.java
  │           ├── InventoryReconciliationDto.java
  │           ├── StockReceiptRequest.java
  │           └── ManualAdjustmentRequest.java
frontend/src/
  ├── components/owner/
  │     ├── OwnerInventoryView.tsx               # Bảng tổng quan tồn kho, tìm kiếm, lọc danh mục & thẻ thống kê
  │     ├── OwnerInventoryLedgerDrawer.tsx       # Ngăn kéo sổ cái lịch sử & thẻ đối soát toán học tự động
  │     ├── OwnerStockReceiptModal.tsx           # Hộp thoại nhập hàng bổ sung kèm dự phóng tồn kho
  │     └── OwnerStockAdjustmentModal.tsx        # Hộp thoại kiểm kê điều chỉnh với xác thực âm kho
  └── api/
        └── ownerInventoryApi.ts                 # REST client kết nối module inventory
```
