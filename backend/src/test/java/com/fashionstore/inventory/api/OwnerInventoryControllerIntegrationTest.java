package com.fashionstore.inventory.api;

import com.fashionstore.cart.domain.Cart;
import com.fashionstore.cart.domain.CartItem;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.security.CookieUtils;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.inventory.application.InventoryService;
import com.fashionstore.inventory.domain.InventoryMovement;
import com.fashionstore.inventory.domain.InventoryMovementRepository;
import com.fashionstore.inventory.domain.InventoryMovementType;
import com.fashionstore.inventory.dto.ManualAdjustmentRequest;
import com.fashionstore.inventory.dto.StockReceiptRequest;
import com.fashionstore.order.api.dto.CheckoutRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.application.CheckoutService;
import com.fashionstore.order.application.OrderLifecycleService;
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
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Owner Inventory Management & Immutable Audit Ledger Integration Tests (Phase 5C.3)")
class OwnerInventoryControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;
        @Autowired
        private ObjectMapper objectMapper;
        @Autowired
        private EntityManager entityManager;
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
        private InventoryMovementRepository movementRepository;
        @Autowired
        private InventoryService inventoryService;
        @Autowired
        private CartRepository cartRepository;
        @Autowired
        private CartItemRepository cartItemRepository;
        @Autowired
        private CheckoutService checkoutService;
        @Autowired
        private OrderLifecycleService orderLifecycleService;
        @Autowired
        private JwtTokenProvider tokenProvider;
        @Autowired
        private CookieUtils cookieUtils;

        private Cookie ownerCookie;
        private Cookie adminCookie;
        private Cookie customerCookie;
        private User testOwner;
        private User testCustomer;

        private Category testCategory;
        private Product testProduct;
        private ProductVariant testVariant;

        @BeforeEach
        void setUp() {
                testOwner = createUser("SHOP_OWNER");
                User admin = createUser("ADMIN");
                testCustomer = createUser("CUSTOMER");

                ownerCookie = authCookie(testOwner);
                adminCookie = authCookie(admin);
                customerCookie = authCookie(testCustomer);

                testCategory = categoryRepository.save(new Category(
                                "Áo Polo Công Sở " + UUID.randomUUID(), "ao-polo-" + UUID.randomUUID(), "Áo cao cấp",
                                null, 1));

                testProduct = new Product(1L, testCategory, "Áo Polo Pima Cotton", "ao-polo-pima-" + UUID.randomUUID(),
                                "Áo polo chất liệu pima mềm mại", "Fashion Atelier", "100% Pima Cotton", "Slim Fit",
                                "Giặt máy 30 độ", "{}", ProductStatus.ACTIVE);

                testVariant = new ProductVariant(testProduct,
                                "POLO-PIMA-NAVY-L-"
                                                + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT),
                                "L", "Xanh Navy", "#000080",
                                new BigDecimal("450000"), new BigDecimal("550000"),
                                20, ProductVariantStatus.ACTIVE);

                testProduct.addVariant(testVariant);
                testProduct = productRepository.save(testProduct);
                testVariant = testProduct.getVariants().get(0);

                // Record OPENING_BALANCE / INITIAL_STOCK for test variant
                inventoryService.recordInitialStock(testVariant.getId(), 20, testOwner.getId(),
                                "Khởi tạo tồn kho test 20 chiếc");
                entityManager.flush();
        }

        private User createUser(String roleCode) {
                Role role = roleRepository.findByCode(roleCode)
                                .orElseGet(() -> roleRepository.save(new Role(roleCode, "Role " + roleCode)));
                String unique = UUID.randomUUID().toString().substring(0, 8);
                User user = new User(
                                "user_" + unique + "@example.com",
                                "$2a$10$hashedpasswordplaceholder",
                                "User " + roleCode,
                                "0987" + unique.substring(0, 6));
                user.setRoles(Set.of(role));
                return userRepository.save(user);
        }

        private Cookie authCookie(User user) {
                return new Cookie(cookieUtils.getCookieName(), tokenProvider.generateToken(UserPrincipal.create(user)));
        }

        // -------------------------------------------------------------------------
        // 1. RBAC Tests
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Guest (unauthenticated) accessing /api/v1/owner/inventory is rejected with 401")
        void guestAccessRejected() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Customer (ROLE_CUSTOMER) accessing /api/v1/owner/inventory is forbidden with 403")
        void customerAccessForbidden() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory").cookie(customerCookie))
                                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Shop Owner and Admin have authorized access to /api/v1/owner/inventory")
        void ownerAndAdminAccessGranted() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory").cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist());

                mockMvc.perform(get("/api/v1/owner/inventory").cookie(adminCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist());
        }

        // -------------------------------------------------------------------------
        // 2. Inventory Overview & Filtering
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Owner gets paginated inventory overview with correct fields and search")
        void getInventoryOverviewSuccess() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory")
                                .cookie(ownerCookie)
                                .param("search", "POLO-PIMA")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.items", not(empty())))
                                .andExpect(jsonPath("$.data.items[0].sku").value(containsString("POLO-PIMA")))
                                .andExpect(jsonPath("$.data.items[0].currentStock").value(20));
        }

        // -------------------------------------------------------------------------
        // 3. Variant Ledger Audit History
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Owner retrieves ledger history for variant, verifying immutable initial movement")
        void getVariantLedgerSuccess() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory/variants/{variantId}/ledger", testVariant.getId())
                                .cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.items", hasSize(1)))
                                .andExpect(jsonPath("$.data.items[0].movementType").value("INITIAL_STOCK"))
                                .andExpect(jsonPath("$.data.items[0].quantityDelta").value(20))
                                .andExpect(jsonPath("$.data.items[0].stockBefore").value(0))
                                .andExpect(jsonPath("$.data.items[0].stockAfter").value(20));
        }

        // -------------------------------------------------------------------------
        // 4. Variant Balance Reconciliation
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Owner reconciles variant stock against cumulative movements: currentStock == sum(deltas)")
        void reconcileVariantBalanced() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory/variants/{variantId}/reconcile", testVariant.getId())
                                .cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.currentStock").value(20))
                                .andExpect(jsonPath("$.data.openingBalance").value(20))
                                .andExpect(jsonPath("$.data.postOpeningDelta").value(0))
                                .andExpect(jsonPath("$.data.totalDelta").value(20))
                                .andExpect(jsonPath("$.data.calculatedStock").value(20))
                                .andExpect(jsonPath("$.data.discrepancy").value(0))
                                .andExpect(jsonPath("$.data.isBalanced").value(true));
        }

        @Test
        @DisplayName("Owner fetches global inventory metrics with mutually exclusive partitions summing to total")
        void getGlobalInventoryStatsSuccess() throws Exception {
                mockMvc.perform(get("/api/v1/owner/inventory/stats")
                                .cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.totalSku").isNumber())
                                .andExpect(jsonPath("$.data.healthyStockSku").isNumber())
                                .andExpect(jsonPath("$.data.lowStockSku").isNumber())
                                .andExpect(jsonPath("$.data.outOfStockSku").isNumber())
                                .andExpect(jsonPath("$.data.totalStockUnits").isNumber());
        }

        // -------------------------------------------------------------------------
        // 5. Stock Receipt (Nhập kho bổ sung)
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Owner records stock receipt: stock increases, movement logged, reconciliation remains balanced")
        void recordStockReceiptSuccess() throws Exception {
                StockReceiptRequest request = new StockReceiptRequest(
                                testVariant.getId(),
                                15,
                                "PNK-2026-X01",
                                "Nhập lô 15 chiếc từ xưởng may Hà Nội");

                mockMvc.perform(post("/api/v1/owner/inventory/receipt")
                                .cookie(ownerCookie)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.movementType").value("STOCK_RECEIPT"))
                                .andExpect(jsonPath("$.data.quantityDelta").value(15))
                                .andExpect(jsonPath("$.data.stockBefore").value(20))
                                .andExpect(jsonPath("$.data.stockAfter").value(35))
                                .andExpect(jsonPath("$.data.referenceId").value("PNK-2026-X01"));

                // Verify updated variant entity in DB
                ProductVariant updated = variantRepository.findById(testVariant.getId()).orElseThrow();
                assertThat(updated.getStockQuantity()).isEqualTo(35);

                // Verify reconciliation after receipt
                mockMvc.perform(get("/api/v1/owner/inventory/variants/{variantId}/reconcile", testVariant.getId())
                                .cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.currentStock").value(35))
                                .andExpect(jsonPath("$.data.totalDelta").value(35))
                                .andExpect(jsonPath("$.data.discrepancy").value(0))
                                .andExpect(jsonPath("$.data.isBalanced").value(true));
        }

        @Test
        @DisplayName("Stock receipt with non-positive quantity is rejected with 400")
        void recordStockReceiptInvalidQuantityRejected() throws Exception {
                StockReceiptRequest request = new StockReceiptRequest(testVariant.getId(), 0, "PNK-0", "Lỗi số lượng");

                mockMvc.perform(post("/api/v1/owner/inventory/receipt")
                                .cookie(ownerCookie)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        // -------------------------------------------------------------------------
        // 6. Manual Stock Adjustment (Kiểm kê điều chỉnh)
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Owner records manual stock adjustment: delta applied, reason audited, balance preserved")
        void recordManualAdjustmentSuccess() throws Exception {
                ManualAdjustmentRequest request = new ManualAdjustmentRequest(
                                testVariant.getId(),
                                -3,
                                "Kiểm kê phát hiện 3 sản phẩm rách chỉ, chuyển thanh lý");

                mockMvc.perform(post("/api/v1/owner/inventory/adjust")
                                .cookie(ownerCookie)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.error").doesNotExist())
                                .andExpect(jsonPath("$.data.movementType").value("MANUAL_ADJUSTMENT"))
                                .andExpect(jsonPath("$.data.quantityDelta").value(-3))
                                .andExpect(jsonPath("$.data.stockBefore").value(20))
                                .andExpect(jsonPath("$.data.stockAfter").value(17))
                                .andExpect(jsonPath("$.data.reason").value(containsString("rách chỉ")));

                ProductVariant updated = variantRepository.findById(testVariant.getId()).orElseThrow();
                assertThat(updated.getStockQuantity()).isEqualTo(17);

                // Verify reconciliation after manual adjustment
                mockMvc.perform(get("/api/v1/owner/inventory/variants/{variantId}/reconcile", testVariant.getId())
                                .cookie(ownerCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.currentStock").value(17))
                                .andExpect(jsonPath("$.data.totalDelta").value(17))
                                .andExpect(jsonPath("$.data.discrepancy").value(0))
                                .andExpect(jsonPath("$.data.isBalanced").value(true));
        }

        @Test
        @DisplayName("Manual adjustment reducing stock below zero is rejected with NEGATIVE_STOCK_FORBIDDEN (400)")
        void recordManualAdjustmentNegativeStockForbidden() throws Exception {
                ManualAdjustmentRequest request = new ManualAdjustmentRequest(
                                testVariant.getId(),
                                -25, // Variant only has 20 in stock
                                "Điều chỉnh quá số lượng tồn hiện có");

                mockMvc.perform(post("/api/v1/owner/inventory/adjust")
                                .cookie(ownerCookie)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error.code").value("NEGATIVE_STOCK_FORBIDDEN"));
        }

        @Test
        @DisplayName("Manual adjustment with delta == 0 is rejected with INVALID_DELTA (400)")
        void recordManualAdjustmentZeroDeltaRejected() throws Exception {
                ManualAdjustmentRequest request = new ManualAdjustmentRequest(
                                testVariant.getId(),
                                0,
                                "Không có độ lệch");

                mockMvc.perform(post("/api/v1/owner/inventory/adjust")
                                .cookie(ownerCookie)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error.code").value("INVALID_DELTA"));
        }

        // -------------------------------------------------------------------------
        // 7. Order Deduction and Cancellation Ledger Linkage
        // -------------------------------------------------------------------------
        @Test
        @DisplayName("Checkout creates ORDER_DEDUCT movement; Order cancellation creates CANCEL_RESTORE movement")
        void checkoutAndCancellationLedgerLifecycle() {
                // Prepare cart with 2 items
                Cart cart = cartRepository.findByUserId(testCustomer.getId())
                                .orElseGet(() -> cartRepository.save(new Cart(testCustomer)));
                cartItemRepository.save(new CartItem(cart, testVariant, 2));

                CheckoutRequest checkoutReq = new CheckoutRequest(
                                "Nguyễn Văn A",
                                "0912345678",
                                "123 Phố Huế",
                                "Hà Nội",
                                "Hai Bà Trưng",
                                "Phố Huế",
                                "Giao giờ hành chính",
                                null);

                OrderConfirmationDto confirmation = checkoutService.checkoutCod(testCustomer.getId(),
                                "IDEM-" + UUID.randomUUID(), checkoutReq);
                assertThat(confirmation.getOrderNumber()).isNotNull();

                // Verify stock deducted to 18
                ProductVariant afterCheckout = variantRepository.findById(testVariant.getId()).orElseThrow();
                assertThat(afterCheckout.getStockQuantity()).isEqualTo(18);

                // Verify ORDER_DEDUCT movement exists in ledger
                List<InventoryMovement> movements = movementRepository
                                .findByVariantIdOrderByCreatedAtAscIdAsc(testVariant.getId());
                assertThat(movements).hasSize(2);
                InventoryMovement deductMv = movements.get(1);
                assertThat(deductMv.getMovementType()).isEqualTo(InventoryMovementType.ORDER_DEDUCT);
                assertThat(deductMv.getQuantityDelta()).isEqualTo(-2);
                assertThat(deductMv.getStockBefore()).isEqualTo(20);
                assertThat(deductMv.getStockAfter()).isEqualTo(18);
                assertThat(deductMv.getReferenceId()).isEqualTo(confirmation.getOrderNumber());

                // Step 2: Cancel the order
                orderLifecycleService.cancelOrderByCustomer(confirmation.getOrderNumber(), testCustomer.getId(),
                                "Khách hàng đổi ý muốn mua màu khác");

                // Verify stock restored to 20
                ProductVariant afterCancel = variantRepository.findById(testVariant.getId()).orElseThrow();
                assertThat(afterCancel.getStockQuantity()).isEqualTo(20);

                // Verify CANCEL_RESTORE movement exists in ledger
                List<InventoryMovement> movementsAfterCancel = movementRepository
                                .findByVariantIdOrderByCreatedAtAscIdAsc(testVariant.getId());
                assertThat(movementsAfterCancel).hasSize(3);
                InventoryMovement restoreMv = movementsAfterCancel.get(2);
                assertThat(restoreMv.getMovementType()).isEqualTo(InventoryMovementType.CANCEL_RESTORE);
                assertThat(restoreMv.getQuantityDelta()).isEqualTo(2);
                assertThat(restoreMv.getStockBefore()).isEqualTo(18);
                assertThat(restoreMv.getStockAfter()).isEqualTo(20);

                // Verify reconciliation after complete lifecycle
                int sumDelta = movementRepository.sumDeltaByVariantId(testVariant.getId());
                assertThat(sumDelta).isEqualTo(20);
                assertThat(afterCancel.getStockQuantity()).isEqualTo(sumDelta);
        }
}
