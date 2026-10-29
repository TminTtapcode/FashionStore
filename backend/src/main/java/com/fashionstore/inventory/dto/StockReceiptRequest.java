package com.fashionstore.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockReceiptRequest(
    @NotNull(message = "ID biến thể không được để trống")
    Long variantId,

    @Min(value = 1, message = "Số lượng nhập kho phải tối thiểu 1")
    int quantity,

    @Size(max = 100, message = "Mã chứng từ/phiếu nhập tối đa 100 ký tự")
    String referenceNumber,

    @NotBlank(message = "Lý do nhập kho không được để trống")
    @Size(max = 500, message = "Lý do nhập kho tối đa 500 ký tự")
    String reason
) {}

