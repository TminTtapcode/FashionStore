package com.fashionstore.inventory.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.inventory.application.InventoryService;
import com.fashionstore.inventory.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/owner/inventory")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class OwnerInventoryController {

    private final InventoryService inventoryService;

    public OwnerInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Lists inventory overview across all variants with filter by category, search, and stock status.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InventorySummaryDto>>> getInventoryOverview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {

        PageResponse<InventorySummaryDto> data = inventoryService.getInventoryOverview(page, size, stockStatus, categoryId, search);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Paginated audit ledger movements for a specific variant.
     */
    @GetMapping("/variants/{variantId}/ledger")
    public ResponseEntity<ApiResponse<PageResponse<InventoryMovementDto>>> getVariantLedger(
            @PathVariable Long variantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<InventoryMovementDto> data = inventoryService.getVariantLedger(variantId, page, size);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Audits reconciliation between current stock and cumulative ledger delta.
     */
    @GetMapping("/variants/{variantId}/reconcile")
    public ResponseEntity<ApiResponse<InventoryReconciliationDto>> reconcileVariant(
            @PathVariable Long variantId) {

        InventoryReconciliationDto data = inventoryService.reconcileVariant(variantId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Records new stock receipt from supplier/workshop.
     */
    @PostMapping("/receipt")
    public ResponseEntity<ApiResponse<InventoryMovementDto>> recordStockReceipt(
            @Valid @RequestBody StockReceiptRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long actorUserId = principal != null ? principal.getId() : null;
        InventoryMovementDto data = inventoryService.recordStockReceipt(request, actorUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(data));
    }

    /**
     * Records manual inventory audit adjustment.
     */
    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<InventoryMovementDto>> recordManualAdjustment(
            @Valid @RequestBody ManualAdjustmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long actorUserId = principal != null ? principal.getId() : null;
        InventoryMovementDto data = inventoryService.recordManualAdjustment(request, actorUserId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
