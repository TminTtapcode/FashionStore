package com.fashionstore.catalog.application;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.catalog.dto.*;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    /**
     * Retrieves hierarchical categories tree (Parent -> Children) for active categories.
     */
    public List<CategoryDto> getCategoriesTree() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullAndStatusOrderBySortOrderAscIdAsc(CategoryStatus.ACTIVE);
        return rootCategories.stream()
                .map(this::toCategoryDto)
                .toList();
    }

    /**
     * Searches and filters products with pagination and sorting.
     */
    public PageResponse<ProductSummaryDto> getProducts(ProductFilterRequest filter) {
        List<Long> categoryIds = null;
        if (filter.getCategorySlug() != null && !filter.getCategorySlug().trim().isEmpty()) {
            Optional<Category> categoryOpt = categoryRepository.findBySlugAndStatus(filter.getCategorySlug().trim(), CategoryStatus.ACTIVE);
            if (categoryOpt.isPresent()) {
                categoryIds = categoryRepository.findSelfAndChildIds(categoryOpt.get().getId());
            } else {
                return new PageResponse<>(Collections.emptyList(), filter.getPage(), filter.getLimit(), 0, 0, false, false);
            }
        } else if (filter.getCategoryId() != null) {
            categoryIds = categoryRepository.findSelfAndChildIds(filter.getCategoryId());
        }

        Specification<Product> spec = ProductSpecification.buildSpecification(filter, categoryIds);
        PageRequest pageRequest = PageRequest.of(filter.getPage(), filter.getLimit());
        Page<Product> productPage = productRepository.findAll(spec, pageRequest);

        List<ProductSummaryDto> items = productPage.getContent().stream()
                .map(this::toProductSummaryDto)
                .toList();

        return new PageResponse<>(
                items,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.hasNext(),
                productPage.hasPrevious()
        );
    }

    /**
     * Retrieves full product detail by slug with variants, images, and specifications.
     */
    public ProductDetailDto getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndStatus(slug, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + slug));

        return toProductDetailDto(product);
    }

    // Mapper Helpers
    private CategoryDto toCategoryDto(Category category) {
        List<CategoryDto> childDtos = Collections.emptyList();
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            childDtos = category.getChildren().stream()
                    .filter(c -> c.getStatus() == CategoryStatus.ACTIVE)
                    .map(this::toCategoryDto)
                    .toList();
        }

        return new CategoryDto(
                category.getId(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getSortOrder(),
                childDtos
        );
    }

    private ProductSummaryDto toProductSummaryDto(Product product) {
        String primaryImg = product.getPrimaryImage().map(ProductImage::getImageUrl).orElse("");
        String secondaryImg = product.getSecondaryImage().map(ProductImage::getImageUrl).orElse(primaryImg);

        List<ProductVariant> activeVariants = product.getActiveVariants();

        List<ColorSwatchDto> colors = activeVariants.stream()
                .map(v -> new ColorSwatchDto(v.getColorName(), v.getColorHex()))
                .filter(c -> c.getName() != null && !c.getName().trim().isEmpty())
                .distinct()
                .toList();

        List<String> sizes = activeVariants.stream()
                .map(ProductVariant::getSize)
                .filter(s -> s != null && !s.trim().isEmpty())
                .distinct()
                .toList();

        BigDecimal comparePrice = activeVariants.stream()
                .map(ProductVariant::getCompareAtPrice)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null);

        return new ProductSummaryDto(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getBrand(),
                product.getMaterial(),
                product.getFitStyle(),
                product.getMinPrice(),
                product.getMaxPrice(),
                comparePrice,
                product.isOutOfStock(),
                primaryImg,
                secondaryImg,
                colors,
                sizes,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getCategory() != null ? product.getCategory().getSlug() : null
        );
    }

    private ProductDetailDto toProductDetailDto(Product product) {
        List<ProductVariant> activeVariants = product.getActiveVariants();

        List<ProductVariantDto> variantDtos = activeVariants.stream()
                .map(v -> new ProductVariantDto(
                        v.getId(),
                        v.getSku(),
                        v.getSize(),
                        v.getColorName(),
                        v.getColorHex(),
                        v.getPrice(),
                        v.getCompareAtPrice(),
                        v.getStockQuantity(),
                        v.isInStock(),
                        v.getStatus().name()
                ))
                .toList();

        List<ProductImageDto> imageDtos = product.getImages().stream()
                .map(img -> new ProductImageDto(
                        img.getId(),
                        img.getVariant() != null ? img.getVariant().getId() : null,
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getSortOrder(),
                        img.isPrimary()
                ))
                .toList();

        List<ColorSwatchDto> colors = activeVariants.stream()
                .map(v -> new ColorSwatchDto(v.getColorName(), v.getColorHex()))
                .filter(c -> c.getName() != null && !c.getName().trim().isEmpty())
                .distinct()
                .toList();

        List<String> sizes = activeVariants.stream()
                .map(ProductVariant::getSize)
                .filter(s -> s != null && !s.trim().isEmpty())
                .distinct()
                .toList();

        BigDecimal comparePrice = activeVariants.stream()
                .map(ProductVariant::getCompareAtPrice)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null);

        return new ProductDetailDto(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getBrand(),
                product.getMaterial(),
                product.getFitStyle(),
                product.getCareInstructions(),
                product.getSpecifications(),
                product.getMinPrice(),
                product.getMaxPrice(),
                comparePrice,
                product.isOutOfStock(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getCategory() != null ? product.getCategory().getSlug() : null,
                variantDtos,
                imageDtos,
                colors,
                sizes
        );
    }
}
