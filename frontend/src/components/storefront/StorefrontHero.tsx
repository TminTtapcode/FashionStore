interface StorefrontHeroProps {
  isRunwayActive: boolean;
  onToggleRunway: () => void;
  onOpenStylingStudio: () => void;
}

export default function StorefrontHero({
  isRunwayActive,
  onToggleRunway,
  onOpenStylingStudio,
}: StorefrontHeroProps) {
  return (
    <section aria-label="Campaign Hero" className="relative border-b border-[#333235] bg-transparent overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[660px]">
        {/* Left Column: Grand Editorial Typography (7 cols on desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-between space-y-8 bg-[#0E0F11]/40 backdrop-blur-[2px]">
          {/* Campaign Breadcrumb & Shader Space Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] text-[#D6B27C] tracking-[0.25em] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#D6B27C] animate-pulse" />
              <span>CAMPAIGN 01 · DIGITAL RUNWAY DROP 2026</span>
            </div>

            <button
              type="button"
              onClick={onToggleRunway}
              title="Bật / tắt không gian Shader sống động"
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider border rounded-full transition-all cursor-pointer ${
                isRunwayActive
                  ? 'border-[#D6B27C] bg-[#D6B27C]/20 text-[#D6B27C]'
                  : 'border-white/20 bg-white/5 text-[#AAA5A0] hover:text-white'
              }`}
            >
              <span className={isRunwayActive ? 'text-[#D6B27C]' : 'text-[#777574]'}>✦</span>
              <span>{isRunwayActive ? 'SHADER: BẬT' : 'SHADER: TẮT'}</span>
            </button>
          </div>

          {/* Grand Editorial Headline */}
          <div className="space-y-6">
            <div className="text-xs font-mono tracking-[0.3em] uppercase text-[#AAA5A0] font-semibold">
              HAUTE COUTURE × CONTEMPORARY MINIMALISM
            </div>

            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1.02] text-[#F5F0E9]">
              The Urbanist <br />
              <span className="text-[#D6B27C] italic font-normal">Couture</span>
            </h1>

            <p className="text-xs sm:text-sm font-serif text-[#AAA5A0] italic max-w-xl leading-relaxed">
              "Khởi sinh từ giao lộ giữa nghệ thuật may đo thủ công tinh tế và hơi thở đương đại của kỷ nguyên số. Mỗi thiết kế là một tuyên ngôn kiêu hãnh về vẻ đẹp tự tin, tối giản và vĩnh cửu."
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <a
                href="#catalog-section"
                className="inline-block border border-[#D6B27C] bg-[#D6B27C] hover:bg-[#E4C18E] text-[#111214] px-7 py-3.5 text-xs font-mono uppercase tracking-[0.2em] font-bold transition-all cursor-pointer shadow-lg rounded-xl"
              >
                KHÁM PHÁ BỘ SƯU TẬP
              </a>

              <button
                type="button"
                onClick={onOpenStylingStudio}
                className="inline-flex items-center gap-2 border border-[#333235] hover:border-[#D6B27C] text-[#F5F0E9] bg-white/5 hover:bg-[#D6B27C]/15 backdrop-blur-xs px-6 py-3.5 text-xs font-mono uppercase tracking-[0.2em] font-bold transition-all cursor-pointer rounded-xl"
              >
                <span>✦ THỬ PHỐI ĐỒ LOOKBOOK</span>
              </button>
            </div>
          </div>

          {/* Editorial Key Metrics */}
          <div className="pt-6 border-t border-[#333235] flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#AAA5A0]">
            <div className="flex items-center gap-2">
              <span className="text-[#D6B27C] font-bold">100%</span>
              <span>Lụa & Linen Tự Nhiên</span>
            </div>
            <div className="hidden sm:inline text-[#333235]">·</div>
            <div className="flex items-center gap-2">
              <span className="text-[#D6B27C] font-bold">1:1</span>
              <span>Tỉ Lệ May Đo Chuẩn Mực</span>
            </div>
            <div className="hidden sm:inline text-[#333235]">·</div>
            <div className="flex items-center gap-2">
              <span className="text-[#D6B27C] font-bold">IVRE</span>
              <span>Boutique Atelier</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fashion Portrait Hero (5 cols on desktop) */}
        <div className="lg:col-span-5 relative bg-[#191A1D] border-t lg:border-t-0 lg:border-l border-[#333235] overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-full flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85"
            alt="The Urbanist Couture Collection Hero"
            className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out hover:scale-105"
            loading="eager"
          />

          {/* Lookbook Indicator Slider Bar */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center gap-3 font-mono text-[10px] text-white/90 select-none z-10 bg-black/50 backdrop-blur-xs p-2 rounded-full border border-white/10">
            <span className="text-[#D6B27C] font-bold">01</span>
            <div className="w-[1px] h-8 bg-white/30 relative">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-[#D6B27C]" />
            </div>
            <span className="text-white/50">02</span>
            <span className="text-white/50">03</span>
          </div>

          {/* Lookbook Caption Pill */}
          <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-[#0E0F11]/90 backdrop-blur-md text-[#F5F0E9] px-4 py-2 font-mono text-[10px] sm:text-[11px] tracking-widest uppercase border border-[#333235] rounded-xl flex items-center justify-between gap-4">
            <span>LOOK 01 · CAMEL COUTURE TRENCH</span>
            <span className="text-[#D6B27C] font-bold">AUTUMN/WINTER</span>
          </div>
        </div>
      </div>
    </section>
  );
}

