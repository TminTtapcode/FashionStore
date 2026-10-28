package com.fashionstore.catalog.dto.owner;

import com.fashionstore.catalog.domain.ProductVariantStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record OwnerVariantDto(
        Long id,
        String sku,
        String size,
        String colorName,
        String colorHex,
        BigDecimal price,
        BigDecimal compareAtPrice,
        int stockQuantity,
        ProductVariantStatus status,
        boolean hasOrders,
        Instant createdAt,
        Instant updatedAt
) {}

