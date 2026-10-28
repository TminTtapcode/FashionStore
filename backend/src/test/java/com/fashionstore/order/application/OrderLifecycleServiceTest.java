package com.fashionstore.order.application;

import com.fashionstore.catalog.domain.ProductVariantRepository;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.identity.domain.User;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: OrderLifecycleService State Transitions & Concurrency Rules")
class OrderLifecycleServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private CouponUsageRepository couponUsageRepository;

    @Mock
    private com.fashionstore.inventory.application.InventoryService inventoryService;

    @InjectMocks
    private OrderLifecycleService orderLifecycleService;

    private User testUser;
    private Order testOrder;
    private OrderItem testItem1;
    private OrderItem testItem2;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Nguyen Van A");
        testUser.setEmail("vana@example.com");

        testOrder = new Order(
                "ORD-20261028-0001",
                "idemp-key-001",
                testUser,
                PaymentMethod.COD,
                "Nguyen Van A",
                "0987654321",
                "123 Nguyen Hue",
                "TP. Ho Chi Minh",
                "Quan 1",
                "Ben Nghe",
                "Giao gio hanh chinh",
                new BigDecimal("900000"),
                BigDecimal.ZERO,
                new BigDecimal("30000"),
                new BigDecimal("930000"),
                null
        );
        ReflectionTestUtils.setField(testOrder, "id", 100L);
        testOrder.setStatus(OrderStatus.PENDING);

        testItem1 = new OrderItem(
                testOrder,
                10L,
                201L,
                "Ao Blazer Linen",
                "Ivre Atelier",
                "BLAZER-LINEN-M",
                "M",
                "Beige",
                "https://cdn.example.com/item1.jpg",
                new BigDecimal("450000"),
                2,
                new BigDecimal("900000")
        );
        testOrder.addItem(testItem1);

        testItem2 = new OrderItem(
                testOrder,
                11L,
                202L,
                "Quan Jeans Ong Suong",
                "Ivre Atelier",
                "JEANS-VINTAGE-30",
                "30",
                "Indigo",
                "https://cdn.example.com/item2.jpg",
                new BigDecimal("500000"),
                1,
                new BigDecimal("500000")
        );
        testOrder.addItem(testItem2);
    }

    @Test
    @DisplayName("Khách hàng hủy đơn PENDING thành công: Khóa bi quan, hoàn kho ngay và ghi lịch sử")
    void cancelOrderByCustomer_Success_PendingOrder() {
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        // Coupon was used on this order
        CouponUsage usage = new CouponUsage(null, testUser, 100L, new BigDecimal("50000"));
        when(couponUsageRepository.findByOrderIdAndStatus(100L, CouponUsage.STATUS_APPLIED))
                .thenReturn(Optional.of(usage));

        OrderConfirmationDto result = orderLifecycleService.cancelOrderByCustomer(
                "ORD-20261028-0001",
                1L,
                "Thay doi y dinh mua"
        );

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);

        // Verify stock is restored immediately via InventoryService
        verify(inventoryService, times(1)).restoreStockForCancellation(any(), eq("ORD-20261028-0001"), eq(201L), eq(2), eq(1L), any());
        verify(inventoryService, times(1)).restoreStockForCancellation(any(), eq("ORD-20261028-0001"), eq(202L), eq(1), eq(1L), any());

        // Verify voucher is released, NOT deleted
        assertThat(usage.getStatus()).isEqualTo(CouponUsage.STATUS_RELEASED);
        assertThat(usage.getReleasedAt()).isNotNull();
        verify(couponUsageRepository, times(1)).save(usage);

        // Verify status history audit
        assertThat(testOrder.getStatusHistory()).hasSize(1);
        OrderStatusHistory history = testOrder.getStatusHistory().get(0);
        assertThat(history.getFromStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(history.getToStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(history.getNote()).isEqualTo("Thay doi y dinh mua");
        assertThat(history.getChangedBy()).isEqualTo("Nguyen Van A");
    }

    @Test
    @DisplayName("Khách hàng hủy đơn thất bại nếu không phải chủ đơn hàng (403 Forbidden)")
    void cancelOrderByCustomer_ThrowsForbidden_WhenNotOrderOwner() {
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderLifecycleService.cancelOrderByCustomer("ORD-20261028-0001", 999L, "Ly do"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getCode()).isEqualTo("FORBIDDEN");
                });

        verify(variantRepository, never()).restoreStock(any(), anyInt());
    }

    @Test
    @DisplayName("Khách hàng không thể tự hủy đơn khi đơn đã sang CONFIRMED hoặc SHIPPING (400 Bad Request)")
    void cancelOrderByCustomer_ThrowsBadRequest_WhenNotPending() {
        testOrder.setStatus(OrderStatus.CONFIRMED);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderLifecycleService.cancelOrderByCustomer("ORD-20261028-0001", 1L, "Huy muon"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getCode()).isEqualTo("ORDER_CANNOT_BE_CANCELLED");
                });

        verify(variantRepository, never()).restoreStock(any(), anyInt());
    }

    @Test
    @DisplayName("Chủ shop hủy đơn ở giai đoạn trước giao hàng (PROCESSING -> CANCELLED): Hoàn kho ngay")
    void updateOrderStatusByOwner_Success_PreCarrierCancelRestoresStock() {
        testOrder.setStatus(OrderStatus.PROCESSING);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderConfirmationDto result = orderLifecycleService.updateOrderStatusByOwner(
                "ORD-20261028-0001",
                OrderStatus.CANCELLED,
                "Khách gọi điện xin hủy đơn",
                "Shop Owner Minh"
        );

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(inventoryService, times(1)).restoreStockForCancellation(any(), eq("ORD-20261028-0001"), eq(201L), eq(2), isNull(), any());
        verify(inventoryService, times(1)).restoreStockForCancellation(any(), eq("ORD-20261028-0001"), eq(202L), eq(1), isNull(), any());
    }

    @Test
    @DisplayName("Đơn đang giao thất bại (SHIPPING -> DELIVERY_FAILED): KHÔNG được hoàn kho ngay vì hàng còn trên đường")
    void updateOrderStatusByOwner_ShippingToDeliveryFailed_DoesNOTRestoreStock() {
        testOrder.setStatus(OrderStatus.SHIPPING);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderConfirmationDto result = orderLifecycleService.updateOrderStatusByOwner(
                "ORD-20261028-0001",
                OrderStatus.DELIVERY_FAILED,
                "Shipper bao khach khong nghe may 3 lan",
                "Shop Owner Minh"
        );

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DELIVERY_FAILED);

        // CRITICAL CHECK: Must NOT restore stock yet!
        verify(variantRepository, never()).restoreStock(any(), anyInt());
        verify(couponUsageRepository, never()).findByOrderIdAndStatus(any(), any());
    }

    @ParameterizedTest
    @EnumSource(OrderStatus.class)
    @DisplayName("PATCH RETURNED yêu cầu xác nhận hàng hoàn riêng và không thay đổi đơn hàng")
    void updateOrderStatusByOwner_ReturnedRequiresConfirmation(OrderStatus currentStatus) {
        testOrder.setStatus(currentStatus);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderLifecycleService.updateOrderStatusByOwner(
                "ORD-20261028-0001", OrderStatus.RETURNED, "Hàng đã về kho", "Shop Owner"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getCode()).isEqualTo("RETURN_CONFIRMATION_REQUIRED");
                    assertThat(apiEx.getMessage()).contains("confirm-return");
                });

        assertThat(testOrder.getStatus()).isEqualTo(currentStatus);
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(testOrder.getStatusHistory()).isEmpty();
        verify(orderRepository, never()).save(any(Order.class));
        verifyNoInteractions(variantRepository, couponUsageRepository);
    }

    @Test
    @DisplayName("Chủ shop xác nhận hàng hoàn về kho (DELIVERY_FAILED -> RETURNED): Mới chính thức hoàn kho an toàn")
    void confirmReturnByOwner_Success_RestoresStock() {
        testOrder.setStatus(OrderStatus.DELIVERY_FAILED);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CouponUsage usage = new CouponUsage(null, testUser, 100L, new BigDecimal("30000"));
        when(couponUsageRepository.findByOrderIdAndStatus(100L, CouponUsage.STATUS_APPLIED))
                .thenReturn(Optional.of(usage));

        OrderConfirmationDto result = orderLifecycleService.confirmReturnByOwner(
                "ORD-20261028-0001",
                "Kiem tra kien hang nguyen ven tem niem phong, nhap kho",
                "Kho Thu Duc"
        );

        assertThat(result.getStatus()).isEqualTo(OrderStatus.RETURNED);

        // Restores stock safely now that package is in warehouse
        verify(inventoryService, times(1)).restoreStockForReturn(any(), eq("ORD-20261028-0001"), eq(201L), eq(2), isNull(), any());
        verify(inventoryService, times(1)).restoreStockForReturn(any(), eq("ORD-20261028-0001"), eq(202L), eq(1), isNull(), any());

        // Voucher released
        assertThat(usage.getStatus()).isEqualTo(CouponUsage.STATUS_RELEASED);
        assertThat(usage.getReleasedAt()).isNotNull();
        verify(couponUsageRepository, times(1)).save(usage);

        assertThat(testOrder.getStatusHistory()).singleElement().satisfies(history -> {
            assertThat(history.getFromStatus()).isEqualTo(OrderStatus.DELIVERY_FAILED);
            assertThat(history.getToStatus()).isEqualTo(OrderStatus.RETURNED);
            assertThat(history.getChangedBy()).isEqualTo("Kho Thu Duc");
        });
    }

    @Test
    @DisplayName("Chuyển trạng thái không hợp lệ bị từ chối (PENDING -> SHIPPING: 400 Bad Request)")
    void updateOrderStatusByOwner_ThrowsBadRequest_OnInvalidTransition() {
        testOrder.setStatus(OrderStatus.PENDING);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderLifecycleService.updateOrderStatusByOwner(
                "ORD-20261028-0001",
                OrderStatus.SHIPPING,
                "Nhay coc trang thai",
                "Shop Owner"
        ))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getCode()).isEqualTo("INVALID_TRANSITION");
                });

        verify(variantRepository, never()).restoreStock(any(), anyInt());
    }

    @Test
    @DisplayName("Giao hàng thành công (SHIPPING -> COMPLETED) chuyển COD payment_status thành PAID")
    void updateOrderStatusByOwner_Completed_SetsPaymentStatusPaid() {
        testOrder.setStatus(OrderStatus.SHIPPING);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);
        when(orderRepository.findByOrderNumberWithLock("ORD-20261028-0001"))
                .thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderConfirmationDto result = orderLifecycleService.updateOrderStatusByOwner(
                "ORD-20261028-0001",
                OrderStatus.COMPLETED,
                "Giao thanh cong va da thu COD",
                "Shop Owner Minh"
        );

        assertThat(result.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }
}
