package com.fashionstore.inventory.application;

import com.fashionstore.catalog.domain.CategoryRepository;
import com.fashionstore.catalog.domain.Product;
import com.fashionstore.catalog.domain.ProductImage;
import com.fashionstore.catalog.domain.ProductVariant;
import com.fashionstore.catalog.domain.ProductVariantRepository;
import com.fashionstore.catalog.domain.ProductVariantStatus;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.inventory.domain.InventoryMovement;
import com.fashionstore.inventory.domain.InventoryMovementRepository;
import com.fashionstore.inventory.domain.InventoryMovementType;
import com.fashionstore.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InventoryService {

    private final ProductVariantRepository variantRepository;
    private final InventoryMovementRepository movementRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public InventoryService(
            ProductVariantRepository variantRepository,
            InventoryMovementRepository movementRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.variantRepository = variantRepository;
        this.movementRepository = movementRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Records initial stock for a newly created variant in the catalog.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovement recordInitialStockForNewVariant(ProductVariant variant, int initialStock,
            Long actorUserId) {
        String movementKey = "INIT-" + variant.getId();
        if (movementRepository.existsByMovementKey(movementKey)) {
            return movementRepository.findByMovementKey(movementKey).orElseThrow();
        }

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.INITIAL_STOCK,
                initialStock,
                0,
                initialStock,
                "CATALOG_CREATE",
                String.valueOf(variant.getProduct().getId()),
                movementKey,
                actor,
                "Tồn kho khởi tạo ban đầu khi tạo mới biến thể " + variant.getSku());

        return movementRepository.save(movement);
    }

    /**
     * Atomically deducts Available-to-Sell (ATS) stock for an order item inside
     * checkout transaction.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovement deductStockForOrder(Long orderId, String orderNumber, Long variantId, int quantity,
            Long actorUserId) {
        if (quantity <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Số lượng trừ tồn kho phải lớn hơn 0");
        }

        String movementKey = "ORDER-" + orderNumber + "-" + variantId;
        Optional<InventoryMovement> existing = movementRepository.findByMovementKey(movementKey);
        if (existing.isPresent()) {
            return existing.get(); // Idempotent return
        }

        ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        if (variant.getStatus() != ProductVariantStatus.ACTIVE) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "VARIANT_UNAVAILABLE",
                    "Phân loại hàng '" + variant.getProduct().getName() + " - " + variant.getSize()
                            + "' hiện đã tạm ngừng kinh doanh");
        }

        int stockBefore = variant.getStockQuantity();
        if (stockBefore < quantity) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INSUFFICIENT_STOCK",
                    "Sản phẩm '" + variant.getProduct().getName() + " (" + variant.getSize() + " - "
                            + variant.getColorName() + ")' không đủ tồn kho khả dụng (còn: " + stockBefore + ", cần: "
                            + quantity + ")");
        }

        int stockAfter = stockBefore - quantity;
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.ORDER_DEDUCT,
                -quantity,
                stockBefore,
                stockAfter,
                "ORDER",
                orderNumber,
                movementKey,
                actor,
                "Trừ tồn kho khả dụng cho đơn hàng #" + orderNumber);

        return movementRepository.save(movement);
    }

    /**
     * Restores Available-to-Sell stock when an order is cancelled prior to
     * shipping.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovement restoreStockForCancellation(Long orderId, String orderNumber, Long variantId, int quantity,
            Long actorUserId, String reason) {
        if (quantity <= 0) {
            return null;
        }

        String movementKey = "CANCEL-" + orderNumber + "-" + variantId;
        Optional<InventoryMovement> existing = movementRepository.findByMovementKey(movementKey);
        if (existing.isPresent()) {
            return existing.get(); // Prevent double restore
        }

        ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        int stockBefore = variant.getStockQuantity();
        int stockAfter = stockBefore + quantity;
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.CANCEL_RESTORE,
                quantity,
                stockBefore,
                stockAfter,
                "ORDER_CANCEL",
                orderNumber,
                movementKey,
                actor,
                reason != null && !reason.isBlank() ? reason : "Hoàn tồn kho khả dụng do hủy đơn hàng #" + orderNumber);

        return movementRepository.save(movement);
    }

    /**
     * Restores stock when a delivery failure is physically received back at the
     * warehouse.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovement restoreStockForReturn(Long orderId, String orderNumber, Long variantId, int quantity,
            Long actorUserId, String reason) {
        if (quantity <= 0) {
            return null;
        }

        String movementKey = "RETURN-" + orderNumber + "-" + variantId;
        Optional<InventoryMovement> existing = movementRepository.findByMovementKey(movementKey);
        if (existing.isPresent()) {
            return existing.get(); // Prevent duplicate restore
        }

        ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        int stockBefore = variant.getStockQuantity();
        int stockAfter = stockBefore + quantity;
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.RETURN_RESTORE,
                quantity,
                stockBefore,
                stockAfter,
                "ORDER_RETURN",
                orderNumber,
                movementKey,
                actor,
                reason != null && !reason.isBlank() ? reason
                        : "Hoàn tồn kho sau khi bưu tá giao hàng trả về kho cho đơn #" + orderNumber);

        return movementRepository.save(movement);
    }

    /**
     * Records initial stock for a newly created variant.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovement recordInitialStock(Long variantId, int initialStock, Long actorUserId, String reason) {
        if (initialStock <= 0) {
            return null;
        }

        String movementKey = "INIT-" + variantId;
        var existing = movementRepository.findByMovementKey(movementKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.INITIAL_STOCK,
                initialStock,
                0,
                initialStock,
                "PRODUCT_CREATION",
                variant.getSku(),
                movementKey,
                actor,
                reason != null && !reason.isBlank() ? reason : "Tồn kho ban đầu khi tạo biến thể");

        return movementRepository.save(movement);
    }

    /**
     * Owner records newly received stock from supplier/factory.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovementDto recordStockReceipt(StockReceiptRequest request, Long actorUserId) {
        if (request.quantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Số lượng nhập kho phải lớn hơn 0");
        }

        ProductVariant variant = variantRepository.findByIdForUpdate(request.variantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + request.variantId()));

        int stockBefore = variant.getStockQuantity();
        int stockAfter = stockBefore + request.quantity();
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        String movementKey = "RECEIPT-" + UUID.randomUUID();

        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.STOCK_RECEIPT,
                request.quantity(),
                stockBefore,
                stockAfter,
                "RECEIPT",
                request.referenceNumber(),
                movementKey,
                actor,
                request.reason());

        InventoryMovement saved = movementRepository.save(movement);
        return toMovementDto(saved);
    }

    /**
     * Owner records manual stock adjustment for inventory audit discrepancies.
     */
    @Transactional(rollbackFor = Exception.class)
    public InventoryMovementDto recordManualAdjustment(ManualAdjustmentRequest request, Long actorUserId) {
        if (request.quantityDelta() == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DELTA", "Độ lệch kiểm kê phải khác 0");
        }

        ProductVariant variant = variantRepository.findByIdForUpdate(request.variantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + request.variantId()));

        int stockBefore = variant.getStockQuantity();
        int stockAfter = stockBefore + request.quantityDelta();

        if (stockAfter < 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "NEGATIVE_STOCK_FORBIDDEN",
                    "Tồn kho sau điều chỉnh không được nhỏ hơn 0 (Hiện tại: " + stockBefore + ", giảm: "
                            + Math.abs(request.quantityDelta()) + ")");
        }

        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        String movementKey = "ADJUST-" + UUID.randomUUID();

        InventoryMovement movement = new InventoryMovement(
                variant,
                InventoryMovementType.MANUAL_ADJUSTMENT,
                request.quantityDelta(),
                stockBefore,
                stockAfter,
                "MANUAL_ADJUSTMENT",
                null,
                movementKey,
                actor,
                request.reason());

        InventoryMovement saved = movementRepository.save(movement);
        return toMovementDto(saved);
    }

    /**
     * Paginated ledger audit history for a specific variant.
     */
    @Transactional(readOnly = true)
    public PageResponse<InventoryMovementDto> getVariantLedger(Long variantId, int page, int size) {
        if (!variantRepository.existsById(variantId)) {
            throw new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId);
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        Page<InventoryMovement> movementPage = movementRepository.findByVariantIdOrderByCreatedAtDescIdDesc(variantId,
                pageable);

        List<InventoryMovementDto> items = movementPage.getContent().stream()
                .map(this::toMovementDto)
                .toList();

        return new PageResponse<>(
                items,
                movementPage.getNumber(),
                movementPage.getSize(),
                movementPage.getTotalElements(),
                movementPage.getTotalPages(),
                movementPage.hasNext(),
                movementPage.hasPrevious());
    }

    /**
     * Reconciles a variant's current stock against the cumulative sum of all ledger
     * movements.
     */
    @Transactional(readOnly = true)
    public InventoryReconciliationDto reconcileVariant(Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        int currentStock = variant.getStockQuantity();
        int sumDelta = movementRepository.sumDeltaByVariantId(variantId);

        Optional<InventoryMovement> opening = movementRepository.findOpeningBalanceByVariantId(variantId);
        int openingBalance = opening.map(InventoryMovement::getQuantityDelta).orElse(0);
        int postOpeningDelta = sumDelta - openingBalance;

        int calculatedStock = openingBalance + postOpeningDelta;
        int discrepancy = currentStock - calculatedStock;
        boolean isBalanced = (discrepancy == 0);

        return new InventoryReconciliationDto(
                variant.getId(),
                variant.getSku(),
                variant.getProduct().getName(),
                currentStock,
                openingBalance,
                postOpeningDelta,
                sumDelta,
                calculatedStock,
                discrepancy,
                isBalanced);
    }

    /**
     * Store-wide inventory metrics across all variants:
     * Guarantees totalSku = healthyStockSku + lowStockSku + outOfStockSku.
     */
    @Transactional(readOnly = true)
    public InventoryGlobalStatsDto getGlobalInventoryStats() {
        long totalSku = variantRepository.count();
        long healthy = variantRepository.countHealthyStock();
        long low = variantRepository.countLowStock();
        long out = variantRepository.countOutOfStock();
        long totalUnits = variantRepository.sumTotalStockUnits();
        return new InventoryGlobalStatsDto(totalSku, healthy, low, out, totalUnits);
    }

    /**
     * Lists inventory overview across all variants with filter by category, search,
     * and stock status.
     */
    @Transactional(readOnly = true)
    public PageResponse<InventorySummaryDto> getInventoryOverview(
            int page, int size, String stockStatus, Long categoryId, String search) {

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "id"));
        Page<ProductVariant> variantPage = variantRepository.findAll((root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (categoryId != null) {
                List<Long> catIds = categoryRepository.findSelfAndChildIds(categoryId);
                if (catIds != null && !catIds.isEmpty()) {
                    predicates.add(root.get("product").get("category").get("id").in(catIds));
                }
            }

            if (stockStatus != null && !stockStatus.isBlank()) {
                switch (stockStatus.toUpperCase()) {
                    case "OUT_OF_STOCK" -> predicates.add(cb.equal(root.get("stockQuantity"), 0));
                    case "LOW_STOCK" -> {
                        predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
                        predicates.add(cb.lessThanOrEqualTo(root.get("stockQuantity"), 5));
                    }
                    case "IN_STOCK" -> predicates.add(cb.greaterThan(root.get("stockQuantity"), 5));
                }
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var skuMatch = cb.like(cb.lower(root.get("sku")), pattern);
                var prodMatch = cb.like(cb.lower(root.get("product").get("name")), pattern);
                predicates.add(cb.or(skuMatch, prodMatch));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, pageable);

        List<InventorySummaryDto> items = variantPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        return new PageResponse<>(
                items,
                variantPage.getNumber(),
                variantPage.getSize(),
                variantPage.getTotalElements(),
                variantPage.getTotalPages(),
                variantPage.hasNext(),
                variantPage.hasPrevious());
    }

    private InventoryMovementDto toMovementDto(InventoryMovement m) {
        ProductVariant v = m.getVariant();
        return new InventoryMovementDto(
                m.getId(),
                v.getId(),
                v.getSku(),
                v.getProduct().getName(),
                v.getSize(),
                v.getColorName(),
                m.getMovementType(),
                m.getQuantityDelta(),
                m.getStockBefore(),
                m.getStockAfter(),
                m.getReferenceType(),
                m.getReferenceId(),
                m.getMovementKey(),
                m.getActor() != null ? m.getActor().getFullName() : "SYSTEM",
                m.getReason(),
                m.getCreatedAt());
    }

    private InventorySummaryDto toSummaryDto(ProductVariant v) {
        Product p = v.getProduct();
        String primaryImage = p.getPrimaryImage().map(ProductImage::getImageUrl).orElse(null);

        Optional<InventoryMovement> lastMovement = movementRepository
                .findFirstByVariantIdOrderByCreatedAtDescIdDesc(v.getId());

        return new InventorySummaryDto(
                v.getId(),
                p.getId(),
                p.getName(),
                p.getCategory().getName(),
                v.getSku(),
                v.getSize(),
                v.getColorName(),
                v.getColorHex(),
                v.getPrice(),
                v.getStockQuantity(),
                v.getStatus(),
                primaryImage,
                lastMovement.map(InventoryMovement::getCreatedAt).orElse(null),
                lastMovement.map(m -> m.getMovementType().name()).orElse(null));
    }
}
