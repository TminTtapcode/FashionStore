package com.fashionstore.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManualAdjustmentRequest(
    @NotNull(message = "ID biến thể không được để trống")
    Long variantId,

    int quantityDelta,

    @NotBlank(message = "Lý do điều chỉnh kiểm kê không được để trống")
    @Size(max = 500, message = "Lý do điều chỉnh tối đa 500 ký tự")
    String reason
) {}

