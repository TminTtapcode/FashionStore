import React, { useState, useEffect, useCallback } from 'react';
import type {
  InventorySummaryDto,
  InventoryMovementDto,
  InventoryReconciliationDto
} from '../../api/ownerInventoryApi';
import { getVariantLedgerApi, reconcileVariantApi } from '../../api/ownerInventoryApi';
import { OwnerStockReceiptModal } from './OwnerStockReceiptModal';
import { OwnerStockAdjustmentModal } from './OwnerStockAdjustmentModal';

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
  onStockUpdated,
}) => {
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [reconciliation, setReconciliation] = useState<InventoryReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Sub-modals for receipt/adjustment directly from ledger
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState<boolean>(false);

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

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isReceiptOpen && !isAdjustmentOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isReceiptOpen, isAdjustmentOpen, onClose]);

  if (!isOpen || !variant) return null;

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return { label: 'Số dư đầu kỳ', color: 'text-[#AAA5A0] bg-white/5 border-[#49423A]' };
      case 'INITIAL_STOCK':
        return { label: 'Khởi tạo SKU', color: 'text-[#D6B27C] bg-[#D6B27C]/10 border-[#5D4836]' };
      case 'STOCK_RECEIPT':
        return { label: 'Nhập kho bổ sung', color: 'text-[#8BC9A8] bg-[#8BC9A8]/10 border-[#8BC9A8]/30' };
      case 'ORDER_DEDUCT':
        return { label: 'Xuất đơn hàng', color: 'text-[#DF8D84] bg-[#DF8D84]/10 border-[#DF8D84]/30' };
      case 'CANCEL_RESTORE':
        return { label: 'Hoàn hủy đơn', color: 'text-[#8BC9A8] bg-[#8BC9A8]/10 border-[#8BC9A8]/30' };
      case 'RETURN_RESTORE':
        return { label: 'Hoàn trả bưu tá', color: 'text-[#E4BB78] bg-[#E4BB78]/10 border-[#E4BB78]/30' };
      case 'MANUAL_ADJUSTMENT':
        return { label: 'Điều chỉnh kiểm kê', color: 'text-[#E4BB78] bg-[#E4BB78]/10 border-[#E4BB78]/30' };
      default:
        return { label: type, color: 'text-[#AAA5A0] bg-white/5 border-[#333235]' };
    }
  };

  // Safe calculated delta after opening balance
  const postOpeningDelta = reconciliation
    ? (reconciliation.postOpeningDelta !== undefined
        ? reconciliation.postOpeningDelta
        : reconciliation.totalDelta - reconciliation.openingBalance)
    : 0;

  const isBalanced = reconciliation ? reconciliation.isBalanced : true;
  const currentATS = reconciliation ? reconciliation.currentStock : variant.currentStock;
  const openingBal = reconciliation ? reconciliation.openingBalance : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Sổ cái kiểm toán tồn kho"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1B1C1E] border-l border-[#333235] w-full max-w-2xl lg:max-w-3xl h-full shadow-2xl flex flex-col text-[#F5F0E9] animate-slide-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 sm:p-7 border-b border-[#333235] flex items-start justify-between gap-4 bg-[#141517]">
          <div>
            <div className="text-[10px] font-mono tracking-[2.5px] text-[#D6B27C] uppercase font-bold">
              INVENTORY AUDIT / SKU DETAIL
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#F5F0E9] mt-1">
              Sổ cái Kiểm toán
            </h2>
            <p className="text-xs text-[#AAA5A0] mt-1">
              Đối chiếu dữ liệu tồn kho theo từng sự kiện biến động bất biến.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[#333235] hover:border-[#D6B27C] text-[#AAA5A0] hover:text-[#D6B27C] flex items-center justify-center text-lg transition-colors cursor-pointer"
            aria-label="Đóng ngăn kéo"
          >
            ×
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Variant Context Card */}
          <div className="p-4 rounded-xl bg-[#212226] border border-[#333235] flex items-center gap-3.5">
            <div className="w-11 h-13 rounded-lg bg-gradient-to-br from-[#615444] to-[#2F2B29] border border-white/10 flex items-center justify-center text-[#DBC6A7] shrink-0 overflow-hidden">
              {variant.primaryImageUrl ? (
                <img src={variant.primaryImageUrl} alt={variant.productName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white text-sm truncate">{variant.productName}</div>
              <div className="flex items-center gap-2 text-xs text-[#AAA5A0] mt-0.5">
                <span>Kích cỡ: <strong className="text-white">{variant.size}</strong></span>
                <span>·</span>
                <span>Màu: <strong className="text-white">{variant.colorName}</strong></span>
              </div>
              <div className="font-mono text-[10px] text-[#D6B27C] tracking-tight mt-1 truncate">
                {variant.sku}
              </div>
            </div>
          </div>

          {/* Mathematical Reconciliation Box (3 Metric Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6B27C]" />
                <span>ĐỐI SOÁT SỐ DƯ TOÁN HỌC</span>
              </div>
              <span className="font-mono text-[11px] text-[#AAA5A0]">
                ATS = Opening + Δ sau mở sổ
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Card 1: ATS Hiện tại */}
              <div className="bg-[#212226] border border-[#333235] rounded-xl p-4 flex flex-col justify-between min-h-[96px]">
                <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                  ATS HIỆN TẠI
                </span>
                <div className="font-editorial text-2xl sm:text-3xl font-normal text-white tabular-nums my-1">
                  {currentATS}
                </div>
                <span className="text-[10px] text-[#777574]">Khả dụng mở bán</span>
              </div>

              {/* Card 2: Số dư đầu kỳ */}
              <div className="bg-[#212226] border border-[#333235] rounded-xl p-4 flex flex-col justify-between min-h-[96px]">
                <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                  SỐ DƯ ĐẦU KỲ
                </span>
                <div className="font-editorial text-2xl sm:text-3xl font-normal text-[#AAA5A0] tabular-nums my-1">
                  {openingBal}
                </div>
                <span className="text-[10px] text-[#777574]">Chốt cutover / khởi tạo</span>
              </div>

              {/* Card 3: Biến động sau mở sổ */}
              <div className="bg-[#212226] border border-[#333235] rounded-xl p-4 flex flex-col justify-between min-h-[96px]">
                <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                  BIẾN ĐỘNG SAU MỞ SỔ
                </span>
                <div className="font-editorial text-2xl sm:text-3xl font-normal text-[#D6B27C] tabular-nums my-1">
                  {postOpeningDelta > 0 ? `+${postOpeningDelta}` : postOpeningDelta}
                </div>
                <span className="text-[10px] text-[#777574]">∑ Nhập - Xuất - Chỉnh</span>
              </div>
            </div>

            {/* Reconciliation State Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                isBalanced
                  ? 'bg-[#234133]/30 border-[#50866A] text-[#8BC9A8]'
                  : 'bg-[#5A302E]/30 border-[#8A4441] text-[#DF8D84]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{isBalanced ? '✓' : '⚠'}</span>
                <span>
                  {isBalanced
                    ? 'Cân đối chính xác · Độ lệch 0 chiếc'
                    : `Cảnh báo lệch tồn kho: ${reconciliation?.discrepancy || 0} chiếc`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReconcile}
                disabled={isReconciling}
                className="text-[11px] underline hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isReconciling ? 'Đang tính...' : 'Đối soát lại ↻'}
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[#333235]" />

          {/* Transaction Audit Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAA5A0] flex items-center gap-2">
                <span>NHẬT KÝ GIAO DỊCH SỔ CÁI</span>
                <span className="text-[#777574] font-mono">({totalElements})</span>
              </h3>
              <button
                type="button"
                onClick={() => fetchLedger(page)}
                className="text-[11px] text-[#D6B27C] hover:underline transition-colors"
              >
                ↻ Làm mới nhật ký
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-[#5A302E]/30 border border-[#8A4441] rounded-xl text-[#DF8D84] text-xs">
                {errorMessage}
              </div>
            )}

            {/* Movements List */}
            {isLoading && (
              <div className="py-10 text-center text-xs text-[#AAA5A0]">
                <div className="w-6 h-6 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="font-mono">Đang tải nhật ký kiểm toán...</span>
              </div>
            )}

            {!isLoading && movements.length === 0 && (
              <div className="py-8 text-center text-xs text-[#777574]">
                Chưa có bản ghi giao dịch nào cho biến thể này.
              </div>
            )}

            {!isLoading && movements.length > 0 && (
              <div className="space-y-2">
                {movements.map((m) => {
                  const badge = getMovementLabel(m.movementType);
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-[#212226] border border-[#333235] hover:border-[#49423A] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-[10px] text-[#777574]">
                            {new Date(m.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#AAA5A0] truncate max-w-md">
                          {m.referenceId && (
                            <span className="font-mono text-white mr-1.5">[{m.referenceId}]</span>
                          )}
                          <span>{m.reason || 'Không có ghi chú'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono text-right">
                        <div
                          className={`text-sm font-bold ${
                            m.quantityDelta > 0
                              ? 'text-[#8BC9A8]'
                              : m.quantityDelta < 0
                              ? 'text-[#DF8D84]'
                              : 'text-white'
                          }`}
                        >
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </div>
                        <div className="text-[11px] text-[#777574]">
                          {m.stockBefore} → <strong className="text-white">{m.stockAfter}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-[#AAA5A0]">
                <span>Trang {page + 1} / {totalPages}</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <button
                    type="button"
                    disabled={page <= 0 || isLoading}
                    onClick={() => {
                      const prev = page - 1;
                      setPage(prev);
                      fetchLedger(prev);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#3A3734] bg-[#262527] text-[#AAA5A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1 || isLoading}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      fetchLedger(next);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#3A3734] bg-[#262527] text-[#AAA5A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#333235] bg-[#141517] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdjustmentOpen(true)}
            className="px-4 py-2.5 border border-[#49423A] hover:border-[#D6B27C] text-[#F5F0E9] hover:text-[#D6B27C] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Điều chỉnh kiểm kê
          </button>
          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="px-5 py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            + Nhập kho bổ sung
          </button>
        </div>
      </div>

      {/* Sub-modals triggered directly from Drawer */}
      <OwnerStockReceiptModal
        variant={variant}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onSuccess={() => {
          fetchLedger(0);
          handleReconcile();
          if (onStockUpdated) onStockUpdated();
        }}
      />

      <OwnerStockAdjustmentModal
        variant={variant}
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={() => {
          fetchLedger(0);
          handleReconcile();
          if (onStockUpdated) onStockUpdated();
        }}
      />
    </div>
  );
};
