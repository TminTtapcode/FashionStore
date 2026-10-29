import { useState, useCallback, useMemo } from 'react';
import type {
  OutfitSlot,
  OutfitItemSelection,
  OutfitSlotsMap,
  OutfitBatchAddResult,
} from '../types/outfit';
import {
  calculateOutfitSummary,
  applySlotCompatibility,
} from '../types/outfit';
import { OUTFIT_PRESETS } from '../data/outfitPresets';
import { addToCartApi } from '../api/cartApi';
import type { Cart } from '../types/cart';

export function useOutfitBuilder(initialSlots?: OutfitSlotsMap) {
  const [slots, setSlots] = useState<OutfitSlotsMap>(
    () => initialSlots || OUTFIT_PRESETS[0].slots
  );
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>('OUTERWEAR');
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<OutfitBatchAddResult | null>(null);

  const notify = useCallback((msg: string, durationMs = 4000) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, durationMs);
  }, []);

  const selectSlot = useCallback((slot: OutfitSlot) => {
    setActiveSlot(slot);
  }, []);

  const setSlotItem = useCallback(
    (item: OutfitItemSelection) => {
      setSlots((prev) => {
        const { updatedSlots, conflictMessage } = applySlotCompatibility(prev, item);
        if (conflictMessage) {
          notify(conflictMessage);
        }
        return updatedSlots;
      });
      notify(`Đã cập nhật ${item.productName} (${item.colorName} · ${item.size}) vào bộ phối.`);
    },
    [notify]
  );

  const removeSlotItem = useCallback(
    (slot: OutfitSlot) => {
      setSlots((prev) => {
        const updated = { ...prev };
        delete updated[slot];
        return updated;
      });
      notify(`Đã gỡ món khỏi vị trí.`);
    },
    [notify]
  );

  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = OUTFIT_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setSlots(preset.slots);
        notify(`Đã áp dụng mẫu phối: ${preset.name}`);
      }
    },
    [notify]
  );

  const resetOutfit = useCallback(() => {
    setSlots(OUTFIT_PRESETS[0].slots);
    setActiveSlot('OUTERWEAR');
    setBatchResults(null);
    notify('Đã đặt lại bộ phối trang phục Atelier Signature.');
  }, [notify]);

  const summary = useMemo(() => calculateOutfitSummary(slots), [slots]);

  /**
   * Sequential Add-to-Cart execution:
   * 1. Checks guest authentication.
   * 2. Aggregates duplicate variants within outfit to verify total limits against existing cart.
   * 3. Executes API requests sequentially to maintain exact state control.
   * 4. Reports granular itemized results (Total success, Partial success, Complete failure).
   */
  const addEntireOutfitToCart = useCallback(
    async ({
      cart,
      user,
      openAuthModal,
      refreshCart,
      openCart,
    }: {
      cart: Cart | null;
      user: unknown;
      openAuthModal: (tab?: 'login' | 'register') => void;
      refreshCart: () => Promise<void>;
      openCart: () => void;
    }) => {
      if (!user) {
        notify('Vui lòng đăng nhập để thêm toàn bộ outfit vào giỏ hàng.');
        openAuthModal('login');
        return { success: false, reason: 'UNAUTHENTICATED' };
      }

      const activeItems = Object.values(slots).filter((s): s is OutfitItemSelection => Boolean(s));
      if (activeItems.length === 0) {
        notify('Vui lòng chọn ít nhất 1 món trang phục vào bộ phối.');
        return { success: false, reason: 'EMPTY_OUTFIT' };
      }

      // Check duplicate variants within the outfit and aggregate counts
      const variantCountMap = new Map<number, number>();
      for (const item of activeItems) {
        variantCountMap.set(item.variantId, (variantCountMap.get(item.variantId) || 0) + 1);
      }

      // Pre-flight check: ensure existingCartQty + outfitQty <= min(10, stock)
      const existingItems = cart?.items || [];
      for (const [vId, neededQty] of variantCountMap.entries()) {
        const existing = existingItems.find((ci) => ci.variantId === vId);
        const existingQty = existing ? existing.quantity : 0;
        const matchingItem = activeItems.find((ai) => ai.variantId === vId)!;
        const maxPermitted = Math.min(10, matchingItem.stockQuantity);
        if (existingQty + neededQty > maxPermitted) {
          notify(
            `Món "${matchingItem.productName}" không đủ số lượng (Đã có ${existingQty} trong giỏ, kho chỉ còn ${matchingItem.stockQuantity}).`
          );
          return { success: false, reason: 'EXCEEDS_LIMIT' };
        }
      }

      setIsSubmitting(true);
      const results: OutfitBatchAddResult = {
        totalRequested: activeItems.length,
        successCount: 0,
        failedCount: 0,
        items: [],
      };

      for (const item of activeItems) {
        try {
          await addToCartApi({ variantId: item.variantId, quantity: 1 });
          results.successCount += 1;
          results.items.push({
            variantId: item.variantId,
            sku: item.sku,
            productName: item.productName,
            slot: item.slot,
            status: 'SUCCESS',
          });
        } catch (err) {
          results.failedCount += 1;
          const errMsg = err instanceof Error ? err.message : 'Lỗi thêm món';
          results.items.push({
            variantId: item.variantId,
            sku: item.sku,
            productName: item.productName,
            slot: item.slot,
            status: 'FAILED',
            errorMessage: errMsg,
          });
        }
      }

      setBatchResults(results);
      setIsSubmitting(false);

      // Synchronize cart state with backend
      await refreshCart();

      if (results.successCount === results.totalRequested) {
        notify(`Đã thêm trọn bộ ${results.successCount} món vào giỏ hàng thành công!`);
        openCart();
        return { success: true, results };
      } else if (results.successCount > 0) {
        const failedNames = results.items
          .filter((i) => i.status === 'FAILED')
          .map((i) => i.productName)
          .join(', ');
        notify(
          `Đã thêm ${results.successCount}/${results.totalRequested} món. Không thể thêm: ${failedNames}.`
        );
        openCart();
        return { success: false, partial: true, results };
      } else {
        notify('Không thể thêm trang phục vào giỏ hàng. Vui lòng kiểm tra lại tồn kho.');
        return { success: false, results };
      }
    },
    [slots, notify]
  );

  return {
    slots,
    activeSlot,
    summary,
    notification,
    isSubmitting,
    batchResults,
    selectSlot,
    setSlotItem,
    removeSlotItem,
    loadPreset,
    resetOutfit,
    addEntireOutfitToCart,
  };
}
