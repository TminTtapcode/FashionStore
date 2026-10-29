import React, { useState, useEffect } from 'react';
import type { InventorySummaryDto, ManualAdjustmentRequest } from '../../api/ownerInventoryApi';
import { recordManualAdjustmentApi } from '../../api/ownerInventoryApi';

interface OwnerStockAdjustmentModalProps {
  variant: InventorySummaryDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerStockAdjustmentModal: React.FC<OwnerStockAdjustmentModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [direction, setDirection] = useState<'DECREASE' | 'INCREASE'>('DECREASE');
  const [amount, setAmount] = useState<number>(2);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDirection('DECREASE');
      setAmount(2);
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

  const rawDelta = direction === 'DECREASE' ? -Math.abs(amount) : Math.abs(amount);
  const projectedStock = variant.currentStock + rawDelta;
  const isNegativeStock = projectedStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('Số lượng điều chỉnh phải lớn hơn 0');
      return;
    }
    if (isNegativeStock) {
      setErrorMessage(`Tồn kho sau điều chỉnh không được nhỏ hơn 0 (Hiện tại: ${variant.currentStock})`);
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMessage('Lý do điều chỉnh kiểm kê phải có ít nhất 5 ký tự để phục vụ kiểm toán');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const finalReason = referenceNumber.trim()
        ? `[${referenceNumber.trim()}] ${reason.trim()}`
        : reason.trim();

      const payload: ManualAdjustmentRequest = {
        variantId: variant.variantId,
        quantityDelta: rawDelta,
        reason: finalReason,
      };

      await recordManualAdjustmentApi(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể ghi nhận phiếu điều chỉnh kiểm kê';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stockAdjustmentTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1D1F] border border-[#5B5043] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] text-[#F5F0E9] animate-rise">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#333235] bg-gradient-to-r from-[#292825] to-[#1C1D1F] flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-[2px] text-[#E4BB78] uppercase font-bold">
              INVENTORY / ADJUSTMENT
            </div>
            <h3 id="stockAdjustmentTitle" className="font-editorial text-2xl font-normal text-white mt-1">
              Điều chỉnh kiểm kê
            </h3>
            <p className="text-xs text-[#AAA5A0] mt-0.5">
              Bù trừ số dư thực tế & ghi nhận biên bản vào sổ cái kiểm toán
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

        {/* Audit Notice */}
        <div className="px-6 py-2.5 bg-[#E4BB78]/10 border-b border-[#E4BB78]/20 text-[#E4BB78] text-[11px] flex items-center gap-2">
          <span>🛡️</span>
          <span>Thao tác kiểm toán này được lưu vết bất biến kèm mã định danh của bạn.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Variant Context */}
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

          {/* Direction Selector: Decrease vs Increase */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Loại điều chỉnh kiểm kê <span className="text-[#D6B27C]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('DECREASE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  direction === 'DECREASE'
                    ? 'bg-[#DF8D84]/20 border-[#DF8D84] text-[#DF8D84] shadow-xs'
                    : 'bg-[#111214] border-[#3A393A] text-[#AAA5A0] hover:text-white'
                }`}
              >
                <span>- GIẢM TỒN KHO</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('INCREASE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  direction === 'INCREASE'
                    ? 'bg-[#8BC9A8]/20 border-[#8BC9A8] text-[#8BC9A8] shadow-xs'
                    : 'bg-[#111214] border-[#3A393A] text-[#AAA5A0] hover:text-white'
                }`}
              >
                <span>+ TĂNG TỒN KHO</span>
              </button>
            </div>
          </div>

          {/* Quantity Amount */}
          <div className="space-y-1.5">
            <label htmlFor="adjustAmount" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Số lượng điều chỉnh (chiếc) <span className="text-[#D6B27C]">*</span>
            </label>
            <input
              id="adjustAmount"
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-11 px-4 bg-[#111214] border border-[#3A393A] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#D6B27C] transition-colors"
            />
          </div>

          {/* Live Projection Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isNegativeStock
              ? 'border-[#8A4441] bg-[#5A302E]/20 text-[#DF8D84]'
              : 'border-[#665640] bg-[#D6B27C]/10 text-[#F5F0E9]'
          }`}>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase block opacity-80">
                DỰ PHÓNG TỒN KHO SAU ĐIỀU CHỈNH
              </span>
              <span className="text-xs mt-0.5 block opacity-80">
                {isNegativeStock ? 'Cảnh báo: Thao tác gây âm kho!' : 'Tồn hiện tại → Tồn dự kiến'}
              </span>
            </div>
            <div className={`font-editorial text-xl font-normal tabular-nums ${isNegativeStock ? 'text-[#DF8D84]' : 'text-[#D6B27C]'}`}>
              {variant.currentStock} → {projectedStock}
            </div>
          </div>

          {/* Reference / Protocol Code */}
          <div className="space-y-1.5">
            <label htmlFor="adjustReference" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Mã biên bản kiểm kê (nếu có)
            </label>
            <input
              id="adjustReference"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="VD: BBKK-2026-10-29 hoặc BIEN-BAN-01..."
              className="w-full h-11 px-4 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-white placeholder-[#777574] focus:outline-none focus:border-[#D6B27C] transition-colors"
            />
          </div>

          {/* Reason (Required, min 5 chars) */}
          <div className="space-y-1.5">
            <label htmlFor="adjustReason" className="block text-xs font-semibold text-[#AAA5A0] uppercase tracking-wider">
              Lý do kiểm toán chi tiết <span className="text-[#D6B27C]">*</span>
            </label>
            <textarea
              id="adjustReason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Hao hụt vải may mẫu chụp studio, phát hiện rách chỉ khóa kéo..."
              className="w-full p-3.5 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-white placeholder-[#777574] focus:outline-none focus:border-[#D6B27C] transition-colors resize-none"
            />
            <div className="text-[10px] text-[#777574] flex justify-between">
              <span>Bắt buộc tối thiểu 5 ký tự</span>
              <span>{reason.trim().length} ký tự</span>
            </div>
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
              disabled={isSubmitting || isNegativeStock}
              className="px-6 py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu điều chỉnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
