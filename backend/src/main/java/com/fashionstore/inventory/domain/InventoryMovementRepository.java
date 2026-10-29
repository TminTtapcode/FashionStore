package com.fashionstore.inventory.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    Page<InventoryMovement> findByVariantIdOrderByCreatedAtDescIdDesc(Long variantId, Pageable pageable);

    List<InventoryMovement> findByVariantIdOrderByCreatedAtAscIdAsc(Long variantId);

    Optional<InventoryMovement> findByMovementKey(String movementKey);

    boolean existsByMovementKey(String movementKey);

    Optional<InventoryMovement> findFirstByVariantIdOrderByCreatedAtDescIdDesc(Long variantId);

    @Query("SELECT COALESCE(SUM(m.quantityDelta), 0) FROM InventoryMovement m WHERE m.variant.id = :variantId")
    Integer sumDeltaByVariantId(@Param("variantId") Long variantId);

    @Query("SELECT m FROM InventoryMovement m WHERE m.variant.id = :variantId AND (m.movementType = com.fashionstore.inventory.domain.InventoryMovementType.OPENING_BALANCE OR m.movementType = com.fashionstore.inventory.domain.InventoryMovementType.INITIAL_STOCK)")
    Optional<InventoryMovement> findOpeningBalanceByVariantId(@Param("variantId") Long variantId);
}

