package com.fashionstore.order.application;

import com.fashionstore.common.exception.ApiException;
import com.fashionstore.order.api.dto.*;
import com.fashionstore.order.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: CheckoutFacade Idempotency Handling & Concurrent Race Recovery")
class CheckoutFacadeTest {

    @Mock
    private CheckoutService checkoutService;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private CheckoutFacade checkoutFacade;

    private CheckoutRequest validRequest;
    private Order existingOrder;
    private OrderConfirmationDto expectedDto;

    @BeforeEach
    void setUp() {
        validRequest = new CheckoutRequest();
        validRequest.setShippingName("Nguyen Van A");
        validRequest.setShippingPhone("0987654321");
        validRequest.setShippingAddress("123 Nguyen Hue");

        existingOrder = new Order(
                "ORD-20261028-0001",
                "idemp-key-123",
                null,
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

        expectedDto = new OrderConfirmationDto(
                100L,
                "ORD-20261028-0001",
                OrderStatus.PENDING,
                PaymentMethod.COD,
                PaymentStatus.PENDING,
                new RecipientDto("Nguyen Van A", "0987654321", "123 Nguyen Hue", "TP. Ho Chi Minh", "Quan 1", "Ben Nghe", null),
                new FinancialsDto(new BigDecimal("900000"), BigDecimal.ZERO, new BigDecimal("30000"), new BigDecimal("930000"), null),
                List.of(),
                Instant.now(),
                true
        );
    }

    @Test
    @DisplayName("Fast check: Nếu đơn đã tồn tại trước khi mở transaction, trả về replay hợp lệ")
    void checkoutCod_ExistingOrder_ReturnsReplay() {
        when(orderRepository.findByUserIdAndIdempotencyKey(1L, "idemp-key-123"))
                .thenReturn(Optional.of(existingOrder));
        when(checkoutService.mapToOrderConfirmationDto(existingOrder, true))
                .thenReturn(expectedDto);

        OrderConfirmationDto result = checkoutFacade.checkoutCod(1L, "idemp-key-123", validRequest);

        assertThat(result.isIdempotentReplay()).isTrue();
        assertThat(result.getOrderNumber()).isEqualTo("ORD-20261028-0001");
        verify(checkoutService, never()).executeCheckoutOrder(any(), any(), any());
    }

    @Test
    @DisplayName("Concurrent Race: Khi 2 request đồng thời chạm uk_orders_user_idempotency, bắt exception và replay an toàn")
    void checkoutCod_ConcurrentRace_RecoversViaDuplicateConstraintAndReplays() {
        when(orderRepository.findByUserIdAndIdempotencyKey(1L, "idemp-key-123"))
                .thenReturn(Optional.empty()) // Lúc bắt đầu chưa thấy
                .thenReturn(Optional.of(existingOrder)); // Khi xảy ra race condition, truy vấn lại thấy đơn đã commit bởi request kia

        DataIntegrityViolationException duplicateEx = new DataIntegrityViolationException(
                "Duplicate entry '1-idemp-key-123' for key 'uk_orders_user_idempotency'"
        );
        when(checkoutService.executeCheckoutOrder(1L, "idemp-key-123", validRequest))
                .thenThrow(duplicateEx);
        when(checkoutService.mapToOrderConfirmationDto(existingOrder, true))
                .thenReturn(expectedDto);

        OrderConfirmationDto result = checkoutFacade.checkoutCod(1L, "idemp-key-123", validRequest);

        assertThat(result.isIdempotentReplay()).isTrue();
        assertThat(result.getOrderNumber()).isEqualTo("ORD-20261028-0001");
    }

    @Test
    @DisplayName("Bảo vệ tính toàn vẹn: Tái sử dụng Idempotency-Key với thông tin người nhận khác bị từ chối 409 Conflict")
    void checkoutCod_PayloadMismatch_ThrowsConflict() {
        validRequest.setShippingPhone("0111222333"); // SĐT khác với đơn cũ

        when(orderRepository.findByUserIdAndIdempotencyKey(1L, "idemp-key-123"))
                .thenReturn(Optional.of(existingOrder));

        assertThatThrownBy(() -> checkoutFacade.checkoutCod(1L, "idemp-key-123", validRequest))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getCode()).isEqualTo("IDEMPOTENCY_CONFLICT");
                });
    }

    @Test
    @DisplayName("Không che giấu lỗi khác: Nếu DataIntegrityViolationException không phải là idempotency thì rethrow")
    void checkoutCod_OtherDataIntegrityException_Rethrows() {
        when(orderRepository.findByUserIdAndIdempotencyKey(1L, "idemp-key-123"))
                .thenReturn(Optional.empty());

        DataIntegrityViolationException foreignKeyEx = new DataIntegrityViolationException(
                "Cannot add or update a child row: a foreign key constraint fails"
        );
        when(checkoutService.executeCheckoutOrder(1L, "idemp-key-123", validRequest))
                .thenThrow(foreignKeyEx);

        assertThatThrownBy(() -> checkoutFacade.checkoutCod(1L, "idemp-key-123", validRequest))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("foreign key constraint");
    }
}
