package com.fashionstore.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddProductImageRequest(
        @NotBlank(message = "URL hình ảnh không được để trống")
        @Size(max = 500, message = "URL hình ảnh không vượt quá 500 ký tự")
        String imageUrl,

        @NotBlank(message = "Storage key (public_id) không được để trống")
        @Size(max = 255, message = "Storage key không vượt quá 255 ký tự")
        String storageKey,

        Long variantId,

        @Size(max = 255, message = "Văn bản thay thế (alt_text) không vượt quá 255 ký tự")
        String altText,

        Integer sortOrder,

        Boolean isPrimary,

        Long fileSize,

        Integer width,

        Integer height,

        @Size(max = 20, message = "Định dạng ảnh không vượt quá 20 ký tự")
        String format
) {
}
