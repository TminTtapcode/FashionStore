package com.fashionstore.cart.application;

import com.fashionstore.cart.api.dto.*;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductVariantRepository variantRepository,
            UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CartDto getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToCartDto(cart);
    }

    public CartDto addItem(Long userId, AddCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm"));

        validateSellable(variant);

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId());

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (newQty > CartItem.MAX_QUANTITY) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "CART_QUANTITY_EXCEEDED",
                        "Mỗi sản phẩm chỉ được mua tối đa " + CartItem.MAX_QUANTITY + " cái trong giỏ hàng"
                );
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            try {
                CartItem newItem = new CartItem(cart, variant, request.getQuantity());
                cartItemRepository.saveAndFlush(newItem);
            } catch (DataIntegrityViolationException ex) {
                // Catch race condition if 2 concurrent threads attempted to insert the same variant
                CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId())
                        .orElseThrow(() -> ex);
                int newQty = Math.min(CartItem.MAX_QUANTITY, item.getQuantity() + request.getQuantity());
                item.setQuantity(newQty);
                cartItemRepository.save(item);
            }
        }

        return mapToCartDto(cart);
    }

    public CartDto updateItemQuantity(Long userId, Long itemId, UpdateCartItemRequest request) {
        CartItem item = cartItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng của bạn"));

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return mapToCartDto(item.getCart());
    }

    public CartDto removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng của bạn"));

        Cart cart = item.getCart();
        cartItemRepository.delete(item);

        return mapToCartDto(cart);
    }

    public CartDto clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteAllByCartId(cart.getId());

        CartDto emptyCart = new CartDto();
        emptyCart.setId(cart.getId());
        emptyCart.setTotalItemCount(0);
        emptyCart.setSubtotal(BigDecimal.ZERO);
        emptyCart.setHasUnavailableItems(false);
        return emptyCart;
    }

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng"));
                    Cart newCart = new Cart(user);
                    try {
                        return cartRepository.saveAndFlush(newCart);
                    } catch (DataIntegrityViolationException e) {
                        return cartRepository.findByUserId(userId).orElseThrow(() -> e);
                    }
                });
    }

    private void validateSellable(ProductVariant variant) {
        Product product = variant.getProduct();
        if (product == null || product.getStatus() != ProductStatus.ACTIVE || variant.getStatus() != ProductVariantStatus.ACTIVE) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_NOT_AVAILABLE",
                    "Sản phẩm hoặc biến thể hiện không còn kinh doanh"
            );
        }
    }

    private CartDto mapToCartDto(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdWithDetails(cart.getId());

        CartDto dto = new CartDto();
        dto.setId(cart.getId());

        int totalCount = 0;
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean hasUnavailable = false;

        for (CartItem item : items) {
            ProductVariant v = item.getVariant();
            Product p = v.getProduct();

            CartItemDto itemDto = new CartItemDto();
            itemDto.setId(item.getId());
            itemDto.setVariantId(v.getId());
            itemDto.setProductId(p.getId());
            itemDto.setProductName(p.getName());
            itemDto.setProductSlug(p.getSlug());
            itemDto.setSku(v.getSku());
            itemDto.setSize(v.getSize());
            itemDto.setColorName(v.getColorName());
            itemDto.setColorHex(v.getColorHex());

            // Image resolution: variant image first, fallback to primary image, then first image
            String resolvedImage = resolveImageUrl(p, v.getId());
            itemDto.setImageUrl(resolvedImage);

            // Authoritative current price from DB
            itemDto.setUnitPrice(v.getPrice());
            itemDto.setCompareAtPrice(v.getCompareAtPrice());
            itemDto.setQuantity(item.getQuantity());
            BigDecimal lineTotal = v.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            itemDto.setLineTotal(lineTotal);
            itemDto.setStockQuantity(v.getStockQuantity());

            // Availability calculation
            if (p.getStatus() != ProductStatus.ACTIVE) {
                itemDto.setAvailable(false);
                itemDto.setUnavailableReason("Sản phẩm tạm ngừng kinh doanh");
                hasUnavailable = true;
            } else if (v.getStatus() != ProductVariantStatus.ACTIVE) {
                itemDto.setAvailable(false);
                itemDto.setUnavailableReason("Phân loại hàng tạm ngừng kinh doanh");
                hasUnavailable = true;
            } else if (v.getStockQuantity() <= 0) {
                itemDto.setAvailable(false);
                itemDto.setUnavailableReason("Sản phẩm tạm hết hàng");
                hasUnavailable = true;
            } else {
                itemDto.setAvailable(true);
                itemDto.setUnavailableReason(null);
                subtotal = subtotal.add(lineTotal);
            }

            totalCount += item.getQuantity();
            dto.getItems().add(itemDto);
        }

        dto.setTotalItemCount(totalCount);
        dto.setSubtotal(subtotal);
        dto.setHasUnavailableItems(hasUnavailable);

        return dto;
    }

    private String resolveImageUrl(Product p, Long variantId) {
        if (p.getImages() == null || p.getImages().isEmpty()) {
            return null;
        }

        // 1. Variant specific image
        Optional<ProductImage> variantImg = p.getImages().stream()
                .filter(img -> img.getVariant() != null && img.getVariant().getId().equals(variantId))
                .findFirst();
        if (variantImg.isPresent()) {
            return variantImg.get().getImageUrl();
        }

        // 2. Primary lookbook image
        Optional<ProductImage> primaryImg = p.getImages().stream()
                .filter(ProductImage::isPrimary)
                .findFirst();
        if (primaryImg.isPresent()) {
            return primaryImg.get().getImageUrl();
        }

        // 3. Fallback to first image
        return p.getImages().get(0).getImageUrl();
    }
}
