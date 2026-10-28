import { useState, useEffect, useRef } from 'react';
import type { OrderStatus } from '../../types/order';

interface OwnerActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
  orderNumber: string;
  targetStatus?: OrderStatus;
  isConfirmReturn?: boolean;
}

export default function OwnerActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  targetStatus,
  isConfirmReturn = false,
}: OwnerActionConfirmModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        const textarea = containerRef.current?.querySelector('textarea');
        textarea?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        previouslyFocusedRef.current?.focus?.();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmitting) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const getActionDetails = () => {
    if (isConfirmReturn) {
      return {
        title: 'Xác nhận Nhận hàng hoàn về kho',
        badge: 'CONFIRM RETURN',
        badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        consequence:
          'Xác nhận bưu tá đã mang kiện hàng hoàn về kho an toàn. Hệ thống sẽ tự động khôi phục số lượng tồn kho nguyên tử cho từng sản phẩm và mở lại hạn mức sử dụng mã giảm giá (nếu có).',
        confirmButtonText: 'Xác nhận nhập kho & Hoàn tồn',
        confirmButtonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      };
    }

    switch (targetStatus) {
      case 'CONFIRMED':
        return {
          title: 'Xác nhận Đơn hàng',
          badge: 'CHUYỂN: CONFIRMED',
          badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
          consequence:
            'Đơn hàng sẽ chuyển sang trạng thái ĐÃ XÁC NHẬN. Bộ phận kho có thể tiến hành nhặt hàng và chuẩn bị đóng gói trang phục.',
          confirmButtonText: 'Xác nhận đơn',
          confirmButtonClass: 'bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E]',
        };
      case 'PROCESSING':
        return {
          title: 'Chuyển sang Đóng gói & Xử lý',
          badge: 'CHUYỂN: PROCESSING',
          badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
          consequence:
            'Đơn hàng đang được đóng gói trong hộp Atelier Signature và sẵn sàng bàn giao cho đơn vị vận chuyển.',
          confirmButtonText: 'Bắt đầu xử lý',
          confirmButtonClass: 'bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E]',
        };
      case 'SHIPPING':
        return {
          title: 'Bàn giao cho Đơn vị vận chuyển',
          badge: 'CHUYỂN: SHIPPING',
          badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
          consequence:
            'Kiện hàng đã rời khỏi kho Atelier và đang trên đường giao tới khách hàng qua đơn vị chuyển phát.',
          confirmButtonText: 'Bàn giao shipper',
          confirmButtonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
      case 'COMPLETED':
        return {
          title: 'Xác nhận Giao hàng thành công',
          badge: 'CHUYỂN: COMPLETED',
          badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
          consequence:
            'Khách hàng đã nhận trang phục và thanh toán tiền mặt. Hệ thống sẽ tự động cập nhật trạng thái thanh toán COD thành ĐÃ THANH TOÁN (PAID) và đóng đơn hàng (Terminal state).',
          confirmButtonText: 'Hoàn tất đơn hàng',
          confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
      case 'DELIVERY_FAILED':
        return {
          title: 'Ghi nhận Giao hàng thất bại',
          badge: 'CHUYỂN: DELIVERY_FAILED',
          badgeColor: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
          consequence:
            'Shipper không liên hệ được khách hàng hoặc khách từ chối nhận. LƯU Ý: Tồn kho CHƯA được hoàn trả lúc này vì hàng vật lý vẫn đang do bưu tá nắm giữ.',
          confirmButtonText: 'Ghi nhận giao thất bại',
          confirmButtonClass: 'bg-orange-600 hover:bg-orange-500 text-white',
        };
      case 'CANCELLED':
        return {
          title: 'Hủy đơn hàng',
          badge: 'CHUYỂN: CANCELLED',
          badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
          consequence:
            'Hủy đơn hàng trước khi gửi đi. Hệ thống sẽ ngay lập tức khôi phục tồn kho sản phẩm và mở lại mã coupon đã áp dụng.',
          confirmButtonText: 'Hủy đơn hàng',
          confirmButtonClass: 'bg-rose-600 hover:bg-rose-500 text-white',
        };
      default:
        return {
          title: 'Cập nhật trạng thái đơn hàng',
          badge: targetStatus || 'UPDATE',
          badgeColor: 'border-white/20 bg-white/5 text-white',
          consequence: 'Cập nhật trạng thái đơn hàng theo quy trình kiểm soát.',
          confirmButtonText: 'Cập nhật',
          confirmButtonClass: 'bg-[#C7AD83] text-[#0A0B0E]',
        };
    }
  };

  const action = getActionDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(note);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thực hiện thao tác');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#0F1015] border border-white/15 rounded-xs p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-2xs border ${action.badgeColor}`}>
                {action.badge}
              </span>
              <span className="text-xs font-mono text-white/50">{orderNumber}</span>
            </div>
            <h3 id="confirm-modal-title" className="font-editorial text-lg font-medium text-white">
              {action.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Consequence notice */}
        <div className="mb-4 p-3 bg-white/[0.03] border border-white/10 rounded-2xs text-xs text-white/75 leading-relaxed font-sans">
          <p>{action.consequence}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-white/60 mb-1.5 uppercase tracking-wider">
              Ghi chú nghiệp vụ / Lý do (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho nhật ký vòng đời đơn hàng..."
              rows={3}
              maxLength={255}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-2xs text-xs text-white placeholder-white/25 focus:border-[#C7AD83] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xs text-rose-300 text-xs font-sans">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:bg-white/5 rounded-2xs text-xs font-mono transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-2xs text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${action.confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              <span>{action.confirmButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
