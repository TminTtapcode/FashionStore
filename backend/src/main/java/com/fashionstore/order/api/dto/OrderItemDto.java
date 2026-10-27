package com.fashionstore.order.api.dto;

import java.math.BigDecimal;

public class OrderItemDto {

    private Long id;
    private Long productId;
    private Long variantId;
    private String productName;
    private String brand;
    private String sku;
    private String size;
    private String colorName;
    private String thumbnailUrl;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal totalPrice;

    public OrderItemDto() {}

    public OrderItemDto(
            Long id,
            Long productId,
            Long variantId,
            String productName,
            String brand,
            String sku,
            String size,
            String colorName,
            String thumbnailUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal totalPrice) {
        this.id = id;
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.brand = brand;
        this.sku = sku;
        this.size = size;
        this.colorName = colorName;
        this.thumbnailUrl = thumbnailUrl;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
    }

    public Long getId() {
        return id;
    }

    public Long getProductId() {
        return productId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public String getProductName() {
        return productName;
    }

    public String getBrand() {
        return brand;
    }

    public String getSku() {
        return sku;
    }

    public String getSize() {
        return size;
    }

    public String getColorName() {
        return colorName;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }
}

