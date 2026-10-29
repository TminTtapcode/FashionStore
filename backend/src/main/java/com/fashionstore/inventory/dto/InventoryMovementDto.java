package com.fashionstore.inventory.dto;

import com.fashionstore.inventory.domain.InventoryMovementType;
import java.time.Instant;

public record InventoryMovementDto(
    Long id,
    Long variantId,
    String sku,
    String productName,
    String size,
    String colorName,
    InventoryMovementType movementType,
    int quantityDelta,
    int stockBefore,
    int stockAfter,
    String referenceType,
    String referenceId,
    String movementKey,
    String actorName,
    String reason,
    Instant createdAt
) {}

