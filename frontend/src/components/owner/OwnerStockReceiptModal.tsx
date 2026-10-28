import React, { useState } from 'react';
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
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-200">
              📥
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nhập kho bổ sung (Stock Receipt)</h3>
              <p className="text-xs text-gray-500 font-medium">Ghi tăng tồn kho và đối soát chứng từ nhập</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Variant Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Biến thể đích</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-200 text-gray-800">
                {variant.sku}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 line-clamp-1">{variant.productName}</div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Size: <strong className="text-gray-900">{variant.size}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                Màu: <strong className="text-gray-900">{variant.colorName}</strong>
                {variant.colorHex && (
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: variant.colorHex }} />
                )}
              </span>
              <span>•</span>
              <span>Tồn hiện tại: <strong className="text-gray-900">{variant.currentStock}</strong> chiếc</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="receipt-qty" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Số lượng nhập thêm <span className="text-red-500">*</span>
              </label>
              <input
                id="receipt-qty"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-gray-900"
                placeholder="Ví dụ: 20"
              />
            </div>

            {/* Projected Stock Preview */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-medium">Dự kiến tồn sau nhập:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 line-through">{variant.currentStock}</span>
                <span className="text-gray-400">→</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  {projectedStock} chiếc
                </span>
                <span className="text-emerald-600 font-semibold">(+{quantity > 0 ? quantity : 0})</span>
              </div>
            </div>

            <div>
              <label htmlFor="receipt-ref" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Mã chứng từ / Phiếu nhập kho (Reference)
              </label>
              <input
                id="receipt-ref"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 font-mono"
                placeholder="Ví dụ: PNK-2026-X01 hoặc PO-8921"
              />
            </div>

            <div>
              <label htmlFor="receipt-reason" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Lý do / Ghi chú nhập hàng
              </label>
              <textarea
                id="receipt-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 resize-none"
                placeholder="Ví dụ: Nhập bổ sung đợt may số 2 từ xưởng Hà Nội"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantity <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang ghi sổ...</span>
                </>
              ) : (
                <span>Xác nhận nhập kho</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
