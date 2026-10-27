package com.fashionstore.order.api.dto;

import com.fashionstore.order.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private OrderStatus status;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;

    public UpdateOrderStatusRequest() {}

    public UpdateOrderStatusRequest(OrderStatus status, String note) {
        this.status = status;
        this.note = note;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
