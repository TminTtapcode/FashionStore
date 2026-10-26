package com.fashionstore.catalog.api;

import com.fashionstore.catalog.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CatalogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    private Product testProduct;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category("Thời trang Nữ", "thoi-trang-nu-test", "Trang phục nữ thanh lịch", null, 1);
        categoryRepository.save(testCategory);

        Category subCategory = new Category("Đầm Maxi", "dam-maxi-test", "Đầm dài maxi", testCategory, 1);
        categoryRepository.save(subCategory);

        testProduct = new Product(
                1L, subCategory, "Đầm Lụa Maxi Hoa Nhí", "dam-lua-maxi-hoa-nhi-test",
                "Đầm hoa nhí cao cấp", "Atelier", "100% Lụa Satin", "Dáng Xòe",
                "Giặt tay nhẹ", "{\"length\": \"120cm\"}", ProductStatus.ACTIVE
        );
        ProductVariant varS = new ProductVariant(
                testProduct, "TEST-DAM-S", "S", "Trắng Kem", "#FDFBF7",
                new BigDecimal("600000.00"), new BigDecimal("700000.00"), 10, ProductVariantStatus.ACTIVE
        );
        ProductVariant varM = new ProductVariant(
                testProduct, "TEST-DAM-M", "M", "Trắng Kem", "#FDFBF7",
                new BigDecimal("620000.00"), new BigDecimal("700000.00"), 5, ProductVariantStatus.ACTIVE
        );
        testProduct.addVariant(varS);
        testProduct.addVariant(varM);

        ProductImage img = new ProductImage(testProduct, varS, "https://example.com/dam.jpg", "key_dam", "Ảnh đầm", 1, true);
        testProduct.addImage(img);

        productRepository.save(testProduct);
    }

    @Test
    @DisplayName("GET /api/v1/categories should return active category hierarchy")
    void getCategories_Success() throws Exception {
        mockMvc.perform(get("/api/v1/categories")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[?(@.slug == 'thoi-trang-nu-test')].name").value("Thời trang Nữ"))
                .andExpect(jsonPath("$.data[?(@.slug == 'thoi-trang-nu-test')].children", not(empty())));
    }

    @Test
    @DisplayName("GET /api/v1/products should return paginated apparel list with price range")
    void getProducts_Success() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                .param("page", "0")
                .param("limit", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", not(empty())))
                .andExpect(jsonPath("$.data.items[?(@.slug == 'dam-lua-maxi-hoa-nhi-test')].minPrice").value(600000.0))
                .andExpect(jsonPath("$.data.items[?(@.slug == 'dam-lua-maxi-hoa-nhi-test')].maxPrice").value(620000.0))
                .andExpect(jsonPath("$.data.items[?(@.slug == 'dam-lua-maxi-hoa-nhi-test')].outOfStock").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/products with size and color filters should filter correctly")
    void getProducts_WithFilter_Success() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                .param("size", "S")
                .param("color", "Trắng Kem")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", not(empty())))
                .andExpect(jsonPath("$.data.items[0].slug").value("dam-lua-maxi-hoa-nhi-test"));

        // Filter by non-existent size should return empty
        mockMvc.perform(get("/api/v1/products")
                .param("size", "XXL")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", empty()));
    }

    @Test
    @DisplayName("GET /api/v1/products/{slug} should return complete product details")
    void getProductDetail_Success() throws Exception {
        mockMvc.perform(get("/api/v1/products/{slug}", "dam-lua-maxi-hoa-nhi-test")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("dam-lua-maxi-hoa-nhi-test"))
                .andExpect(jsonPath("$.data.material").value("100% Lụa Satin"))
                .andExpect(jsonPath("$.data.fitStyle").value("Dáng Xòe"))
                .andExpect(jsonPath("$.data.variants", hasSize(2)))
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.availableSizes", containsInAnyOrder("S", "M")));
    }

    @Test
    @DisplayName("GET /api/v1/products/{slug} with non-existent slug should return 404")
    void getProductDetail_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/products/{slug}", "san-pham-khong-ton-tai")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }
}
