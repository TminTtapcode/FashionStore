package com.fashionstore.catalog.dto;

import java.math.BigDecimal;

public class ProductFilterRequest {

    private Long categoryId;
    private String categorySlug;
    private String size;
    private String color;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean inStockOnly = false;
    private String search;
    private String sort = "newest";
    private int page = 0;
    private int limit = 12;

    public ProductFilterRequest() {}

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public void setCategorySlug(String categorySlug) {
        this.categorySlug = categorySlug;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
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

    public Boolean getInStockOnly() {
        return inStockOnly != null && inStockOnly;
    }

    public void setInStockOnly(Boolean inStockOnly) {
        this.inStockOnly = inStockOnly;
    }

    public String getSearch() {
        return search;
    }

    public void setSearch(String search) {
        this.search = search;
    }

    public String getSort() {
        return sort != null ? sort : "newest";
    }

    public void setSort(String sort) {
        this.sort = sort;
    }

    public int getPage() {
        return Math.max(0, page);
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getLimit() {
        if (limit <= 0) return 12;
        return Math.min(limit, 48); // Maximum 48 items per page
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }
}
