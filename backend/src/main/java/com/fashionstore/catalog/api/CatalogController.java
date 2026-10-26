package com.fashionstore.catalog.api;

import com.fashionstore.catalog.application.CatalogService;
import com.fashionstore.catalog.dto.CategoryDto;
import com.fashionstore.catalog.dto.ProductDetailDto;
import com.fashionstore.catalog.dto.ProductFilterRequest;
import com.fashionstore.catalog.dto.ProductSummaryDto;
import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.api.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    /**
     * Get hierarchical categories tree for storefront navigation.
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories() {
        List<CategoryDto> categories = catalogService.getCategoriesTree();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * Search, filter, and paginate active products with size/color/price/stock filters.
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummaryDto>>> getProducts(
            @ModelAttribute ProductFilterRequest filter
    ) {
        PageResponse<ProductSummaryDto> result = catalogService.getProducts(filter);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get product details by slug including active variants, gallery images, and size guide specs.
     */
    @GetMapping("/products/{slug}")
    public ResponseEntity<ApiResponse<ProductDetailDto>> getProductDetail(@PathVariable String slug) {
        ProductDetailDto product = catalogService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(product));
    }
}
