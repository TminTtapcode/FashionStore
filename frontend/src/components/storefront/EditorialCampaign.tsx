interface EditorialCampaignProps {
  onFilterSilkAndLinen: () => void;
}

export default function EditorialCampaign({ onFilterSilkAndLinen }: EditorialCampaignProps) {
  return (
    <section id="collections" aria-label="Editorial Campaign" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-[#333235] bg-[#111214] shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Column: High-Fashion Editorial Photography (6 cols on desktop) */}
          <div className="lg:col-span-6 relative overflow-hidden min-h-[380px] sm:min-h-[460px] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
              alt="The Silk and Linen Collection Edit"
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#111214]/90" />

            {/* Campaign Stamp Overlay */}
            <div className="absolute top-6 left-6 bg-[#0E0F11]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-[#D6B27C] tracking-widest uppercase">
              EDITORIAL CAMPAIGN · VOLUME 01
            </div>
          </div>

          {/* Right Column: Editorial Manifesto & Narrative (6 cols on desktop) */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-[3px] text-[#D6B27C] uppercase font-bold">
                THE SILK & LINEN EDIT
              </div>

              <h2 className="font-editorial text-3xl sm:text-5xl text-[#F5F0E9] font-normal leading-tight">
                Bản Giao Hưởng <br />
                <span className="italic text-[#D6B27C]">Lụa Tơ Tằm & Linen</span>
              </h2>

              <p className="text-xs sm:text-sm font-serif text-[#AAA5A0] leading-relaxed italic">
                "Sự giao thoa giữa ánh lụa óng ả mềm mại và cấu trúc mộc mạc của sợi linen dệt tay. Mỗi trang phục đều mang phom dáng kiến trúc phóng khoáng, giữ trọn cảm xúc tự nhiên trên làn da người mặc."
              </p>

              <div className="pt-2 space-y-2 text-xs font-mono text-[#AAA5A0]">
                <div className="flex items-center gap-2">
                  <span className="text-[#D6B27C]">✓</span>
                  <span>100% Sợi tự nhiên thuần khiết, thân thiện với môi trường</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#D6B27C]">✓</span>
                  <span>Kỹ nghệ may đo chuẩn form dáng Á Đông thanh thoát</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#D6B27C]">✓</span>
                  <span>Sắc màu trung tính: Trắng kem, Đen tuyền, Be cát & Rượu vang</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#333235] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onFilterSilkAndLinen}
                className="px-6 py-3 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#111214] font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                XEM TRANG PHỤC LỤA & LINEN →
              </button>

              <span className="text-[11px] font-mono text-[#777574]">
                LIMITED ATELIER PRODUCTION
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

