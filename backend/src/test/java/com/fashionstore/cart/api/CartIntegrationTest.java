package com.fashionstore.cart.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fashionstore.cart.api.dto.AddCartItemRequest;
import com.fashionstore.cart.api.dto.UpdateCartItemRequest;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
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
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Integration Test: API Giỏ hàng (Cart API Endpoints)")
class CartIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private Cookie userACookie;
    private Cookie userBCookie;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByCode("CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role("CUSTOMER", "Khách hàng")));

        // 1. Create User A
        User userA = new User("user.a@fashionstore.com", "hash", "User A", "0911111111");
        userA.setRoles(Set.of(customerRole));
        userA = userRepository.save(userA);
        String tokenA = tokenProvider.generateToken(UserPrincipal.create(userA));
        userACookie = new Cookie("fs_session", tokenA);

        // 2. Create User B
        User userB = new User("user.b@fashionstore.com", "hash", "User B", "0922222222");
        userB.setRoles(Set.of(customerRole));
        userB = userRepository.save(userB);
        String tokenB = tokenProvider.generateToken(UserPrincipal.create(userB));
        userBCookie = new Cookie("fs_session", tokenB);

        // 3. Create Product & Variant
        Category category = new Category("Thời trang Nữ", "nu-cart-test", "Mô tả", null, 1);
        categoryRepository.save(category);

        Product product = new Product(1L, category, "Đầm Maxi Satin", "dam-maxi-satin-cart", "Mô tả", "Atelier", "Satin", "Xòe", "Giặt nhẹ", "{}", ProductStatus.ACTIVE);
        testVariant = new ProductVariant(product, "CART-VAR-S", "S", "Hồng Pastel", "#FFB6C1", new BigDecimal("750000.00"), new BigDecimal("900000.00"), 20, ProductVariantStatus.ACTIVE);
        product.addVariant(testVariant);

        productRepository.save(product);
    }

    @Test
    @DisplayName("Truy cập giỏ hàng khi chưa đăng nhập -> Nhận HTTP 401 Unauthorized")
    void getCart_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Đọc giỏ hàng rỗng của người dùng đã đăng nhập -> Trả về data rỗng 200 OK")
    void getCart_emptyCart_returnsSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/cart").cookie(userACookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemCount", is(0)))
                .andExpect(jsonPath("$.data.subtotal", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @DisplayName("Thêm sản phẩm và cộng dồn khi thêm lại -> Kiểm tra số lượng và tổng tiền chính xác")
    void addItem_andMerge_calculatesCorrectSubtotal() throws Exception {
        // 1. Thêm lần 1: 2 sản phẩm
        AddCartItemRequest req1 = new AddCartItemRequest(testVariant.getId(), 2);
        mockMvc.perform(post("/api/v1/cart/items")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemCount", is(2)))
                .andExpect(jsonPath("$.data.subtotal", is(1500000.00)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(2)))
                .andExpect(jsonPath("$.data.items[0].unitPrice", is(750000.00)))
                .andExpect(jsonPath("$.data.items[0].lineTotal", is(1500000.00)));

        // 2. Thêm lần 2: 3 sản phẩm cùng biến thể -> Số lượng thành 5
        AddCartItemRequest req2 = new AddCartItemRequest(testVariant.getId(), 3);
        mockMvc.perform(post("/api/v1/cart/items")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemCount", is(5)))
                .andExpect(jsonPath("$.data.subtotal", is(3750000.00)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(5)));
    }

    @Test
    @DisplayName("Thao tác chéo người dùng: User B cố gắng sửa hoặc xóa item của User A -> Nhận 404 NOT FOUND")
    void crossUserAccess_returnsNotFound() throws Exception {
        // User A thêm 1 item
        AddCartItemRequest addReq = new AddCartItemRequest(testVariant.getId(), 1);
        String responseJson = mockMvc.perform(post("/api/v1/cart/items")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long itemId = objectMapper.readTree(responseJson).path("data").path("items").get(0).path("id").asLong();

        // User B cố gắng cập nhật số lượng của User A
        UpdateCartItemRequest updateReq = new UpdateCartItemRequest(4);
        mockMvc.perform(patch("/api/v1/cart/items/" + itemId)
                        .cookie(userBCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // User B cố gắng xóa item của User A
        mockMvc.perform(delete("/api/v1/cart/items/" + itemId)
                        .cookie(userBCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Xóa dòng hàng và dọn sạch giỏ hàng -> Cập nhật trạng thái giỏ rỗng thành công")
    void removeItem_andClearCart_worksCorrectly() throws Exception {
        // 1. Thêm 1 item
        AddCartItemRequest addReq = new AddCartItemRequest(testVariant.getId(), 2);
        String res = mockMvc.perform(post("/api/v1/cart/items")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long itemId = objectMapper.readTree(res).path("data").path("items").get(0).path("id").asLong();

        // 2. Xóa item
        mockMvc.perform(delete("/api/v1/cart/items/" + itemId).cookie(userACookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemCount", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));

        // 3. Clear cart
        mockMvc.perform(delete("/api/v1/cart").cookie(userACookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItemCount", is(0)));
    }
}
