package com.fashionstore.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InventoryReconciliationDto(
        Long variantId,
        String sku,
        String productName,
        int currentStock,
        int openingBalance,
        int postOpeningDelta,
        int totalDelta,
        int calculatedStock,
        int discrepancy,
        @JsonProperty("isBalanced") boolean isBalanced) {
}
