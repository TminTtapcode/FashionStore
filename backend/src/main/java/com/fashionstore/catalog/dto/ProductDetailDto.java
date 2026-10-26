package com.fashionstore.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductDetailDto {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String brand;
    private String material;
    private String fitStyle;
    private String careInstructions;
    private String specifications; // Extensible specifications (size guide, stretch, etc.)
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal compareAtPrice;
    private boolean isOutOfStock;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private List<ProductVariantDto> variants;
    private List<ProductImageDto> images;
    private List<ColorSwatchDto> availableColors;
    private List<String> availableSizes;

    public ProductDetailDto() {}

    public ProductDetailDto(Long id, String name, String slug, String description, String brand,
                            String material, String fitStyle, String careInstructions, String specifications,
                            BigDecimal minPrice, BigDecimal maxPrice, BigDecimal compareAtPrice, boolean isOutOfStock,
                            Long categoryId, String categoryName, String categorySlug,
                            List<ProductVariantDto> variants, List<ProductImageDto> images,
                            List<ColorSwatchDto> availableColors, List<String> availableSizes) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.brand = brand;
        this.material = material;
        this.fitStyle = fitStyle;
        this.careInstructions = careInstructions;
        this.specifications = specifications;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.compareAtPrice = compareAtPrice;
        this.isOutOfStock = isOutOfStock;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categorySlug = categorySlug;
        this.variants = variants;
        this.images = images;
        this.availableColors = availableColors;
        this.availableSizes = availableSizes;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getCareInstructions() {
        return careInstructions;
    }

    public void setCareInstructions(String careInstructions) {
        this.careInstructions = careInstructions;
    }

    public String getSpecifications() {
        return specifications;
    }

    public void setSpecifications(String specifications) {
        this.specifications = specifications;
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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

    public List<ProductVariantDto> getVariants() {
        return variants;
    }

    public void setVariants(List<ProductVariantDto> variants) {
        this.variants = variants;
    }

    public List<ProductImageDto> getImages() {
        return images;
    }

    public void setImages(List<ProductImageDto> images) {
        this.images = images;
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
}
