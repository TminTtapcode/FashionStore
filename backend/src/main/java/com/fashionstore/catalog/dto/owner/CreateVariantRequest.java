package com.fashionstore.catalog.dto.owner;

import com.fashionstore.catalog.domain.ProductVariantStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateVariantRequest(
        @Size(max = 60, message = "SKU không được vượt quá 60 ký tự")
        String sku,

        @NotBlank(message = "Kích cỡ (size) không được để trống")
        @Size(max = 20, message = "Kích cỡ không được vượt quá 20 ký tự")
        String size,

        @NotBlank(message = "Tên màu sắc (colorName) không được để trống")
        @Size(max = 50, message = "Tên màu không được vượt quá 50 ký tự")
        String colorName,

        @Pattern(regexp = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", message = "Mã màu Hex phải có định dạng #RGB hoặc #RRGGBB (ví dụ: #FFFFFF)")
        String colorHex,

        @NotNull(message = "Giá bán không được để trống")
        @DecimalMin(value = "1000", message = "Giá bán phải lớn hơn hoặc bằng 1.000 VNĐ")
        BigDecimal price,

        @DecimalMin(value = "1000", message = "Giá niêm yết so sánh phải lớn hơn hoặc bằng 1.000 VNĐ")
        BigDecimal compareAtPrice,

        @Min(value = 0, message = "Số lượng tồn kho ban đầu không được âm")
        Integer stockQuantity,

        ProductVariantStatus status
) {}

