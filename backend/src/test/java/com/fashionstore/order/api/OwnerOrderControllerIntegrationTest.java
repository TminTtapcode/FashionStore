package com.fashionstore.order.api;

import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.security.CookieUtils;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.domain.DiscountType;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Integration Test: Owner return confirmation on H2")
class OwnerOrderControllerIntegrationTest {

    private static final String ORDER_NUMBER = "ORD-RETURN-TEST";
    private static final String ORDER_URL = "/api/v1/owner/orders/" + ORDER_NUMBER;
    private static final String RETURNED_REQUEST = "{\"status\":\"RETURNED\",\"note\":\"Hàng đã về kho\"}";
    private static final String RETURN_NOTE = "Đã kiểm tra và nhận hàng hoàn về kho";

    @Autowired private MockMvc mockMvc;
    @Autowired private EntityManager entityManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository variantRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderStatusHistoryRepository historyRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponUsageRepository usageRepository;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private CookieUtils cookieUtils;

    private Cookie ownerCookie;
    private Cookie adminCookie;
    private Cookie customerCookie;
    private Long orderId;
    private Long firstVariantId;
    private Long secondVariantId;
    private Long usageId;
    private Long initialHistoryId;

    @BeforeEach
    void setUp() {
        User customer = createUser("CUSTOMER");
        customerCookie = authCookie(customer);
        ownerCookie = authCookie(createUser("SHOP_OWNER"));
        adminCookie = authCookie(createUser("ADMIN"));

        Category category = categoryRepository.save(new Category(
                "Áo", "owner-return-test", "Test", null, 1));
        Product product = new Product(1L, category, "Áo Cotton", "ao-owner-return-test",
                "Test", "Atelier", "Cotton", "Regular", "Giặt nhẹ", "{}", ProductStatus.ACTIVE);
        ProductVariant first = new ProductVariant(product, "OWNER-RETURN-S", "S", "Trắng", "#FFFFFF",
                new BigDecimal("450000"), null, 6, ProductVariantStatus.ACTIVE);
        ProductVariant second = new ProductVariant(product, "OWNER-RETURN-M", "M", "Trắng", "#FFFFFF",
                new BigDecimal("500000"), null, 9, ProductVariantStatus.ACTIVE);
        product.addVariant(first);
        product.addVariant(second);
        productRepository.saveAndFlush(product);
        firstVariantId = first.getId();
        secondVariantId = second.getId();

        Coupon coupon = new Coupon();
        coupon.setCode("OWNER-RETURN-COUPON");
        coupon.setDiscountType(DiscountType.FIXED_AMOUNT);
        coupon.setDiscountValue(new BigDecimal("50000"));
        couponRepository.save(coupon);

        Order order = new Order(ORDER_NUMBER, "owner-return-key", customer, PaymentMethod.COD,
                "Khách hàng", "0901234567", "123 Nguyễn Huệ", "TP. Hồ Chí Minh", null, null, null,
                new BigDecimal("2400000"), new BigDecimal("50000"), BigDecimal.ZERO,
                new BigDecimal("2350000"), coupon.getCode());
        order.setStatus(OrderStatus.DELIVERY_FAILED);
        order.addItem(new OrderItem(order, product.getId(), firstVariantId, product.getName(), product.getBrand(),
                first.getSku(), first.getSize(), first.getColorName(), null, first.getPrice(), 2,
                new BigDecimal("900000")));
        order.addItem(new OrderItem(order, product.getId(), secondVariantId, product.getName(), product.getBrand(),
                second.getSku(), second.getSize(), second.getColorName(), null, second.getPrice(), 3,
                new BigDecimal("1500000")));
        OrderStatusHistory initialHistory = new OrderStatusHistory(order, OrderStatus.SHIPPING,
                OrderStatus.DELIVERY_FAILED, "Giao hàng thất bại", "SYSTEM");
        order.addStatusHistory(initialHistory);
        orderRepository.saveAndFlush(order);
        orderId = order.getId();
        initialHistoryId = initialHistory.getId();
        usageId = usageRepository.saveAndFlush(new CouponUsage(
                coupon, customer, orderId, new BigDecimal("50000"))).getId();
        entityManager.clear();
    }

    @ParameterizedTest
    @ValueSource(strings = {"SHOP_OWNER", "ADMIN"})
    void patchReturned_requiresConfirmation_withoutChangingOrder(String role) throws Exception {
        mockMvc.perform(patch(ORDER_URL + "/status")
                        .cookie(privilegedCookie(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RETURNED_REQUEST))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("RETURN_CONFIRMATION_REQUIRED"))
                .andExpect(jsonPath("$.error.message", containsString("confirm-return")));

        assertStoredState(OrderStatus.DELIVERY_FAILED, 6, 9, CouponUsage.STATUS_APPLIED, 1);
        assertThat(historyRepository.findByOrderIdOrderByCreatedAtAsc(orderId))
                .extracting(OrderStatusHistory::getId).containsExactly(initialHistoryId);
    }

    @ParameterizedTest
    @ValueSource(strings = {"SHOP_OWNER", "ADMIN"})
    void confirmReturn_restoresStockAndReleasesCoupon_onlyOnce(String role) throws Exception {
        Cookie cookie = privilegedCookie(role);
        mockMvc.perform(post(ORDER_URL + "/confirm-return")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"" + RETURN_NOTE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RETURNED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(2)));

        assertStoredState(OrderStatus.RETURNED, 8, 12, CouponUsage.STATUS_RELEASED, 2);
        Instant releasedAt = usageRepository.findById(usageId).orElseThrow().getReleasedAt();
        List<OrderStatusHistory> history = historyRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        assertThat(history).filteredOn(h -> h.getToStatus() == OrderStatus.RETURNED)
                .singleElement().satisfies(entry -> {
                    assertThat(entry.getFromStatus()).isEqualTo(OrderStatus.DELIVERY_FAILED);
                    assertThat(entry.getNote()).isEqualTo(RETURN_NOTE);
                    assertThat(entry.getChangedBy()).isEqualTo(role + " Return Test");
                });
        List<Long> historyIds = history.stream().map(OrderStatusHistory::getId).toList();

        mockMvc.perform(post(ORDER_URL + "/confirm-return").cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_TRANSITION"));

        assertStoredState(OrderStatus.RETURNED, 8, 12, CouponUsage.STATUS_RELEASED, 2);
        assertThat(usageRepository.findById(usageId).orElseThrow().getReleasedAt()).isEqualTo(releasedAt);
        assertThat(historyRepository.findByOrderIdOrderByCreatedAtAsc(orderId))
                .extracting(OrderStatusHistory::getId).containsExactlyElementsOf(historyIds);
    }

    @Test
    void returnEndpoints_withoutAuthentication_return401() throws Exception {
        mockMvc.perform(patch(ORDER_URL + "/status")
                        .contentType(MediaType.APPLICATION_JSON).content(RETURNED_REQUEST))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post(ORDER_URL + "/confirm-return"))
                .andExpect(status().isUnauthorized());

        assertStoredState(OrderStatus.DELIVERY_FAILED, 6, 9, CouponUsage.STATUS_APPLIED, 1);
    }

    @Test
    void returnEndpoints_asCustomer_return403() throws Exception {
        mockMvc.perform(patch(ORDER_URL + "/status").cookie(customerCookie)
                        .contentType(MediaType.APPLICATION_JSON).content(RETURNED_REQUEST))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(ORDER_URL + "/confirm-return").cookie(customerCookie))
                .andExpect(status().isForbidden());

        assertStoredState(OrderStatus.DELIVERY_FAILED, 6, 9, CouponUsage.STATUS_APPLIED, 1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"SHOP_OWNER", "ADMIN"})
    void patchReturned_forMissingOrder_returns404(String role) throws Exception {
        mockMvc.perform(patch("/api/v1/owner/orders/ORD-MISSING/status")
                        .cookie(privilegedCookie(role))
                        .contentType(MediaType.APPLICATION_JSON).content(RETURNED_REQUEST))
                .andExpect(status().isNotFound());

        assertStoredState(OrderStatus.DELIVERY_FAILED, 6, 9, CouponUsage.STATUS_APPLIED, 1);
    }

    @Test
    void patchShippingToDeliveryFailed_doesNotRestoreStockOrReleaseCoupon() throws Exception {
        orderRepository.findById(orderId).orElseThrow().setStatus(OrderStatus.SHIPPING);
        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(patch(ORDER_URL + "/status").cookie(ownerCookie)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DELIVERY_FAILED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERY_FAILED"));

        assertStoredState(OrderStatus.DELIVERY_FAILED, 6, 9, CouponUsage.STATUS_APPLIED, 2);
    }

    private User createUser(String roleCode) {
        Role role = roleRepository.findByCode(roleCode)
                .orElseGet(() -> roleRepository.save(new Role(roleCode, "Return test")));
        User user = new User(roleCode.toLowerCase(Locale.ROOT) + ".return@fashionstore.com",
                "hash", roleCode + " Return Test", "0901234567");
        user.setRoles(Set.of(role));
        return userRepository.save(user);
    }

    private Cookie authCookie(User user) {
        return new Cookie(cookieUtils.getCookieName(), tokenProvider.generateToken(UserPrincipal.create(user)));
    }

    private Cookie privilegedCookie(String role) {
        return "ADMIN".equals(role) ? adminCookie : ownerCookie;
    }

    private void assertStoredState(OrderStatus expectedStatus, int firstStock, int secondStock,
                                   String expectedUsageStatus, int historyCount) {
        // Reload after bulk inventory updates so assertions inspect database state.
        entityManager.flush();
        entityManager.clear();
        Order storedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(storedOrder.getStatus()).isEqualTo(expectedStatus);
        assertThat(storedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(variantRepository.findById(firstVariantId).orElseThrow().getStockQuantity()).isEqualTo(firstStock);
        assertThat(variantRepository.findById(secondVariantId).orElseThrow().getStockQuantity()).isEqualTo(secondStock);
        CouponUsage usage = usageRepository.findById(usageId).orElseThrow();
        assertThat(usage.getStatus()).isEqualTo(expectedUsageStatus);
        if (CouponUsage.STATUS_RELEASED.equals(expectedUsageStatus)) {
            assertThat(usage.getReleasedAt()).isNotNull();
        } else {
            assertThat(usage.getReleasedAt()).isNull();
        }
        assertThat(historyRepository.findByOrderIdOrderByCreatedAtAsc(orderId)).hasSize(historyCount);
    }
}
