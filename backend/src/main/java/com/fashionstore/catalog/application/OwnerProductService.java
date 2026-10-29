package com.fashionstore.catalog.application;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.catalog.dto.ProductImageDto;
import com.fashionstore.catalog.dto.owner.*;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.DuplicateResourceException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.inventory.application.InventoryService;
import com.fashionstore.order.domain.OrderItemRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OwnerProductService {

    private static final Long DEFAULT_SHOP_ID = 1L; // Single-Store Atelier MVP

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final SkuGeneratorService skuGeneratorService;
    private final InventoryService inventoryService;

    public OwnerProductService(
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            CategoryRepository categoryRepository,
            OrderItemRepository orderItemRepository,
            SkuGeneratorService skuGeneratorService,
            InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.categoryRepository = categoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.skuGeneratorService = skuGeneratorService;
        this.inventoryService = inventoryService;
    }

    /**
     * List, filter, search, and paginate products for the Shop Owner portal.
     * Unlike storefront, includes DRAFT, HIDDEN, and ARCHIVED products.
     */
    @Transactional(readOnly = true)
    public PageResponse<OwnerProductSummaryDto> getProducts(
            int page, int size, ProductStatus status, Long categoryId, String search) {

        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "updatedAt", "id"));

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (categoryId != null) {
                List<Long> catIds = categoryRepository.findSelfAndChildIds(categoryId);
                if (catIds != null && !catIds.isEmpty()) {
                    predicates.add(root.get("category").get("id").in(catIds));
                }
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate brandMatch = cb.like(cb.lower(root.get("brand")), pattern);
                Predicate slugMatch = cb.like(cb.lower(root.get("slug")), pattern);
                predicates.add(cb.or(nameMatch, brandMatch, slugMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<OwnerProductSummaryDto> items = productPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        return new PageResponse<>(
                items,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.hasNext(),
                productPage.hasPrevious());
    }

    /**
     * Retrieve full product details for viewing or editing in Owner Portal.
     */
    @Transactional(readOnly = true)
    public OwnerProductDetailDto getProductDetail(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        boolean hasOrders = orderItemRepository.existsByProductId(productId);
        return toDetailDto(product, hasOrders);
    }

    /**
     * Create a new product and optional initial variant matrix atomically.
     */
    @Transactional(rollbackFor = Exception.class)
    public OwnerProductDetailDto createProduct(CreateProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy danh mục ID: " + request.categoryId()));

        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INACTIVE_CATEGORY",
                    "Không thể gán sản phẩm vào danh mục đã bị vô hiệu hóa");
        }

        String slug = skuGeneratorService.generateUniqueSlug(request.name(), request.slug(), null);
        ProductStatus initialStatus = request.status() != null ? request.status() : ProductStatus.DRAFT;

        // Validation for initial ACTIVE status
        if (initialStatus == ProductStatus.ACTIVE) {
            if (request.variants() == null || request.variants().isEmpty()) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "ACTIVE_REQUIRES_VARIANTS",
                        "Sản phẩm phải có ít nhất một biến thể để có thể xuất bản ở trạng thái Hoạt động (ACTIVE)");
            }
            boolean hasActiveVariant = request.variants().stream()
                    .anyMatch(v -> v.status() == null || v.status() == ProductVariantStatus.ACTIVE);
            if (!hasActiveVariant) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "ACTIVE_REQUIRES_ACTIVE_VARIANT",
                        "Sản phẩm phải có ít nhất một biến thể ở trạng thái Hoạt động để có thể xuất bản");
            }
        }

        Product product = new Product(
                DEFAULT_SHOP_ID,
                category,
                request.name().trim(),
                slug,
                request.description(),
                request.brand() != null ? request.brand().trim() : null,
                request.material() != null ? request.material().trim() : null,
                request.fitStyle() != null ? request.fitStyle().trim() : null,
                request.careInstructions(),
                request.specifications(),
                initialStatus);

        // Process initial variants if provided
        if (request.variants() != null && !request.variants().isEmpty()) {
            Set<String> seenCombos = new HashSet<>();

            for (CreateVariantRequest vReq : request.variants()) {
                String normalizedSize = vReq.size().trim().toUpperCase(Locale.ROOT);
                String normalizedColor = vReq.colorName().trim();
                String comboKey = normalizedSize + "::" + normalizedColor.toLowerCase(Locale.ROOT);

                if (!seenCombos.add(comboKey)) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "DUPLICATE_VARIANT_COMBINATION",
                            "Tổ hợp kích cỡ '" + vReq.size() + "' và màu '" + vReq.colorName()
                                    + "' bị trùng lặp trong yêu cầu tạo");
                }

                validateVariantPrices(vReq.price(), vReq.compareAtPrice());

                String sku = (vReq.sku() != null && !vReq.sku().trim().isEmpty())
                        ? vReq.sku().trim().toUpperCase(Locale.ROOT)
                        : skuGeneratorService.generateUniqueSku(product.getName(), normalizedColor, normalizedSize);

                if (variantRepository.existsBySku(sku)) {
                    throw new DuplicateResourceException("Mã SKU '" + sku + "' đã tồn tại trong hệ thống");
                }

                ProductVariant variant = new ProductVariant(
                        product,
                        sku,
                        normalizedSize,
                        normalizedColor,
                        vReq.colorHex() != null ? vReq.colorHex().trim() : null,
                        vReq.price(),
                        vReq.compareAtPrice(),
                        vReq.stockQuantity() != null ? vReq.stockQuantity() : 0,
                        vReq.status() != null ? vReq.status() : ProductVariantStatus.ACTIVE);
                product.addVariant(variant);
            }
        }

        Product saved = productRepository.save(product);
        if (saved.getVariants() != null) {
            for (ProductVariant v : saved.getVariants()) {
                if (v.getStockQuantity() > 0) {
                    inventoryService.recordInitialStock(v.getId(), v.getStockQuantity(), null,
                            "Khởi tạo tồn kho ban đầu khi tạo sản phẩm");
                }
            }
        }
        return toDetailDto(saved, false);
    }

    /**
     * Update product general information.
     */
    @Transactional(rollbackFor = Exception.class)
    public OwnerProductDetailDto updateProduct(Long productId, UpdateProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + productId));

        if (product.getStatus().isTerminal()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TERMINAL_STATE",
                    "Không thể sửa sản phẩm đã bị Lưu trữ (ARCHIVED)");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy danh mục ID: " + request.categoryId()));

        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INACTIVE_CATEGORY",
                    "Không thể chuyển sản phẩm sang danh mục đã vô hiệu hóa");
        }

        String newSlug = skuGeneratorService.generateUniqueSlug(request.name(), request.slug(), productId);

        product.setCategory(category);
        product.setName(request.name().trim());
        product.setSlug(newSlug);
        product.setDescription(request.description());
        product.setBrand(request.brand() != null ? request.brand().trim() : null);
        product.setMaterial(request.material() != null ? request.material().trim() : null);
        product.setFitStyle(request.fitStyle() != null ? request.fitStyle().trim() : null);
        product.setCareInstructions(request.careInstructions());
        product.setSpecifications(request.specifications());

        Product saved = productRepository.save(product);
        boolean hasOrders = orderItemRepository.existsByProductId(productId);
        return toDetailDto(saved, hasOrders);
    }

    /**
     * Update product lifecycle state (DRAFT, ACTIVE, HIDDEN, ARCHIVED).
     */
    @Transactional(rollbackFor = Exception.class)
    public OwnerProductDetailDto updateProductStatus(Long productId, UpdateProductStatusRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + productId));

        ProductStatus currentStatus = product.getStatus();
        ProductStatus targetStatus = request.status();

        if (currentStatus == targetStatus) {
            boolean hasOrders = orderItemRepository.existsByProductId(productId);
            return toDetailDto(product, hasOrders);
        }

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TRANSITION",
                    "Không thể chuyển trạng thái sản phẩm từ " + currentStatus + " sang " + targetStatus);
        }

        if (targetStatus == ProductStatus.ACTIVE) {
            boolean hasActiveVariant = product.getVariants().stream()
                    .anyMatch(v -> v.getStatus() == ProductVariantStatus.ACTIVE);
            if (!hasActiveVariant) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "NO_ACTIVE_VARIANTS",
                        "Không thể kích hoạt (ACTIVE) sản phẩm vì chưa có bất kỳ biến thể nào đang hoạt động");
            }
        }

        product.setStatus(targetStatus);
        Product saved = productRepository.save(product);
        boolean hasOrders = orderItemRepository.existsByProductId(productId);
        return toDetailDto(saved, hasOrders);
    }

    /**
     * Add a single new variant to an existing product.
     */
    @Transactional(rollbackFor = Exception.class)
    public OwnerVariantDto addVariant(Long productId, CreateVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + productId));

        if (product.getStatus().isTerminal()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TERMINAL_STATE",
                    "Không thể thêm biến thể cho sản phẩm đã Lưu trữ (ARCHIVED)");
        }

        String normalizedSize = request.size().trim().toUpperCase(Locale.ROOT);
        String normalizedColor = request.colorName().trim();

        if (variantRepository.existsByProductIdAndSizeIgnoreCaseAndColorNameIgnoreCase(productId, normalizedSize,
                normalizedColor)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "DUPLICATE_VARIANT_COMBINATION",
                    "Tổ hợp kích cỡ '" + normalizedSize + "' và màu '" + normalizedColor
                            + "' đã tồn tại cho sản phẩm này");
        }

        validateVariantPrices(request.price(), request.compareAtPrice());

        String sku = (request.sku() != null && !request.sku().trim().isEmpty())
                ? request.sku().trim().toUpperCase(Locale.ROOT)
                : skuGeneratorService.generateUniqueSku(product.getName(), normalizedColor, normalizedSize);

        if (variantRepository.existsBySku(sku)) {
            throw new DuplicateResourceException("Mã SKU '" + sku + "' đã tồn tại trong hệ thống");
        }

        ProductVariant variant = new ProductVariant(
                product,
                sku,
                normalizedSize,
                normalizedColor,
                request.colorHex() != null ? request.colorHex().trim() : null,
                request.price(),
                request.compareAtPrice(),
                request.stockQuantity() != null ? request.stockQuantity() : 0,
                request.status() != null ? request.status() : ProductVariantStatus.ACTIVE);

        product.addVariant(variant);
        ProductVariant saved = variantRepository.save(variant);
        if (saved.getStockQuantity() > 0) {
            inventoryService.recordInitialStock(saved.getId(), saved.getStockQuantity(), null,
                    "Khởi tạo tồn kho ban đầu khi tạo biến thể");
        }

        return toVariantDto(saved, false);
    }

    /**
     * Update an existing variant's price, compareAtPrice, color, size, or status.
     * Enforces SKU immutability if orders already reference this variant.
     */
    @Transactional(rollbackFor = Exception.class)
    public OwnerVariantDto updateVariant(Long productId, Long variantId, UpdateVariantRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể ID: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VARIANT_MISMATCH",
                    "Biến thể không thuộc về sản phẩm đã chỉ định");
        }

        if (variant.getProduct().getStatus().isTerminal()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TERMINAL_STATE",
                    "Không thể sửa biến thể của sản phẩm đã Lưu trữ (ARCHIVED)");
        }

        boolean hasOrders = orderItemRepository.existsByVariantId(variantId);

        // SKU immutability check
        if (request.sku() != null && !request.sku().trim().isEmpty()) {
            String newSku = request.sku().trim().toUpperCase(Locale.ROOT);
            if (!newSku.equalsIgnoreCase(variant.getSku())) {
                if (hasOrders) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "SKU_IMMUTABLE",
                            "Mã SKU '" + variant.getSku()
                                    + "' đã phát sinh đơn hàng lịch sử, không được phép thay đổi để bảo toàn đối soát");
                }
                if (variantRepository.existsBySkuAndIdNot(newSku, variantId)) {
                    throw new DuplicateResourceException("Mã SKU '" + newSku + "' đã tồn tại trên một biến thể khác");
                }
                variant.setSku(newSku);
            }
        }

        String normalizedSize = request.size().trim().toUpperCase(Locale.ROOT);
        String normalizedColor = request.colorName().trim();

        if (variantRepository.existsByProductIdAndSizeIgnoreCaseAndColorNameIgnoreCaseAndIdNot(
                productId, normalizedSize, normalizedColor, variantId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "DUPLICATE_VARIANT_COMBINATION",
                    "Tổ hợp kích cỡ '" + normalizedSize + "' và màu '" + normalizedColor
                            + "' đã tồn tại trên biến thể khác của sản phẩm này");
        }

        validateVariantPrices(request.price(), request.compareAtPrice());

        variant.setSize(normalizedSize);
        variant.setColorName(normalizedColor);
        variant.setColorHex(request.colorHex() != null ? request.colorHex().trim() : null);
        variant.setPrice(request.price());
        variant.setCompareAtPrice(request.compareAtPrice());
        variant.setStatus(request.status());

        ProductVariant saved = variantRepository.save(variant);
        return toVariantDto(saved, hasOrders);
    }

    /**
     * Delete a product physically only if no orders reference it.
     * If historical orders exist, rejects physical delete and advises archiving.
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID: " + productId));

        boolean hasOrders = orderItemRepository.existsByProductId(productId);
        if (hasOrders) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_HAS_ORDERS",
                    "Sản phẩm '" + product.getName()
                            + "' đã phát sinh đơn hàng trong quá khứ, không thể xóa vật lý. Vui lòng chuyển trạng thái sang Lưu trữ (ARCHIVED)");
        }

        productRepository.delete(product);
    }

    private void validateVariantPrices(BigDecimal price, BigDecimal compareAtPrice) {
        if (price == null || price.compareTo(new BigDecimal("1000")) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PRICE", "Giá bán phải từ 1.000 VNĐ trở lên");
        }
        if (compareAtPrice != null && compareAtPrice.compareTo(price) < 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_COMPARE_AT_PRICE",
                    "Giá niêm yết so sánh (" + compareAtPrice + ") không được nhỏ hơn giá bán thực tế (" + price + ")");
        }
    }

    private OwnerProductSummaryDto toSummaryDto(Product p) {
        int totalStock = p.getVariants().stream().mapToInt(ProductVariant::getStockQuantity).sum();
        String primaryImg = p.getPrimaryImage().map(ProductImage::getImageUrl).orElse(null);

        return new OwnerProductSummaryDto(
                p.getId(),
                p.getShopId(),
                p.getName(),
                p.getSlug(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.getBrand(),
                p.getStatus(),
                p.getVariants().size(),
                totalStock,
                p.getMinPrice(),
                p.getMaxPrice(),
                primaryImg,
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    private OwnerProductDetailDto toDetailDto(Product p, boolean hasOrders) {
        List<OwnerVariantDto> variantDtos = p.getVariants().stream()
                .map(v -> {
                    boolean vHasOrders = orderItemRepository.existsByVariantId(v.getId());
                    return toVariantDto(v, vHasOrders);
                })
                .toList();

        List<ProductImageDto> imageDtos = p.getImages().stream()
                .map(img -> new ProductImageDto(
                        img.getId(),
                        img.getVariant() != null ? img.getVariant().getId() : null,
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getSortOrder(),
                        img.isPrimary()))
                .toList();

        return new OwnerProductDetailDto(
                p.getId(),
                p.getShopId(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getBrand(),
                p.getMaterial(),
                p.getFitStyle(),
                p.getCareInstructions(),
                p.getSpecifications(),
                p.getStatus(),
                variantDtos,
                imageDtos,
                hasOrders,
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    private OwnerVariantDto toVariantDto(ProductVariant v, boolean hasOrders) {
        return new OwnerVariantDto(
                v.getId(),
                v.getSku(),
                v.getSize(),
                v.getColorName(),
                v.getColorHex(),
                v.getPrice(),
                v.getCompareAtPrice(),
                v.getStockQuantity(),
                v.getStatus(),
                hasOrders,
                v.getCreatedAt(),
                v.getUpdatedAt());
    }
}
