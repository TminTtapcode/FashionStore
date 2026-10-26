package com.fashionstore.catalog.dto;

import java.util.List;

public class CategoryDto {

    private Long id;
    private Long parentId;
    private String name;
    private String slug;
    private String description;
    private int sortOrder;
    private List<CategoryDto> children;

    public CategoryDto() {}

    public CategoryDto(Long id, Long parentId, String name, String slug, String description, int sortOrder, List<CategoryDto> children) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.sortOrder = sortOrder;
        this.children = children;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
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

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public List<CategoryDto> getChildren() {
        return children;
    }

    public void setChildren(List<CategoryDto> children) {
        this.children = children;
    }
}
