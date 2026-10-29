package com.fashionstore.inventory.dto;

public record InventoryGlobalStatsDto(
        long totalSku,
        long healthyStockSku,
        long lowStockSku,
        long outOfStockSku,
        long totalStockUnits) {
}
