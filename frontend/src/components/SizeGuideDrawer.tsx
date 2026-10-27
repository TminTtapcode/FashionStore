import { useMemo } from 'react';

interface SizeGuideRow {
  size: string;
  bust?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  length?: string;
  shoulder?: string;
}

interface SizeGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  specificationsJson?: string;
}

export default function SizeGuideDrawer({
  isOpen,
  onClose,
  categoryName = 'Thời trang',
  specificationsJson,
}: SizeGuideDrawerProps) {
  // Parse customized size guide from specifications JSON if present
  const customGuide = useMemo<SizeGuideRow[] | null>(() => {
    if (!specificationsJson) return null;
    try {
      const parsed = JSON.parse(specificationsJson);
      if (Array.isArray(parsed.size_guide) && parsed.size_guide.length > 0) {
        return parsed.size_guide;
      }
    } catch {
      // ignore parse error, use default
    }
    return null;
  }, [specificationsJson]);

  // Fallback standardized guide for Tops, Dresses, Pants
  const isPants = categoryName.toLowerCase().includes('quần');
  const isDress = categoryName.toLowerCase().includes('đầm') || categoryName.toLowerCase().includes('váy');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#0D0E12] text-[#F7F7F4] h-full shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col z-10 border-l border-white/10 animate-in slide-in-from-right duration-300">
        {/* Top Gold Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C7AD83] to-transparent shrink-0" />

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#C7AD83] uppercase flex items-center gap-1.5 font-semibold">
              <span>✦</span>
              <span>BẢNG QUY ĐỔI KÍCH CỠ CHUẨN</span>
            </span>
            <h2 className="font-editorial text-xl tracking-tight font-medium mt-1 text-white">
              Size Guide — {categoryName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng size"
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L13 13M1 13L13 1" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* Measurement Table */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold mb-3 text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7AD83]" />
              <span>Thông số chi tiết sản phẩm (Đơn vị: cm)</span>
            </h3>

            {customGuide ? (
              <div className="border border-white/10 overflow-x-auto rounded-2xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[#C7AD83]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE</th>
                      {customGuide[0].bust && <th className="p-2.5 font-bold">NGỰC</th>}
                      {customGuide[0].chest && <th className="p-2.5 font-bold">VÒNG NGỰC</th>}
                      {customGuide[0].waist && <th className="p-2.5 font-bold">EO</th>}
                      {customGuide[0].hips && <th className="p-2.5 font-bold">MÔNG</th>}
                      {customGuide[0].shoulder && <th className="p-2.5 font-bold">RỘNG VAI</th>}
                      {customGuide[0].length && <th className="p-2.5 font-bold">CHIỀU DÀI</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    {customGuide.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-2.5 font-bold text-white">{row.size}</td>
                        {row.bust && <td className="p-2.5">{row.bust}</td>}
                        {row.chest && <td className="p-2.5">{row.chest}</td>}
                        {row.waist && <td className="p-2.5">{row.waist}</td>}
                        {row.hips && <td className="p-2.5">{row.hips}</td>}
                        {row.shoulder && <td className="p-2.5">{row.shoulder}</td>}
                        {row.length && <td className="p-2.5">{row.length}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : isPants ? (
              <div className="border border-white/10 overflow-x-auto rounded-2xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[#C7AD83]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE SỐ</th>
                      <th className="p-2.5 font-bold">VÒNG EO (CM)</th>
                      <th className="p-2.5 font-bold">VÒNG MÔNG (CM)</th>
                      <th className="p-2.5 font-bold">DÀI QUẦN (CM)</th>
                      <th className="p-2.5 font-bold">CÂN NẶNG (KG)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    <tr><td className="p-2.5 font-bold text-white">28</td><td className="p-2.5">66 - 70</td><td className="p-2.5">90 - 93</td><td className="p-2.5">100</td><td className="p-2.5">48 - 54</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">29</td><td className="p-2.5">70 - 74</td><td className="p-2.5">93 - 96</td><td className="p-2.5">101</td><td className="p-2.5">54 - 60</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">30</td><td className="p-2.5">74 - 78</td><td className="p-2.5">96 - 99</td><td className="p-2.5">102</td><td className="p-2.5">60 - 66</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">31</td><td className="p-2.5">78 - 82</td><td className="p-2.5">99 - 102</td><td className="p-2.5">103</td><td className="p-2.5">66 - 72</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">32</td><td className="p-2.5">82 - 86</td><td className="p-2.5">102 - 106</td><td className="p-2.5">104</td><td className="p-2.5">72 - 78</td></tr>
                  </tbody>
                </table>
              </div>
            ) : isDress ? (
              <div className="border border-white/10 overflow-x-auto rounded-2xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[#C7AD83]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE</th>
                      <th className="p-2.5 font-bold">NGỰC (CM)</th>
                      <th className="p-2.5 font-bold">EO (CM)</th>
                      <th className="p-2.5 font-bold">MÔNG (CM)</th>
                      <th className="p-2.5 font-bold">DÀI ĐẦM (CM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    <tr><td className="p-2.5 font-bold text-white">S</td><td className="p-2.5">82 - 86</td><td className="p-2.5">64 - 68</td><td className="p-2.5">88 - 92</td><td className="p-2.5">120</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">M</td><td className="p-2.5">86 - 90</td><td className="p-2.5">68 - 72</td><td className="p-2.5">92 - 96</td><td className="p-2.5">122</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">L</td><td className="p-2.5">90 - 94</td><td className="p-2.5">72 - 76</td><td className="p-2.5">96 - 100</td><td className="p-2.5">124</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-white/10 overflow-x-auto rounded-2xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[#C7AD83]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE CHUẨN</th>
                      <th className="p-2.5 font-bold">RỘNG VAI (CM)</th>
                      <th className="p-2.5 font-bold">VÒNG NGỰC (CM)</th>
                      <th className="p-2.5 font-bold">DÀI ÁO (CM)</th>
                      <th className="p-2.5 font-bold">CHIỀU CAO (CM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    <tr><td className="p-2.5 font-bold text-white">S</td><td className="p-2.5">42 - 44</td><td className="p-2.5">98 - 102</td><td className="p-2.5">68 - 70</td><td className="p-2.5">160 - 168</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">M</td><td className="p-2.5">44 - 46</td><td className="p-2.5">102 - 106</td><td className="p-2.5">70 - 72</td><td className="p-2.5">168 - 174</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">L</td><td className="p-2.5">46 - 48</td><td className="p-2.5">106 - 110</td><td className="p-2.5">72 - 74</td><td className="p-2.5">174 - 180</td></tr>
                    <tr><td className="p-2.5 font-bold text-white">XL</td><td className="p-2.5">48 - 50</td><td className="p-2.5">110 - 114</td><td className="p-2.5">74 - 76</td><td className="p-2.5">180 - 186</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Guide Tips */}
          <div className="bg-white/[0.03] border border-white/10 p-4 space-y-2 text-xs font-mono rounded-2xs">
            <span className="font-bold text-[#C7AD83] uppercase tracking-wider block">
              ✦ Hướng dẫn đo kích thước chuẩn tại nhà
            </span>
            <ul className="list-disc pl-4 space-y-1 text-white/60">
              <li><strong className="text-white">Vòng ngực:</strong> Quấn thước dây quanh phần nở nhất của ngực, giữ thước phẳng ngang lưng.</li>
              <li><strong className="text-white">Vòng eo:</strong> Đo quanh phần hẹp nhất của thắt lưng (thường cách rốn 2-3cm lên trên).</li>
              <li><strong className="text-white">Vòng mông:</strong> Đứng khép hai chân, đo quanh điểm nở nang nhất của vòng ba.</li>
              <li>Nếu số đo của bạn nằm giữa 2 size, nên ưu tiên chọn size lớn hơn để mặc thoải mái hoặc điều chỉnh dáng rũ tự nhiên.</li>
            </ul>
          </div>

          {/* Contact Atelier Support */}
          <div className="border border-white/10 p-4 flex items-center justify-between font-mono text-xs rounded-2xs">
            <div>
              <p className="font-bold text-white">Cần tư vấn size riêng?</p>
              <p className="text-white/40 text-[11px]">Đội ngũ stylist luôn sẵn sàng hỗ trợ bạn chọn size chuẩn xác.</p>
            </div>
            <a
              href="#contact"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#C7AD83] bg-[#C7AD83]/10 text-[#C7AD83] hover:bg-[#C7AD83] hover:text-[#0D0E12] uppercase tracking-wider font-bold transition-all rounded-xs"
            >
              CHAT STUDIO
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
