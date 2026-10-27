package com.fashionstore.cart.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AddCartItemRequest {

    @NotNull(message = "Mã biến thể không được để trống")
    private Long variantId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    @Max(value = 10, message = "Mỗi sản phẩm chỉ được mua tối đa 10 cái")
    private Integer quantity;

    public AddCartItemRequest() {}

    public AddCartItemRequest(Long variantId, Integer quantity) {
        this.variantId = variantId;
        this.quantity = quantity;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
