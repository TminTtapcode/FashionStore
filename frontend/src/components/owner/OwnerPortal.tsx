import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OwnerOrdersView from './OwnerOrdersView';
import OwnerProductsView from './OwnerProductsView';

interface OwnerPortalProps {
  onNavigateStorefront: () => void;
}

export default function OwnerPortal({ onNavigateStorefront }: OwnerPortalProps) {
  const { user, isLoading, logout, openAuthModal } = useAuth();
  const [activeNav, setActiveNav] = useState<'orders' | 'products' | 'inventory' | 'media' | 'analytics'>('orders');

  // RBAC Role Verification: accepts both 'SHOP_OWNER' / 'ADMIN' or 'ROLE_SHOP_OWNER' / 'ROLE_ADMIN'
  const isOwner = Boolean(
    user &&
      Array.isArray(user.roles) &&
      user.roles.some((r) => ['SHOP_OWNER', 'ROLE_SHOP_OWNER', 'ADMIN', 'ROLE_ADMIN'].includes(r))
  );

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col items-center justify-center font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#C7AD83] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-white/60 tracking-wider">ĐANG XÁC THỰC QUYỀN HẠN ATELIER OWNER...</span>
      </div>
    );
  }

  // 2. 401 Unauthorized State (Guest)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111218] border border-white/10 rounded-xs p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto text-xl font-mono">
            !
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#C7AD83] uppercase font-bold">
              YÊU CẦU XÁC THỰC
            </span>
            <h1 className="font-editorial text-2xl font-medium mt-1 text-white">Cổng Quản Trị Atelier</h1>
            <p className="text-xs text-white/60 mt-2 font-sans leading-relaxed">
              Khu vực quản trị chỉ dành riêng cho Chủ cửa hàng (SHOP_OWNER) và Quản trị viên hệ thống (ADMIN). Vui lòng
              đăng nhập để tiếp tục.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-bold rounded-2xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Đăng nhập Quản trị
            </button>
            <button
              type="button"
              onClick={onNavigateStorefront}
              className="w-full sm:w-auto px-5 py-2.5 border border-white/20 hover:bg-white/5 text-white/80 hover:text-white rounded-2xs transition-colors cursor-pointer"
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
      <div className="min-h-screen bg-[#0A0B0E] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111218] border border-rose-500/30 rounded-xs p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-center mx-auto text-xl font-mono">
            ✕
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-bold">
              403 FORBIDDEN — TRUY CẬP BỊ TỪ CHỐI
            </span>
            <h1 className="font-editorial text-2xl font-medium mt-1 text-white">Không Đủ Quyền Hạn</h1>
            <p className="text-xs text-white/60 mt-2 font-sans leading-relaxed">
              Tài khoản <strong className="text-white">{user.email}</strong> đang đăng nhập với vai trò{' '}
              <span className="font-mono text-amber-300">[{user.roles.join(', ')}]</span>. Bạn không có quyền truy cập
              vào hệ thống vận hành cửa hàng.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
            <button
              type="button"
              onClick={onNavigateStorefront}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#C7AD83] hover:bg-[#D9C09A] text-[#0A0B0E] font-bold rounded-2xs uppercase tracking-wider transition-all cursor-pointer"
            >
              ← Về Trang Mua Sắm
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2.5 border border-white/20 hover:bg-white/5 text-white/70 hover:text-white rounded-2xs transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Authorized Owner Portal Shell
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F7F7F4] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0E0F14] border-b border-white/10 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-xl font-bold tracking-tight text-white">IVRE.</span>
            <span className="h-4 w-[1px] bg-white/20" />
            <span className="text-[11px] font-mono tracking-widest text-[#C7AD83] uppercase font-bold">
              OWNER PORTAL
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/10 text-xs font-mono text-white/50">
            <span>Cửa hàng:</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded-2xs border border-white/10">
              IVRE Atelier (ID: 1)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80">{user.fullName || user.email}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#C7AD83]/20 text-[#C7AD83] border border-[#C7AD83]/30 rounded-2xs uppercase font-bold">
              {user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN') ? 'ADMIN' : 'SHOP_OWNER'}
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateStorefront}
            className="px-3 py-1.5 border border-white/20 hover:border-[#C7AD83] hover:text-[#C7AD83] rounded-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Xem Storefront cửa hàng"
          >
            <span>Storefront</span>
            <span className="text-[10px]">↗</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Đăng xuất khỏi Cổng quản trị"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Body: Sidebar + View Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-[#0E0F14]/70 border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0 space-y-6">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-bold mb-2 px-2">
              QUẢN LÝ VẬN HÀNH
            </div>
            <nav className="space-y-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveNav('orders')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xs transition-all cursor-pointer ${
                  activeNav === 'orders'
                    ? 'bg-[#C7AD83]/15 text-[#C7AD83] font-bold border border-[#C7AD83]/40 shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>📦</span>
                  <span>Quản lý Đơn hàng</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#C7AD83]/20 rounded-full font-bold">5C.1</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('products')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xs transition-all cursor-pointer ${
                  activeNav === 'products'
                    ? 'bg-[#C7AD83]/15 text-[#C7AD83] font-bold border border-[#C7AD83]/40 shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>👗</span>
                  <span>Sản phẩm & Biến thể</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#C7AD83]/20 rounded-full font-bold">5C.2</span>
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xs text-white/30 cursor-not-allowed"
                title="Sẽ triển khai trong Phase 5C.3"
              >
                <div className="flex items-center gap-2.5">
                  <span>🏷️</span>
                  <span>Tồn kho & Audit Trail</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 bg-white/5 rounded-2xs text-white/20">5C.3</span>
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xs text-white/30 cursor-not-allowed"
                title="Sẽ triển khai trong Phase 5C.4"
              >
                <div className="flex items-center gap-2.5">
                  <span>🖼️</span>
                  <span>Thư viện Ảnh Cloudinary</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 bg-white/5 rounded-2xs text-white/20">5C.4</span>
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xs text-white/30 cursor-not-allowed"
                title="Sẽ triển khai trong Phase 5C.5"
              >
                <div className="flex items-center gap-2.5">
                  <span>📊</span>
                  <span>Đối soát COD & Báo cáo</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 bg-white/5 rounded-2xs text-white/20">5C.5</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-white/40 space-y-1 px-2">
            <p>FashionStore Modular Monolith</p>
            <p className="text-[10px] text-white/30">Architecture: Spring Boot 3 + MySQL 8</p>
          </div>
        </aside>

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* View Header */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#C7AD83] uppercase font-bold">
                {activeNav === 'orders' ? 'OPERATIONS DASHBOARD' : 'CATALOG & INVENTORY ATELIER'}
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-medium mt-1 text-white">
                {activeNav === 'orders' ? 'Quản lý Vòng đời Đơn hàng' : 'Quản lý Sản phẩm & Biến thể'}
              </h1>
              <p className="text-xs text-white/50 mt-1 font-sans">
                {activeNav === 'orders'
                  ? 'Theo dõi, xác nhận đóng gói, bàn giao vận chuyển và xử lý hàng hoàn về kho theo state machine nghiêm ngặt.'
                  : 'Khởi tạo sản phẩm, sinh ma trận biến thể theo size/màu, quản lý SKU chuẩn hóa và điều phối vòng đời DRAFT → ACTIVE → HIDDEN → ARCHIVED.'}
              </p>
            </div>

            {/* Active View */}
            {activeNav === 'orders' && <OwnerOrdersView />}
            {activeNav === 'products' && <OwnerProductsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
