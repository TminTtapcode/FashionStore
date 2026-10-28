package com.fashionstore.catalog.dto.owner;

import com.fashionstore.catalog.domain.ProductStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record OwnerProductSummaryDto(
        Long id,
        Long shopId,
        String name,
        String slug,
        Long categoryId,
        String categoryName,
        String brand,
        ProductStatus status,
        int variantCount,
        int totalStock,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String primaryImageUrl,
        Instant createdAt,
        Instant updatedAt
) {}

