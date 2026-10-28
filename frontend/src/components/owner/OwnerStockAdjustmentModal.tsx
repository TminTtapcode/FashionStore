import React, { useState } from 'react';
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
  const [delta, setDelta] = useState<number>(-1);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !variant) return null;

  const projectedStock = variant.currentStock + delta;
  const isNegativeStock = projectedStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      setErrorMessage('Độ lệch kiểm kê phải khác 0 (dương để tăng, âm để giảm)');
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

      const payload: ManualAdjustmentRequest = {
        variantId: variant.variantId,
        quantityDelta: Math.floor(delta),
        reason: reason.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50 to-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl shadow-md shadow-amber-200">
              ⚖️
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Điều chỉnh kiểm kê (Stock Adjustment)</h3>
              <p className="text-xs text-gray-500 font-medium">Bù trừ số dư thực tế & ghi nhận lý do vào sổ cái</p>
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

        {/* Audit Warning */}
        <div className="px-6 py-2.5 bg-amber-100/60 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <span>🛡️</span>
          <span>Thao tác kiểm toán này sẽ được lưu bất biến, gắn kèm danh tính tài khoản của bạn.</span>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Variant Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Biến thể kiểm kê</span>
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
              <span>Tồn kho sổ sách: <strong className="text-gray-900 font-mono">{variant.currentStock}</strong> chiếc</span>
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="adjust-delta" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Độ lệch số lượng (Delta) <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500 font-medium">Nhập số âm để giảm, số dương để tăng</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="adjust-delta"
                  type="number"
                  step="1"
                  required
                  value={delta}
                  onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 text-sm font-mono font-bold ${
                    isNegativeStock
                      ? 'border-red-400 focus:ring-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 focus:ring-amber-500 text-gray-900'
                  }`}
                  placeholder="Ví dụ: -2 hoặc +5"
                />
              </div>
            </div>

            {/* Projected Stock Preview */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isNegativeStock
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <span className="font-medium">Dự kiến tồn kho sau điều chỉnh:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 line-through font-mono">{variant.currentStock}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-base font-extrabold font-mono ${
                  isNegativeStock ? 'text-red-600' : 'text-amber-800'
                }`}>
                  {projectedStock} chiếc
                </span>
                <span className={`font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  ({delta > 0 ? `+${delta}` : delta})
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="adjust-reason" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Lý do điều chỉnh kiểm kê <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adjust-reason"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 resize-none"
                placeholder="Ví dụ: Kiểm kê cuối tháng 10 phát hiện 1 áo bị lỗi xước chỉ, chuyển thanh lý phế phẩm"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-gray-400">Tối thiểu 5 ký tự</span>
                <span className={`text-[11px] ${reason.trim().length >= 5 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {reason.trim().length} ký tự
                </span>
              </div>
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
              disabled={isSubmitting || delta === 0 || isNegativeStock || reason.trim().length < 5}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang ghi sổ...</span>
                </>
              ) : (
                <span>Xác nhận điều chỉnh</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
