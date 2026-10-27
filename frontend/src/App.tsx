import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import AuthModal from './components/AuthModal';
import MiniCartDrawer from './components/MiniCartDrawer';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CategoryFilterBar from './components/CategoryFilterBar';
import VirtualStylingStudio from './components/VirtualStylingStudio';
import AtcShader from './components/ui/atc-shader';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderHistoryDrawer } from './components/OrderHistoryDrawer';
import { getCategoriesApi, getProductsApi } from './api/catalogApi';
import type { Category, PageResponse, ProductFilterParams, ProductSummary } from './types/catalog';

function StorefrontContent() {
  const { user, isLoading: isAuthLoading, openAuthModal, logout } = useAuth();
  const { totalCount, openCart, closeCart } = useCart();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsData, setProductsData] = useState<PageResponse<ProductSummary> | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilterParams>({
    sort: 'newest',
    page: 0,
    limit: 12,
  });

  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [isStylingStudioOpen, setIsStylingStudioOpen] = useState(false);
  const [isRunwayActive, setIsRunwayActive] = useState(true);

  // Load Categories on mount
  useEffect(() => {
    getCategoriesApi()
      .then((data) => setCategories(data))
      .catch((err) => console.error('Lỗi tải danh mục:', err));
  }, []);

  // Load Products whenever filters change
  useEffect(() => {
    setIsCatalogLoading(true);
    setCatalogError(null);

    getProductsApi(filters)
      .then((data) => setProductsData(data))
      .catch((err) => setCatalogError(err.message || 'Lỗi tải danh sách sản phẩm'))
      .finally(() => setIsCatalogLoading(false));
  }, [filters]);

  const handleFilterChange = (newFilters: ProductFilterParams) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col relative text-[#F7F7F4] selection:bg-[#C7AD83] selection:text-[#151518]">
      {/* 1. Persistent Living Digital Runway Shader Background */}
      {isRunwayActive && (
        <div className="fixed inset-0 z-0 w-full h-full pointer-events-none overflow-hidden transition-opacity duration-700">
          <AtcShader
            speed={0.38}
            intensity={0.36}
            enableScrollReactive={true}
            className="w-full h-full"
            overlayClassName="bg-black/20"
          />
          {/* Soft Luxury Vignette around viewport edges */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,6,8,0.65)_100%)]" />
        </div>
      )}

      {/* Fallback dark void when runway is toggled off */}
      {!isRunwayActive && (
        <div className="fixed inset-0 z-0 bg-[#0A0B0E] pointer-events-none" />
      )}

      {/* Main Content Area Floating Over The Living Shader Space */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Banner: Welcome Incentive */}
        {!bannerDismissed && (
          <aside aria-label="Welcome Incentive" className="bg-[#121316]/75 backdrop-blur-md text-[#F7F7F4] text-xs py-2 px-4 tracking-wider uppercase flex justify-between items-center transition-all border-b border-white/10 z-40 relative">
          <div className="flex-1 text-center font-mono">
            {user ? (
              <span>
                Chào mừng <span className="font-bold underline text-[#C7AD83]">{user.fullName}</span>! Mã voucher <span className="font-bold tracking-widest bg-white/20 px-1.5 py-0.5 text-white">WELCOME10</span> (giảm 10%) đã kích hoạt.
              </span>
            ) : (
              <span>
                Tặng mã <span className="font-bold underline tracking-widest text-[#C7AD83]">WELCOME10</span> giảm 10% cho đơn hàng đầu tiên khi{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="underline cursor-pointer hover:text-[#C7AD83] font-bold"
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
            className="text-white/40 hover:text-white ml-4 w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L11 11M1 11L11 1" strokeLinecap="round" />
            </svg>
          </button>
        </aside>
      )}

      {/* Header: Ultra-Slim Translucent Dark Luxury Navigation */}
      <header className="border-b border-white/10 sticky top-0 bg-black/40 backdrop-blur-md z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="font-editorial text-2xl sm:text-3xl tracking-tight font-medium hover:opacity-80 transition-opacity text-white">
              Ivre<span className="text-[#C7AD83]">.</span>
            </a>
            <span className="hidden md:inline-block font-mono text-[10px] tracking-widest uppercase text-gray-400 border-l border-white/15 pl-3">
              DIGITAL LUXURY ATELIER
            </span>
          </div>

          {/* Main Navigation */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-[0.2em] text-white/70">
            <a href="#catalog" className="hover:text-[#C7AD83] transition-colors">SHOP</a>
            <a href="#catalog" className="hover:text-[#C7AD83] transition-colors">COLLECTIONS</a>
            <button
              type="button"
              onClick={() => setIsStylingStudioOpen(true)}
              className="hover:text-[#C7AD83] transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-white"
            >
              <span>STYLING STUDIO</span>
              <span className="bg-[#C7AD83] text-[#151518] text-[9px] px-1.5 py-0.2 rounded-xs font-mono font-bold tracking-normal">
                ✦ 2.5D
              </span>
            </button>
            <a href="#footer" className="hover:text-[#C7AD83] transition-colors">ABOUT</a>
          </nav>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4 font-mono text-xs">
            {/* Cart Button with Count Badge - Clean & High Priority */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Giỏ hàng ${totalCount} sản phẩm`}
              className="border border-[#C7AD83]/70 bg-[#C7AD83]/15 text-white hover:bg-[#C7AD83] hover:text-[#151518] px-3.5 py-1.5 tracking-widest uppercase transition-all cursor-pointer text-xs flex items-center gap-2 group rounded-xs font-bold shadow-xs"
            >
              <span>GIỎ HÀNG</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-xs transition-colors ${
                totalCount > 0 ? 'bg-[#C7AD83] text-[#151518]' : 'bg-white/20 text-white/70'
              }`}>
                {totalCount}
              </span>
            </button>

            {/* Account / User Section - Elegant Ghost Typography */}
            {isAuthLoading ? (
              <span className="text-gray-400 animate-pulse text-[11px]">Đang kiểm tra...</span>
            ) : user ? (
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsOrderHistoryOpen(true)}
                  className="text-[#C7AD83] hover:underline tracking-wider uppercase font-semibold cursor-pointer"
                  title="Xem lịch sử đơn hàng"
                >
                  {user.fullName}
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => setIsOrderHistoryOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer uppercase tracking-wider text-[11px]"
                >
                  ĐƠN HÀNG
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer underline uppercase tracking-wider"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-gray-300 hover:text-white hover:text-[#C7AD83] transition-colors cursor-pointer text-xs uppercase tracking-[0.15em] font-medium"
              >
                TÀI KHOẢN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section: Floating Over The Living Shader Space */}
      <section aria-label="Campaign Hero" className="relative border-b border-white/10 bg-transparent overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[640px]">
          {/* Left Column: Floating Typography (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-14 lg:p-18 flex flex-col justify-between space-y-8 bg-black/20 backdrop-blur-[2px]">
            {/* Campaign Breadcrumb & Living Space Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#C7AD83] tracking-[0.25em] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#C7AD83] animate-pulse"></span>
                <span>CAMPAIGN 01 · DIGITAL RUNWAY DROP 2026</span>
              </div>

              <button
                type="button"
                onClick={() => setIsRunwayActive(!isRunwayActive)}
                title="Bật / tắt không gian Shader sống động"
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider border rounded-full transition-all cursor-pointer ${
                  isRunwayActive
                    ? 'border-[#C7AD83] bg-[#C7AD83]/20 text-[#C7AD83]'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span className={isRunwayActive ? 'text-[#C7AD83]' : 'text-gray-500'}>✦</span>
                <span>{isRunwayActive ? 'SHADER SPACE: ON' : 'SHADER SPACE: OFF'}</span>
              </button>
            </div>

            {/* Grand Editorial Headline */}
            <div className="space-y-6">
              <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.02] text-white">
                The Urbanist <br />
                <span className="text-[#C7AD83]">Couture</span>
              </h1>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#catalog"
                  className="inline-block border border-white bg-white text-[#151518] px-8 py-3.5 text-xs font-mono uppercase tracking-[0.25em] font-bold hover:bg-transparent hover:text-white transition-all cursor-pointer shadow-lg rounded-xs"
                >
                  SHOP NOW
                </a>
                <button
                  type="button"
                  onClick={() => setIsStylingStudioOpen(true)}
                  className="inline-flex items-center gap-2 border border-[#C7AD83] text-[#F7F7F4] bg-[#C7AD83]/20 backdrop-blur-xs px-6 py-3.5 text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-[#C7AD83] hover:text-[#151518] transition-all cursor-pointer rounded-xs"
                >
                  <span>✦ THỬ PHỐI ĐỒ TRỰC QUAN</span>
                </button>
              </div>
            </div>

            {/* Philosophical Fashion Manifesto */}
            <p className="text-xs sm:text-sm font-serif text-white/70 italic max-w-lg leading-relaxed pt-6 border-t border-white/15">
              "Every detail in the fashion you wear must be considered to maintain the feel of the style you choose and to show your character in an authentic digital fashion era."
            </p>
          </div>

          {/* Right Column: Warm Camel Tone with High-Fashion Model Portrait (5 cols) */}
          <div className="lg:col-span-5 relative bg-[#BA9F84]/20 border-l border-white/10 overflow-hidden min-h-[450px] lg:min-h-full flex items-center justify-center">
            {/* High-Fashion Portrait Image */}
            <img
              src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85"
              alt="The Urbanist Couture Lookbook"
              className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-[1.02]"
            />

            {/* Vertical Lookbook Slider Indicator */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 font-mono text-xs text-white/90 select-none z-10">
              <span className="opacity-100 font-bold">01</span>
              <div className="w-[1px] h-10 bg-white/40 relative">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white" />
              </div>
              <span className="opacity-50">02</span>
              <span className="opacity-50">03</span>
            </div>

            {/* Subtle Overlay Badge */}
            <div className="absolute bottom-6 left-6 bg-[#0E0F12]/85 backdrop-blur-md text-[#F7F7F4] px-4 py-2 font-mono text-[11px] tracking-widest uppercase border border-white/20">
              LOOK 01 · CAMEL COUTURE TRENCH
            </div>
          </div>
        </div>
      </section>

      {/* Style It Your Way Feature Banner (Virtual Styling Studio Gateway) */}
      <section aria-label="Styling Studio Teaser" className="border-b border-white/10 bg-black/35 backdrop-blur-md py-10 px-6 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#C7AD83] tracking-widest uppercase">
              <span className="bg-[#C7AD83] text-[#151518] px-1.5 py-0.2 font-bold rounded-2xs">FEATURE</span>
              <span className="font-bold">VIRTUAL STYLING STUDIO 2.5D</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-white">
              Tự Phối Trang Phục Theo Phong Cách Của Riêng Bạn
            </h2>
            <p className="text-xs text-gray-300 font-mono">
              Ghép áo, quần, váy và blazer trên mô hình ma-nơ-canh trực quan · Nhận ưu đãi 10% khi mua cả bộ outfit.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsStylingStudioOpen(true)}
            className="border-2 border-[#C7AD83] bg-[#C7AD83] text-[#151518] hover:bg-transparent hover:text-white px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer whitespace-nowrap shadow-lg rounded-xs"
          >
            MỞ PHÒNG PHỐI ĐỒ (STUDIO) ✦
          </button>
        </div>
      </section>

      {/* Main Catalog Section: Floating Over The Living Shader Runway */}
      <section id="catalog-section" className="relative z-10 bg-transparent border-t border-white/10">
        <main id="catalog" className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-14 w-full space-y-10">
          {/* Category Navigation & Filter Bar */}
          <CategoryFilterBar
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            totalProducts={productsData?.totalElements || 0}
          />

          {/* Product Grid Area */}
          {isCatalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col space-y-3 bg-white/5 border border-white/10 p-3 rounded-xs">
                  <div className="bg-white/10 aspect-[3/4] w-full rounded-2xs"></div>
                  <div className="h-3 bg-white/10 w-3/4"></div>
                  <div className="h-3 bg-white/10 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <div className="text-center py-16 border border-red-500/30 bg-red-950/20 p-6 space-y-3 font-mono text-xs text-red-400 rounded-xs">
              <p>Không thể kết nối danh mục: {catalogError}</p>
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters })}
                className="border border-red-500 px-3 py-1 uppercase hover:bg-red-500 hover:text-white"
              >
                Thử lại
              </button>
            </div>
          ) : !productsData || productsData.items.length === 0 ? (
            <div className="text-center py-20 border border-white/10 bg-[#121316]/80 backdrop-blur-md p-8 space-y-4 rounded-xs">
              <span className="font-editorial text-3xl text-gray-400 font-light">Không tìm thấy sản phẩm phù hợp</span>
              <p className="text-sm font-mono text-gray-400">
                Hãy thử bỏ bớt bộ lọc kích cỡ hoặc màu sắc để xem thêm các mẫu trang phục khác.
              </p>
              <button
                type="button"
                onClick={() => handleFilterChange({ sort: 'newest', page: 0 })}
                className="border border-white text-white px-5 py-2 font-mono text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer rounded-xs"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {productsData.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(slug) => setSelectedProductSlug(slug)}
                />
              ))}
            </div>
          )}

          {/* Pagination Bar */}
          {productsData && productsData.totalPages > 1 && (
            <div className="pt-8 border-t border-white/10 flex items-center justify-between font-mono text-xs">
              <button
                type="button"
                disabled={!productsData.hasPrevious}
                onClick={() => handleFilterChange({ ...filters, page: filters.page! - 1 })}
                className="px-4 py-2 border border-white/20 text-white uppercase tracking-wider hover:border-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-xs"
              >
                &larr; Trang trước
              </button>

              <span className="text-gray-400">
                Trang {productsData.page + 1} / {productsData.totalPages}
              </span>

              <button
                type="button"
                disabled={!productsData.hasNext}
                onClick={() => handleFilterChange({ ...filters, page: filters.page! + 1 })}
                className="px-4 py-2 border border-white/20 text-white uppercase tracking-wider hover:border-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-xs"
              >
                Trang sau &rarr;
              </button>
            </div>
          )}
        </main>
      </section>

      {/* Footer */}
      <footer id="footer" className="border-t border-white/10 py-12 bg-black/40 backdrop-blur-md text-xs font-mono text-gray-400 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-editorial text-lg tracking-tight text-white font-medium">IVRE. ATELIER</span>
            <span>&copy; 2026 FASHION STORE 2.0 · HYBRID LUXURY COUTURE.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] tracking-widest uppercase text-gray-300">
            <a href="#policy" className="hover:text-white hover:text-[#C7AD83]">Chính sách đổi trả</a>
            <a href="#size" className="hover:text-white hover:text-[#C7AD83]">Bảng quy đổi Size</a>
            <a href="#care" className="hover:text-white hover:text-[#C7AD83]">Hướng dẫn bảo quản</a>
            <a href="#contact" className="hover:text-white hover:text-[#C7AD83]">Liên hệ Studio</a>
          </div>
        </div>
      </footer>

      {/* Interactive Modals & Drawers */}
      <AuthModal />
      <ProductDetailModal
        slug={selectedProductSlug}
        isOpen={Boolean(selectedProductSlug)}
        onClose={() => setSelectedProductSlug(null)}
      />
      <MiniCartDrawer
        onProceedToCheckout={() => {
          closeCart();
          if (!user) {
            openAuthModal('login');
          } else {
            setIsCheckoutOpen(true);
          }
        }}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
      />
      <OrderHistoryDrawer
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
      />
      <VirtualStylingStudio
        isOpen={isStylingStudioOpen}
        onClose={() => setIsStylingStudioOpen(false)}
      />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}
