package com.fashionstore.catalog.api;

import com.fashionstore.catalog.application.OwnerProductService;
import com.fashionstore.catalog.domain.ProductStatus;
import com.fashionstore.catalog.dto.owner.*;
import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.api.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/owner/products")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class OwnerProductController {

    private final OwnerProductService ownerProductService;

    public OwnerProductController(OwnerProductService ownerProductService) {
        this.ownerProductService = ownerProductService;
    }

    /**
     * List, filter, search, and paginate products for the Shop Owner portal.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OwnerProductSummaryDto>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {

        PageResponse<OwnerProductSummaryDto> response = ownerProductService.getProducts(
                page, size, status, categoryId, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieve full product details including variants and specifications.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OwnerProductDetailDto>> getProductDetail(@PathVariable Long id) {
        OwnerProductDetailDto product = ownerProductService.getProductDetail(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    /**
     * Create a new product and optional initial variant matrix.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OwnerProductDetailDto>> createProduct(
            @Valid @RequestBody CreateProductRequest request) {

        OwnerProductDetailDto created = ownerProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    /**
     * Update product general information.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OwnerProductDetailDto>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {

        OwnerProductDetailDto updated = ownerProductService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * Transition product lifecycle status (DRAFT, ACTIVE, HIDDEN, ARCHIVED).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OwnerProductDetailDto>> updateProductStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductStatusRequest request) {

        OwnerProductDetailDto updated = ownerProductService.updateProductStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * Add a new variant to an existing product.
     */
    @PostMapping("/{id}/variants")
    public ResponseEntity<ApiResponse<OwnerVariantDto>> addVariant(
            @PathVariable Long id,
            @Valid @RequestBody CreateVariantRequest request) {

        OwnerVariantDto variant = ownerProductService.addVariant(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(variant));
    }

    /**
     * Update an existing variant.
     */
    @PutMapping("/{id}/variants/{variantId}")
    public ResponseEntity<ApiResponse<OwnerVariantDto>> updateVariant(
            @PathVariable Long id,
            @PathVariable Long variantId,
            @Valid @RequestBody UpdateVariantRequest request) {

        OwnerVariantDto updated = ownerProductService.updateVariant(id, variantId, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * Delete product (only permitted if no historical orders exist; otherwise archived).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        ownerProductService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

