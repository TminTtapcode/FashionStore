package com.fashionstore.media.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderImagesRequest(
        @NotEmpty(message = "Danh sách ID hình ảnh không được để trống")
        List<Long> imageIds
) {
}
