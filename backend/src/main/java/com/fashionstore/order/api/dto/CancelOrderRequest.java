package com.fashionstore.order.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelOrderRequest {

    @NotBlank(message = "Lý do hủy đơn hàng không được để trống")
    @Size(max = 255, message = "Lý do hủy đơn tối đa 255 ký tự")
    private String reason;

    public CancelOrderRequest() {}

    public CancelOrderRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
