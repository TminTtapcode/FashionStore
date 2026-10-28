package com.fashionstore.order.application;

import com.fashionstore.cart.domain.Cart;
import com.fashionstore.cart.domain.CartItem;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.order.api.dto.CheckoutRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.domain.DiscountType;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("mysql-test")
@DisplayName("Integration Test: Concurrency Safety & Lifecycle State Transitions on Real MySQL")
class OrderConcurrencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CheckoutFacade checkoutFacade;

    @Autowired
    private OrderLifecycleService orderLifecycleService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponUsageRepository couponUsageRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private User testCustomer;
    private User testOwner;
    private ProductVariant testVariant;
    private Coupon testCoupon;

    @BeforeEach
    void setUp() {
        tearDown();

        Role customerRole = roleRepository.findByCode("CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role("CUSTOMER", "Khách hàng")));
        Role ownerRole = roleRepository.findByCode("SHOP_OWNER")
                .orElseGet(() -> roleRepository.save(new Role("SHOP_OWNER", "Chủ shop")));

        testCustomer = new User("customer.concurrency@fashionstore.com", "hash", "Khách hàng Concurrency", "0901234567");
        testCustomer.setRoles(Set.of(customerRole));
        testCustomer = userRepository.save(testCustomer);

        testOwner = new User("owner.concurrency@fashionstore.com", "hash", "Chủ Shop Concurrency", "0907654321");
        testOwner.setRoles(Set.of(ownerRole));
        testOwner = userRepository.save(testOwner);

        Category category = new Category("Thời trang Concurrency", "thoi-trang-concurrency", "Mô tả", null, 1);
        category = categoryRepository.save(category);

        Product product = new Product(1L, category, "Áo Sơ Mi Concurrency", "ao-so-mi-concurrency", "Mô tả", "Atelier", "100% Cotton", "Slim", "Giặt máy", "{}", ProductStatus.ACTIVE);
        testVariant = new ProductVariant(product, "CONCUR-SKU-01", "M", "Trắng", "#FFFFFF", new BigDecimal("450000.00"), new BigDecimal("550000.00"), 10, ProductVariantStatus.ACTIVE);
        product.addVariant(testVariant);
        productRepository.save(product);

        testCoupon = new Coupon();
        testCoupon.setCode("CONCUR10");
        testCoupon.setDescription("Giảm 10% test");
        testCoupon.setDiscountType(DiscountType.PERCENTAGE);
        testCoupon.setDiscountValue(new BigDecimal("10.00"));
        testCoupon.setMinOrderAmount(BigDecimal.ZERO);
        testCoupon.setStartsAt(Instant.now().minus(1, ChronoUnit.DAYS));
        testCoupon.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        testCoupon.setUsageLimit(100);
        testCoupon.setPerUserLimit(5);
        testCoupon.setFirstOrderOnly(false);
        testCoupon.setStatus("ACTIVE");
        testCoupon = couponRepository.save(testCoupon);
    }

    @AfterEach
    void tearDown() {
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        couponUsageRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();

        if (testCoupon != null) {
            couponRepository.findByCodeIgnoreCase("CONCUR10").ifPresent(c -> couponRepository.delete(c));
        }

        variantRepository.findBySku("CONCUR-SKU-01").ifPresent(v -> {
            Product p = v.getProduct();
            variantRepository.delete(v);
            if (p != null) productRepository.delete(p);
        });

        categoryRepository.findBySlug("thoi-trang-concurrency").ifPresent(c -> categoryRepository.delete(c));

        userRepository.findByEmailIgnoreCase("customer.concurrency@fashionstore.com").ifPresent(u -> userRepository.delete(u));
        userRepository.findByEmailIgnoreCase("owner.concurrency@fashionstore.com").ifPresent(u -> userRepository.delete(u));
    }

    @Test
    @DisplayName("Scenario 1: Hai luồng Checkout cùng một Idempotency-Key đồng thời -> Chỉ tạo 1 đơn, 1 replay và trừ kho 1 lần")
    void concurrentCheckout_SameUserAndIdempotencyKey_CreatesOneOrderAndDeductsStockOnce() throws Exception {
        // Setup User Cart
        Cart cart = cartRepository.save(new Cart(testCustomer));
        cartItemRepository.save(new CartItem(cart, testVariant, 2)); // Subtotal = 900.000đ

        String idempotencyKey = "concur-key-" + UUID.randomUUID();

        CheckoutRequest request = new CheckoutRequest();
        request.setShippingName("Khách Hàng Test");
        request.setShippingPhone("0901234567");
        request.setShippingAddress("123 Phố Thời Trang");
        request.setShippingCity("TP. Hồ Chí Minh");
        request.setShippingDistrict("Quận 1");
        request.setShippingWard("Bến Nghé");
        request.setCouponCode("CONCUR10");

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<OrderConfirmationDto> results = Collections.synchronizedList(new ArrayList<>());
        List<Exception> exceptions = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Cả 2 thread xuất phát cùng lúc
                    OrderConfirmationDto result = checkoutFacade.checkoutCod(testCustomer.getId(), idempotencyKey, request);
                    results.add(result);
                } catch (Exception e) {
                    exceptions.add(e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Kích hoạt 2 thread
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Cả 2 luồng đều không được crash lỗi unhandled exception
        assertThat(exceptions).isEmpty();
        assertThat(results).hasSize(2);

        // 1 luồng tạo mới (isIdempotentReplay == false), 1 luồng replay (isIdempotentReplay == true)
        long replayCount = results.stream().filter(OrderConfirmationDto::isIdempotentReplay).count();
        long newOrderCount = results.stream().filter(r -> !r.isIdempotentReplay()).count();

        assertThat(newOrderCount).isEqualTo(1);
        assertThat(replayCount).isEqualTo(1);

        // Cả 2 đều trả về cùng 1 mã đơn hàng
        String orderNumberA = results.get(0).getOrderNumber();
        String orderNumberB = results.get(1).getOrderNumber();
        assertThat(orderNumberA).isEqualTo(orderNumberB);

        // Kiểm tra Database MySQL thực tế: Chỉ có đúng 1 đơn hàng
        List<Order> ordersInDb = orderRepository.findByUserIdOrderByCreatedAtDesc(testCustomer.getId());
        assertThat(ordersInDb).hasSize(1);

        // Tồn kho ban đầu = 10, chỉ trừ đúng 1 lần số lượng 2 -> còn lại 8
        ProductVariant updatedVariant = variantRepository.findById(testVariant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockQuantity()).isEqualTo(8);

        // Voucher chỉ được ghi nhận APPLIED đúng 1 lần
        long couponUsages = couponUsageRepository.countByCouponIdAndStatus(testCoupon.getId(), CouponUsage.STATUS_APPLIED);
        assertThat(couponUsages).isEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 2: Hai luồng cùng gửi yêu cầu Hủy một đơn hàng PENDING -> Chỉ hoàn kho đúng 1 lần và voucher RELEASED 1 lần")
    void concurrentCancellation_PendingOrder_RestoresStockExactlyOnce() throws Exception {
        // Tồn kho hiện tại giảm xuống 8 (do đã đặt 2 sản phẩm)
        testVariant.setStockQuantity(8);
        variantRepository.save(testVariant);

        // Tạo đơn hàng PENDING
        Order order = new Order(
                "ORD-TEST-CANCEL-01",
                "key-cancel-01",
                testCustomer,
                PaymentMethod.COD,
                "Khách Test",
                "0901234567",
                "123 Nguyen Hue",
                "TP. HCM",
                "Quan 1",
                "Ben Nghe",
                "Giao gio hanh chinh",
                new BigDecimal("900000.00"),
                new BigDecimal("90000.00"),
                BigDecimal.ZERO,
                new BigDecimal("810000.00"),
                testCoupon.getCode()
        );
        order.setStatus(OrderStatus.PENDING);
        order.addItem(new OrderItem(order, testVariant.getProduct().getId(), testVariant.getId(), "Ao So Mi", "Atelier", "CONCUR-SKU-01", "M", "Trang", null, new BigDecimal("450000.00"), 2, new BigDecimal("900000.00")));
        order = orderRepository.save(order);

        // Ghi nhận voucher APPLIED
        CouponUsage usage = new CouponUsage(testCoupon, testCustomer, order.getId(), new BigDecimal("90000.00"));
        couponUsageRepository.save(usage);

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        String orderNumber = order.getOrderNumber();
        Long customerId = testCustomer.getId();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    orderLifecycleService.cancelOrderByCustomer(orderNumber, customerId, "Khách xin hủy đơn");
                    successCount.incrementAndGet();
                } catch (ApiException e) {
                    if ("ORDER_CANNOT_BE_CANCELLED".equals(e.getCode())) {
                        rejectedCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 1 luồng thành công, 1 luồng bị khóa bi quan từ chối với ORDER_CANNOT_BE_CANCELLED
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(rejectedCount.get()).isEqualTo(1);

        // Kiểm tra Database MySQL thực tế: Tồn kho được hoàn lại đúng 1 lần: 8 + 2 = 10 (không bị hoàn 2 lần thành 12)
        ProductVariant updatedVariant = variantRepository.findById(testVariant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockQuantity()).isEqualTo(10);

        // Đơn hàng đã ở trạng thái CANCELLED
        Order updatedOrder = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);

        // Voucher status được chuyển sang RELEASED đúng 1 lần
        CouponUsage updatedUsage = couponUsageRepository.findByOrderId(order.getId()).get(0);
        assertThat(updatedUsage.getStatus()).isEqualTo(CouponUsage.STATUS_RELEASED);
        assertThat(updatedUsage.getReleasedAt()).isNotNull();

        // Lịch sử trạng thái chỉ có đúng 1 bản ghi hủy
        var histories = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        assertThat(histories).hasSize(1);
        assertThat(histories.get(0).getToStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("Scenario 3: Hai luồng cùng xác nhận hàng hoàn về kho trên đơn DELIVERY_FAILED -> Hoàn kho đúng 1 lần")
    void concurrentReturnConfirmation_DeliveryFailedOrder_RestoresStockExactlyOnce() throws Exception {
        testVariant.setStockQuantity(8);
        variantRepository.save(testVariant);

        Order order = new Order(
                "ORD-TEST-RETURN-01",
                "key-return-01",
                testCustomer,
                PaymentMethod.COD,
                "Khách Test",
                "0901234567",
                "123 Nguyen Hue",
                "TP. HCM",
                "Quan 1",
                "Ben Nghe",
                null,
                new BigDecimal("900000.00"),
                BigDecimal.ZERO,
                new BigDecimal("30000.00"),
                new BigDecimal("930000.00"),
                null
        );
        order.setStatus(OrderStatus.DELIVERY_FAILED);
        order.addItem(new OrderItem(order, testVariant.getProduct().getId(), testVariant.getId(), "Ao So Mi", "Atelier", "CONCUR-SKU-01", "M", "Trang", null, new BigDecimal("450000.00"), 2, new BigDecimal("900000.00")));
        order = orderRepository.save(order);

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);
        String orderNumber = order.getOrderNumber();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    orderLifecycleService.confirmReturnByOwner(orderNumber, "Hàng về kho nguyên tem", "Kho Thủ Đức");
                    successCount.incrementAndGet();
                } catch (ApiException e) {
                    if ("INVALID_TRANSITION".equals(e.getCode())) {
                        rejectedCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(rejectedCount.get()).isEqualTo(1);

        // Tồn kho hoàn đúng 1 lần: 8 + 2 = 10
        ProductVariant updatedVariant = variantRepository.findById(testVariant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockQuantity()).isEqualTo(10);

        Order updatedOrder = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.RETURNED);
    }

    @Test
    @DisplayName("Scenario 4: Giao hàng thất bại (SHIPPING -> DELIVERY_FAILED) tuyệt đối KHÔNG được hoàn kho vì hàng còn trên đường")
    void shippingToDeliveryFailed_DoesNotRestoreStock() {
        testVariant.setStockQuantity(8);
        variantRepository.save(testVariant);

        Order order = new Order(
                "ORD-TEST-FAILED-01",
                "key-failed-01",
                testCustomer,
                PaymentMethod.COD,
                "Khách Test",
                "0901234567",
                "123 Nguyen Hue",
                "TP. HCM",
                "Quan 1",
                "Ben Nghe",
                null,
                new BigDecimal("900000.00"),
                BigDecimal.ZERO,
                new BigDecimal("30000.00"),
                new BigDecimal("930000.00"),
                null
        );
        order.setStatus(OrderStatus.SHIPPING);
        order.addItem(new OrderItem(order, testVariant.getProduct().getId(), testVariant.getId(), "Ao So Mi", "Atelier", "CONCUR-SKU-01", "M", "Trang", null, new BigDecimal("450000.00"), 2, new BigDecimal("900000.00")));
        order = orderRepository.save(order);

        orderLifecycleService.updateOrderStatusByOwner(order.getOrderNumber(), OrderStatus.DELIVERY_FAILED, "Shipper báo khách không nghe máy", "Owner");

        Order updatedOrder = orderRepository.findByOrderNumber(order.getOrderNumber()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.DELIVERY_FAILED);

        // Tồn kho KHÔNG được cộng: vẫn giữ nguyên là 8
        ProductVariant updatedVariant = variantRepository.findById(testVariant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockQuantity()).isEqualTo(8);
    }

    @Test
    @DisplayName("Scenario 5: Phân quyền RBAC cho Owner endpoints: GUEST -> 401, CUSTOMER -> 403, SHOP_OWNER -> 200")
    void ownerEndpoints_RbacSecurity() throws Exception {
        // 1. GUEST truy cập không có cookie -> 401 Unauthorized
        mockMvc.perform(get("/api/v1/owner/orders"))
                .andExpect(status().isUnauthorized());

        // 2. CUSTOMER truy cập -> 403 Forbidden
        String customerToken = tokenProvider.generateToken(UserPrincipal.create(testCustomer));
        Cookie customerCookie = new Cookie("fs_session", customerToken);
        mockMvc.perform(get("/api/v1/owner/orders").cookie(customerCookie))
                .andExpect(status().isForbidden());

        // 3. SHOP_OWNER truy cập -> 200 OK
        String ownerToken = tokenProvider.generateToken(UserPrincipal.create(testOwner));
        Cookie ownerCookie = new Cookie("fs_session", ownerToken);
        mockMvc.perform(get("/api/v1/owner/orders").cookie(ownerCookie))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Scenario 6: Đơn hàng COD chỉ đổi payment_status sang PAID khi hoàn tất thành công (SHIPPING -> COMPLETED)")
    void codPaymentStatus_PaidOnlyUponCompleted() {
        Order order = new Order(
                "ORD-TEST-PAID-01",
                "key-paid-01",
                testCustomer,
                PaymentMethod.COD,
                "Khách Test",
                "0901234567",
                "123 Nguyen Hue",
                "TP. HCM",
                "Quan 1",
                "Ben Nghe",
                null,
                new BigDecimal("450000.00"),
                BigDecimal.ZERO,
                new BigDecimal("30000.00"),
                new BigDecimal("480000.00"),
                null
        );
        order.setStatus(OrderStatus.SHIPPING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.addItem(new OrderItem(order, testVariant.getProduct().getId(), testVariant.getId(), "Ao So Mi", "Atelier", "CONCUR-SKU-01", "M", "Trang", null, new BigDecimal("450000.00"), 1, new BigDecimal("450000.00")));
        order = orderRepository.save(order);

        // Chuyển sang COMPLETED
        orderLifecycleService.updateOrderStatusByOwner(order.getOrderNumber(), OrderStatus.COMPLETED, "Khách nhận và thanh toán đủ tiền", "Owner");

        Order updatedOrder = orderRepository.findByOrderNumber(order.getOrderNumber()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }
}
