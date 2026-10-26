package com.fashionstore.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductSummaryDto {

    private Long id;
    private String name;
    private String slug;
    private String brand;
    private String material;
    private String fitStyle;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal compareAtPrice;
    private boolean isOutOfStock;
    private String primaryImageUrl;
    private String secondaryImageUrl;
    private List<ColorSwatchDto> availableColors;
    private List<String> availableSizes;
    private String categoryName;
    private String categorySlug;

    public ProductSummaryDto() {}

    public ProductSummaryDto(Long id, String name, String slug, String brand, String material, String fitStyle,
                             BigDecimal minPrice, BigDecimal maxPrice, BigDecimal compareAtPrice, boolean isOutOfStock,
                             String primaryImageUrl, String secondaryImageUrl,
                             List<ColorSwatchDto> availableColors, List<String> availableSizes,
                             String categoryName, String categorySlug) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.brand = brand;
        this.material = material;
        this.fitStyle = fitStyle;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.compareAtPrice = compareAtPrice;
        this.isOutOfStock = isOutOfStock;
        this.primaryImageUrl = primaryImageUrl;
        this.secondaryImageUrl = secondaryImageUrl;
        this.availableColors = availableColors;
        this.availableSizes = availableSizes;
        this.categoryName = categoryName;
        this.categorySlug = categorySlug;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getFitStyle() {
        return fitStyle;
    }

    public void setFitStyle(String fitStyle) {
        this.fitStyle = fitStyle;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public BigDecimal getCompareAtPrice() {
        return compareAtPrice;
    }

    public void setCompareAtPrice(BigDecimal compareAtPrice) {
        this.compareAtPrice = compareAtPrice;
    }

    public boolean isOutOfStock() {
        return isOutOfStock;
    }

    public void setOutOfStock(boolean outOfStock) {
        isOutOfStock = outOfStock;
    }

    public String getPrimaryImageUrl() {
        return primaryImageUrl;
    }

    public void setPrimaryImageUrl(String primaryImageUrl) {
        this.primaryImageUrl = primaryImageUrl;
    }

    public String getSecondaryImageUrl() {
        return secondaryImageUrl;
    }

    public void setSecondaryImageUrl(String secondaryImageUrl) {
        this.secondaryImageUrl = secondaryImageUrl;
    }

    public List<ColorSwatchDto> getAvailableColors() {
        return availableColors;
    }

    public void setAvailableColors(List<ColorSwatchDto> availableColors) {
        this.availableColors = availableColors;
    }

    public List<String> getAvailableSizes() {
        return availableSizes;
    }

    public void setAvailableSizes(List<String> availableSizes) {
        this.availableSizes = availableSizes;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public void setCategorySlug(String categorySlug) {
        this.categorySlug = categorySlug;
    }
}
