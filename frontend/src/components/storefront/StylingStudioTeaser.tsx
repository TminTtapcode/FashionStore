interface StylingStudioTeaserProps {
  onOpenStylingStudio: () => void;
}

export default function StylingStudioTeaser({ onOpenStylingStudio }: StylingStudioTeaserProps) {
  return (
    <section aria-label="Editorial Styling Studio Teaser" className="relative z-10 bg-[#0A0B0E] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#333235]">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#D6B27C]/40 bg-gradient-to-br from-[#191A1D] via-[#111214] to-[#0A0B0E] p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl">
          {/* Subtle decorative gold light glow in background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D6B27C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Text Narrative (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#D6B27C] tracking-widest uppercase">
                <span className="bg-[#D6B27C] text-[#111214] px-2 py-0.5 font-bold rounded-md">
                  ATELIER SIGNATURE
                </span>
                <span className="font-bold">EDITORIAL STYLING STUDIO</span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#F5F0E9] font-normal leading-tight">
                Tự Do Sáng Tạo & Phối Đồ <br />
                <span className="text-[#D6B27C] italic">Trực Quan Trên Lookbook Board</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#AAA5A0] leading-relaxed font-sans max-w-xl">
                Studio phối đồ kỹ thuật số cho phép quý khách kết hợp linh hoạt các mẫu đầm liền, áo sơ mi, blazer và quần jeans may đo từ các bộ sưu tập IVRE Atelier. Trực quan hóa bảng phối, tùy chọn biến thể màu sắc, kích cỡ và đưa cả bộ vào giỏ hàng chỉ trong một thao tác.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onOpenStylingStudio}
                  className="px-8 py-3.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#111214] font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <span>✦ MỞ EDITORIAL STYLING STUDIO</span>
                </button>

                <span className="text-xs font-mono text-[#AAA5A0]">
                  Gợi ý phối đồ cá nhân hóa từ Atelier
                </span>
              </div>
            </div>

            {/* Right Visual Teaser: Interactive Lookbook Board Preview (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className="relative w-full max-w-sm aspect-[4/5] bg-[#16171D] border border-white/10 hover:border-[#D6B27C]/50 rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-xl group cursor-pointer transition-all"
                onClick={onOpenStylingStudio}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#AAA5A0]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6B27C] animate-pulse" />
                    LOOKBOOK CANVAS
                  </span>
                  <span className="text-[#D6B27C]">INTERACTIVE</span>
                </div>

                {/* Minimalist Lookbook Silhouette Visual */}
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full border-2 border-[#D6B27C]/50 flex items-center justify-center text-[#D6B27C] text-2xl font-editorial shadow-[0_0_20px_rgba(214,178,124,0.2)]">
                    ✦
                  </div>
                  <div className="text-center space-y-1">
                    <div className="font-editorial text-lg text-[#F5F0E9]">The Urbanist Couture</div>
                    <div className="text-[11px] font-mono text-[#A6A49F]">Blazer Linen + Oxford + Vintage Denim</div>
                  </div>
                </div>

                <div className="p-3 bg-[#111214]/80 backdrop-blur-xs border border-white/5 rounded-xl text-center text-xs font-mono text-[#D6B27C] group-hover:bg-[#D6B27C] group-hover:text-[#111214] transition-colors font-bold">
                  BẤM ĐỂ TRẢI NGHIỆM NGAY ↗
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
