interface StylingStudioTeaserProps {
  onOpenStylingStudio: () => void;
}

export default function StylingStudioTeaser({ onOpenStylingStudio }: StylingStudioTeaserProps) {
  return (
    <section aria-label="Virtual Styling Studio Teaser" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-3xl border border-[#D6B27C]/40 bg-gradient-to-br from-[#191A1D] via-[#111214] to-[#0A0B0E] p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl">
        {/* Subtle decorative gold light glow in background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D6B27C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#D6B27C] tracking-widest uppercase">
              <span className="bg-[#D6B27C] text-[#111214] px-2 py-0.5 font-bold rounded-md">
                ĐỘC QUYỀN
              </span>
              <span className="font-bold">VIRTUAL STYLING STUDIO 2.5D</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#F5F0E9] font-normal leading-tight">
              Tự Do Phối Ghép Outfit <br />
              <span className="text-[#D6B27C] italic">Trực Quan Trên Ma-nơ-canh</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#AAA5A0] leading-relaxed font-sans max-w-xl">
              Phòng thử đồ kỹ thuật số cho phép bạn tự do kết hợp các mẫu áo sơ mi, blazer, chân váy hoặc quần âu trực tiếp trên mô hình ma-nơ-canh 2.5D. Tự do cân chỉnh màu sắc và kích cỡ trước khi quyết định mua sắm.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenStylingStudio}
                className="px-8 py-3.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#111214] font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>✦ MỞ PHÒNG THỬ ĐỒ STUDIO</span>
              </button>

              <span className="text-xs font-mono text-[#AAA5A0]">
                Tiết kiệm 10% khi đặt trọn bộ outfit
              </span>
            </div>
          </div>

          {/* Right Visual Teaser: Interactive Lookbook Mannequin Preview (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[4/5] bg-[#212226] border border-[#333235] rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-xl group cursor-pointer"
                 onClick={onOpenStylingStudio}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#AAA5A0]">
                <span>MANNEQUIN 2.5D</span>
                <span className="text-[#D6B27C]">INTERACTIVE</span>
              </div>

              {/* Minimalist Mannequin Visual Illustration */}
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-[#D6B27C]/50 flex items-center justify-center text-[#D6B27C] text-2xl font-editorial">
                  I
                </div>
                <div className="text-center space-y-1">
                  <div className="font-editorial text-lg text-[#F5F0E9]">Outfit Studio Suite</div>
                  <div className="text-[11px] font-mono text-[#777574]">Ghép Áo + Quần + Phụ Kiện</div>
                </div>
              </div>

              <div className="p-3 bg-[#111214]/80 backdrop-blur-xs border border-white/5 rounded-xl text-center text-xs font-mono text-[#D6B27C] group-hover:bg-[#D6B27C] group-hover:text-[#111214] transition-colors font-bold">
                BẤM ĐỂ TRẢI NGHIỆM NGAY ↗
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

