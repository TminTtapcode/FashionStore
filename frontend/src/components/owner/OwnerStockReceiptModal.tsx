import React, { useState, useEffect } from 'react';
import type { InventorySummaryDto, StockReceiptRequest } from '../../api/ownerInventoryApi';
import { recordStockReceiptApi } from '../../api/ownerInventoryApi';

interface OwnerStockReceiptModalProps {
  variant: InventorySummaryDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerStockReceiptModal: React.FC<OwnerStockReceiptModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(15);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(15);
      setReferenceNumber('');
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !variant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setErrorMessage('Số lượng nhập kho phải lớn hơn 0');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload: StockReceiptRequest = {
        variantId: variant.variantId,
        quantity: Math.floor(quantity),
        referenceNumber: referenceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
      };

      await recordStockReceiptApi(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể ghi nhận phiếu nhập kho';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectedStock = variant.currentStock + (quantity > 0 ? Math.floor(quantity) : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stockReceiptTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1D1F] border border-[#5B5043] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] text-[#F5F0E9] animate-rise">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#333235] bg-gradient-to-r from-[#292825] to-[#1C1D1F] flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-[2px] text-[#D6B27C] uppercase font-bold">
              INVENTORY / RECEIPT
            </div>
            <h3 id="stockReceiptTitle" className="font-editorial text-2xl font-normal text-white mt-1">
              Nhập kho bổ sung
            </h3>
            <p className="text-xs text-[#AAA5A0] mt-0.5">
              Ghi nhận chứng từ và biến động ATS cho một biến thể SKU
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-[#333235] hover:border-[#D6B27C] text-[#AAA5A0] hover:text-[#D6B27C] flex items-center justify-center text-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Variant Info Summary */}
          <div className="bg-[#111214] border border-[#333235] rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#AAA5A0]">
              <span>Sản phẩm:</span>
              <strong className="text-white truncate max-w-[260px]">{variant.productName}</strong>
            </div>
            <div className="flex items-center justify-between text-[#AAA5A0]">
              <span>Biến thể:</span>
              <strong className="text-white">{variant.size} · {variant.colorName}</strong>
            </div>
            <div className="flex items-center justify-between text-[#AAA5A0]">
              <span>Mã SKU:</span>
              <strong className="font-mono text-[#D6B27C] text-[11px]">{variant.sku}</strong>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label htmlFor="receiptQuantity" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Số lượng nhập (chiếc) <span className="text-[#D6B27C]">*</span>
            </label>
            <input
              id="receiptQuantity"
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full h-11 px-4 bg-[#111214] border border-[#3A393A] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#D6B27C] transition-colors"
            />
          </div>

          {/* Live Projection Card */}
          <div className="p-4 rounded-xl border border-[#665640] bg-[#D6B27C]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase block">
                DỰ PHÓNG TỒN KHO SAU NHẬP
              </span>
              <span className="text-xs text-[#AAA5A0] mt-0.5 block">Tồn hiện tại → Tồn dự kiến</span>
            </div>
            <div className="font-editorial text-xl font-normal text-[#D6B27C] tabular-nums">
              {variant.currentStock} → {projectedStock}
            </div>
          </div>

          {/* Reference Document */}
          <div className="space-y-1.5">
            <label htmlFor="receiptReference" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Mã phiếu nhập / Chứng từ
            </label>
            <input
              id="receiptReference"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="VD: PNK-2026-X01 hoặc Hóa đơn xưởng may..."
              className="w-full h-11 px-4 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-white placeholder-[#777574] focus:outline-none focus:border-[#D6B27C] transition-colors"
            />
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <label htmlFor="receiptReason" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Lý do / Ghi chú nghiệp vụ
            </label>
            <textarea
              id="receiptReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ghi rõ nguồn gốc lô hàng hoặc mục đích nhập kho..."
              className="w-full p-3.5 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-white placeholder-[#777574] focus:outline-none focus:border-[#D6B27C] transition-colors resize-none"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-[#5A302E]/30 border border-[#8A4441] rounded-xl text-[#DF8D84] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#333235] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-[#49423A] hover:border-[#D6B27C] text-[#AAA5A0] hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
