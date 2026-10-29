export default function StorefrontFooter() {
  return (
    <footer id="about-manifesto" aria-label="Atelier Footer" className="border-t border-[#333235] bg-[#0E0F11]/95 text-xs text-[#AAA5A0] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Footer: 4 Editorial Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand Info & Manifesto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-2xl text-[#F5F0E9] font-medium tracking-tight">
                Ivre<span className="text-[#D6B27C]">.</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#D6B27C] uppercase font-bold pl-2 border-l border-[#333235]">
                ATELIER
              </span>
            </div>
            <p className="text-[11px] font-serif italic text-[#AAA5A0] leading-relaxed">
              "Khởi sinh từ tình yêu với nghệ thuật may đo thủ công và triết lý thời trang bền vững. Chúng tôi sáng tạo nên những thiết kế tôn vinh bản sắc độc bản của mỗi người mặc."
            </p>
            <div className="text-[11px] font-mono text-[#777574]">
              Boutique: TP. Hồ Chí Minh, Việt Nam
            </div>
          </div>

          {/* Col 2: Danh Mục Khám Phá */}
          <div className="space-y-3 font-mono">
            <h4 className="text-[11px] font-bold text-[#F5F0E9] tracking-widest uppercase">
              BỘ SƯU TẬP
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Đầm Dạ Hội & Váy Maxi Lụa
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Áo Blazer & Sơ Mi Linen May Đo
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Quần Tây Ống Suông & Quần Kaki
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Trang Phục Phối Bộ Dạo Phố
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Dịch Vụ Khách Hàng Có Căn Cứ */}
          <div className="space-y-3 font-mono">
            <h4 className="text-[11px] font-bold text-[#F5F0E9] tracking-widest uppercase">
              DỊCH VỤ & CHÍNH SÁCH
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Thanh Toán COD Khi Nhận Hàng
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Bảng Quy Đổi Kích Cỡ Size Guide
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Hướng Dẫn Chăm Sóc Sợi Lụa & Linen
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
                  Chính Sách Đổi Size Trong 48 Giờ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Giờ Mở Cửa & Concierge */}
          <div className="space-y-3 font-mono">
            <h4 className="text-[11px] font-bold text-[#F5F0E9] tracking-widest uppercase">
              CONCIERGE STUDIO
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="text-[#F5F0E9]">Thứ Hai – Chủ Nhật: 09:00 – 21:00</div>
              <div>Hỗ trợ tư vấn size & đặt may riêng</div>
              <div className="pt-2 text-[#D6B27C] font-bold">concierge@ivre-atelier.com</div>
              <div className="text-[10px] text-[#777574]">Phản hồi trong vòng 2 giờ làm việc</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Technical Baseline */}
        <div className="pt-8 border-t border-[#333235] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-[#777574]">
          <div>
            &copy; 2026 IVRE ATELIER. BẢN QUYỀN THUỘC VỀ FASHION STORE 2.0.
          </div>
          <div className="flex items-center gap-3">
            <span>SPRING BOOT 3</span>
            <span>·</span>
            <span>REACT SPA</span>
            <span>·</span>
            <span>CLOUDINARY MEDIA</span>
            <span>·</span>
            <span className="text-[#D6B27C]">IVRE LUXURY SYSTEM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

