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
        badgeColor: 'border-[#E4BB78]/30 bg-[#E4BB78]/10 text-[#E4BB78]',
        consequence:
          'Xác nhận bưu tá đã mang kiện hàng hoàn về kho an toàn. Hệ thống sẽ tự động khôi phục số lượng tồn kho nguyên tử cho từng sản phẩm và mở lại hạn mức sử dụng mã giảm giá (nếu có).',
        confirmButtonText: 'Xác nhận nhập kho & Hoàn tồn',
        confirmButtonClass: 'bg-[#E4BB78] hover:bg-[#ebd097] text-[#0E0F11]',
      };
    }

    switch (targetStatus) {
      case 'CONFIRMED':
        return {
          title: 'Xác nhận Đơn hàng',
          badge: 'CHUYỂN: CONFIRMED',
          badgeColor: 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]',
          consequence:
            'Đơn hàng sẽ chuyển sang trạng thái ĐÃ XÁC NHẬN. Bộ phận kho có thể tiến hành nhặt hàng và chuẩn bị đóng gói trang phục.',
          confirmButtonText: 'Xác nhận đơn',
          confirmButtonClass: 'bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11]',
        };
      case 'PROCESSING':
        return {
          title: 'Chuyển sang Đóng gói & Xử lý',
          badge: 'CHUYỂN: PROCESSING',
          badgeColor: 'border-[#D6B27C]/30 bg-[#D6B27C]/10 text-[#D6B27C]',
          consequence:
            'Đơn hàng đang được đóng gói trong hộp Atelier Signature và sẵn sàng bàn giao cho đơn vị vận chuyển.',
          confirmButtonText: 'Bắt đầu xử lý',
          confirmButtonClass: 'bg-[#D6B27C] hover:bg-[#E5C592] text-[#0E0F11]',
        };
      case 'SHIPPING':
        return {
          title: 'Bàn giao cho Đơn vị vận chuyển',
          badge: 'CHUYỂN: SHIPPING',
          badgeColor: 'border-sky-400/30 bg-sky-500/10 text-sky-300',
          consequence:
            'Kiện hàng đã rời khỏi kho Atelier và đang trên đường giao tới khách hàng qua đơn vị chuyển phát.',
          confirmButtonText: 'Bàn giao shipper',
          confirmButtonClass: 'bg-sky-600 hover:bg-sky-500 text-[#0E0F11]',
        };
      case 'COMPLETED':
        return {
          title: 'Xác nhận Giao hàng thành công',
          badge: 'CHUYỂN: COMPLETED',
          badgeColor: 'border-[#8BC9A8]/30 bg-[#8BC9A8]/10 text-[#8BC9A8]',
          consequence:
            'Khách hàng đã nhận trang phục và thanh toán tiền mặt. Hệ thống sẽ tự động cập nhật trạng thái thanh toán COD thành ĐÃ THANH TOÁN (PAID) và đóng đơn hàng (Terminal state).',
          confirmButtonText: 'Hoàn tất đơn hàng',
          confirmButtonClass: 'bg-[#8BC9A8] hover:bg-[#9fd5ba] text-[#0E0F11]',
        };
      case 'DELIVERY_FAILED':
        return {
          title: 'Ghi nhận Giao hàng thất bại',
          badge: 'CHUYỂN: DELIVERY_FAILED',
          badgeColor: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
          consequence:
            'Shipper không liên hệ được khách hàng hoặc khách từ chối nhận. LƯU Ý: Tồn kho CHƯA được hoàn trả lúc này vì hàng vật lý vẫn đang do bưu tá nắm giữ.',
          confirmButtonText: 'Ghi nhận giao thất bại',
          confirmButtonClass: 'bg-orange-500 hover:bg-orange-400 text-[#0E0F11]',
        };
      case 'CANCELLED':
        return {
          title: 'Hủy đơn hàng',
          badge: 'CHUYỂN: CANCELLED',
          badgeColor: 'border-[#DF8D84]/30 bg-[#DF8D84]/10 text-[#DF8D84]',
          consequence:
            'Hủy đơn hàng trước khi gửi đi. Hệ thống sẽ ngay lập tức khôi phục tồn kho sản phẩm và mở lại mã coupon đã áp dụng.',
          confirmButtonText: 'Hủy đơn hàng',
          confirmButtonClass: 'bg-[#DF8D84] hover:bg-[#eb9d95] text-[#0E0F11]',
        };
      default:
        return {
          title: 'Cập nhật trạng thái đơn hàng',
          badge: targetStatus || 'UPDATE',
          badgeColor: 'border-[#333235] bg-[#212226] text-[#AAA5A0]',
          consequence: 'Cập nhật trạng thái đơn hàng theo quy trình kiểm soát.',
          confirmButtonText: 'Cập nhật',
          confirmButtonClass: 'bg-[#D6B27C] text-[#0E0F11]',
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#191A1D] border border-[#333235] rounded-t-xl sm:rounded-xs p-5 sm:p-6 shadow-2xl text-[#F5F0E9]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${action.badgeColor}`}>
                {action.badge}
              </span>
              <span className="text-xs font-mono text-[#AAA5A0]">#{orderNumber}</span>
            </div>
            <h3 id="confirm-modal-title" className="font-serif text-lg font-medium text-[#F5F0E9]">
              {action.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 flex items-center justify-center text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#212226] rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Consequence notice */}
        <div className="mb-4 p-3 bg-[#212226] border border-[#333235] rounded-xs text-xs text-[#AAA5A0] leading-relaxed font-sans">
          <p>{action.consequence}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-[#AAA5A0] mb-1.5 uppercase tracking-wider">
              Ghi chú nghiệp vụ / Lý do (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho nhật ký vòng đời đơn hàng..."
              rows={3}
              maxLength={255}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-[#212226] border border-[#333235] rounded-xs text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:border-[#D6B27C] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-[#DF8D84]/10 border border-[#DF8D84]/30 rounded-xs text-[#DF8D84] text-xs font-sans">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#333235] bg-[#212226] text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#333235] rounded-xs text-xs font-mono transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xs text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${action.confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
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
