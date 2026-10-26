package com.fashionstore.catalog.application;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.catalog.dto.CategoryDto;
import com.fashionstore.catalog.dto.ProductDetailDto;
import com.fashionstore.catalog.dto.ProductFilterRequest;
import com.fashionstore.catalog.dto.ProductSummaryDto;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    private CatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogService(categoryRepository, productRepository);
    }

    @Test
    @DisplayName("getCategoriesTree should return root categories with their active children")
    void getCategoriesTree_Success() {
        Category parent = new Category("Thời trang Nữ", "thoi-trang-nu", "Trang phục nữ", null, 1);
        parent.setId(1L);

        Category child = new Category("Đầm & Váy", "dam-va-vay", "Đầm thời trang", parent, 1);
        child.setId(2L);
        parent.getChildren().add(child);

        when(categoryRepository.findByParentIsNullAndStatusOrderBySortOrderAscIdAsc(CategoryStatus.ACTIVE))
                .thenReturn(List.of(parent));

        List<CategoryDto> tree = catalogService.getCategoriesTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getName()).isEqualTo("Thời trang Nữ");
        assertThat(tree.get(0).getChildren()).hasSize(1);
        assertThat(tree.get(0).getChildren().get(0).getName()).isEqualTo("Đầm & Váy");
    }

    @Test
    @DisplayName("getProductBySlug should return complete product detail with variants and swatches")
    void getProductBySlug_Success() {
        Category category = new Category("Áo", "ao", "Áo nam nữ", null, 1);
        category.setId(10L);

        Product product = new Product(
                1L, category, "Áo Sơ Mi Oxford", "ao-so-mi-oxford",
                "Mô tả sơ mi", "Heritage", "100% Cotton", "Regular Fit",
                "Giặt tay", "{\"collar\": \"button-down\"}", ProductStatus.ACTIVE
        );
        product.setId(100L);

        ProductVariant v1 = new ProductVariant(
                product, "SM-TRANG-S", "S", "Trắng", "#FFFFFF",
                new BigDecimal("450000.00"), new BigDecimal("500000.00"), 10, ProductVariantStatus.ACTIVE
        );
        v1.setId(1L);

        ProductVariant v2 = new ProductVariant(
                product, "SM-TRANG-M", "M", "Trắng", "#FFFFFF",
                new BigDecimal("450000.00"), new BigDecimal("500000.00"), 15, ProductVariantStatus.ACTIVE
        );
        v2.setId(2L);

        product.addVariant(v1);
        product.addVariant(v2);

        ProductImage img = new ProductImage(product, v1, "https://example.com/somi.jpg", "key_somi", "Sơ mi", 1, true);
        product.addImage(img);

        when(productRepository.findBySlugAndStatus("ao-so-mi-oxford", ProductStatus.ACTIVE))
                .thenReturn(Optional.of(product));

        ProductDetailDto detail = catalogService.getProductBySlug("ao-so-mi-oxford");

        assertThat(detail).isNotNull();
        assertThat(detail.getName()).isEqualTo("Áo Sơ Mi Oxford");
        assertThat(detail.getMinPrice()).isEqualByComparingTo("450000.00");
        assertThat(detail.getCompareAtPrice()).isEqualByComparingTo("500000.00");
        assertThat(detail.isOutOfStock()).isFalse();
        assertThat(detail.getVariants()).hasSize(2);
        assertThat(detail.getImages()).hasSize(1);
        assertThat(detail.getAvailableSizes()).containsExactlyInAnyOrder("S", "M");
        assertThat(detail.getAvailableColors()).hasSize(1);
        assertThat(detail.getAvailableColors().get(0).getName()).isEqualTo("Trắng");
    }

    @Test
    @DisplayName("getProductBySlug should throw ResourceNotFoundException if product not found")
    void getProductBySlug_NotFound() {
        when(productRepository.findBySlugAndStatus("non-existent", ProductStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.getProductBySlug("non-existent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Sản phẩm không tồn tại");
    }

    @Test
    @DisplayName("getProducts should map paged products and calculate price bounds correctly")
    void getProducts_Success() {
        Category category = new Category("Quần", "quan", "Quần các loại", null, 2);
        Product p = new Product(1L, category, "Quần Jeans", "quan-jeans", "Jeans", "Denim", "Cotton", "Straight", "Wash", null, ProductStatus.ACTIVE);
        p.setId(200L);

        ProductVariant var1 = new ProductVariant(p, "JEANS-28", "28", "Xanh", "#0000FF", new BigDecimal("500000.00"), null, 5, ProductVariantStatus.ACTIVE);
        ProductVariant var2 = new ProductVariant(p, "JEANS-29", "29", "Xanh", "#0000FF", new BigDecimal("550000.00"), null, 0, ProductVariantStatus.ACTIVE);
        p.addVariant(var1);
        p.addVariant(var2);

        Page<Product> pagedResult = new PageImpl<>(List.of(p), PageRequest.of(0, 12), 1);
        when(productRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(pagedResult);

        ProductFilterRequest filter = new ProductFilterRequest();
        PageResponse<ProductSummaryDto> response = catalogService.getProducts(filter);

        assertThat(response.getItems()).hasSize(1);
        ProductSummaryDto summary = response.getItems().get(0);
        assertThat(summary.getMinPrice()).isEqualByComparingTo("500000.00");
        assertThat(summary.getMaxPrice()).isEqualByComparingTo("550000.00");
        assertThat(summary.isOutOfStock()).isFalse(); // var1 still has 5 in stock
    }
}
