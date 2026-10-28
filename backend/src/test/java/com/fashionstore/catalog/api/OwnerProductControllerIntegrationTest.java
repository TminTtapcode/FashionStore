package com.fashionstore.catalog.api;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.security.CookieUtils;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.order.domain.*;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
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
import java.util.Locale;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Owner Product Management & Variant CRUD Integration Tests (Phase 5C.2A)")
class OwnerProductControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private EntityManager entityManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository variantRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private CookieUtils cookieUtils;

    private Cookie ownerCookie;
    private Cookie adminCookie;
    private Cookie customerCookie;
    private User testCustomer;

    private Category testCategory;
    private Product existingProduct;
    private ProductVariant existingVariant;

    @BeforeEach
    void setUp() {
        User owner = createUser("SHOP_OWNER");
        User admin = createUser("ADMIN");
        testCustomer = createUser("CUSTOMER");

        ownerCookie = authCookie(owner);
        adminCookie = authCookie(admin);
        customerCookie = authCookie(testCustomer);

        testCategory = categoryRepository.save(new Category(
                "Đầm Nữ Atelier", "dam-nu-atelier", "Danh mục đầm cao cấp", null, 1));

        existingProduct = new Product(1L, testCategory, "Đầm Lụa Dạ Hội", "dam-lua-da-hoi",
                "Đầm lụa sang trọng", "Atelier", "100% Lụa", "Dáng xòe", "Giặt tay nhẹ", "{}", ProductStatus.ACTIVE);

        existingVariant = new ProductVariant(existingProduct, "DAM-LUA-DO-S", "S", "Đỏ Ruby", "#E0115F",
                new BigDecimal("1200000"), new BigDecimal("1500000"), 15, ProductVariantStatus.ACTIVE);

        existingProduct.addVariant(existingVariant);
        productRepository.saveAndFlush(existingProduct);

        entityManager.clear();
    }

    @Test
    @DisplayName("1. RBAC: Guest bị từ chối truy cập Owner Product API (401 Unauthorized)")
    void guestAccess_isRejectedWith401() throws Exception {
        mockMvc.perform(get("/api/v1/owner/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. RBAC: Khách hàng (CUSTOMER) bị từ chối truy cập Owner Product API (403 Forbidden)")
    void customerAccess_isRejectedWith403() throws Exception {
        mockMvc.perform(get("/api/v1/owner/products").cookie(customerCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. RBAC: Shop Owner và Admin truy cập thành công (200 OK)")
    void ownerAccess_isAllowedWith200() throws Exception {
        mockMvc.perform(get("/api/v1/owner/products").cookie(ownerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.data.items").isArray());

        mockMvc.perform(get("/api/v1/owner/products").cookie(adminCookie))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("4. Create Product: Shop Owner tạo sản phẩm DRAFT thành công kèm ma trận biến thể")
    void createProduct_withVariants_succeeds() throws Exception {
        String payload = """
                {
                    "categoryId": %d,
                    "name": "Áo Sơ Mi Lụa Cổ V",
                    "brand": "IVRE Atelier",
                    "material": "Lụa Tơ Tằm",
                    "fitStyle": "Regular Fit",
                    "careInstructions": "Giặt hấp hoặc giặt tay",
                    "specifications": "{\\"stretch\\": \\"Không co giãn\\"}",
                    "status": "DRAFT",
                    "variants": [
                        {
                            "size": "S",
                            "colorName": "Trắng Kem",
                            "colorHex": "#FFFDD0",
                            "price": 850000,
                            "compareAtPrice": 950000,
                            "stockQuantity": 20
                        },
                        {
                            "size": "M",
                            "colorName": "Trắng Kem",
                            "colorHex": "#FFFDD0",
                            "price": 850000,
                            "compareAtPrice": 950000,
                            "stockQuantity": 15
                        }
                    ]
                }
                """.formatted(testCategory.getId());

        mockMvc.perform(post("/api/v1/owner/products")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.data.name").value("Áo Sơ Mi Lụa Cổ V"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.variants", hasSize(2)))
                .andExpect(jsonPath("$.data.variants[0].sku", containsString("AO-SO-MI-LUA")));

        // Verify in database
        assertThat(productRepository.existsBySlug("ao-so-mi-lua-co-v")).isTrue();
    }

    @Test
    @DisplayName("5. Create Product: Chặn xuất bản ACTIVE nếu sản phẩm chưa có biến thể nào")
    void createProduct_activeWithoutVariants_isRejected() throws Exception {
        String payload = """
                {
                    "categoryId": %d,
                    "name": "Áo Thun Không Biến Thể",
                    "status": "ACTIVE",
                    "variants": []
                }
                """.formatted(testCategory.getId());

        mockMvc.perform(post("/api/v1/owner/products")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("ACTIVE_REQUIRES_VARIANTS"));
    }

    @Test
    @DisplayName("6. Create Product: Chặn trùng lặp tổ hợp (size, color) trong danh sách biến thể")
    void createProduct_duplicateVariantCombo_isRejected() throws Exception {
        String payload = """
                {
                    "categoryId": %d,
                    "name": "Váy Chữ A Dạo Phố",
                    "status": "DRAFT",
                    "variants": [
                        {
                            "size": "M",
                            "colorName": "Đen Tuyền",
                            "price": 600000,
                            "stockQuantity": 10
                        },
                        {
                            "size": "M",
                            "colorName": "Đen Tuyền",
                            "price": 600000,
                            "stockQuantity": 5
                        }
                    ]
                }
                """.formatted(testCategory.getId());

        mockMvc.perform(post("/api/v1/owner/products")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_VARIANT_COMBINATION"));
    }

    @Test
    @DisplayName("7. Price Validation: Chặn giá niêm yết compareAtPrice nhỏ hơn giá bán thực tế")
    void createProduct_compareAtPriceLessThanPrice_isRejected() throws Exception {
        String payload = """
                {
                    "categoryId": %d,
                    "name": "Quần Tây Xếp Ly",
                    "status": "DRAFT",
                    "variants": [
                        {
                            "size": "L",
                            "colorName": "Ghi Sáng",
                            "price": 750000,
                            "compareAtPrice": 500000,
                            "stockQuantity": 10
                        }
                    ]
                }
                """.formatted(testCategory.getId());

        mockMvc.perform(post("/api/v1/owner/products")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_COMPARE_AT_PRICE"));
    }

    @Test
    @DisplayName("8. Add Variant: Chặn trùng SKU đã tồn tại trong toàn hệ thống (409 Conflict)")
    void addVariant_duplicateSku_isRejected() throws Exception {
        String payload = """
                {
                    "sku": "%s",
                    "size": "M",
                    "colorName": "Xanh Rêu",
                    "price": 1200000,
                    "stockQuantity": 10
                }
                """.formatted(existingVariant.getSku());

        mockMvc.perform(post("/api/v1/owner/products/" + existingProduct.getId() + "/variants")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("9. Add Variant: Chặn trùng tổ hợp (size, color) trên cùng sản phẩm")
    void addVariant_duplicateSizeColor_isRejected() throws Exception {
        String payload = """
                {
                    "size": "S",
                    "colorName": "Đỏ Ruby",
                    "price": 1200000,
                    "stockQuantity": 5
                }
                """;

        mockMvc.perform(post("/api/v1/owner/products/" + existingProduct.getId() + "/variants")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_VARIANT_COMBINATION"));
    }

    @Test
    @DisplayName("10. SKU Immutability: Chặn đổi SKU của biến thể đã có đơn hàng lịch sử")
    void updateVariant_skuChangeOnOrderedVariant_isRejected() throws Exception {
        // Create an order referencing existingVariant
        Order order = new Order("ORD-SKU-TEST", "key-sku-1", testCustomer, PaymentMethod.COD,
                "Khách Test", "0901234567", "123 Test", "Hà Nội", null, null, null,
                new BigDecimal("1200000"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("1200000"), null);
        order.addItem(new OrderItem(order, existingProduct.getId(), existingVariant.getId(),
                existingProduct.getName(), existingProduct.getBrand(), existingVariant.getSku(),
                existingVariant.getSize(), existingVariant.getColorName(), null, existingVariant.getPrice(),
                1, existingVariant.getPrice()));
        orderRepository.saveAndFlush(order);

        String payload = """
                {
                    "sku": "NEW-SKU-MODIFIED",
                    "size": "S",
                    "colorName": "Đỏ Ruby",
                    "colorHex": "#E0115F",
                    "price": 1200000,
                    "compareAtPrice": 1500000,
                    "status": "ACTIVE"
                }
                """;

        mockMvc.perform(put("/api/v1/owner/products/" + existingProduct.getId() + "/variants/" + existingVariant.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("SKU_IMMUTABLE"));
    }

    @Test
    @DisplayName("11. Product Lifecycle: Chuyển DRAFT -> ACTIVE yêu cầu ít nhất 1 biến thể hoạt động")
    void updateProductStatus_draftToActive_requiresActiveVariant() throws Exception {
        // Create product with only INACTIVE variant
        Product draftProduct = new Product(1L, testCategory, "Váy Nháp", "vay-nhap",
                "Mô tả", "Atelier", "Cotton", "Suông", null, null, ProductStatus.DRAFT);
        ProductVariant inactiveVariant = new ProductVariant(draftProduct, "VAY-NHAP-S", "S", "Xám", "#808080",
                new BigDecimal("500000"), null, 10, ProductVariantStatus.INACTIVE);
        draftProduct.addVariant(inactiveVariant);
        productRepository.saveAndFlush(draftProduct);

        String payload = """
                {
                    "status": "ACTIVE",
                    "note": "Xuất bản sản phẩm"
                }
                """;

        mockMvc.perform(patch("/api/v1/owner/products/" + draftProduct.getId() + "/status")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("NO_ACTIVE_VARIANTS"));
    }

    @Test
    @DisplayName("12. Product Lifecycle: Trạng thái ARCHIVED là điểm kết thúc, không thể kích hoạt lại")
    void updateProductStatus_archivedIsTerminal() throws Exception {
        existingProduct.setStatus(ProductStatus.ARCHIVED);
        productRepository.saveAndFlush(existingProduct);

        String payload = """
                {
                    "status": "ACTIVE"
                }
                """;

        mockMvc.perform(patch("/api/v1/owner/products/" + existingProduct.getId() + "/status")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_TRANSITION"));
    }

    @Test
    @DisplayName("13. Storefront Isolation: Sản phẩm HIDDEN, DRAFT hoặc ARCHIVED không hiển thị trên Storefront")
    void storefront_doesNotDisplayNonActiveProducts() throws Exception {
        // Existing product is ACTIVE -> visible
        mockMvc.perform(get("/api/v1/products/" + existingProduct.getSlug()))
                .andExpect(status().isOk());

        // Change to HIDDEN
        existingProduct.setStatus(ProductStatus.HIDDEN);
        productRepository.saveAndFlush(existingProduct);

        // Storefront returns 404
        mockMvc.perform(get("/api/v1/products/" + existingProduct.getSlug()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("14. Delete Product: Chặn xóa vật lý khi sản phẩm đã phát sinh đơn hàng lịch sử")
    void deleteProduct_blockedIfHasOrders() throws Exception {
        Order order = new Order("ORD-DEL-TEST", "key-del-1", testCustomer, PaymentMethod.COD,
                "Khách Test", "0901234567", "123 Test", "Hà Nội", null, null, null,
                new BigDecimal("1200000"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("1200000"), null);
        order.addItem(new OrderItem(order, existingProduct.getId(), existingVariant.getId(),
                existingProduct.getName(), existingProduct.getBrand(), existingVariant.getSku(),
                existingVariant.getSize(), existingVariant.getColorName(), null, existingVariant.getPrice(),
                1, existingVariant.getPrice()));
        orderRepository.saveAndFlush(order);

        mockMvc.perform(delete("/api/v1/owner/products/" + existingProduct.getId())
                        .cookie(ownerCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("PRODUCT_HAS_ORDERS"));
    }

    private User createUser(String roleCode) {
        Role role = roleRepository.findByCode(roleCode)
                .orElseGet(() -> roleRepository.save(new Role(roleCode, "Role " + roleCode)));
        User user = new User(roleCode.toLowerCase(Locale.ROOT) + ".ownerproduct@fashionstore.com",
                "hash", roleCode + " Test User", "0901234567");
        user.setRoles(Set.of(role));
        return userRepository.save(user);
    }

    private Cookie authCookie(User user) {
        return new Cookie(cookieUtils.getCookieName(), tokenProvider.generateToken(UserPrincipal.create(user)));
    }
}
