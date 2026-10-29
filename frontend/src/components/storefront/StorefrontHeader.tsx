import { useState, useRef, useEffect } from 'react';
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const isOwner = Boolean(
    user &&
      Array.isArray(user.roles) &&
      user.roles.some((r) => ['SHOP_OWNER', 'ROLE_SHOP_OWNER', 'ADMIN', 'ROLE_ADMIN'].includes(r))
  );

  return (
    <header className="border-b border-[#333235]/80 sticky top-0 bg-[#0A0B0E]/95 backdrop-blur-md z-40 transition-all">
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
          <a href="#catalog-section" className="hover:text-[#D6B27C] transition-colors">
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
        </nav>

        {/* Right Actions: Cart & Account Popover */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Cart Button */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Giỏ hàng ${totalCount} sản phẩm`}
            className="border border-[#D6B27C]/60 bg-[#D6B27C]/15 text-[#F5F0E9] hover:bg-[#D6B27C] hover:text-[#111214] px-3.5 py-2 tracking-widest uppercase transition-all cursor-pointer text-xs flex items-center gap-2 group rounded-xl font-bold shadow-xs"
          >
            <span className="hidden sm:inline">GIỎ HÀNG</span>
            <span className="sm:hidden text-sm">🛒</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md transition-colors ${
                totalCount > 0 ? 'bg-[#D6B27C] text-[#111214]' : 'bg-white/20 text-[#F5F0E9]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Account Popover Menu */}
          {isAuthLoading ? (
            <span className="text-[#777574] animate-pulse text-[11px] px-2">Đang tải...</span>
          ) : user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#333235] hover:border-[#D6B27C] bg-white/5 hover:bg-[#D6B27C]/10 text-white transition-all cursor-pointer font-mono text-xs"
                aria-expanded={accountMenuOpen}
                aria-label="Menu tài khoản người dùng"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D6B27C] to-[#9E7A4A] text-[#111214] font-bold text-[10px] flex items-center justify-center">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="hidden sm:inline font-semibold text-[#F5F0E9] max-w-[110px] truncate">
                  {user.fullName || 'Tài khoản'}
                </span>
                {isOwner && (
                  <span className="hidden md:inline-block bg-[#D6B27C]/20 text-[#D6B27C] text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border border-[#D6B27C]/30">
                    OWNER
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-[#AAA5A0] transition-transform duration-200 ${
                    accountMenuOpen ? 'rotate-180 text-[#D6B27C]' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Luxury Floating Dropdown */}
              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#111214] border border-[#333235] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-mono text-xs text-[#AAA5A0] space-y-1">
                  <div className="p-3 border-b border-[#333235] bg-white/[0.02] rounded-xl space-y-1">
                    <div className="text-white font-bold truncate text-[13px]">{user.fullName || user.email}</div>
                    <div className="text-[10px] text-[#777574] truncate">{user.email}</div>
                    {isOwner && (
                      <div className="pt-1">
                        <span className="inline-block px-2 py-0.5 bg-[#D6B27C]/20 border border-[#D6B27C]/40 text-[#D6B27C] text-[9px] font-bold rounded-md">
                          ✦ CHỦ SHOP ATELIER
                        </span>
                      </div>
                    )}
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onNavigateOwner();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#D6B27C] hover:bg-[#D6B27C]/15 flex items-center justify-between transition-colors cursor-pointer font-bold"
                    >
                      <span>Cổng Quản Trị Atelier</span>
                      <span className="text-[11px]">↗</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenOrderHistory();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#F5F0E9] hover:text-[#D6B27C] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Lịch sử Đơn hàng</span>
                    <span className="text-sm">📋</span>
                  </button>

                  <div className="border-t border-[#333235] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#DF8D84] hover:bg-[#DF8D84]/10 flex items-center justify-between transition-colors cursor-pointer font-medium"
                  >
                    <span>Đăng xuất</span>
                    <span className="text-sm">🚪</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[#AAA5A0] hover:text-[#D6B27C] border border-[#333235] hover:border-[#D6B27C] px-3.5 py-2 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-[0.15em] font-medium"
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
            DANH MỤC
          </a>
          <a
            href="#catalog-section"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-[#D6B27C] border-b border-white/5"
          >
            SẢN PHẨM MỚI
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenStylingStudio();
            }}
            className="w-full text-left py-2 hover:text-[#D6B27C] border-b border-white/5 flex items-center justify-between"
          >
            <span>STYLING STUDIO</span>
            <span className="bg-[#D6B27C] text-[#111214] text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-bold tracking-normal">
              ✦ 2.5D
            </span>
          </button>

          {user ? (
            <div className="pt-2 space-y-2 border-t border-white/10">
              <div className="text-[10px] text-[#777574] truncate">{user.fullName || user.email}</div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateOwner();
                  }}
                  className="w-full text-left py-1.5 text-[#D6B27C] font-bold"
                >
                  CỔNG QUẢN TRỊ ATELIER ↗
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrderHistory();
                }}
                className="w-full text-left py-1.5 text-[#F5F0E9]"
              >
                LỊCH SỬ ĐƠN HÀNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left py-1.5 text-[#DF8D84]"
              >
                ĐĂNG XUẤT
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal('login');
              }}
              className="w-full text-center py-2.5 mt-2 bg-[#D6B27C] text-[#111214] font-bold rounded-xl"
            >
              ĐĂNG NHẬP
            </button>
          )}
        </div>
      )}
    </header>
  );
}
