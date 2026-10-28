package com.fashionstore.catalog.dto.owner;

import jakarta.validation.constraints.*;

public record UpdateProductRequest(
        @NotNull(message = "Danh mục sản phẩm không được để trống")
        Long categoryId,

        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
        String name,

        @Size(max = 280, message = "Đường dẫn slug không được vượt quá 280 ký tự")
        String slug,

        String description,

        @Size(max = 100, message = "Thương hiệu không được vượt quá 100 ký tự")
        String brand,

        @Size(max = 150, message = "Chất liệu không được vượt quá 150 ký tự")
        String material,

        @Size(max = 100, message = "Form dáng không được vượt quá 100 ký tự")
        String fitStyle,

        String careInstructions,

        String specifications
) {}

