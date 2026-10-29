package com.fashionstore.media.service;

import com.fashionstore.catalog.domain.Product;
import com.fashionstore.catalog.domain.ProductImage;
import com.fashionstore.catalog.domain.ProductImageRepository;
import com.fashionstore.catalog.domain.ProductRepository;
import com.fashionstore.catalog.domain.ProductVariant;
import com.fashionstore.catalog.domain.ProductVariantRepository;
import com.fashionstore.catalog.dto.ProductImageDto;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.media.dto.AddProductImageRequest;
import com.fashionstore.media.dto.UpdateProductImageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MediaManagementService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;

    public MediaManagementService(ProductRepository productRepository,
                                  ProductVariantRepository variantRepository,
                                  ProductImageRepository imageRepository,
                                  CloudinaryService cloudinaryService) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.imageRepository = imageRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional(readOnly = true)
    public List<ProductImageDto> getProductImages(Long productId) {
        verifyProductExists(productId);
        return imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ProductImageDto addImage(Long productId, AddProductImageRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + productId));

        ProductVariant variant = null;
        if (req.variantId() != null) {
            variant = variantRepository.findById(req.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể với id: " + req.variantId()));

            if (!variant.getProduct().getId().equals(productId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VARIANT_ASSOCIATION",
                        "Biến thể id " + req.variantId() + " không thuộc về sản phẩm id " + productId);
            }
        }

        long existingCount = imageRepository.countByProductId(productId);
        boolean shouldBePrimary = Boolean.TRUE.equals(req.isPrimary()) || existingCount == 0;

        if (shouldBePrimary) {
            clearPrimaryForProduct(productId);
        }

        int sortOrder = req.sortOrder() != null ? req.sortOrder() : (int) existingCount;

        ProductImage image = new ProductImage(
                product,
                variant,
                req.imageUrl().trim(),
                req.storageKey().trim(),
                req.altText() != null ? req.altText().trim() : product.getName(),
                sortOrder,
                shouldBePrimary
        );

        image.setFileSize(req.fileSize());
        image.setWidth(req.width());
        image.setHeight(req.height());
        image.setFormat(req.format());

        ProductImage saved = imageRepository.save(image);
        return mapToDto(saved);
    }

    @Transactional
    public ProductImageDto updateImage(Long productId, Long imageId, UpdateProductImageRequest req) {
        verifyProductExists(productId);

        ProductImage image = imageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hình ảnh id " + imageId + " thuộc sản phẩm id " + productId));

        if (req.variantId() != null) {
            ProductVariant variant = variantRepository.findById(req.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể với id: " + req.variantId()));

            if (!variant.getProduct().getId().equals(productId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VARIANT_ASSOCIATION",
                        "Biến thể id " + req.variantId() + " không thuộc về sản phẩm id " + productId);
            }
            image.setVariant(variant);
        } else {
            image.setVariant(null);
        }

        if (req.altText() != null) {
            image.setAltText(req.altText().trim());
        }

        if (req.sortOrder() != null) {
            image.setSortOrder(req.sortOrder());
        }

        if (Boolean.TRUE.equals(req.isPrimary()) && !image.isPrimary()) {
            clearPrimaryForProduct(productId);
            image.setPrimary(true);
        }

        ProductImage saved = imageRepository.save(image);
        return mapToDto(saved);
    }

    @Transactional
    public ProductImageDto setPrimaryImage(Long productId, Long imageId) {
        verifyProductExists(productId);

        ProductImage target = imageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hình ảnh id " + imageId + " thuộc sản phẩm id " + productId));

        clearPrimaryForProduct(productId);
        target.setPrimary(true);

        ProductImage saved = imageRepository.save(target);
        return mapToDto(saved);
    }

    @Transactional
    public List<ProductImageDto> reorderImages(Long productId, List<Long> imageIds) {
        verifyProductExists(productId);

        for (int i = 0; i < imageIds.size(); i++) {
            Long imgId = imageIds.get(i);
            ProductImage img = imageRepository.findByIdAndProductId(imgId, productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hình ảnh id " + imgId + " thuộc sản phẩm id " + productId));
            img.setSortOrder(i);
            imageRepository.save(img);
        }

        return imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public void deleteImage(Long productId, Long imageId) {
        verifyProductExists(productId);

        ProductImage image = imageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hình ảnh id " + imageId + " thuộc sản phẩm id " + productId));

        String storageKey = image.getStorageKey();
        boolean wasPrimary = image.isPrimary();

        imageRepository.delete(image);

        // If the primary image was deleted, promote next available image as primary
        if (wasPrimary) {
            imageRepository.findFirstByProductIdOrderBySortOrderAscIdAsc(productId).ifPresent(next -> {
                next.setPrimary(true);
                imageRepository.save(next);
            });
        }

        // Call Cloudinary destroy asynchronously / safely
        if (storageKey != null && !storageKey.isBlank()) {
            cloudinaryService.destroyImage(storageKey);
        }
    }

    private void clearPrimaryForProduct(Long productId) {
        imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId).forEach(img -> {
            if (img.isPrimary()) {
                img.setPrimary(false);
                imageRepository.save(img);
            }
        });
    }

    private void verifyProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + productId);
        }
    }

    public ProductImageDto mapToDto(ProductImage img) {
        return new ProductImageDto(
                img.getId(),
                img.getVariant() != null ? img.getVariant().getId() : null,
                img.getImageUrl(),
                img.getStorageKey(),
                img.getAltText(),
                img.getSortOrder(),
                img.isPrimary(),
                img.getFileSize(),
                img.getWidth(),
                img.getHeight(),
                img.getFormat()
        );
    }
}
