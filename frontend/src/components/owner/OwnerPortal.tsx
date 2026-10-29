import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OwnerOrdersView from './OwnerOrdersView';
import OwnerProductsView from './OwnerProductsView';
import { OwnerInventoryView } from './OwnerInventoryView';

interface OwnerPortalProps {
  onNavigateStorefront: () => void;
}

export default function OwnerPortal({ onNavigateStorefront }: OwnerPortalProps) {
  const { user, isLoading, logout, openAuthModal } = useAuth();
  const [activeNav, setActiveNav] = useState<'orders' | 'products' | 'inventory' | 'media' | 'analytics'>('inventory');

  // RBAC Role Verification: accepts both 'SHOP_OWNER' / 'ADMIN' or 'ROLE_SHOP_OWNER' / 'ROLE_ADMIN'
  const isOwner = Boolean(
    user &&
      Array.isArray(user.roles) &&
      user.roles.some((r) => ['SHOP_OWNER', 'ROLE_SHOP_OWNER', 'ADMIN', 'ROLE_ADMIN'].includes(r))
  );

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0F11] text-[#F5F0E9] flex flex-col items-center justify-center font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[#AAA5A0] tracking-widest uppercase">Đang xác thực thẩm quyền IVRE Atelier...</span>
      </div>
    );
  }

  // 2. 401 Unauthorized State (Guest)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E0F11] text-[#F5F0E9] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#191A1D] border border-[#333235] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#D6B27C]/15 border border-[#D6B27C]/30 text-[#D6B27C] flex items-center justify-center mx-auto text-xl font-mono">
            !
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-[2.5px] text-[#D6B27C] uppercase font-bold">
              YÊU CẦU XÁC THỰC ATELIER
            </span>
            <h1 className="font-editorial text-2xl font-normal mt-2 text-[#F5F0E9]">Cổng Quản Trị Atelier</h1>
            <p className="text-xs text-[#AAA5A0] mt-2 leading-relaxed">
              Khu vực quản trị chỉ dành riêng cho Chủ cửa hàng (SHOP_OWNER) và Quản trị viên (ADMIN). Vui lòng đăng nhập để tiếp tục.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl uppercase tracking-wider transition-all cursor-pointer font-bold shadow-md"
            >
              Đăng nhập Quản trị
            </button>
            <button
              type="button"
              onClick={onNavigateStorefront}
              className="w-full sm:w-auto px-5 py-2.5 border border-[#333235] hover:border-[#D6B27C] hover:bg-white/5 text-[#AAA5A0] hover:text-[#F5F0E9] rounded-xl transition-colors cursor-pointer"
            >
              ← Về Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. 403 Forbidden State (Customer logged in, but lacks SHOP_OWNER / ADMIN role)
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#0E0F11] text-[#F5F0E9] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#191A1D] border border-[#DF8D84]/40 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#DF8D84]/15 border border-[#DF8D84]/30 text-[#DF8D84] flex items-center justify-center mx-auto text-xl font-mono">
            ✕
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-[2px] text-[#DF8D84] uppercase font-bold">
              403 FORBIDDEN — TRUY CẬP BỊ TỪ CHỐI
            </span>
            <h1 className="font-editorial text-2xl font-normal mt-2 text-[#F5F0E9]">Không Đủ Quyền Hạn</h1>
            <p className="text-xs text-[#AAA5A0] mt-2 leading-relaxed">
              Tài khoản <strong className="text-[#F5F0E9]">{user.email}</strong> đang đăng nhập với vai trò{' '}
              <span className="font-mono text-[#E4BB78]">[{user.roles.join(', ')}]</span>. Bạn không có quyền truy cập vào cổng vận hành nội bộ.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={onNavigateStorefront}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl uppercase tracking-wider transition-all cursor-pointer font-bold"
            >
              ← Về Trang Mua Sắm
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2.5 border border-[#333235] hover:bg-white/5 text-[#AAA5A0] hover:text-[#F5F0E9] rounded-xl transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Authorized Owner Portal Shell (Dark Editorial Luxury)
  return (
    <div className="min-h-screen bg-[#0E0F11] text-[#F5F0E9] flex flex-col font-sans selection:bg-[#D6B27C] selection:text-[#191A1D]">
      {/* Top Navbar */}
      <header className="h-[72px] bg-[#111214]/95 backdrop-blur-md border-b border-[#333235] px-4 sm:px-6 lg:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <span className="font-editorial text-2xl font-bold tracking-tight text-white">
              IVRE<span className="text-[#D6B27C]">.</span>
            </span>
            <div className="pl-3 border-l border-[#534839] text-[9px] leading-tight tracking-[2.4px] text-[#D6B27C] font-bold">
              ATELIER<br />PORTAL
            </div>
          </div>

          {/* Breadcrumb (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2.5 text-xs text-[#AAA5A0]">
            <span className="text-[#777574]">/</span>
            <span className="text-white font-medium">
              {activeNav === 'orders'
                ? 'Quản lý Đơn hàng'
                : activeNav === 'products'
                ? 'Sản phẩm & Biến thể'
                : 'Tồn kho & Audit Trail'}
            </span>
          </div>
        </div>

        {/* Toolbar & User Area */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs">
          {/* Shop Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#191A1D] border border-[#333235] rounded-full text-[11px] font-mono text-[#AAA5A0]">
            <span className="w-2 h-2 rounded-full bg-[#8BC9A8] shadow-[0_0_8px_rgba(139,201,168,0.4)]" />
            <span>IVRE Atelier (ID: 1)</span>
          </div>

          {/* Storefront Nav Button */}
          <button
            type="button"
            onClick={onNavigateStorefront}
            className="px-3.5 py-1.5 border border-[#333235] hover:border-[#D6B27C] text-[#AAA5A0] hover:text-[#D6B27C] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Xem Storefront cửa hàng"
          >
            <span>Storefront</span>
            <span className="text-[10px]">↗</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#333235]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6B27C] to-[#AF8455] text-[#191A1D] font-bold text-xs flex items-center justify-center tracking-wider shadow-sm">
              AO
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-white leading-tight">{user.fullName || user.email}</div>
              <div className="text-[10px] text-[#D6B27C] font-mono tracking-wider font-bold">
                {user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN') ? 'ADMIN' : 'SHOP_OWNER'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="p-2 text-[#777574] hover:text-[#DF8D84] hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-xs"
            title="Đăng xuất khỏi Cổng quản trị"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Body: Desktop Sidebar + View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-64 bg-[#111214] border-r border-[#333235] p-5 shrink-0 flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-mono tracking-[2px] text-[#777574] uppercase font-bold mb-3 px-3">
                KHÔNG GIAN QUẢN TRỊ
              </div>
              <nav className="space-y-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveNav('orders')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                    activeNav === 'orders'
                      ? 'bg-gradient-to-r from-[#D6B27C]/20 to-[#D6B27C]/05 text-[#D6B27C] font-bold border border-[#D6B27C]/30 shadow-xs'
                      : 'text-[#AAA5A0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Quản lý Đơn hàng</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeNav === 'orders' ? 'bg-[#D6B27C]/20 text-[#D6B27C]' : 'bg-white/5 text-[#777574]'}`}>5C.1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNav('products')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                    activeNav === 'products'
                      ? 'bg-gradient-to-r from-[#D6B27C]/20 to-[#D6B27C]/05 text-[#D6B27C] font-bold border border-[#D6B27C]/30 shadow-xs'
                      : 'text-[#AAA5A0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Sản phẩm & Biến thể</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeNav === 'products' ? 'bg-[#D6B27C]/20 text-[#D6B27C]' : 'bg-white/5 text-[#777574]'}`}>5C.2</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNav('inventory')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                    activeNav === 'inventory'
                      ? 'bg-gradient-to-r from-[#D6B27C]/20 to-[#D6B27C]/05 text-[#D6B27C] font-bold border border-[#D6B27C]/30 shadow-xs'
                      : 'text-[#AAA5A0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Tồn kho & Audit Trail</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeNav === 'inventory' ? 'bg-[#D6B27C]/20 text-[#D6B27C]' : 'bg-white/5 text-[#777574]'}`}>5C.3</span>
                </button>
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-[2px] text-[#777574] uppercase font-bold mb-3 px-3">
                SẮP TRIỂN KHAI
              </div>
              <nav className="space-y-1.5 text-xs font-medium">
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[#777574]/50 cursor-not-allowed"
                  title="Sẽ triển khai trong Phase 5C.4"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Thư viện Ảnh Cloudinary</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-full text-[#777574]">5C.4</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[#777574]/50 cursor-not-allowed"
                  title="Sẽ triển khai trong Phase 5C.5"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Đối soát COD & Báo cáo</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-full text-[#777574]">5C.5</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="pt-4 border-t border-[#333235] text-[11px] text-[#AAA5A0] space-y-1">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-[#8BC9A8] shadow-[0_0_6px_rgba(139,201,168,0.5)]" />
              <span>IVRE Atelier Boutique</span>
            </div>
            <p className="text-[10px] text-[#777574]">Spring Boot 3 + React + MySQL</p>
          </div>
        </aside>

        {/* View Content Area: Full Width Responsive */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 pb-28 md:pb-10 w-full min-w-0">
          <div className="w-full">
            {activeNav === 'orders' && <OwnerOrdersView />}
            {activeNav === 'products' && <OwnerProductsView />}
            {activeNav === 'inventory' && <OwnerInventoryView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav aria-label="Điều hướng di động" className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111214]/98 backdrop-blur-lg border-t border-[#333235] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setActiveNav('orders')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 text-[10px] font-semibold transition-colors ${
            activeNav === 'orders' ? 'text-[#D6B27C]' : 'text-[#777574] hover:text-[#AAA5A0]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Đơn hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('products')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 text-[10px] font-semibold transition-colors ${
            activeNav === 'products' ? 'text-[#D6B27C]' : 'text-[#777574] hover:text-[#AAA5A0]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Sản phẩm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('inventory')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 text-[10px] font-semibold transition-colors ${
            activeNav === 'inventory' ? 'text-[#D6B27C]' : 'text-[#777574] hover:text-[#AAA5A0]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Tồn kho</span>
        </button>

        <button
          type="button"
          onClick={onNavigateStorefront}
          className="flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 text-[10px] font-semibold text-[#777574] hover:text-[#D6B27C] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Storefront</span>
        </button>
      </nav>
    </div>
  );
}
