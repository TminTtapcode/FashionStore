package com.fashionstore.media.api;

import com.fashionstore.catalog.dto.ProductImageDto;
import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.media.dto.AddProductImageRequest;
import com.fashionstore.media.dto.ReorderImagesRequest;
import com.fashionstore.media.dto.SignUploadRequest;
import com.fashionstore.media.dto.SignUploadResponse;
import com.fashionstore.media.dto.UpdateProductImageRequest;
import com.fashionstore.media.service.CloudinaryService;
import com.fashionstore.media.service.MediaManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/owner")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class OwnerMediaController {

    private final CloudinaryService cloudinaryService;
    private final MediaManagementService mediaManagementService;

    public OwnerMediaController(CloudinaryService cloudinaryService,
                                MediaManagementService mediaManagementService) {
        this.cloudinaryService = cloudinaryService;
        this.mediaManagementService = mediaManagementService;
    }

    @PostMapping("/media/sign-upload")
    public ResponseEntity<ApiResponse<SignUploadResponse>> signUpload(
            @RequestBody(required = false) SignUploadRequest req) {
        Long productId = req != null ? req.productId() : null;
        String folder = req != null ? req.folder() : null;
        SignUploadResponse response = cloudinaryService.createUploadSignature(productId, folder);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/media/dev-mock-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> devMockUpload(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) {
        String randomId = UUID.randomUUID().toString().substring(0, 8);
        String publicId = (folder != null ? folder + "/" : "fashion_store/dev/") + "mock_asset_" + randomId;
        String mockUrl = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80";

        Map<String, Object> result = new HashMap<>();
        result.put("secure_url", mockUrl);
        result.put("public_id", publicId);
        result.put("width", 900);
        result.put("height", 1200);
        result.put("format", "jpg");
        result.put("bytes", file != null ? file.getSize() : 204800L);
        result.put("created_at", Instant.now().toString());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/products/{productId}/images")
    public ResponseEntity<ApiResponse<List<ProductImageDto>>> getProductImages(
            @PathVariable Long productId) {
        List<ProductImageDto> images = mediaManagementService.getProductImages(productId);
        return ResponseEntity.ok(ApiResponse.success(images));
    }

    @PostMapping("/products/{productId}/images")
    public ResponseEntity<ApiResponse<ProductImageDto>> addProductImage(
            @PathVariable Long productId,
            @Valid @RequestBody AddProductImageRequest req) {
        ProductImageDto created = mediaManagementService.addImage(productId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PutMapping("/products/{productId}/images/{imageId}")
    public ResponseEntity<ApiResponse<ProductImageDto>> updateProductImage(
            @PathVariable Long productId,
            @PathVariable Long imageId,
            @Valid @RequestBody UpdateProductImageRequest req) {
        ProductImageDto updated = mediaManagementService.updateImage(productId, imageId, req);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/products/{productId}/images/{imageId}/set-primary")
    public ResponseEntity<ApiResponse<ProductImageDto>> setPrimaryImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        ProductImageDto primary = mediaManagementService.setPrimaryImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.success(primary));
    }

    @PutMapping("/products/{productId}/images/reorder")
    public ResponseEntity<ApiResponse<List<ProductImageDto>>> reorderImages(
            @PathVariable Long productId,
            @Valid @RequestBody ReorderImagesRequest req) {
        List<ProductImageDto> reordered = mediaManagementService.reorderImages(productId, req.imageIds());
        return ResponseEntity.ok(ApiResponse.success(reordered));
    }

    @DeleteMapping("/products/{productId}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteProductImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        mediaManagementService.deleteImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
