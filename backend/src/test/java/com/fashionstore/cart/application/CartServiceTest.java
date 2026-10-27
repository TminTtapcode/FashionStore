package com.fashionstore.cart.application;

import com.fashionstore.cart.api.dto.AddCartItemRequest;
import com.fashionstore.cart.api.dto.CartDto;
import com.fashionstore.cart.api.dto.UpdateCartItemRequest;
import com.fashionstore.cart.domain.Cart;
import com.fashionstore.cart.domain.CartItem;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test: CartService Business Logic")
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartService cartService;

    private User testUser;
    private Cart testCart;
    private Product activeProduct;
    private ProductVariant activeVariant;

    @BeforeEach
    void setUp() {
        testUser = new User("user@fashionstore.com", "hash", "Nguyen Van A", "0912345678");
        testUser.setId(10L);

        testCart = new Cart(testUser);
        testCart.setId(100L);

        Category category = new Category("Thời trang Nữ", "nu", "Mô tả", null, 1);
        activeProduct = new Product(1L, category, "Đầm Lụa Maxi", "dam-lua-maxi", "Mô tả", "Atelier", "Lụa", "Xòe", "Giặt tay", "{}", ProductStatus.ACTIVE);
        activeProduct.setId(1L);

        activeVariant = new ProductVariant(activeProduct, "SKU-TEST-S", "S", "Trắng", "#FFF", new BigDecimal("500000.00"), new BigDecimal("600000.00"), 10, ProductVariantStatus.ACTIVE);
        activeVariant.setId(20L);
    }

    @Test
    @DisplayName("Thêm mới biến thể vào giỏ: Tạo CartItem mới và tính toán đúng tổng tiền")
    void addItem_newVariant_createsItem() {
        when(cartRepository.findByUserId(10L)).thenReturn(Optional.of(testCart));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(activeVariant));
        when(cartItemRepository.findByCartIdAndVariantId(100L, 20L)).thenReturn(Optional.empty());

        CartItem savedItem = new CartItem(testCart, activeVariant, 2);
        savedItem.setId(1L);

        when(cartItemRepository.findByCartIdWithDetails(100L)).thenReturn(List.of(savedItem));

        CartDto result = cartService.addItem(10L, new AddCartItemRequest(20L, 2));

        assertThat(result).isNotNull();
        assertThat(result.getTotalItemCount()).isEqualTo(2);
        assertThat(result.getSubtotal()).isEqualByComparingTo("1000000.00");
        verify(cartItemRepository).saveAndFlush(any(CartItem.class));
    }

    @Test
    @DisplayName("Thêm lại biến thể đã có trong giỏ: Tự động cộng dồn số lượng (Merge policy)")
    void addItem_existingVariant_mergesQuantity() {
        when(cartRepository.findByUserId(10L)).thenReturn(Optional.of(testCart));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(activeVariant));

        CartItem existingItem = new CartItem(testCart, activeVariant, 2);
        existingItem.setId(1L);
        when(cartItemRepository.findByCartIdAndVariantId(100L, 20L)).thenReturn(Optional.of(existingItem));

        when(cartItemRepository.findByCartIdWithDetails(100L)).thenReturn(List.of(existingItem));

        CartDto result = cartService.addItem(10L, new AddCartItemRequest(20L, 3));

        assertThat(existingItem.getQuantity()).isEqualTo(5);
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    @DisplayName("Số lượng vượt quá giới hạn tối đa (10): Bị từ chối CART_QUANTITY_EXCEEDED")
    void addItem_exceedsMaxLimit_throwsException() {
        when(cartRepository.findByUserId(10L)).thenReturn(Optional.of(testCart));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(activeVariant));

        CartItem existingItem = new CartItem(testCart, activeVariant, 8);
        when(cartItemRepository.findByCartIdAndVariantId(100L, 20L)).thenReturn(Optional.of(existingItem));

        assertThatThrownBy(() -> cartService.addItem(10L, new AddCartItemRequest(20L, 3)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Mỗi sản phẩm chỉ được mua tối đa 10 cái");

        verify(cartItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Biến thể ngưng bán: Bị từ chối PRODUCT_NOT_AVAILABLE")
    void addItem_inactiveVariant_throwsException() {
        activeVariant.setStatus(ProductVariantStatus.INACTIVE);

        when(cartRepository.findByUserId(10L)).thenReturn(Optional.of(testCart));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(activeVariant));

        assertThatThrownBy(() -> cartService.addItem(10L, new AddCartItemRequest(20L, 1)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Sản phẩm hoặc biến thể hiện không còn kinh doanh");
    }

    @Test
    @DisplayName("Sản phẩm bị ẩn: Bị từ chối PRODUCT_NOT_AVAILABLE")
    void addItem_hiddenProduct_throwsException() {
        activeProduct.setStatus(ProductStatus.HIDDEN);

        when(cartRepository.findByUserId(10L)).thenReturn(Optional.of(testCart));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(activeVariant));

        assertThatThrownBy(() -> cartService.addItem(10L, new AddCartItemRequest(20L, 1)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Sản phẩm hoặc biến thể hiện không còn kinh doanh");
    }

    @Test
    @DisplayName("Cập nhật số lượng dòng hàng không thuộc sở hữu của user: Ném ResourceNotFoundException")
    void updateItemQuantity_otherUserItem_throwsException() {
        when(cartItemRepository.findByIdAndUserId(999L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.updateItemQuantity(10L, 999L, new UpdateCartItemRequest(3)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    @Test
    @DisplayName("Xóa dòng hàng: Gọi cartItemRepository.delete")
    void removeItem_validOwnership_deletesItem() {
        CartItem item = new CartItem(testCart, activeVariant, 2);
        item.setId(5L);

        when(cartItemRepository.findByIdAndUserId(5L, 10L)).thenReturn(Optional.of(item));
        when(cartItemRepository.findByCartIdWithDetails(100L)).thenReturn(List.of());

        CartDto result = cartService.removeItem(10L, 5L);

        assertThat(result.getItems()).isEmpty();
        verify(cartItemRepository).delete(item);
    }
}
