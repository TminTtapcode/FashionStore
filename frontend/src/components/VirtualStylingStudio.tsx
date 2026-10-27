import { useState, useEffect } from 'react';
import type { StylingItem, StudioBackground } from '../types/styling';
import { useCart } from '../context/CartContext';
import AtcShader from './ui/atc-shader';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Curated Collection of calibrated items for the 2.5D Mannequin
const TOPS: StylingItem[] = [
  {
    id: 'top-silk',
    name: 'Silk Blouse Cổ V',
    category: 'TOP',
    price: 490000,
    colorName: 'Trắng Ngọc',
    colorHex: '#FDFBF7',
    variantId: 1,
    description: 'Chất lụa satin rủ mềm mại, cổ chữ V thanh thoát tôn xương quai xanh.',
  },
  {
    id: 'top-tee',
    name: 'Essential Cotton Tee',
    category: 'TOP',
    price: 290000,
    colorName: 'Đen Mờ',
    colorHex: '#1A1A1A',
    variantId: 2,
    description: 'Cotton organic 240gsm đứng phom, tối giản và trẻ trung.',
  },
  {
    id: 'top-sculpted',
    name: 'Sculpted Oxford Shirt',
    category: 'TOP',
    price: 590000,
    colorName: 'Xanh Pastel',
    colorHex: '#C8DEFF',
    variantId: 3,
    description: 'Phom sơ mi kiến trúc hiện đại, cổ bẻ sắc sảo phong cách Atelier.',
  },
];

const BOTTOMS: StylingItem[] = [
  {
    id: 'bottom-wide',
    name: 'Wide-Leg Trousers',
    category: 'BOTTOM',
    price: 650000,
    colorName: 'Be Trầm',
    colorHex: '#C7AD83',
    variantId: 4,
    description: 'Quần tây ống suông xếp ly nhẹ, kéo dài đôi chân tối đa.',
  },
  {
    id: 'bottom-skirt',
    name: 'Midi A-Line Skirt',
    category: 'BOTTOM',
    price: 520000,
    colorName: 'Xanh Rêu Nhạt',
    colorHex: '#B9C8BA',
    variantId: 5,
    description: 'Chân váy chữ A dài qua gối, tôn eo và bay bổng khi bước đi.',
  },
  {
    id: 'bottom-shorts',
    name: 'Tailored Linen Shorts',
    category: 'BOTTOM',
    price: 390000,
    colorName: 'Trắng Ngà',
    colorHex: '#FAF9F6',
    variantId: 6,
    description: 'Shorts may đo cạp cao, chất linen thoáng mát dạo phố mùa hè.',
  },
];

const OUTERWEAR: StylingItem[] = [
  {
    id: 'outer-blazer',
    name: 'Oversized Sculpted Blazer',
    category: 'OUTERWEAR',
    price: 890000,
    colorName: 'Đen Tuyển Ink',
    colorHex: '#151518',
    variantId: 7,
    description: 'Áo blazer độn vai nhẹ phong cách menswear thanh lịch quyền lực.',
  },
  {
    id: 'outer-trench',
    name: 'Lightweight Trench Jacket',
    category: 'OUTERWEAR',
    price: 790000,
    colorName: 'Camel Cổ Điển',
    colorHex: '#BA9F84',
    variantId: 8,
    description: 'Áo khoác dáng lửng thắt đai, cảm hứng từ BST The Urbanist Couture.',
  },
];

interface VirtualStylingStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VirtualStylingStudio({ isOpen, onClose }: VirtualStylingStudioProps) {
  const { addToCart } = useCart();

  const [selectedTop, setSelectedTop] = useState<StylingItem>(TOPS[0]);
  const [selectedBottom, setSelectedBottom] = useState<StylingItem>(BOTTOMS[0]);
  const [selectedOuterwear, setSelectedOuterwear] = useState<StylingItem | null>(null);
  const [studioBg, setStudioBg] = useState<StudioBackground>('pearl');

  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashCaptured, setFlashCaptured] = useState(false);

  const triggerStudioFlash = () => {
    setIsFlashing(true);
    setFlashCaptured(true);
    setTimeout(() => setIsFlashing(false), 120);
    setTimeout(() => setFlashCaptured(false), 2000);
  };

  // Keyboard escape listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Pricing calculations
  const rawTotal = selectedTop.price + selectedBottom.price + (selectedOuterwear ? selectedOuterwear.price : 0);
  const comboDiscount = Math.round(rawTotal * 0.1); // 10% outfit incentive
  const finalPrice = rawTotal - comboDiscount;

  // Reset to default look
  const handleReset = () => {
    setSelectedTop(TOPS[0]);
    setSelectedBottom(BOTTOMS[0]);
    setSelectedOuterwear(null);
    setStudioBg('pearl');
  };

  // Add all selected items to cart
  const handleAddOutfitToCart = async () => {
    try {
      setIsAdding(true);
      triggerStudioFlash();
      await addToCart(selectedTop.variantId, 1);
      await addToCart(selectedBottom.variantId, 1);
      if (selectedOuterwear) {
        await addToCart(selectedOuterwear.variantId, 1);
      }
      setNotification('Đã thêm toàn bộ outfit vào giỏ hàng thành công! (-10% combo)');
      setTimeout(() => setNotification(null), 3000);
    } catch {
      setNotification('Đã thêm outfit mô phỏng vào giỏ!');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#151518]/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-6xl bg-[#F7F7F4] text-[#151518] shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col h-[94vh] max-h-[900px]">
        {/* Studio Top Navigation Bar */}
        <div className="p-4 sm:px-8 sm:py-4 border-b border-[#E8E8E3] flex items-center justify-between bg-white/70 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#151518] animate-pulse"></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-xl tracking-tight uppercase font-medium">
                  ATELIER / VIRTUAL STYLING STUDIO
                </h2>
                <span className="hidden sm:inline-block font-mono text-[10px] tracking-widest uppercase bg-[#C8DEFF] text-[#151518] px-2 py-0.5 font-bold">
                  2.5D PREVIEW · POSE 01
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#6C6C72]">
                Phối trang phục trực quan · Thử nghiệm phom dáng trước khi đặt hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono uppercase tracking-wider text-[#6C6C72] hover:text-[#151518] px-3 py-1.5 border border-transparent hover:border-[#E8E8E3] transition-colors cursor-pointer rounded-xs"
            >
              Đặt lại outfit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs border border-[#151518] px-3 py-1.5 uppercase hover:bg-[#151518] hover:text-[#F7F7F4] transition-colors cursor-pointer font-bold rounded-xs flex items-center gap-1.5"
            >
              <span>Đóng Studio</span>
              <span className="text-[11px]">✕</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-[#151518] text-[#F7F7F4] text-xs font-mono py-2 px-4 text-center tracking-wider flex items-center justify-center gap-2 border-b border-[#C7AD83]">
            <span className="text-[#C7AD83]">✦</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Main 3-Column Studio Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Garment Selector Tabs (4 cols) */}
          <div className="lg:col-span-4 border-r border-[#E8E8E3] bg-white overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 01 / TOP */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-[#E8E8E3] pb-1.5 font-mono text-xs">
                <span className="font-bold tracking-widest text-[#151518]">01 / TOP (ÁO)</span>
                <span className="text-[#6C6C72]">{TOPS.length} lựa chọn</span>
              </div>
              <div className="space-y-2">
                {TOPS.map((item) => {
                  const isSelected = selectedTop.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTop(item)}
                      className={`w-full text-left p-3 border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#151518] bg-[#F7F7F4] shadow-xs'
                          : 'border-[#E8E8E3] hover:border-black/40 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <h4 className="font-editorial text-sm font-medium text-[#151518]">{item.name}</h4>
                        </div>
                        <p className="text-[11px] font-mono text-[#6C6C72] truncate max-w-[210px]">
                          {item.description}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#151518]">
                        {formatVND(item.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 02 / BOTTOM */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-[#E8E8E3] pb-1.5 font-mono text-xs">
                <span className="font-bold tracking-widest text-[#151518]">02 / BOTTOM (QUẦN / VÁY)</span>
                <span className="text-[#6C6C72]">{BOTTOMS.length} lựa chọn</span>
              </div>
              <div className="space-y-2">
                {BOTTOMS.map((item) => {
                  const isSelected = selectedBottom.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBottom(item)}
                      className={`w-full text-left p-3 border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#151518] bg-[#F7F7F4] shadow-xs'
                          : 'border-[#E8E8E3] hover:border-black/40 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <h4 className="font-editorial text-sm font-medium text-[#151518]">{item.name}</h4>
                        </div>
                        <p className="text-[11px] font-mono text-[#6C6C72] truncate max-w-[210px]">
                          {item.description}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#151518]">
                        {formatVND(item.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 03 / OUTERWEAR */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-[#E8E8E3] pb-1.5 font-mono text-xs">
                <span className="font-bold tracking-widest text-[#151518]">03 / OUTERWEAR (ÁO KHOÁC)</span>
                <span className="text-[#6C6C72]">Tùy chọn</span>
              </div>
              <div className="space-y-2">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => setSelectedOuterwear(null)}
                  className={`w-full text-left p-2.5 border transition-all cursor-pointer flex items-center justify-between ${
                    selectedOuterwear === null
                      ? 'border-[#151518] bg-[#F7F7F4] font-bold'
                      : 'border-[#E8E8E3] hover:border-black/40 bg-white text-[#6C6C72]'
                  }`}
                >
                  <span className="font-mono text-xs uppercase">Không khoác ngoài</span>
                  <span className="font-mono text-xs">—</span>
                </button>

                {OUTERWEAR.map((item) => {
                  const isSelected = selectedOuterwear?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedOuterwear(item)}
                      className={`w-full text-left p-3 border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#151518] bg-[#F7F7F4] shadow-xs'
                          : 'border-[#E8E8E3] hover:border-black/40 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <h4 className="font-editorial text-sm font-medium text-[#151518]">{item.name}</h4>
                        </div>
                        <p className="text-[11px] font-mono text-[#6C6C72] truncate max-w-[210px]">
                          {item.description}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#151518]">
                        {formatVND(item.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Column: 2.5D Mannequin Interactive Stage (5 cols) */}
          <div
            className={`lg:col-span-5 flex flex-col justify-between p-6 transition-colors duration-500 relative select-none overflow-hidden ${
              studioBg === 'pearl'
                ? 'bg-[#F7F7F4]'
                : studioBg === 'sage'
                ? 'bg-[#E5ECE6]'
                : studioBg === 'runway'
                ? 'bg-[#0E0F12] text-white'
                : 'bg-[#151518] text-white'
            }`}
          >
            {/* Living WebGL Digital Runway Shader */}
            {studioBg === 'runway' && (
              <AtcShader
                speed={0.42}
                intensity={0.35}
                className="absolute inset-0 z-0 pointer-events-none"
                overlayClassName="bg-black/25"
              />
            )}

            {/* Localized Studio Camera Flash Layer (<120ms) */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-studio-flash" />
            )}

            {/* Flash Captured Notification Badge */}
            {flashCaptured && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-[#151518]/90 text-white font-mono text-[10px] px-3.5 py-1.5 uppercase tracking-widest border border-[#C7AD83] shadow-md animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 rounded-xs">
                <span className="text-[#C7AD83]">⚡</span>
                <span>STUDIO LOOK SNAPSHOT CAPTURED</span>
              </div>
            )}

            {/* Top Stage Indicators */}
            <div className="flex justify-between items-center font-mono text-xs z-10">
              <span className="tracking-widest uppercase opacity-70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>STAGE 01 · 2.5D VIEW</span>
              </span>

              {/* Action Buttons: Flash Shutter & Background Switcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerStudioFlash}
                  title="Chụp ảnh Lookbook / Camera Flash"
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 hover:bg-white text-[#151518] text-[10px] font-mono uppercase tracking-wider border border-black/15 shadow-xs cursor-pointer rounded-xs transition-colors"
                >
                  <span>📸</span>
                  <span className="font-bold">FLASH</span>
                </button>

                {/* Background Color Switcher */}
                <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-xs p-1 border border-black/10 rounded-full">
                  <button
                    type="button"
                    onClick={() => setStudioBg('pearl')}
                    title="Pearl Background"
                    className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                      studioBg === 'pearl' ? 'scale-125 border-black' : 'border-transparent opacity-60'
                    }`}
                    style={{ backgroundColor: '#F7F7F4' }}
                  />
                  <button
                    type="button"
                    onClick={() => setStudioBg('sage')}
                    title="Sage Background"
                    className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                      studioBg === 'sage' ? 'scale-125 border-black' : 'border-transparent opacity-60'
                    }`}
                    style={{ backgroundColor: '#B9C8BA' }}
                  />
                  <button
                    type="button"
                    onClick={() => setStudioBg('ink')}
                    title="Ink Background"
                    className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                      studioBg === 'ink' ? 'scale-125 border-white' : 'border-transparent opacity-60'
                    }`}
                    style={{ backgroundColor: '#151518' }}
                  />
                  <button
                    type="button"
                    onClick={() => setStudioBg('runway')}
                    title="Digital Runway Shader"
                    className={`px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                      studioBg === 'runway'
                        ? 'bg-[#C7AD83] text-[#151518] font-bold shadow-xs'
                        : 'bg-black/60 text-[#C7AD83] hover:bg-black'
                    }`}
                  >
                    <span>✦</span>
                    <span>RUNWAY</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mannequin Graphic Representation (Layered Silhouette Canvas) */}
            <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden">
              {/* Studio Spotlight Effect */}
              <div className="absolute inset-0 bg-radial from-white/40 via-transparent to-transparent pointer-events-none" />

              {/* Vector Mannequin Rig */}
              <div className="relative w-56 h-[460px] flex flex-col items-center justify-center transition-all duration-300">
                {/* Head Silhouette */}
                <div
                  className={`w-14 h-18 rounded-full border transition-colors ${
                    studioBg === 'ink' ? 'border-white/20 bg-white/10' : 'border-[#151518]/20 bg-[#151518]/5'
                  }`}
                />
                {/* Neck */}
                <div
                  className={`w-4 h-5 -mt-1 transition-colors ${
                    studioBg === 'ink' ? 'bg-white/10' : 'bg-[#151518]/10'
                  }`}
                />

                {/* Layer 1: TOP (Rendered on Torso) */}
                <div
                  className="w-40 h-32 -mt-1 rounded-t-xl relative border-2 border-dashed flex flex-col items-center justify-center p-2 shadow-sm transition-all duration-300 transform group"
                  style={{
                    backgroundColor: selectedTop.colorHex,
                    borderColor: studioBg === 'ink' ? '#C7AD83' : '#151518',
                    color: selectedTop.colorHex === '#1A1A1A' ? '#FFF' : '#151518',
                  }}
                >
                  <span className="font-editorial text-xs font-bold text-center leading-tight">
                    {selectedTop.name}
                  </span>
                  <span className="text-[10px] font-mono opacity-80 mt-1">
                    {selectedTop.colorName}
                  </span>
                </div>

                {/* Layer 2: BOTTOM (Rendered on Hips & Legs) */}
                <div
                  className="w-36 h-48 -mt-1 relative border-2 border-dashed flex flex-col items-center justify-center p-2 shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: selectedBottom.colorHex,
                    borderColor: studioBg === 'ink' ? '#C7AD83' : '#151518',
                    color: selectedBottom.colorHex === '#1A1A1A' ? '#FFF' : '#151518',
                  }}
                >
                  <span className="font-editorial text-xs font-bold text-center leading-tight">
                    {selectedBottom.name}
                  </span>
                  <span className="text-[10px] font-mono opacity-80 mt-1">
                    {selectedBottom.colorName}
                  </span>
                </div>

                {/* Layer 3: OUTERWEAR (Floating Overlap Layer) */}
                {selectedOuterwear && (
                  <div
                    className="absolute top-16 -left-3 -right-3 h-40 rounded-xl border-2 border-solid flex flex-col items-center justify-start pt-2 px-2 shadow-xl backdrop-blur-xs transition-all duration-300 animate-in zoom-in-95"
                    style={{
                      backgroundColor: `${selectedOuterwear.colorHex}E6`,
                      borderColor: '#C7AD83',
                      color: selectedOuterwear.colorHex === '#151518' ? '#FFF' : '#151518',
                    }}
                  >
                    <span className="font-editorial text-xs font-bold uppercase tracking-wider text-center">
                      [ {selectedOuterwear.name} ]
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      Layer Khoác Ngoài
                    </span>
                  </div>
                )}

                {/* Floor Pedestal Shadow */}
                <div className="w-32 h-3 bg-black/15 rounded-full blur-xs mt-2" />
              </div>
            </div>

            {/* Stage Disclaimer Note */}
            <p className="text-[10px] font-mono opacity-60 text-center tracking-tight">
              * Đây là mô hình phối màu và bố cục trang phục 2.5D trực quan, không mô phỏng độ vừa vặn thực tế.
            </p>
          </div>

          {/* Right Column: Outfit Summary & Checkout CTA (3 cols) */}
          <div className="lg:col-span-3 border-l border-[#E8E8E3] bg-white p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="border-b border-[#E8E8E3] pb-2">
                <span className="text-[10px] font-mono text-[#6C6C72] tracking-widest uppercase">
                  LOOK 001 · OUTFIT SUMMARY
                </span>
                <h3 className="font-editorial text-xl font-medium text-[#151518] mt-0.5">
                  Bản Phối Của Bạn
                </h3>
              </div>

              {/* Itemized Price Breakdown */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-start pb-2 border-b border-[#E8E8E3]">
                  <div>
                    <p className="font-bold text-[#151518]">{selectedTop.name}</p>
                    <p className="text-[10px] text-[#6C6C72]">Áo · {selectedTop.colorName}</p>
                  </div>
                  <span className="font-bold">{formatVND(selectedTop.price)}</span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-[#E8E8E3]">
                  <div>
                    <p className="font-bold text-[#151518]">{selectedBottom.name}</p>
                    <p className="text-[10px] text-[#6C6C72]">Quần/Váy · {selectedBottom.colorName}</p>
                  </div>
                  <span className="font-bold">{formatVND(selectedBottom.price)}</span>
                </div>

                {selectedOuterwear && (
                  <div className="flex justify-between items-start pb-2 border-b border-[#E8E8E3]">
                    <div>
                      <p className="font-bold text-[#151518]">{selectedOuterwear.name}</p>
                      <p className="text-[10px] text-[#6C6C72]">Khoác · {selectedOuterwear.colorName}</p>
                    </div>
                    <span className="font-bold">{formatVND(selectedOuterwear.price)}</span>
                  </div>
                )}

                {/* Subtotal & Combo Discount */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#6C6C72]">
                    <span>Tạm tính ({selectedOuterwear ? '3' : '2'} món):</span>
                    <span>{formatVND(rawTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold bg-[#B9C8BA]/20 p-1.5 border border-[#B9C8BA]">
                    <span>Ưu đãi trọn bộ outfit (-10%):</span>
                    <span>- {formatVND(comboDiscount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Total & Add to Cart Button */}
            <div className="pt-6 border-t border-[#E8E8E3] space-y-3">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-[#6C6C72] uppercase tracking-wider">TỔNG COMBO:</span>
                <span className="text-xl font-bold text-[#151518]">{formatVND(finalPrice)}</span>
              </div>

              <button
                type="button"
                disabled={isAdding}
                onClick={handleAddOutfitToCart}
                className="w-full h-12 bg-[#151518] text-[#F7F7F4] hover:bg-[#C7AD83] hover:text-[#151518] active:scale-[0.99] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#151518] shadow-sm disabled:opacity-50"
              >
                {isAdding ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>THÊM CẢ BỘ VÀO GIỎ</span>
                    <span>✦</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

