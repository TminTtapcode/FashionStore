package com.fashionstore.catalog.dto;

import java.math.BigDecimal;

public class ProductVariantDto {

    private Long id;
    private String sku;
    private String size;
    private String colorName;
    private String colorHex;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private int stockQuantity;
    private boolean inStock;
    private String status;

    public ProductVariantDto() {}

    public ProductVariantDto(Long id, String sku, String size, String colorName, String colorHex,
                             BigDecimal price, BigDecimal compareAtPrice, int stockQuantity,
                             boolean inStock, String status) {
        this.id = id;
        this.sku = sku;
        this.size = size;
        this.colorName = colorName;
        this.colorHex = colorHex;
        this.price = price;
        this.compareAtPrice = compareAtPrice;
        this.stockQuantity = stockQuantity;
        this.inStock = inStock;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getColorName() {
        return colorName;
    }

    public void setColorName(String colorName) {
        this.colorName = colorName;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getCompareAtPrice() {
        return compareAtPrice;
    }

    public void setCompareAtPrice(BigDecimal compareAtPrice) {
        this.compareAtPrice = compareAtPrice;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
