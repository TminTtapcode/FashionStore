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
import OwnerPortal from './components/owner/OwnerPortal';
import StorefrontHeader from './components/storefront/StorefrontHeader';
import StorefrontHero from './components/storefront/StorefrontHero';
import BrandValueStrip from './components/storefront/BrandValueStrip';
import CategoryShowcase from './components/storefront/CategoryShowcase';
import EditorialCampaign from './components/storefront/EditorialCampaign';
import StylingStudioTeaser from './components/storefront/StylingStudioTeaser';
import StorefrontFooter from './components/storefront/StorefrontFooter';
import { getCategoriesApi, getProductsApi } from './api/catalogApi';
import { parseCatalogUrl, serializeCatalogUrl, DEFAULT_FILTERS } from './utils/catalogUrl';
import type { Category, PageResponse, ProductFilterParams, ProductSummary } from './types/catalog';

interface StorefrontContentProps {
  onNavigateOwner: () => void;
}

function StorefrontContent({ onNavigateOwner }: StorefrontContentProps) {
  const { user, openAuthModal } = useAuth();
  const { closeCart } = useCart();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsData, setProductsData] = useState<PageResponse<ProductSummary> | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilterParams>(() => {
    if (typeof window !== 'undefined') {
      return parseCatalogUrl(window.location.search);
    }
    return DEFAULT_FILTERS;
  });

  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('product') || null;
    }
    return null;
  });
  const [isStylingStudioOpen, setIsStylingStudioOpen] = useState(false);
  const [isRunwayActive, setIsRunwayActive] = useState(true);

  // Canonicalize initial URL and listen for browser Back/Forward (popstate) navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialFilters = parseCatalogUrl(window.location.search);
      const canonicalQuery = serializeCatalogUrl(initialFilters, window.location.search);
      if (window.location.search !== canonicalQuery) {
        const canonicalUrl = `${window.location.pathname}${canonicalQuery}${window.location.hash}`;
        window.history.replaceState({ filters: initialFilters }, '', canonicalUrl);
      }
    }

    const handlePopState = () => {
      const urlFilters = parseCatalogUrl(window.location.search);
      setFilters(urlFilters);
      const params = new URLSearchParams(window.location.search);
      setSelectedProductSlug(params.get('product') || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Load Categories on mount
  useEffect(() => {
    getCategoriesApi()
      .then((data) => setCategories(data))
      .catch((err) => console.error('Lỗi tải danh mục:', err));
  }, []);

  // Load Products whenever filters change, protected by AbortController and response ignore guard
  useEffect(() => {
    const controller = new AbortController();
    setIsCatalogLoading(true);
    setCatalogError(null);

    getProductsApi(filters, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProductsData(data);
        setIsCatalogLoading(false);
      })
      .catch((err: unknown) => {
        // Silently ignore aborted requests from newer filter changes
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError')
        ) {
          return;
        }
        setCatalogError(err instanceof Error ? err.message : 'Lỗi tải danh sách sản phẩm');
        setIsCatalogLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [filters]);

  const handleSelectProduct = (slug: string) => {
    setSelectedProductSlug(slug);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('product', slug);
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.pushState(
        { ...window.history.state, isProductModalPushed: true, product: slug },
        '',
        newUrl
      );
    }
  };

  const handleCloseProductModal = () => {
    if (typeof window !== 'undefined') {
      const isModalPushed = window.history.state?.isProductModalPushed;
      if (isModalPushed) {
        // Modal was opened in-app via pushState: calling window.history.back() unwinds the history
        // entry cleanly so browser Back will not resurrect the modal.
        setSelectedProductSlug(null);
        window.history.back();
        return;
      }

      // Direct deep-link or fresh load without an in-app pushState:
      // Replace state to avoid navigating outside the website or creating forward/back loops
      setSelectedProductSlug(null);
      const params = new URLSearchParams(window.location.search);
      params.delete('product');
      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState(
        { ...window.history.state, isProductModalPushed: false, product: null },
        '',
        newUrl
      );
    } else {
      setSelectedProductSlug(null);
    }
  };

  const handleFilterChange = (
    newFilters: ProductFilterParams,
    options?: { replace?: boolean }
  ) => {
    setFilters(newFilters);
    if (typeof window !== 'undefined') {
      const currentSearch = window.location.search;
      const newQuery = serializeCatalogUrl(newFilters, currentSearch);
      const newUrl = `${window.location.pathname}${newQuery}${window.location.hash}`;

      // Avoid creating duplicate history entries if the query string did not change
      if (currentSearch !== newQuery) {
        if (options?.replace) {
          window.history.replaceState({ filters: newFilters }, '', newUrl);
        } else {
          window.history.pushState({ filters: newFilters }, '', newUrl);
        }
      }
    }
  };

  const handleSelectCategory = (slug: string) => {
    handleFilterChange({
      ...filters,
      categorySlug: slug,
      page: 0,
    });
  };

  const handleFilterSilkAndLinen = () => {
    handleFilterChange({
      ...filters,
      search: 'Lụa',
      page: 0,
    });
    if (typeof document !== 'undefined') {
      const catalogElem = document.getElementById('catalog-section');
      if (catalogElem) {
        catalogElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative text-[#F7F7F4] selection:bg-[#D6B27C] selection:text-[#111214]">
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
                Chào mừng <span className="font-bold underline text-[#D6B27C]">{user.fullName}</span>! Mã voucher <span className="font-bold tracking-widest bg-white/20 px-1.5 py-0.5 text-white">WELCOME10</span> (giảm 10%) đã kích hoạt.
              </span>
            ) : (
              <span>
                Tặng mã <span className="font-bold underline tracking-widest text-[#D6B27C]">WELCOME10</span> giảm 10% cho đơn hàng đầu tiên khi{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="underline cursor-pointer hover:text-[#D6B27C] font-bold"
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

      {/* 1. Storefront Luxury Editorial Navigation Header */}
      <StorefrontHeader
        onNavigateOwner={onNavigateOwner}
        onOpenStylingStudio={() => setIsStylingStudioOpen(true)}
        onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
        totalProductsCount={productsData?.totalElements || 0}
      />

      {/* 2. Section 1: Immersive Campaign Hero */}
      <StorefrontHero
        isRunwayActive={isRunwayActive}
        onToggleRunway={() => setIsRunwayActive(!isRunwayActive)}
        onOpenStylingStudio={() => setIsStylingStudioOpen(true)}
      />

      {/* 3. Section 2: Grounded Brand Value Strip */}
      <BrandValueStrip />

      {/* 4. Section 3: Shop by Category Showcase */}
      <CategoryShowcase
        categories={categories}
        activeCategorySlug={filters.categorySlug}
        onSelectCategory={handleSelectCategory}
      />

      {/* 5. Section 5: Editorial Collection Campaign */}
      <EditorialCampaign onFilterSilkAndLinen={handleFilterSilkAndLinen} />

      {/* 6. Section 4 & 6: Active Catalog & New Arrivals Showcase */}
      <section id="catalog-section" className="relative z-10 bg-transparent border-t border-[#333235]">
        <main id="catalog" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full space-y-8">
          {/* Active Collection Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333235] pb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[2.5px] text-[#D6B27C] uppercase font-bold">
                <span>NEW ARRIVALS</span>
                <span className="text-[#534839]">/</span>
                <span>BỘ SƯU TẬP MỚI NHẤT</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F0E9] font-normal mt-1">
                {filters.categorySlug
                  ? `Dòng Thiết Kế · ${categories.find((c) => c.slug === filters.categorySlug)?.name || filters.categorySlug}`
                  : 'Trang Phục Mới Ra Mắt (New Arrivals)'}
              </h2>
            </div>
            <div className="text-xs font-mono text-[#AAA5A0]">
              Tổng số: <span className="text-[#D6B27C] font-bold">{productsData?.totalElements || 0}</span> thiết kế đang mở bán
            </div>
          </div>

          {/* Category Navigation & Filter Bar */}
          <CategoryFilterBar
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            totalProducts={productsData?.totalElements || 0}
          />

          {/* Product Grid Area (Responsive 2 to 5 columns) */}
          {isCatalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6 py-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col space-y-3 bg-[#191A1D]/60 border border-[#333235] p-3 rounded-xl">
                  <div className="bg-[#212226] aspect-[3/4] w-full rounded-lg" />
                  <div className="h-3 bg-[#212226] w-3/4 rounded-xs" />
                  <div className="h-3 bg-[#212226] w-1/2 rounded-xs" />
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <div className="text-center py-16 border border-[#DF8D84]/30 bg-[#DF8D84]/10 p-6 space-y-3 font-mono text-xs text-[#DF8D84] rounded-2xl">
              <p>Không thể kết nối danh mục: {catalogError}</p>
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters })}
                className="border border-[#DF8D84] px-4 py-1.5 uppercase hover:bg-[#DF8D84] hover:text-[#111214] rounded-lg transition-colors cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : !productsData || productsData.items.length === 0 ? (
            <div className="text-center py-20 border border-[#333235] bg-[#111214]/90 backdrop-blur-md p-8 space-y-4 rounded-2xl">
              <span className="font-editorial text-3xl text-[#AAA5A0] font-light">Không tìm thấy sản phẩm phù hợp</span>
              <p className="text-xs font-mono text-[#AAA5A0]">
                Hãy thử bỏ bớt bộ lọc kích cỡ hoặc màu sắc để xem thêm các mẫu trang phục khác.
              </p>
              <button
                type="button"
                onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                className="border border-[#D6B27C] text-[#D6B27C] hover:bg-[#D6B27C] hover:text-[#111214] px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer rounded-xl font-bold"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6">
              {productsData.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>
          )}

          {/* Pagination Bar */}
          {productsData && productsData.totalPages > 1 && (
            <div className="pt-8 border-t border-[#333235] flex items-center justify-between font-mono text-xs text-[#AAA5A0]">
              <button
                type="button"
                disabled={!productsData.hasPrevious}
                onClick={() => handleFilterChange({ ...filters, page: filters.page! - 1 })}
                className="px-4 py-2 bg-[#191A1D] hover:bg-[#212226] border border-[#333235] text-[#F5F0E9] uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-xl transition-colors"
              >
                &larr; Trang trước
              </button>

              <span>
                Trang {productsData.page + 1} / {productsData.totalPages} ({productsData.totalElements} thiết kế)
              </span>

              <button
                type="button"
                disabled={!productsData.hasNext}
                onClick={() => handleFilterChange({ ...filters, page: filters.page! + 1 })}
                className="px-4 py-2 bg-[#191A1D] hover:bg-[#212226] border border-[#333235] text-[#F5F0E9] uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-xl transition-colors"
              >
                Trang sau &rarr;
              </button>
            </div>
          )}
        </main>
      </section>

      {/* 7. Section 7: Virtual Styling Studio Teaser */}
      <StylingStudioTeaser onOpenStylingStudio={() => setIsStylingStudioOpen(true)} />

      {/* 8. Section 8: Brand Manifesto Footer */}
      <StorefrontFooter />

      {/* Interactive Modals & Drawers */}
      <AuthModal />
      <ProductDetailModal
        slug={selectedProductSlug}
        isOpen={Boolean(selectedProductSlug)}
        onClose={handleCloseProductModal}
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
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        {currentPath.startsWith('/owner') ? (
          <OwnerPortal onNavigateStorefront={() => navigateTo('/')} />
        ) : (
          <StorefrontContent onNavigateOwner={() => navigateTo('/owner')} />
        )}
      </CartProvider>
    </AuthProvider>
  );
}
