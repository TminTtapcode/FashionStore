package com.fashionstore.order.api.dto;

import jakarta.validation.constraints.Size;

public class ConfirmReturnRequest {

    @Size(max = 255, message = "Ghi chú nhập kho tối đa 255 ký tự")
    private String note;

    public ConfirmReturnRequest() {}

    public ConfirmReturnRequest(String note) {
        this.note = note;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
