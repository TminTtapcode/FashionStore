package com.fashionstore.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProductImageDto {

    private Long id;
    private Long variantId;
    private String imageUrl;
    private String storageKey;
    private String altText;
    private int sortOrder;
    @JsonProperty("isPrimary")
    private boolean isPrimary;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private String format;

    public ProductImageDto() {}

    public ProductImageDto(Long id, Long variantId, String imageUrl, String altText, int sortOrder, boolean isPrimary) {
        this.id = id;
        this.variantId = variantId;
        this.imageUrl = imageUrl;
        this.altText = altText;
        this.sortOrder = sortOrder;
        this.isPrimary = isPrimary;
    }

    public ProductImageDto(Long id, Long variantId, String imageUrl, String storageKey, String altText,
                           int sortOrder, boolean isPrimary, Long fileSize, Integer width, Integer height, String format) {
        this.id = id;
        this.variantId = variantId;
        this.imageUrl = imageUrl;
        this.storageKey = storageKey;
        this.altText = altText;
        this.sortOrder = sortOrder;
        this.isPrimary = isPrimary;
        this.fileSize = fileSize;
        this.width = width;
        this.height = height;
        this.format = format;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    @JsonProperty("isPrimary")
    public boolean isPrimary() {
        return isPrimary;
    }

    @JsonProperty("isPrimary")
    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }
}
