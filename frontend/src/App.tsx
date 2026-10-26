import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

function StorefrontContent() {
  const { user, isLoading, openAuthModal, logout } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#121212] selection:bg-[#121212] selection:text-[#FAF9F6]">
      {/* Top Banner: Welcome Incentive */}
      {!bannerDismissed && (
        <aside aria-label="Welcome Incentive" className="bg-[#121212] text-[#FAF9F6] text-xs py-2 px-4 tracking-wider uppercase flex justify-between items-center transition-all">
          <div className="flex-1 text-center font-mono">
            {user ? (
              <span>
                Chào mừng <span className="font-bold underline">{user.fullName}</span>! Mã voucher <span className="font-bold tracking-widest bg-white/20 px-1.5 py-0.5">WELCOME10</span> (giảm 10%) đã kích hoạt.
              </span>
            ) : (
              <span>
                Tặng mã <span className="font-bold underline tracking-widest">WELCOME10</span> giảm 10% cho đơn hàng đầu tiên khi{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="underline cursor-pointer hover:text-emerald-400 font-bold"
                >
                  đăng ký tài khoản
                </button>
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => setBannerDismissed(true)}
            aria-label="Đóng banner thông báo"
            className="text-[#999999] hover:text-[#FAF9F6] ml-4 text-sm font-mono cursor-pointer"
          >
            [X]
          </button>
        </aside>
      )}

      {/* Header */}
      <header className="border-b border-[#E6E4DF] sticky top-0 bg-[#FAF9F6]/90 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-widest text-[#666666] border border-[#E6E4DF] px-2 py-0.5">
              EST. 2026
            </span>
            <a href="/" className="font-serif text-2xl tracking-tighter uppercase font-medium hover:opacity-80 transition-opacity">
              FASHION STORE
            </a>
          </div>

          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <a href="#new" className="hover:text-[#666666] transition-colors">NEW ARRIVALS</a>
            <a href="#collection" className="hover:text-[#666666] transition-colors">COLLECTION</a>
            <a href="#lookbook" className="hover:text-[#666666] transition-colors">LOOKBOOK</a>
            <a href="#about" className="hover:text-[#666666] transition-colors">ABOUT</a>
          </nav>

          <div className="flex items-center gap-4 font-mono text-xs">
            {isLoading ? (
              <span className="text-[#888888] animate-pulse">[CHECKING SESSION...]</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="border border-emerald-600 bg-emerald-50 text-emerald-900 px-2.5 py-1 tracking-wider uppercase font-bold">
                  {user.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="border border-[#121212] px-2.5 py-1 tracking-widest uppercase hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer"
                >
                  ĐĂNG XUẤT
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="border border-[#121212] px-3 py-1 tracking-widest uppercase hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer"
                >
                  [ ĐĂNG NHẬP / ĐĂNG KÝ ]
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#666666]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>PHASE 1 FOUNDATION — IDENTITY & HTTPONLY COOKIE AUTH READY</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-[1.08] uppercase">
            Curated Garments, <br />
            Architected with Rigor.
          </h1>

          <p className="text-lg md:text-xl text-[#555555] font-light max-w-2xl leading-relaxed">
            Hệ thống xác thực chuẩn Stateless qua HttpOnly Cookie đã kích hoạt. Bảo vệ hoàn toàn trước tấn công XSS, tự động tặng mã giảm giá chào mừng cho khách hàng mới.
          </p>

          {/* Interactive User State Callout */}
          <div className="border border-[#121212] bg-white p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#E6E4DF] pb-2">
              <span className="font-bold tracking-widest text-[#888888] uppercase">[ CURRENT SESSION STATUS ]</span>
              <span className={`px-2 py-0.5 uppercase font-bold ${user ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {user ? 'AUTHENTICATED' : 'GUEST'}
              </span>
            </div>

            {user ? (
              <div className="space-y-1 text-[#333333]">
                <p><strong>EMAIL:</strong> {user.email}</p>
                <p><strong>HỌ VÀ TÊN:</strong> {user.fullName}</p>
                <p><strong>VAI TRÒ (ROLES):</strong> {user.roles.join(', ')}</p>
                {user.welcomeCoupon && (
                  <div className="mt-3 p-3 bg-[#FAF9F6] border border-[#E6E4DF]">
                    <span className="font-bold text-emerald-700 uppercase">[VOUCHER CHÀO MỪNG ĐÃ SẴN SÀNG]</span>
                    <p className="mt-1">Mã: <strong>{user.welcomeCoupon.code}</strong> — Giảm {user.welcomeCoupon.discountValue}% (Áp dụng cho đơn hàng đầu tiên)</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-[#666666]">
                <p>Bạn đang duyệt website với tư cách <strong>Khách vãng lai (Guest)</strong>.</p>
                <p>Theo ADR-007, hệ thống yêu cầu đăng nhập trước khi checkout để đảm bảo toàn vẹn đơn hàng và kích hoạt mã giảm giá đầu tiên.</p>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="mt-2 inline-block bg-[#121212] text-[#FAF9F6] px-4 py-2 uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  ĐĂNG KÝ NGAY ĐỂ NHẬN VOUCHER WELCOME10
                </button>
              </div>
            )}
          </div>

          {/* Signature Badges / Tags */}
          <div className="pt-2 flex flex-wrap gap-2 font-mono text-xs">
            <span className="border border-[#121212] bg-[#121212] text-[#FAF9F6] px-3 py-1 tracking-wider uppercase">
              MODULAR MONOLITH
            </span>
            <span className="border border-emerald-600 bg-emerald-50 text-emerald-900 px-3 py-1 tracking-wider uppercase font-bold">
              &check; HTTPONLY COOKIE AUTH
            </span>
            <span className="border border-emerald-600 bg-emerald-50 text-emerald-900 px-3 py-1 tracking-wider uppercase font-bold">
              &check; WELCOME INCENTIVE
            </span>
            <span className="border border-[#D4D2CD] bg-white text-[#333333] px-3 py-1 tracking-wider uppercase">
              COD PAYMENT FIRST
            </span>
          </div>
        </div>

        {/* Phase Architecture preview */}
        <section aria-labelledby="foundation-status-title" className="mt-16 pt-12 border-t border-[#E6E4DF] grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-[#E6E4DF] bg-white p-6 space-y-2">
            <span className="font-mono text-xs text-[#888888]">[AUTH PIPELINE]</span>
            <h2 id="foundation-status-title" className="font-serif text-lg uppercase font-medium">JWT in HttpOnly Cookie</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Token được bảo vệ trong cookie <code>fs_session</code> với thuộc tính HttpOnly và SameSite=Lax, chống lại rủi ro XSS.
            </p>
          </div>

          <div className="border border-[#E6E4DF] bg-white p-6 space-y-2">
            <span className="font-mono text-xs text-[#888888]">[PROMOTION DOMAIN]</span>
            <h2 className="font-serif text-lg uppercase font-medium">Welcome Voucher</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Tự động liên kết mã <code>WELCOME10</code> khi đăng ký tài khoản thành công để tăng tỷ lệ chuyển đổi đơn hàng đầu tiên.
            </p>
          </div>

          <div className="border border-[#E6E4DF] bg-white p-6 space-y-2">
            <span className="font-mono text-xs text-[#888888]">[NEXT: PHASE 2]</span>
            <h2 className="font-serif text-lg uppercase font-medium">Catalog Experience</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Sản phẩm, biến thể (Size/Màu), thư viện ảnh editorial lookbook và bộ lọc tìm kiếm sản phẩm.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E4DF] py-8 text-center text-xs font-mono text-[#888888]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; 2026 FASHION STORE. ALL RIGHTS RESERVED.</span>
          <span className="tracking-widest">PHASE 1 FOUNDATION &bull; IDENTITY VERTICAL SLICE</span>
        </div>
      </footer>

      {/* Auth Modal Component */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorefrontContent />
    </AuthProvider>
  );
}
