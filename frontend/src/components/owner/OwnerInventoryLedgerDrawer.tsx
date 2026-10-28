import React, { useState, useEffect, useCallback } from 'react';
import type {
  InventorySummaryDto,
  InventoryMovementDto,
  InventoryReconciliationDto
} from '../../api/ownerInventoryApi';
import { getVariantLedgerApi, reconcileVariantApi } from '../../api/ownerInventoryApi';

interface OwnerInventoryLedgerDrawerProps {
  variant: InventorySummaryDto | null;
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export const OwnerInventoryLedgerDrawer: React.FC<OwnerInventoryLedgerDrawerProps> = ({
  variant,
  isOpen,
  onClose,
}) => {
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [reconciliation, setReconciliation] = useState<InventoryReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  const fetchLedger = useCallback(async (pageNum: number) => {
    if (!variant) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await getVariantLedgerApi(variant.variantId, pageNum, 10);
      setMovements(data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải sổ cái biến động kho';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [variant]);

  const handleReconcile = useCallback(async () => {
    if (!variant) return;
    try {
      setIsReconciling(true);
      const recon = await reconcileVariantApi(variant.variantId);
      setReconciliation(recon);
    } catch (err: unknown) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsReconciling(false);
    }
  }, [variant]);

  useEffect(() => {
    if (isOpen && variant) {
      setPage(0);
      fetchLedger(0);
      handleReconcile();
    }
  }, [isOpen, variant, fetchLedger, handleReconcile]);

  if (!isOpen || !variant) return null;

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">⚪ Số dư ban đầu</span>;
      case 'INITIAL_STOCK':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">✨ Khởi tạo SKU</span>;
      case 'STOCK_RECEIPT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">📥 Nhập kho</span>;
      case 'ORDER_DEDUCT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">📦 Xuất đơn hàng</span>;
      case 'CANCEL_RESTORE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">↩️ Hoàn hủy đơn</span>;
      case 'RETURN_RESTORE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">🚚 Hoàn trả bưu tá</span>;
      case 'MANUAL_ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">⚖️ Điều chỉnh kiểm kê</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-gray-200 animate-slide-left">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-lg font-bold">Sổ cái Kiểm toán Tồn kho (Audit Ledger)</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Nhật ký biến động bất biến & đối soát tính toàn vẹn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Variant Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-gray-200 text-gray-800 font-mono text-xs font-bold">
              {variant.sku}
            </span>
            <span className="text-xs font-semibold text-gray-900 line-clamp-1 max-w-md">
              {variant.productName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Size: <strong className="text-gray-900">{variant.size}</strong></span>
            <span>•</span>
            <span>Màu: <strong className="text-gray-900">{variant.colorName}</strong></span>
          </div>
        </div>

        {/* Reconciliation Metric Card */}
        <div className="p-6 border-b border-gray-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Đối soát số dư toán học</span>
              <span className="text-[11px] text-gray-400 font-mono">Current == Opening + ∑Deltas</span>
            </div>
            <button
              type="button"
              onClick={handleReconcile}
              disabled={isReconciling}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span className={`text-sm ${isReconciling ? 'animate-spin' : ''}`}>🔄</span>
              <span>{isReconciling ? 'Đang tính...' : 'Đối soát lại'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-[11px] text-gray-500 font-medium">Tồn khả dụng (ATS)</div>
              <div className="text-lg font-extrabold text-gray-900 font-mono mt-0.5">
                {reconciliation ? reconciliation.currentStock : variant.currentStock}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-[11px] text-gray-500 font-medium">Số dư đầu kỳ</div>
              <div className="text-lg font-extrabold text-gray-900 font-mono mt-0.5">
                {reconciliation ? reconciliation.openingBalance : '—'}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-[11px] text-gray-500 font-medium">Tổng biến động (∑Δ)</div>
              <div className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5">
                {reconciliation ? reconciliation.totalDelta : '—'}
              </div>
            </div>
            <div className={`rounded-xl p-3 border shadow-sm ${
              reconciliation?.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="text-[11px] font-medium">Trạng thái đối soát</div>
              <div className="text-xs font-bold mt-1 flex items-center gap-1.5">
                {reconciliation?.isBalanced ? (
                  <>
                    <span className="text-emerald-600">✓</span>
                    <span>Cân đối (Lệch 0)</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">⚠️</span>
                    <span>Lệch {reconciliation?.discrepancy ?? '?'} chiếc</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Nhật ký giao dịch ({totalElements} bản ghi)
            </h3>
          </div>

          {errorMessage && (
            <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Đang truy vấn sổ cái...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-xs">
              Chưa có bản ghi biến động nào cho biến thể này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5 font-bold">Thời gian</th>
                    <th className="py-3 px-3.5 font-bold">Loại biến động</th>
                    <th className="py-3 px-3.5 font-bold text-center">Biến động</th>
                    <th className="py-3 px-3.5 font-bold text-center">Trước → Sau</th>
                    <th className="py-3 px-3.5 font-bold">Chứng từ / Đơn</th>
                    <th className="py-3 px-3.5 font-bold">Người thực hiện</th>
                    <th className="py-3 px-3.5 font-bold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-gray-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getMovementBadge(m.movementType)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-center font-mono font-bold">
                        <span className={m.quantityDelta > 0 ? 'text-emerald-600' : m.quantityDelta < 0 ? 'text-rose-600' : 'text-gray-500'}>
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-center font-mono text-[11px] text-gray-600">
                        <span>{m.stockBefore}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="font-bold text-gray-900">{m.stockAfter}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-gray-700 text-[11px]">
                        {m.referenceId ? `#${m.referenceId}` : '—'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-gray-600 text-[11px]">
                        {m.actorName || 'Hệ thống'}
                      </td>
                      <td className="py-3 px-3.5 text-gray-600 max-w-xs truncate text-[11px]" title={m.reason || ''}>
                        {m.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0 || isLoading}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  fetchLedger(newPage);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchLedger(newPage);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
