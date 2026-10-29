package com.fashionstore.media.api;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.security.CookieUtils;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Owner Media & Cloudinary Integration Tests (Phase 5C.4)")
class OwnerMediaControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private EntityManager entityManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository variantRepository;
    @Autowired private ProductImageRepository imageRepository;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private CookieUtils cookieUtils;
    @Autowired private ObjectMapper objectMapper;

    private Cookie ownerCookie;
    private Cookie customerCookie;

    private Product testProduct;
    private Product anotherProduct;
    private ProductVariant testVariant;
    private ProductVariant foreignVariant;

    @BeforeEach
    void setUp() {
        User owner = createUser("SHOP_OWNER");
        User customer = createUser("CUSTOMER");

        ownerCookie = authCookie(owner);
        customerCookie = authCookie(customer);

        Category category = categoryRepository.save(new Category(
                "Thời trang Đầm Váy", "dam-vay-media-test", "Mô tả đầm", null, 1));

        testProduct = new Product(1L, category, "Đầm Lụa Midi Champagne", "dam-lua-midi-champagne",
                "Váy dạ hội", "IVRE Atelier", "100% Silk", "A-line", "Dry clean only", "{}", ProductStatus.ACTIVE);
        testProduct = productRepository.saveAndFlush(testProduct);

        testVariant = new ProductVariant(testProduct, "IVRE-MIDI-CHAMP-S", "S", "Champagne", "#F7E7CE",
                new BigDecimal("1250000"), new BigDecimal("1500000"), 10, ProductVariantStatus.ACTIVE);
        testVariant = variantRepository.saveAndFlush(testVariant);

        anotherProduct = new Product(2L, category, "Áo Blazer Linen", "ao-blazer-linen-media",
                "Blazer", "IVRE Atelier", "Linen", "Regular", "Hand wash", "{}", ProductStatus.ACTIVE);
        anotherProduct = productRepository.saveAndFlush(anotherProduct);

        foreignVariant = new ProductVariant(anotherProduct, "IVRE-BLZ-LINEN-M", "M", "Đen", "#000000",
                new BigDecimal("1850000"), null, 5, ProductVariantStatus.ACTIVE);
        foreignVariant = variantRepository.saveAndFlush(foreignVariant);

        entityManager.clear();
    }

    @Test
    @DisplayName("1. RBAC: Guest nhận 401, Customer nhận 403, Owner nhận 200 khi ký upload")
    void rbacForMediaEndpoints() throws Exception {
        // Guest -> 401
        mockMvc.perform(post("/api/v1/owner/media/sign-upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + testProduct.getId() + "}"))
                .andExpect(status().isUnauthorized());

        // Customer -> 403
        mockMvc.perform(post("/api/v1/owner/media/sign-upload")
                        .cookie(customerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + testProduct.getId() + "}"))
                .andExpect(status().isForbidden());

        // Owner -> 200 OK
        mockMvc.perform(post("/api/v1/owner/media/sign-upload")
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + testProduct.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.signature").isNotEmpty())
                .andExpect(jsonPath("$.data.folder").value(containsString(testProduct.getId().toString())));
    }

    @Test
    @DisplayName("2. Thêm ảnh đầu tiên: Tự động trở thành ảnh đại diện (isPrimary = true)")
    void addImage_firstImageBecomesPrimaryAutomatically() throws Exception {
        String payload = """
                {
                    "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample1.jpg",
                    "storageKey": "fashion_store/products/sample1",
                    "altText": "Góc chụp chính diện",
                    "fileSize": 1048576,
                    "width": 1200,
                    "height": 1600,
                    "format": "jpg"
                }
                """;

        mockMvc.perform(post("/api/v1/owner/products/{productId}/images", testProduct.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.imageUrl").value("https://res.cloudinary.com/demo/image/upload/sample1.jpg"))
                .andExpect(jsonPath("$.data.isPrimary").value(true))
                .andExpect(jsonPath("$.data.sortOrder").value(0))
                .andExpect(jsonPath("$.data.fileSize").value(1048576))
                .andExpect(jsonPath("$.data.width").value(1200))
                .andExpect(jsonPath("$.data.height").value(1600));

        assertThat(imageRepository.countByProductId(testProduct.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("3. Thêm ảnh gán cho biến thể thuộc sản phẩm khác -> Bị chặn với 400 INVALID_VARIANT_ASSOCIATION")
    void addImage_withForeignVariant_rejected() throws Exception {
        String payload = """
                {
                    "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample_foreign.jpg",
                    "storageKey": "fashion_store/products/sample_foreign",
                    "variantId": %d
                }
                """.formatted(foreignVariant.getId());

        mockMvc.perform(post("/api/v1/owner/products/{productId}/images", testProduct.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_VARIANT_ASSOCIATION"));
    }

    @Test
    @DisplayName("4. Thêm ảnh gán biến thể hợp lệ và ảnh thứ 2 đặt isPrimary = true -> Hủy primary ảnh thứ nhất")
    void addImage_secondPrimaryImageDemotesFirst() throws Exception {
        // Image 1: Primary
        Product prod = productRepository.findById(testProduct.getId()).orElseThrow();
        ProductImage img1 = new ProductImage(prod, null, "https://url/1.jpg", "key/1", "Ảnh 1", 0, true);
        imageRepository.saveAndFlush(img1);

        // Add Image 2 with variantId and isPrimary = true
        String payload = """
                {
                    "imageUrl": "https://url/2.jpg",
                    "storageKey": "key/2",
                    "variantId": %d,
                    "altText": "Ảnh màu champagne",
                    "isPrimary": true
                }
                """.formatted(testVariant.getId());

        mockMvc.perform(post("/api/v1/owner/products/{productId}/images", testProduct.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isPrimary").value(true))
                .andExpect(jsonPath("$.data.variantId").value(testVariant.getId()));

        entityManager.flush();
        entityManager.clear();

        ProductImage reloaded1 = imageRepository.findById(img1.getId()).orElseThrow();
        assertThat(reloaded1.isPrimary()).isFalse();
    }

    @Test
    @DisplayName("5. Cập nhật ảnh (thay đổi variant, altText, sortOrder)")
    void updateImage_success() throws Exception {
        Product prod = productRepository.findById(testProduct.getId()).orElseThrow();
        ProductImage img = new ProductImage(prod, null, "https://url/1.jpg", "key/1", "Alt cũ", 0, true);
        imageRepository.saveAndFlush(img);

        String payload = """
                {
                    "variantId": %d,
                    "altText": "Alt mới cập nhật",
                    "sortOrder": 3,
                    "isPrimary": true
                }
                """.formatted(testVariant.getId());

        mockMvc.perform(put("/api/v1/owner/products/{productId}/images/{imageId}", testProduct.getId(), img.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.altText").value("Alt mới cập nhật"))
                .andExpect(jsonPath("$.data.sortOrder").value(3))
                .andExpect(jsonPath("$.data.variantId").value(testVariant.getId()));
    }

    @Test
    @DisplayName("6. Đổi ảnh đại diện qua PATCH set-primary")
    void setPrimaryImage_success() throws Exception {
        Product prod = productRepository.findById(testProduct.getId()).orElseThrow();
        ProductImage img1 = new ProductImage(prod, null, "https://url/1.jpg", "key/1", "Ảnh 1", 0, true);
        ProductImage img2 = new ProductImage(prod, null, "https://url/2.jpg", "key/2", "Ảnh 2", 1, false);
        imageRepository.saveAllAndFlush(List.of(img1, img2));

        mockMvc.perform(patch("/api/v1/owner/products/{productId}/images/{imageId}/set-primary", testProduct.getId(), img2.getId())
                        .cookie(ownerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isPrimary").value(true));

        entityManager.flush();
        entityManager.clear();

        assertThat(imageRepository.findById(img1.getId()).orElseThrow().isPrimary()).isFalse();
        assertThat(imageRepository.findById(img2.getId()).orElseThrow().isPrimary()).isTrue();
    }

    @Test
    @DisplayName("7. Sắp xếp lại thứ tự hình ảnh qua PUT reorder")
    void reorderImages_success() throws Exception {
        Product prod = productRepository.findById(testProduct.getId()).orElseThrow();
        ProductImage img1 = new ProductImage(prod, null, "https://url/1.jpg", "key/1", "Ảnh 1", 0, true);
        ProductImage img2 = new ProductImage(prod, null, "https://url/2.jpg", "key/2", "Ảnh 2", 1, false);
        ProductImage img3 = new ProductImage(prod, null, "https://url/3.jpg", "key/3", "Ảnh 3", 2, false);
        imageRepository.saveAllAndFlush(List.of(img1, img2, img3));

        // Reorder to 3, 1, 2
        String payload = objectMapper.writeValueAsString(Map.of("imageIds", List.of(img3.getId(), img1.getId(), img2.getId())));

        mockMvc.perform(put("/api/v1/owner/products/{productId}/images/reorder", testProduct.getId())
                        .cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(img3.getId()))
                .andExpect(jsonPath("$.data[0].sortOrder").value(0))
                .andExpect(jsonPath("$.data[1].id").value(img1.getId()))
                .andExpect(jsonPath("$.data[1].sortOrder").value(1))
                .andExpect(jsonPath("$.data[2].id").value(img2.getId()))
                .andExpect(jsonPath("$.data[2].sortOrder").value(2));
    }

    @Test
    @DisplayName("8. Xóa ảnh đại diện: Tự động thăng cấp ảnh kế tiếp làm ảnh đại diện mới")
    void deleteImage_promotesNextAvailableImage() throws Exception {
        Product prod = productRepository.findById(testProduct.getId()).orElseThrow();
        ProductImage img1 = new ProductImage(prod, null, "https://url/1.jpg", "key/1", "Ảnh 1", 0, true);
        ProductImage img2 = new ProductImage(prod, null, "https://url/2.jpg", "key/2", "Ảnh 2", 1, false);
        imageRepository.saveAllAndFlush(List.of(img1, img2));

        mockMvc.perform(delete("/api/v1/owner/products/{productId}/images/{imageId}", testProduct.getId(), img1.getId())
                        .cookie(ownerCookie))
                .andExpect(status().isOk());

        entityManager.flush();
        entityManager.clear();

        assertThat(imageRepository.existsById(img1.getId())).isFalse();
        ProductImage promoted = imageRepository.findById(img2.getId()).orElseThrow();
        assertThat(promoted.isPrimary()).isTrue();
    }

    @Test
    @DisplayName("9. Xóa ảnh của sản phẩm khác -> Nhận 404 Not Found")
    void deleteImage_fromForeignProduct_returns404() throws Exception {
        Product other = productRepository.findById(anotherProduct.getId()).orElseThrow();
        ProductImage foreignImg = new ProductImage(other, null, "https://url/f.jpg", "key/f", "Ảnh khác", 0, true);
        foreignImg = imageRepository.saveAndFlush(foreignImg);

        mockMvc.perform(delete("/api/v1/owner/products/{productId}/images/{imageId}", testProduct.getId(), foreignImg.getId())
                        .cookie(ownerCookie))
                .andExpect(status().isNotFound());
    }

    private User createUser(String roleCode) {
        Role role = roleRepository.findByCode(roleCode)
                .orElseGet(() -> roleRepository.save(new Role(roleCode, "Role " + roleCode)));
        String unique = System.currentTimeMillis() + "_" + Math.abs(roleCode.hashCode() % 1000);
        User user = new User(roleCode.toLowerCase(Locale.ROOT) + "." + unique + "@fashionstore.com",
                "$2a$10$abcdefghijklmnopqrstuvwxyzABCDE", roleCode + " Test User", "0901234567");
        user.setRoles(Set.of(role));
        return userRepository.save(user);
    }

    private Cookie authCookie(User user) {
        return new Cookie(cookieUtils.getCookieName(), tokenProvider.generateToken(UserPrincipal.create(user)));
    }
}
