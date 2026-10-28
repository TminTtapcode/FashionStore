package com.fashionstore.order.application;

import com.fashionstore.cart.domain.Cart;
import com.fashionstore.cart.domain.CartItem;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.order.api.dto.CheckoutRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.domain.DiscountType;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: CheckoutService COD Business Logic & Transaction Rules")
class CheckoutServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponUsageRepository couponUsageRepository;

    @Mock
    private com.fashionstore.inventory.application.InventoryService inventoryService;

    @InjectMocks
    private CheckoutService checkoutService;

    private User testUser;
    private Cart testCart;
    private Product activeProduct;
    private ProductVariant variant1;
    private ProductVariant variant2;
    private CheckoutRequest validRequest;
    private final String testIdempotencyKey = "uuid-test-idempotency-123";

    @BeforeEach
    void setUp() {
        testUser = new User("triet@fashionstore.com", "hash", "Nguyễn Minh Triết", "0946602954");
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testCart = new Cart(testUser);
        ReflectionTestUtils.setField(testCart, "id", 10L);

        Category category = new Category("Thời trang Nam", "nam", "Mô tả", null, 1);
        activeProduct = new Product(1L, category, "Áo Thun Heavyweight Cotton", "ao-thun-heavyweight", "Mô tả", "Ivre. Atelier", "Cotton", "Oversized", "Giặt nhẹ", "{}", ProductStatus.ACTIVE);
        ReflectionTestUtils.setField(activeProduct, "id", 100L);

        variant1 = new ProductVariant(activeProduct, "TSH-BLK-L", "L", "Đen", "#000", new BigDecimal("450000"), null, 10, ProductVariantStatus.ACTIVE);
        ReflectionTestUtils.setField(variant1, "id", 201L);

        variant2 = new ProductVariant(activeProduct, "TSH-WHT-M", "M", "Trắng", "#FFF", new BigDecimal("440000"), null, 15, ProductVariantStatus.ACTIVE);
        ReflectionTestUtils.setField(variant2, "id", 202L);

        validRequest = new CheckoutRequest(
                "Nguyễn Minh Triết",
                "0946602954",
                "Số 12 Công Trường Lam Sơn",
                "TP. Hồ Chí Minh",
                "Quận 1",
                "Phường Bến Nghé",
                "Giao giờ hành chính",
                null
        );
    }

    @Test
    @DisplayName("Ném lỗi MISSING_IDEMPOTENCY_KEY nếu không có khóa idempotency")
    void checkoutCod_MissingIdempotencyKey_ThrowsException() {
        assertThatThrownBy(() -> checkoutService.checkoutCod(1L, "", validRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Yêu cầu đặt hàng phải có Idempotency-Key");
    }

    @Test
    @DisplayName("Idempotent Replay: Trả về đơn hàng cũ nếu trùng khóa và cùng thông tin giao hàng")
    void checkoutCod_IdempotentReplay_ReturnsExistingOrder() {
        Order existingOrder = new Order(
                "IVRE-20261028-TEST",
                testIdempotencyKey,
                testUser,
                PaymentMethod.COD,
                "Nguyễn Minh Triết",
                "0946602954",
                "Số 12 Công Trường Lam Sơn",
                "TP. Hồ Chí Minh",
                "Quận 1",
                "Phường Bến Nghé",
                "Giao giờ hành chính",
                new BigDecimal("900000"),
                BigDecimal.ZERO,
                new BigDecimal("30000"),
                new BigDecimal("930000"),
                null
        );
        ReflectionTestUtils.setField(existingOrder, "id", 55L);

        when(orderRepository.findByUserIdAndIdempotencyKey(1L, testIdempotencyKey))
                .thenReturn(Optional.of(existingOrder));

        OrderConfirmationDto result = checkoutService.checkoutCod(1L, testIdempotencyKey, validRequest);

        assertThat(result.isIdempotentReplay()).isTrue();
        assertThat(result.getOrderId()).isEqualTo(55L);
        assertThat(result.getOrderNumber()).isEqualTo("IVRE-20261028-TEST");
        verifyNoInteractions(variantRepository);
        verifyNoInteractions(cartItemRepository);
    }

    @Test
    @DisplayName("Ném lỗi CART_EMPTY nếu giỏ hàng của user rỗng")
    void checkoutCod_CartEmpty_ThrowsException() {
        when(orderRepository.findByUserIdAndIdempotencyKey(1L, testIdempotencyKey))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdWithDetails(10L)).thenReturn(List.of());

        assertThatThrownBy(() -> checkoutService.checkoutCod(1L, testIdempotencyKey, validRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Giỏ hàng của bạn đang trống");
    }

    @Test
    @DisplayName("Ném lỗi INSUFFICIENT_STOCK nếu tồn kho biến thể không đủ")
    void checkoutCod_InsufficientStock_ThrowsException() {
        CartItem item1 = new CartItem(testCart, variant1, 2);

        when(orderRepository.findByUserIdAndIdempotencyKey(1L, testIdempotencyKey))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdWithDetails(10L)).thenReturn(new ArrayList<>(List.of(item1)));

        // inventoryService throws INSUFFICIENT_STOCK
        doThrow(new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "INSUFFICIENT_STOCK", "không đủ tồn kho"))
                .when(inventoryService).deductStockForOrder(any(), any(), eq(201L), eq(2), eq(1L));

        assertThatThrownBy(() -> checkoutService.checkoutCod(1L, testIdempotencyKey, validRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không đủ tồn kho");

        verify(orderRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAllByCartId(any());
    }

    @Test
    @DisplayName("Đặt hàng COD thành công (Đơn < 1 triệu -> tính phí ship 30.000đ, xóa giỏ hàng)")
    void checkoutCod_Success_BelowFreeshipThreshold() {
        CartItem item1 = new CartItem(testCart, variant1, 1); // 450.000đ

        when(orderRepository.findByUserIdAndIdempotencyKey(1L, testIdempotencyKey))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdWithDetails(10L)).thenReturn(new ArrayList<>(List.of(item1)));
        when(orderRepository.existsByOrderNumber(any())).thenReturn(false);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            ReflectionTestUtils.setField(o, "id", 88L);
            return o;
        });

        OrderConfirmationDto result = checkoutService.checkoutCod(1L, testIdempotencyKey, validRequest);

        assertThat(result.getOrderId()).isEqualTo(88L);
        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getPaymentMethod()).isEqualTo(PaymentMethod.COD);
        assertThat(result.getFinancials().getSubtotalAmount()).isEqualTo(new BigDecimal("450000"));
        assertThat(result.getFinancials().getShippingFee()).isEqualTo(new BigDecimal("30000"));
        assertThat(result.getFinancials().getFinalAmount()).isEqualTo(new BigDecimal("480000"));
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.isIdempotentReplay()).isFalse();

        // Ensure cart items are cleared after successful checkout
        verify(cartItemRepository, times(1)).deleteAllByCartId(10L);
    }

    @Test
    @DisplayName("Đặt hàng COD thành công với Voucher WELCOME10 (Đơn >= 1 triệu -> Freeship 0đ)")
    void checkoutCod_Success_WithVoucher_AboveFreeshipThreshold() {
        CartItem item1 = new CartItem(testCart, variant1, 2); // 450.000 * 2 = 900.000đ
        CartItem item2 = new CartItem(testCart, variant2, 1); // 440.000 * 1 = 440.000đ
        // Total subtotal = 1.340.000đ (>= 1tr => Freeship)

        validRequest.setCouponCode("WELCOME10");

        Coupon welcomeCoupon = new Coupon();
        ReflectionTestUtils.setField(welcomeCoupon, "id", 7L);
        welcomeCoupon.setCode("WELCOME10");
        welcomeCoupon.setDescription("Giảm 10%");
        welcomeCoupon.setDiscountType(DiscountType.PERCENTAGE);
        welcomeCoupon.setDiscountValue(new BigDecimal("10.00"));
        welcomeCoupon.setMinOrderAmount(BigDecimal.ZERO);
        welcomeCoupon.setStartsAt(Instant.now().minus(1, ChronoUnit.DAYS));
        welcomeCoupon.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        welcomeCoupon.setUsageLimit(100);
        welcomeCoupon.setPerUserLimit(1);
        welcomeCoupon.setFirstOrderOnly(true);
        welcomeCoupon.setStatus("ACTIVE");

        when(orderRepository.findByUserIdAndIdempotencyKey(1L, testIdempotencyKey))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdWithDetails(10L)).thenReturn(new ArrayList<>(List.of(item1, item2)));
        when(orderRepository.existsByOrderNumber(any())).thenReturn(false);

        // Voucher checks
        when(couponRepository.findByCodeWithLock("WELCOME10")).thenReturn(Optional.of(welcomeCoupon));
        when(couponUsageRepository.countByCouponIdAndStatus(7L, CouponUsage.STATUS_APPLIED)).thenReturn(0L);
        when(couponUsageRepository.countByCouponIdAndUserIdAndStatus(7L, 1L, CouponUsage.STATUS_APPLIED)).thenReturn(0L);
        when(orderRepository.countByUserIdAndStatusNotIn(eq(1L), any())).thenReturn(0L);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            ReflectionTestUtils.setField(o, "id", 99L);
            return o;
        });

        OrderConfirmationDto result = checkoutService.checkoutCod(1L, testIdempotencyKey, validRequest);

        // Verify calculations: 1.340.000 - 134.000 (10%) + 0 (freeship) = 1.206.000đ
        assertThat(result.getFinancials().getSubtotalAmount()).isEqualTo(new BigDecimal("1340000"));
        assertThat(result.getFinancials().getDiscountAmount()).isEqualTo(new BigDecimal("134000"));
        assertThat(result.getFinancials().getShippingFee()).isEqualTo(BigDecimal.ZERO);
        assertThat(result.getFinancials().getFinalAmount()).isEqualTo(new BigDecimal("1206000"));
        assertThat(result.getItems()).hasSize(2);

        // Ensure coupon usage record is saved
        verify(couponUsageRepository, times(1)).save(any(CouponUsage.class));
        verify(cartItemRepository, times(1)).deleteAllByCartId(10L);
    }
}
