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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#FAF9F6] text-[#121212] h-full shadow-2xl flex flex-col z-10 border-l border-[#E6E4DF] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#E6E4DF] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#888888] uppercase">
              BẢNG QUY ĐỔI KÍCH CỠ CHUẨN
            </span>
            <h2 className="font-serif text-xl tracking-tight font-medium mt-0.5">
              Size Guide — {categoryName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono uppercase px-2.5 py-1 border border-[#121212] hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
          >
            ĐÓNG [X]
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* Measurement Table */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold mb-3">
              Thông số chi tiết sản phẩm (Đơn vị: cm)
            </h3>

            {customGuide ? (
              <div className="border border-[#E6E4DF] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#EFECE6] border-b border-[#E6E4DF]">
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
                  <tbody className="divide-y divide-[#E6E4DF]">
                    {customGuide.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/60">
                        <td className="p-2.5 font-bold">{row.size}</td>
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
              <div className="border border-[#E6E4DF] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#EFECE6] border-b border-[#E6E4DF]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE SỐ</th>
                      <th className="p-2.5 font-bold">VÒNG EO (CM)</th>
                      <th className="p-2.5 font-bold">VÒNG MÔNG (CM)</th>
                      <th className="p-2.5 font-bold">DÀI QUẦN (CM)</th>
                      <th className="p-2.5 font-bold">CÂN NẶNG (KG)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DF]">
                    <tr><td className="p-2.5 font-bold">28</td><td className="p-2.5">66 - 70</td><td className="p-2.5">90 - 93</td><td className="p-2.5">100</td><td className="p-2.5">48 - 54</td></tr>
                    <tr><td className="p-2.5 font-bold">29</td><td className="p-2.5">70 - 74</td><td className="p-2.5">93 - 96</td><td className="p-2.5">101</td><td className="p-2.5">54 - 60</td></tr>
                    <tr><td className="p-2.5 font-bold">30</td><td className="p-2.5">74 - 78</td><td className="p-2.5">96 - 99</td><td className="p-2.5">102</td><td className="p-2.5">60 - 66</td></tr>
                    <tr><td className="p-2.5 font-bold">31</td><td className="p-2.5">78 - 82</td><td className="p-2.5">99 - 102</td><td className="p-2.5">103</td><td className="p-2.5">66 - 72</td></tr>
                    <tr><td className="p-2.5 font-bold">32</td><td className="p-2.5">82 - 86</td><td className="p-2.5">102 - 106</td><td className="p-2.5">104</td><td className="p-2.5">72 - 78</td></tr>
                  </tbody>
                </table>
              </div>
            ) : isDress ? (
              <div className="border border-[#E6E4DF] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#EFECE6] border-b border-[#E6E4DF]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE</th>
                      <th className="p-2.5 font-bold">NGỰC (CM)</th>
                      <th className="p-2.5 font-bold">EO (CM)</th>
                      <th className="p-2.5 font-bold">MÔNG (CM)</th>
                      <th className="p-2.5 font-bold">DÀI ĐẦM (CM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DF]">
                    <tr><td className="p-2.5 font-bold">S</td><td className="p-2.5">82 - 86</td><td className="p-2.5">64 - 68</td><td className="p-2.5">88 - 92</td><td className="p-2.5">120 - 125</td></tr>
                    <tr><td className="p-2.5 font-bold">M</td><td className="p-2.5">86 - 90</td><td className="p-2.5">68 - 72</td><td className="p-2.5">92 - 96</td><td className="p-2.5">122 - 127</td></tr>
                    <tr><td className="p-2.5 font-bold">L</td><td className="p-2.5">90 - 94</td><td className="p-2.5">72 - 76</td><td className="p-2.5">96 - 100</td><td className="p-2.5">124 - 129</td></tr>
                    <tr><td className="p-2.5 font-bold">XL</td><td className="p-2.5">94 - 98</td><td className="p-2.5">76 - 80</td><td className="p-2.5">100 - 104</td><td className="p-2.5">126 - 131</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-[#E6E4DF] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#EFECE6] border-b border-[#E6E4DF]">
                    <tr>
                      <th className="p-2.5 font-bold">SIZE</th>
                      <th className="p-2.5 font-bold">VÒNG NGỰC (CM)</th>
                      <th className="p-2.5 font-bold">RỘNG VAI (CM)</th>
                      <th className="p-2.5 font-bold">CHIỀU CAO (CM)</th>
                      <th className="p-2.5 font-bold">CÂN NẶNG (KG)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DF]">
                    <tr><td className="p-2.5 font-bold">S</td><td className="p-2.5">96 - 100</td><td className="p-2.5">42 - 44</td><td className="p-2.5">158 - 165</td><td className="p-2.5">48 - 56</td></tr>
                    <tr><td className="p-2.5 font-bold">M</td><td className="p-2.5">100 - 104</td><td className="p-2.5">44 - 46</td><td className="p-2.5">165 - 172</td><td className="p-2.5">56 - 65</td></tr>
                    <tr><td className="p-2.5 font-bold">L</td><td className="p-2.5">104 - 108</td><td className="p-2.5">46 - 48</td><td className="p-2.5">170 - 178</td><td className="p-2.5">65 - 75</td></tr>
                    <tr><td className="p-2.5 font-bold">XL</td><td className="p-2.5">108 - 114</td><td className="p-2.5">48 - 50</td><td className="p-2.5">175 - 185</td><td className="p-2.5">75 - 85</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* How to measure */}
          <div className="border-t border-[#E6E4DF] pt-5 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
              Hướng dẫn lấy số đo chính xác
            </h3>
            <ul className="text-xs text-[#555555] space-y-2 list-disc list-inside leading-relaxed">
              <li><strong>Vòng ngực:</strong> Đo ngang qua điểm nở nhất của lồng ngực, giữ thước dây ngang bằng không thắt quá chặt.</li>
              <li><strong>Vòng eo:</strong> Đo quanh phần hẹp nhất của eo (thường nằm trên rốn khoảng 2–3 cm).</li>
              <li><strong>Vòng mông:</strong> Đo quanh phần nở nang nhất của hông và mông khi đứng thẳng khép chân.</li>
              <li><strong>Lưu ý:</strong> Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu thích mặc thoải mái hoặc chọn size nhỏ hơn nếu thích ôm sát phom người.</li>
            </ul>
          </div>

          {/* Return & Exchange Guarantee */}
          <div className="bg-[#EFECE6] p-4 border border-[#E6E4DF] text-xs space-y-1">
            <span className="font-mono font-bold uppercase tracking-wider block">
              CHÍNH SÁCH ĐỔI SIZE AN TÂM 7 NGÀY
            </span>
            <p className="text-[#666666]">
              Shop hỗ trợ đổi kích cỡ miễn phí trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm mặc không vừa vặn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
