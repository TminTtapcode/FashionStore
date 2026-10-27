import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import AuthModal from './components/AuthModal';
import MiniCartDrawer from './components/MiniCartDrawer';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CategoryFilterBar from './components/CategoryFilterBar';
import { getCategoriesApi, getProductsApi } from './api/catalogApi';
import type { Category, PageResponse, ProductFilterParams, ProductSummary } from './types/catalog';

function StorefrontContent() {
  const { user, isLoading: isAuthLoading, openAuthModal, logout } = useAuth();
  const { totalCount, openCart } = useCart();
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
      <header className="border-b border-[#E6E4DF] sticky top-0 bg-[#FAF9F6]/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tracking-widest text-[#666666] border border-[#E6E4DF] px-2 py-0.5 hidden sm:inline-block">
              EST. 2026
            </span>
            <a href="/" className="font-serif text-2xl tracking-tighter uppercase font-medium hover:opacity-80 transition-opacity">
              FASHION STORE
            </a>
          </div>

          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-[#666666]">
            <a href="#catalog" className="hover:text-[#121212] transition-colors">BỘ SƯU TẬP</a>
            <a href="#lookbook" className="hover:text-[#121212] transition-colors">EDITORIAL LOOKBOOK</a>
            <a href="#atelier" className="hover:text-[#121212] transition-colors">CHẤT LIỆU VẢI</a>
          </nav>

          <div className="flex items-center gap-3 font-mono text-xs">
            {/* Cart Button with Count Badge */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Giỏ hàng ${totalCount} sản phẩm`}
              className="border border-[#121212] px-3 py-1 tracking-widest uppercase hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer text-xs flex items-center gap-2 group"
            >
              <span>GIỎ HÀNG</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-xs transition-colors ${
                totalCount > 0 ? 'bg-[#121212] text-white group-hover:bg-white group-hover:text-[#121212]' : 'bg-[#E6E4DF] text-[#666666]'
              }`}>
                {totalCount}
              </span>
            </button>

            {isAuthLoading ? (
              <span className="text-[#888888] animate-pulse">[CHECKING...]</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="border border-emerald-600 bg-emerald-50 text-emerald-900 px-2 py-0.5 tracking-wider uppercase font-bold text-[11px]">
                  {user.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="border border-[#121212] px-2.5 py-1 tracking-widest uppercase hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer text-[11px]"
                >
                  ĐĂNG XUẤT
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="border border-[#121212] px-3 py-1 tracking-widest uppercase hover:bg-[#121212] hover:text-[#FAF9F6] transition-colors cursor-pointer text-xs"
              >
                [ TÀI KHOẢN ]
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Editorial Campaign Banner */}
      <section aria-label="Campaign Hero" className="relative border-b border-[#E6E4DF] bg-[#F4F1EA] py-14 sm:py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#666666]">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="tracking-widest uppercase font-semibold">PHASE 2 — APPAREL CATALOG & REAL-TIME LOOKBOOK</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif tracking-tight leading-[1.08] uppercase text-[#121212]">
              The Atelier Drop 2026. <br />
              <span className="italic font-normal lowercase font-serif text-3xl sm:text-5xl text-[#555555]">
                tinh tế trong từng thớ vải.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#555555] font-light max-w-xl leading-relaxed">
              Bộ sưu tập chuyên biệt cho thời trang may mặc: đầm lụa maxi, áo sơ mi Oxford, áo khoác blazer linen và denim vintage. Quản lý biến thể chuẩn mực theo size và màu sắc swatch trực quan.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 font-mono text-xs">
              <span className="border border-[#121212] bg-[#121212] text-[#FAF9F6] px-2.5 py-0.5 tracking-wider uppercase text-[11px]">
                100% THỜI TRANG MAY MẶC
              </span>
              <span className="border border-[#D4D2CD] bg-white text-[#333333] px-2.5 py-0.5 tracking-wider uppercase text-[11px]">
                SIZE S/M/L & 28-34
              </span>
              <span className="border border-[#D4D2CD] bg-white text-[#333333] px-2.5 py-0.5 tracking-wider uppercase text-[11px]">
                COLOR SWATCHES ĐỒNG BỘ
              </span>
              <span className="border border-[#D4D2CD] bg-white text-[#333333] px-2.5 py-0.5 tracking-wider uppercase text-[11px]">
                SIZE GUIDE THEO CM
              </span>
            </div>
          </div>

          <div className="border border-[#121212] bg-white p-5 w-full md:w-80 shadow-md font-mono text-xs space-y-2.5">
            <span className="font-bold tracking-widest text-[#888888] uppercase block border-b border-[#E6E4DF] pb-1">
              [ SHOP SIGNATURE GUARANTEE ]
            </span>
            <ul className="text-xs text-[#555555] space-y-1.5 list-disc list-inside">
              <li>Thanh toán COD khi nhận hàng</li>
              <li>Kiểm tra hàng trước khi nhận</li>
              <li>Đổi size miễn phí trong 7 ngày</li>
              <li>Tồn kho nguyên tử theo từng SKU</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main id="catalog" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
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
              <div key={i} className="animate-pulse flex flex-col space-y-3 bg-white border border-[#E6E4DF] p-3">
                <div className="bg-[#EFECE6] aspect-[3/4] w-full"></div>
                <div className="h-3 bg-[#EFECE6] w-3/4"></div>
                <div className="h-3 bg-[#EFECE6] w-1/2"></div>
              </div>
            ))}
          </div>
        ) : catalogError ? (
          <div className="text-center py-16 border border-red-200 bg-red-50 p-6 space-y-3 font-mono text-xs text-red-700">
            <p>Không thể kết nối danh mục: {catalogError}</p>
            <button
              type="button"
              onClick={() => handleFilterChange({ ...filters })}
              className="border border-red-700 px-3 py-1 uppercase hover:bg-red-700 hover:text-white"
            >
              Thử lại
            </button>
          </div>
        ) : !productsData || productsData.items.length === 0 ? (
          <div className="text-center py-20 border border-[#E6E4DF] bg-white p-8 space-y-4">
            <span className="font-serif text-3xl text-[#888888] font-light">Không tìm thấy sản phẩm phù hợp</span>
            <p className="text-sm font-mono text-[#666666]">
              Hãy thử bỏ bớt bộ lọc kích cỡ hoặc màu sắc để xem thêm các mẫu trang phục khác.
            </p>
            <button
              type="button"
              onClick={() => handleFilterChange({ sort: 'newest', page: 0 })}
              className="border border-[#121212] px-5 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
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
          <div className="pt-8 border-t border-[#E6E4DF] flex items-center justify-between font-mono text-xs">
            <button
              type="button"
              disabled={!productsData.hasPrevious}
              onClick={() => handleFilterChange({ ...filters, page: filters.page! - 1 })}
              className="px-4 py-2 border border-[#E6E4DF] uppercase tracking-wider hover:border-[#121212] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              &larr; Trang trước
            </button>

            <span className="text-[#666666]">
              Trang {productsData.page + 1} / {productsData.totalPages}
            </span>

            <button
              type="button"
              disabled={!productsData.hasNext}
              onClick={() => handleFilterChange({ ...filters, page: filters.page! + 1 })}
              className="px-4 py-2 border border-[#E6E4DF] uppercase tracking-wider hover:border-[#121212] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Trang sau &rarr;
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E4DF] py-10 bg-white text-xs font-mono text-[#888888] mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-serif text-sm tracking-tight text-[#121212] font-medium">FASHION STORE ATELIER</span>
            <span>&copy; 2026 FASHION STORE. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] tracking-widest uppercase">
            <a href="#policy" className="hover:text-[#121212]">Chính sách đổi trả</a>
            <a href="#size" className="hover:text-[#121212]">Bảng quy đổi Size</a>
            <a href="#care" className="hover:text-[#121212]">Hướng dẫn giặt ủi</a>
            <a href="#contact" className="hover:text-[#121212]">Liên hệ cửa hàng</a>
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
      <MiniCartDrawer />
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
