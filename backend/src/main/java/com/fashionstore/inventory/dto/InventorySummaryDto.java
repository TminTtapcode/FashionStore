package com.fashionstore.inventory.dto;

import com.fashionstore.catalog.domain.ProductVariantStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record InventorySummaryDto(
    Long variantId,
    Long productId,
    String productName,
    String categoryName,
    String sku,
    String size,
    String colorName,
    String colorHex,
    BigDecimal price,
    int currentStock,
    ProductVariantStatus status,
    String primaryImageUrl,
    Instant lastMovementAt,
    String lastMovementType
) {}

