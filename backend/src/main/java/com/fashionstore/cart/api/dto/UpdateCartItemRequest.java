package com.fashionstore.cart.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateCartItemRequest {

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    @Max(value = 10, message = "Mỗi sản phẩm chỉ được mua tối đa 10 cái")
    private Integer quantity;

    public UpdateCartItemRequest() {}

    public UpdateCartItemRequest(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
