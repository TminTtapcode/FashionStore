import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface StorefrontHeaderProps {
  onNavigateOwner: () => void;
  onOpenStylingStudio: () => void;
  onOpenOrderHistory: () => void;
  totalProductsCount: number;
}

export default function StorefrontHeader({
  onNavigateOwner,
  onOpenStylingStudio,
  onOpenOrderHistory,
}: StorefrontHeaderProps) {
  const { user, isLoading: isAuthLoading, openAuthModal, logout } = useAuth();
  const { totalCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOwner = Boolean(
    user &&
      Array.isArray(user.roles) &&
      user.roles.some((r) => ['SHOP_OWNER', 'ROLE_SHOP_OWNER', 'ADMIN', 'ROLE_ADMIN'].includes(r))
  );

  return (
    <header className="border-b border-[#333235]/80 sticky top-0 bg-[#0A0B0E]/85 backdrop-blur-md z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Monogram & Sub-brand */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="font-editorial text-2xl sm:text-3xl tracking-tight font-medium hover:opacity-90 transition-opacity text-[#F5F0E9] flex items-center"
          >
            <span>Ivre</span>
            <span className="text-[#D6B27C]">.</span>
          </a>
          <div className="hidden sm:flex flex-col pl-3 border-l border-[#333235] text-[9px] font-mono tracking-[2px] text-[#AAA5A0] uppercase">
            <span>DIGITAL COUTURE</span>
            <span className="text-[#D6B27C] font-semibold">EST. 2026</span>
          </div>
        </div>

        {/* Desktop Main Navigation */}
        <nav aria-label="Storefront Navigation" className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-[0.2em] text-[#AAA5A0]">
          <a href="#collections" className="hover:text-[#D6B27C] transition-colors">
            BỘ SƯU TẬP
          </a>
          <a href="#categories" className="hover:text-[#D6B27C] transition-colors">
            DANH MỤC
          </a>
          <a href="#new-arrivals" className="hover:text-[#D6B27C] transition-colors">
            SẢN PHẨM MỚI
          </a>
          <button
            type="button"
            onClick={onOpenStylingStudio}
            className="hover:text-[#D6B27C] transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-[#F5F0E9]"
          >
            <span>STYLING STUDIO</span>
            <span className="bg-[#D6B27C] text-[#111214] text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-bold tracking-normal">
              ✦ 2.5D
            </span>
          </button>
          <a href="#about-manifesto" className="hover:text-[#D6B27C] transition-colors">
            VỀ ATELIER
          </a>
        </nav>

        {/* Right Actions: Cart, User Auth, Owner Shortcut */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          {/* Cart Button */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Giỏ hàng ${totalCount} sản phẩm`}
            className="border border-[#D6B27C]/60 bg-[#D6B27C]/15 text-[#F5F0E9] hover:bg-[#D6B27C] hover:text-[#111214] px-3.5 py-1.5 tracking-widest uppercase transition-all cursor-pointer text-xs flex items-center gap-2 group rounded-xl font-bold shadow-xs"
          >
            <span className="hidden sm:inline">GIỎ HÀNG</span>
            <span className="sm:hidden">🛒</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md transition-colors ${
                totalCount > 0 ? 'bg-[#D6B27C] text-[#111214]' : 'bg-white/20 text-[#F5F0E9]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Account / User Section */}
          {isAuthLoading ? (
            <span className="text-[#777574] animate-pulse text-[11px] hidden sm:inline">Đang tải...</span>
          ) : user ? (
            <div className="flex items-center gap-2 text-[11px]">
              {isOwner && (
                <button
                  type="button"
                  onClick={onNavigateOwner}
                  className="text-[#D6B27C] bg-[#D6B27C]/15 hover:bg-[#D6B27C]/25 border border-[#D6B27C]/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer uppercase tracking-wider text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs"
                  title="Vào Cổng Quản Trị Cửa Hàng (Owner Portal)"
                >
                  <span>QUẢN TRỊ</span>
                  <span className="text-[9px]">↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenOrderHistory}
                className="hidden md:inline text-[#D6B27C] hover:underline tracking-wider uppercase font-semibold cursor-pointer truncate max-w-[120px]"
                title="Xem lịch sử đơn hàng"
              >
                {user.fullName || user.email}
              </button>
              <button
                type="button"
                onClick={onOpenOrderHistory}
                className="hidden sm:inline text-[#AAA5A0] hover:text-white transition-colors cursor-pointer uppercase tracking-wider text-[11px]"
              >
                ĐƠN HÀNG
              </button>
              <button
                type="button"
                onClick={logout}
                className="text-[#777574] hover:text-[#DF8D84] transition-colors cursor-pointer underline uppercase tracking-wider text-[11px]"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[#AAA5A0] hover:text-[#D6B27C] transition-colors cursor-pointer text-xs uppercase tracking-[0.15em] font-medium"
            >
              ĐĂNG NHẬP
            </button>
          )}

          {/* Mobile Menu Toggle Button (< 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#AAA5A0] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Mở menu di động"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111214]/98 border-b border-[#333235] px-6 py-5 space-y-4 font-mono text-xs uppercase tracking-widest text-[#AAA5A0] animate-fade-in">
          <a
            href="#collections"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-[#D6B27C] border-b border-white/5"
          >
            BỘ SƯU TẬP
          </a>
          <a
            href="#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-[#D6B27C] border-b border-white/5"
          >
            DANH MỤC SẢN PHẨM
          </a>
          <a
            href="#new-arrivals"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-[#D6B27C] border-b border-white/5"
          >
            SẢN PHẨM MỚI NHẤT
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenStylingStudio();
            }}
            className="w-full text-left py-2 hover:text-[#D6B27C] border-b border-white/5 flex items-center justify-between text-[#F5F0E9] font-bold"
          >
            <span>VIRTUAL STYLING STUDIO</span>
            <span className="bg-[#D6B27C] text-[#111214] text-[9px] px-1.5 py-0.5 rounded-xs font-mono">
              ✦ 2.5D
            </span>
          </button>
          <a
            href="#about-manifesto"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-[#D6B27C]"
          >
            VỀ THƯƠNG HIỆU ATELIER
          </a>
        </div>
      )}
    </header>
  );
}

