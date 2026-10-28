package com.fashionstore.catalog.dto.owner;

import com.fashionstore.catalog.domain.ProductStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateProductStatusRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        ProductStatus status,

        @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
        String note
) {}

