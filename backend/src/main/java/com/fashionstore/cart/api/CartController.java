package com.fashionstore.cart.api;

import com.fashionstore.cart.api.dto.AddCartItemRequest;
import com.fashionstore.cart.api.dto.CartDto;
import com.fashionstore.cart.api.dto.UpdateCartItemRequest;
import com.fashionstore.cart.application.CartService;
import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(
            @AuthenticationPrincipal UserPrincipal principal) {
        CartDto cart = cartService.getCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddCartItemRequest request) {
        CartDto cart = cartService.addItem(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PatchMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartDto cart = cartService.updateItemQuantity(principal.getId(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> removeItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long itemId) {
        CartDto cart = cartService.removeItem(principal.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartDto>> clearCart(
            @AuthenticationPrincipal UserPrincipal principal) {
        CartDto cart = cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }
}
