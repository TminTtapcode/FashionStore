package com.fashionstore.cart.api.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartDto {

    private Long id;
    private int totalItemCount;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private boolean hasUnavailableItems;
    private List<CartItemDto> items = new ArrayList<>();

    public CartDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getTotalItemCount() {
        return totalItemCount;
    }

    public void setTotalItemCount(int totalItemCount) {
        this.totalItemCount = totalItemCount;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public boolean isHasUnavailableItems() {
        return hasUnavailableItems;
    }

    public void setHasUnavailableItems(boolean hasUnavailableItems) {
        this.hasUnavailableItems = hasUnavailableItems;
    }

    public List<CartItemDto> getItems() {
        return items;
    }

    public void setItems(List<CartItemDto> items) {
        this.items = items;
    }
}
