package com.fashionstore.order.application;

import com.fashionstore.cart.domain.Cart;
import com.fashionstore.cart.domain.CartItem;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.Product;
import com.fashionstore.catalog.domain.ProductImage;
import com.fashionstore.catalog.domain.ProductStatus;
import com.fashionstore.catalog.domain.ProductVariant;
import com.fashionstore.catalog.domain.ProductVariantRepository;
import com.fashionstore.catalog.domain.ProductVariantStatus;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.order.api.dto.*;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.domain.DiscountType;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class CheckoutService {

    private static final BigDecimal FREESHIP_THRESHOLD = new BigDecimal("1000000");
    private static final BigDecimal FLAT_SHIPPING_FEE = new BigDecimal("30000");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public CheckoutService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository orderStatusHistoryRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductVariantRepository variantRepository,
            UserRepository userRepository,
            CouponRepository couponRepository,
            CouponUsageRepository couponUsageRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    /**
     * Process COD Checkout atomically with Idempotency, Deadlock prevention,
     * conditional inventory deduction, voucher quota control, and cart invalidation.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderConfirmationDto checkoutCod(Long userId, String idempotencyKey, CheckoutRequest request) {
        // 1. Idempotency Key Validation
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_IDEMPOTENCY_KEY", "Yêu cầu đặt hàng phải có Idempotency-Key");
        }
        String cleanIdempotencyKey = idempotencyKey.trim();

        // Check if an order already exists for this (userId, idempotencyKey)
        Optional<Order> existingOrderOpt = orderRepository.findByUserIdAndIdempotencyKey(userId, cleanIdempotencyKey);
        if (existingOrderOpt.isPresent()) {
            Order existingOrder = existingOrderOpt.get();
            // Verify payload consistency (prevent key reuse with conflicting payload)
            if (!existingOrder.getShippingPhone().equals(request.getShippingPhone().trim()) ||
                !existingOrder.getShippingAddress().equals(request.getShippingAddress().trim())) {
                throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "Khóa request đã được sử dụng cho một yêu cầu khác");
            }
            return mapToOrderConfirmationDto(existingOrder, true);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        // 2. Fetch User's Cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CART_EMPTY", "Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng"));

        List<CartItem> cartItems = cartItemRepository.findByCartIdWithDetails(cart.getId());
        if (cartItems.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CART_EMPTY", "Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng");
        }

        // 3. Validate Catalog Active Status
        for (CartItem item : cartItems) {
            ProductVariant v = item.getVariant();
            Product p = v.getProduct();
            if (p == null || p.getStatus() != ProductStatus.ACTIVE) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "VARIANT_UNAVAILABLE",
                        "Sản phẩm '" + (p != null ? p.getName() : "không xác định") + "' hiện đã tạm ngừng kinh doanh"
                );
            }
            if (v.getStatus() != ProductVariantStatus.ACTIVE) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "VARIANT_UNAVAILABLE",
                        "Phân loại hàng '" + p.getName() + " - " + v.getSize() + "' hiện đã tạm ngừng kinh doanh"
                );
            }
        }

        // 4. Deadlock Prevention: Sort items by Variant ID in ascending order
        cartItems.sort(Comparator.comparing(item -> item.getVariant().getId()));

        // 5. Conditional Inventory Deduction
        for (CartItem item : cartItems) {
            ProductVariant v = item.getVariant();
            int affected = variantRepository.deductStock(v.getId(), item.getQuantity());
            if (affected == 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "INSUFFICIENT_STOCK",
                        "Sản phẩm '" + v.getProduct().getName() + " (" + v.getSize() + " - " + v.getColorName() + ")' không đủ tồn kho hoặc đã hết hàng"
                );
            }
        }

        // 6. Subtotal Calculation
        BigDecimal subtotalAmount = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            BigDecimal itemTotal = item.getVariant().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotalAmount = subtotalAmount.add(itemTotal);
        }

        // 7. Shipping Fee Calculation (Freeship on Subtotal >= 1,000,000 VND)
        BigDecimal shippingFee = (subtotalAmount.compareTo(FREESHIP_THRESHOLD) >= 0)
                ? BigDecimal.ZERO
                : FLAT_SHIPPING_FEE;

        // 8. Coupon Validation & Locking
        BigDecimal discountAmount = BigDecimal.ZERO;
        Coupon appliedCoupon = null;
        String couponCode = (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty())
                ? request.getCouponCode().trim().toUpperCase()
                : null;

        if (couponCode != null) {
            appliedCoupon = couponRepository.findByCodeWithLock(couponCode)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "COUPON_INVALID", "Mã giảm giá không tồn tại hoặc đã ngừng áp dụng"));

            if (!"ACTIVE".equalsIgnoreCase(appliedCoupon.getStatus())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_INVALID", "Mã giảm giá hiện không hoạt động");
            }

            Instant now = Instant.now();
            if (appliedCoupon.getStartsAt() != null && now.isBefore(appliedCoupon.getStartsAt())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_INVALID", "Mã giảm giá chưa đến thời gian áp dụng");
            }
            if (appliedCoupon.getExpiresAt() != null && now.isAfter(appliedCoupon.getExpiresAt())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_EXPIRED", "Mã giảm giá đã hết thời hạn sử dụng");
            }

            if (appliedCoupon.getMinOrderAmount() != null && subtotalAmount.compareTo(appliedCoupon.getMinOrderAmount()) < 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "COUPON_MIN_ORDER_NOT_MET",
                        "Đơn hàng chưa đạt giá trị tối thiểu " + appliedCoupon.getMinOrderAmount().longValue() + "đ để áp dụng mã này"
                );
            }

            if (appliedCoupon.getUsageLimit() != null) {
                long totalUsed = couponUsageRepository.countByCouponId(appliedCoupon.getId());
                if (totalUsed >= appliedCoupon.getUsageLimit()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_USAGE_EXCEEDED", "Mã giảm giá đã hết lượt sử dụng trên hệ thống");
                }
            }

            if (appliedCoupon.getPerUserLimit() != null && appliedCoupon.getPerUserLimit() > 0) {
                long userUsed = couponUsageRepository.countByCouponIdAndUserId(appliedCoupon.getId(), userId);
                if (userUsed >= appliedCoupon.getPerUserLimit()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_USAGE_EXCEEDED", "Bạn đã sử dụng hết lượt cho mã giảm giá này");
                }
            }

            if (appliedCoupon.isFirstOrderOnly()) {
                long nonCancelledOrders = orderRepository.countByUserIdAndStatusNot(userId, OrderStatus.CANCELLED);
                if (nonCancelledOrders > 0) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "COUPON_FIRST_ORDER_ONLY", "Mã giảm giá chỉ áp dụng cho đơn hàng đầu tiên của bạn");
                }
            }

            if (appliedCoupon.getDiscountType() == DiscountType.PERCENTAGE) {
                discountAmount = subtotalAmount.multiply(appliedCoupon.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                if (appliedCoupon.getMaxDiscount() != null && discountAmount.compareTo(appliedCoupon.getMaxDiscount()) > 0) {
                    discountAmount = appliedCoupon.getMaxDiscount();
                }
            } else if (appliedCoupon.getDiscountType() == DiscountType.FIXED_AMOUNT) {
                discountAmount = appliedCoupon.getDiscountValue().min(subtotalAmount);
            }

            discountAmount = discountAmount.min(subtotalAmount);
        }

        BigDecimal finalAmount = subtotalAmount.subtract(discountAmount).add(shippingFee);

        // 9. Generate Unique Order Number
        String orderNumber = generateUniqueOrderNumber();

        // 10. Persist Order
        Order order = new Order(
                orderNumber,
                cleanIdempotencyKey,
                user,
                PaymentMethod.COD,
                request.getShippingName().trim(),
                request.getShippingPhone().trim(),
                request.getShippingAddress().trim(),
                request.getShippingCity() != null ? request.getShippingCity().trim() : null,
                request.getShippingDistrict() != null ? request.getShippingDistrict().trim() : null,
                request.getShippingWard() != null ? request.getShippingWard().trim() : null,
                request.getShippingNote() != null ? request.getShippingNote().trim() : null,
                subtotalAmount,
                discountAmount,
                shippingFee,
                finalAmount,
                couponCode
        );

        // 11. Create Immutable OrderItems Snapshots
        for (CartItem item : cartItems) {
            ProductVariant v = item.getVariant();
            Product p = v.getProduct();
            String thumbnail = resolveImageUrl(p, v.getId());
            BigDecimal itemTotal = v.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

            OrderItem orderItem = new OrderItem(
                    order,
                    p.getId(),
                    v.getId(),
                    p.getName(),
                    p.getBrand(),
                    v.getSku(),
                    v.getSize(),
                    v.getColorName(),
                    thumbnail,
                    v.getPrice(),
                    item.getQuantity(),
                    itemTotal
            );
            order.addItem(orderItem);
        }

        // 12. Create Initial Status History Record
        OrderStatusHistory history = new OrderStatusHistory(
                order,
                null,
                OrderStatus.PENDING,
                "Đơn hàng COD được tạo thành công",
                "CUSTOMER"
        );
        order.addStatusHistory(history);

        Order savedOrder = orderRepository.save(order);

        // 13. Persist Coupon Usage Record
        if (appliedCoupon != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            CouponUsage usage = new CouponUsage(appliedCoupon, user, savedOrder.getId(), discountAmount);
            couponUsageRepository.save(usage);
        }

        // 14. Invalidate / Clear Cart Items
        cartItemRepository.deleteAllByCartId(cart.getId());

        // 15. Return Confirmation DTO
        return mapToOrderConfirmationDto(savedOrder, false);
    }

    private String generateUniqueOrderNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder sb = new StringBuilder(4);
            for (int i = 0; i < 4; i++) {
                sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
            }
            String candidate = "IVRE-" + datePrefix + "-" + sb;
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        return "IVRE-" + datePrefix + "-" + (System.currentTimeMillis() % 10000);
    }

    private String resolveImageUrl(Product p, Long variantId) {
        if (p == null || p.getImages() == null || p.getImages().isEmpty()) {
            return null;
        }
        // 1. Variant specific image
        Optional<ProductImage> variantImg = p.getImages().stream()
                .filter(img -> img.getVariant() != null && img.getVariant().getId().equals(variantId))
                .findFirst();
        if (variantImg.isPresent()) {
            return variantImg.get().getImageUrl();
        }
        // 2. Primary image
        Optional<ProductImage> primaryImg = p.getImages().stream()
                .filter(ProductImage::isPrimary)
                .findFirst();
        if (primaryImg.isPresent()) {
            return primaryImg.get().getImageUrl();
        }
        // 3. Fallback
        return p.getImages().get(0).getImageUrl();
    }

    private OrderConfirmationDto mapToOrderConfirmationDto(Order order, boolean isReplay) {
        RecipientDto recipient = new RecipientDto(
                order.getShippingName(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getShippingDistrict(),
                order.getShippingWard(),
                order.getShippingNote()
        );

        FinancialsDto financials = new FinancialsDto(
                order.getSubtotalAmount(),
                order.getDiscountAmount(),
                order.getShippingFee(),
                order.getFinalAmount(),
                order.getCouponCode()
        );

        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> new OrderItemDto(
                item.getId(),
                item.getProductId(),
                item.getVariantId(),
                item.getProductName(),
                item.getBrand(),
                item.getSku(),
                item.getSize(),
                item.getColorName(),
                item.getThumbnailUrl(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getTotalPrice()
        )).toList();

        return new OrderConfirmationDto(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                recipient,
                financials,
                itemDtos,
                order.getCreatedAt(),
                isReplay
        );
    }
}
