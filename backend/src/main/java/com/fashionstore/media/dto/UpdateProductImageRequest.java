package com.fashionstore.media.dto;

import jakarta.validation.constraints.Size;

public record UpdateProductImageRequest(
        Long variantId,

        @Size(max = 255, message = "Văn bản thay thế (alt_text) không vượt quá 255 ký tự")
        String altText,

        Integer sortOrder,

        Boolean isPrimary
) {
}
