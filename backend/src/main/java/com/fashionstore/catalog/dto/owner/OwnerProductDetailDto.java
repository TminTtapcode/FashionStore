package com.fashionstore.catalog.dto.owner;

import com.fashionstore.catalog.domain.ProductStatus;
import com.fashionstore.catalog.dto.ProductImageDto;
import java.time.Instant;
import java.util.List;

public record OwnerProductDetailDto(
        Long id,
        Long shopId,
        Long categoryId,
        String categoryName,
        String name,
        String slug,
        String description,
        String brand,
        String material,
        String fitStyle,
        String careInstructions,
        String specifications,
        ProductStatus status,
        List<OwnerVariantDto> variants,
        List<ProductImageDto> images,
        boolean hasOrders,
        Instant createdAt,
        Instant updatedAt
) {}

