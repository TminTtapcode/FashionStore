import { useState, useEffect, useRef } from 'react';
import type { ProductStatus } from '../../api/ownerProductApi';

interface OwnerProductStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  currentStatus: ProductStatus;
  onConfirm: (targetStatus: ProductStatus, note: string) => Promise<void>;
}

const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['HIDDEN', 'ARCHIVED'],
  HIDDEN: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Bản nháp (DRAFT)',
  ACTIVE: 'Hoạt động (ACTIVE)',
  HIDDEN: 'Tạm ẩn (HIDDEN)',
  ARCHIVED: 'Lưu trữ vĩnh viễn (ARCHIVED)',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  ACTIVE: 'Xuất bản sản phẩm lên Storefront. Khách hàng có thể tìm kiếm, xem trang phục và thêm vào giỏ hàng. Yêu cầu sản phẩm phải có ít nhất 1 biến thể đang hoạt động.',
  HIDDEN: 'Tạm ẩn sản phẩm khỏi Storefront. Sản phẩm sẽ không xuất hiện trong catalog. Khách có sản phẩm trong giỏ hàng sẽ nhận thông báo tạm ngừng kinh doanh và không thể thanh toán.',
  ARCHIVED: 'LƯU TRỮ VĨNH VIỄN. Sản phẩm sẽ bị đóng băng ngừng kinh doanh và KHÔNG THỂ kích hoạt lại. Chỉ dùng khi sản phẩm đã kết thúc hoàn toàn vòng đời!',
};

export default function OwnerProductStatusModal({
  isOpen,
  onClose,
  productId: _productId,
  productName,
  currentStatus,
  onConfirm,
}: OwnerProductStatusModalProps) {
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>(allowedTargets[0] || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setSelectedStatus(allowedTargets[0] || '');
      setNote('');
      setError(null);

      const timer = setTimeout(() => {
        containerRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        previouslyFocusedRef.current?.focus?.();
      };
    }
  }, [isOpen, currentStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Vui lòng chọn trạng thái mới');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(selectedStatus, note);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs focus:outline-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-status-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#191A1D] border border-[#333235] rounded-t-xl sm:rounded-xs shadow-2xl p-5 sm:p-6 text-[#F5F0E9]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#D6B27C] uppercase font-bold block mb-1">
              CATALOG / LIFECYCLE
            </span>
            <h3 id="product-status-modal-title" className="text-base font-serif font-medium text-[#F5F0E9]">
              Chuyển trạng thái sản phẩm
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#212226] rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#AAA5A0] mb-4 line-clamp-1">{productName}</p>

        {error && (
          <div className="mb-4 p-2.5 bg-[#DF8D84]/10 border border-[#DF8D84]/30 text-[#DF8D84] text-xs rounded-xs">
            {error}
          </div>
        )}

        {allowedTargets.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#AAA5A0]">
            Sản phẩm đã ở trạng thái kết thúc ({STATUS_LABELS[currentStatus]}), không thể chuyển đổi tiếp.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1.5">
                Trạng thái hiện tại
              </label>
              <div className="text-xs font-mono px-3 py-2 bg-[#212226] border border-[#333235] rounded-xs text-[#D6B27C]">
                {STATUS_LABELS[currentStatus]}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1.5">
                Chọn trạng thái mới <span className="text-[#DF8D84]">*</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                className="w-full bg-[#212226] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] focus:outline-hidden focus:border-[#D6B27C]"
              >
                {allowedTargets.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            {selectedStatus && STATUS_DESCRIPTIONS[selectedStatus] && (
              <div className={`p-3 rounded-xs text-xs border ${
                selectedStatus === 'ARCHIVED'
                  ? 'bg-[#DF8D84]/10 border-[#DF8D84]/30 text-[#DF8D84]'
                  : 'bg-[#D6B27C]/10 border-[#D6B27C]/30 text-[#F5F0E9]/90'
              }`}>
                <p className="font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  {selectedStatus === 'ARCHIVED' ? '⚠ Cảnh báo hệ quả nghiêm trọng' : 'ℹ Hệ quả vận hành'}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {STATUS_DESCRIPTIONS[selectedStatus]}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1.5">
                Ghi chú lý do thay đổi (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do xuất bản, tạm ẩn hoặc lưu trữ..."
                rows={2}
                className="w-full bg-[#212226] border border-[#333235] rounded-xs p-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#333235]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs text-[#AAA5A0] hover:text-[#F5F0E9] border border-[#333235] bg-[#212226] rounded-xs cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedStatus}
                className="px-4 py-1.5 text-xs font-mono font-bold bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] disabled:opacity-50 rounded-xs cursor-pointer"
              >
                {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'XÁC NHẬN'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
