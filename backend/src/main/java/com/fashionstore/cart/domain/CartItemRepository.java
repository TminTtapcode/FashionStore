package com.fashionstore.cart.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndVariantId(Long cartId, Long variantId);

    /**
     * Strict ownership check: Only finds the item if it belongs to the given user's cart.
     */
    @Query("SELECT ci FROM CartItem ci WHERE ci.id = :itemId AND ci.cart.user.id = :userId")
    Optional<CartItem> findByIdAndUserId(@Param("itemId") Long itemId, @Param("userId") Long userId);

    /**
     * Optimized fetch query to avoid N+1 queries when loading cart items.
     */
    @Query("SELECT ci FROM CartItem ci " +
           "JOIN FETCH ci.variant v " +
           "JOIN FETCH v.product p " +
           "WHERE ci.cart.id = :cartId " +
           "ORDER BY ci.createdAt DESC")
    List<CartItem> findByCartIdWithDetails(@Param("cartId") Long cartId);

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cart.id = :cartId")
    void deleteAllByCartId(@Param("cartId") Long cartId);
}
