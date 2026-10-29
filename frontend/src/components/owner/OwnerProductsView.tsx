import { useState, useEffect } from 'react';
import {
  getOwnerProductsApi,
  deleteOwnerProductApi,
  updateOwnerProductStatusApi,
  type OwnerProductSummary,
  type ProductStatus,
} from '../../api/ownerProductApi';
import { getCategoriesApi } from '../../api/catalogApi';
import type { Category } from '../../types/catalog';
import OwnerProductDetailModal from './OwnerProductDetailModal';
import OwnerProductStatusModal from './OwnerProductStatusModal';

const STATUS_TABS: { label: string; value: ProductStatus | '' }[] = [
  { label: 'TẤT CẢ', value: '' },
  { label: 'HOẠT ĐỘNG (ACTIVE)', value: 'ACTIVE' },
  { label: 'BẢN NHÁP (DRAFT)', value: 'DRAFT' },
  { label: 'TẠM ẨN (HIDDEN)', value: 'HIDDEN' },
  { label: 'LƯU TRỮ (ARCHIVED)', value: 'ARCHIVED' },
];

export default function OwnerProductsView() {
  const [products, setProducts] = useState<OwnerProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [modalProductId, setModalProductId] = useState<number | null | 'CREATE'>(null);
  const [statusModalProduct, setStatusModalProduct] = useState<{ id: number; name: string; status: ProductStatus } | null>(null);

  // Load Categories on mount
  useEffect(() => {
    getCategoriesApi()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch Products
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getOwnerProductsApi(
      {
        page,
        size: 15,
        status: selectedStatus,
        categoryId: selectedCategoryId,
        search: searchQuery,
      },
      controller.signal
    )
      .then((data) => {
        if (!ignore) {
          setProducts(data.items);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        }
      })
      .catch((err) => {
        if (!ignore && err.name !== 'AbortError') {
          setError(err.message || 'Không thể tải danh sách sản phẩm');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [page, selectedStatus, selectedCategoryId, searchQuery, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearchQuery(searchInput);
  };

  const handleDeleteProduct = async (product: OwnerProductSummary) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? (Lưu ý: Nếu sản phẩm đã phát sinh đơn hàng, hệ thống sẽ yêu cầu chuyển sang Lưu trữ)`)) {
      return;
    }

    try {
      await deleteOwnerProductApi(product.id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa sản phẩm');
    }
  };

  const handleConfirmStatusChange = async (targetStatus: ProductStatus, note: string) => {
    if (!statusModalProduct) return;
    await updateOwnerProductStatusApi(statusModalProduct.id, {
      status: targetStatus,
      note: note.trim() || undefined,
    });
    setRefreshTrigger((prev) => prev + 1);
  };

  const renderStatusBadge = (st: ProductStatus) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#8BC9A8]/10 text-[#8BC9A8] border border-[#8BC9A8]/30">
            ACTIVE
          </span>
        );
      case 'DRAFT':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#E4BB78]/10 text-[#E4BB78] border border-[#E4BB78]/30">
            DRAFT
          </span>
        );
      case 'HIDDEN':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#212226] text-[#AAA5A0] border border-[#333235]">
            HIDDEN
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#DF8D84]/10 text-[#DF8D84] border border-[#DF8D84]/30">
            ARCHIVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#333235]/60">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D6B27C] block mb-1">
            CATALOG / PRODUCT STUDIO
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#F5F0E9]">
            Quản lý Sản phẩm & Biến thể
          </h1>
          <p className="text-xs text-[#AAA5A0] mt-1">
            Quản trị catalog, ma trận biến thể, bảng size guide và trạng thái hiển thị trên Storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalProductId('CREATE')}
          className="px-4 py-2.5 bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] font-mono font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
        >
          <span>+ THÊM SẢN PHẨM MỚI</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar Container */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-xs p-4 space-y-4 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[#333235]/60 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-xs transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? 'bg-[#D6B27C] text-[#0E0F11] font-bold shadow-xs'
                  : 'text-[#AAA5A0] hover:text-[#F5F0E9] hover:bg-[#212226]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters and Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Dropdown */}
          <select
            value={selectedCategoryId ?? ''}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="bg-[#212226] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] focus:outline-hidden focus:border-[#D6B27C]"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                <option value={cat.id}>{cat.name} (Toàn bộ)</option>
                {cat.children?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    ↳ {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, thương hiệu hoặc slug..."
              className="flex-1 bg-[#212226] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] font-mono text-xs rounded-xs cursor-pointer transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-[#DF8D84]/10 border border-[#DF8D84]/30 text-[#DF8D84] text-xs rounded-xs">
          {error}
        </div>
      )}

      {/* Products Container */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-xs overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#AAA5A0] animate-pulse font-mono">
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#AAA5A0] space-y-2">
            <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('');
                setSelectedCategoryId(undefined);
                setSearchQuery('');
                setSearchInput('');
              }}
              className="text-[#D6B27C] underline font-mono text-xs cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#212226] font-mono text-[10px] uppercase text-[#D6B27C] border-b border-[#333235] tracking-wider">
                  <tr>
                    <th className="p-3.5">Sản phẩm</th>
                    <th className="p-3.5">Danh mục</th>
                    <th className="p-3.5">Số biến thể</th>
                    <th className="p-3.5">Khoảng giá</th>
                    <th className="p-3.5">Tổng tồn kho</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5">Cập nhật</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333235] text-[#F5F0E9]/90">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#212226]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {p.primaryImageUrl ? (
                            <img
                              src={p.primaryImageUrl}
                              alt={p.name}
                              className="w-10 h-12 object-cover rounded-xs border border-[#333235] bg-[#212226]"
                            />
                          ) : (
                            <div className="w-10 h-12 rounded-xs border border-[#333235] bg-[#212226] flex items-center justify-center text-[10px] text-[#AAA5A0]">
                              No img
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-[#F5F0E9] line-clamp-1">{p.name}</div>
                            <div className="font-mono text-[10px] text-[#AAA5A0]">{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-[#AAA5A0]">{p.categoryName}</td>

                      <td className="p-3.5 font-mono font-bold text-[#F5F0E9]">
                        {p.variantCount} biến thể
                      </td>

                      <td className="p-3.5 font-mono text-[#D6B27C]">
                        {p.minPrice === p.maxPrice
                          ? `${p.minPrice.toLocaleString('vi-VN')}₫`
                          : `${p.minPrice.toLocaleString('vi-VN')}₫ – ${p.maxPrice.toLocaleString('vi-VN')}₫`}
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className={p.totalStock === 0 ? 'text-[#DF8D84] font-bold' : 'text-[#F5F0E9]'}>
                          {p.totalStock} cái
                        </span>
                      </td>

                      <td className="p-3.5">{renderStatusBadge(p.status)}</td>

                      <td className="p-3.5 font-mono text-[10px] text-[#AAA5A0]">
                        {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setModalProductId(p.id)}
                          className="px-2.5 py-1 text-[11px] font-mono bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#D6B27C] rounded-xs cursor-pointer transition-colors"
                          title="Xem chi tiết và chỉnh sửa biến thể"
                        >
                          Sửa & Biến thể
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatusModalProduct({ id: p.id, name: p.name, status: p.status })}
                          className="px-2.5 py-1 text-[11px] font-mono bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] rounded-xs cursor-pointer transition-colors"
                          title="Đổi trạng thái hiển thị (DRAFT, ACTIVE, HIDDEN, ARCHIVED)"
                        >
                          Đổi trạng thái
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="px-2 py-1 text-[11px] font-mono hover:bg-[#DF8D84]/20 border border-transparent hover:border-[#DF8D84]/30 text-[#DF8D84] rounded-xs cursor-pointer transition-colors"
                          title="Xóa sản phẩm"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< 768px) */}
            <div className="block md:hidden divide-y divide-[#333235]">
              {products.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.name}
                        className="w-14 h-16 object-cover rounded-xs border border-[#333235] bg-[#212226] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-xs border border-[#333235] bg-[#212226] flex items-center justify-center text-[10px] text-[#AAA5A0] shrink-0">
                        No img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-[#AAA5A0]">{p.categoryName}</span>
                        {renderStatusBadge(p.status)}
                      </div>
                      <h4 className="font-semibold text-sm text-[#F5F0E9] line-clamp-1 mt-0.5">{p.name}</h4>
                      <p className="font-mono text-[10px] text-[#AAA5A0]">{p.slug}</p>
                      <div className="mt-1 font-mono text-xs text-[#D6B27C]">
                        {p.minPrice === p.maxPrice
                          ? `${p.minPrice.toLocaleString('vi-VN')}₫`
                          : `${p.minPrice.toLocaleString('vi-VN')}₫ – ${p.maxPrice.toLocaleString('vi-VN')}₫`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 text-[#AAA5A0]">
                    <span>{p.variantCount} biến thể</span>
                    <span className={p.totalStock === 0 ? 'text-[#DF8D84] font-bold' : 'text-[#F5F0E9]'}>
                      Tồn: {p.totalStock} chiếc
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#333235]/60">
                    <button
                      type="button"
                      onClick={() => setModalProductId(p.id)}
                      className="px-2.5 py-1.5 text-xs font-mono bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#D6B27C] rounded-xs cursor-pointer"
                    >
                      Sửa & Biến thể
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusModalProduct({ id: p.id, name: p.name, status: p.status })}
                      className="px-2.5 py-1.5 text-xs font-mono bg-[#212226] hover:bg-[#333235] border border-[#333235] text-[#F5F0E9] rounded-xs cursor-pointer"
                    >
                      Đổi trạng thái
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p)}
                      className="px-2.5 py-1.5 text-xs font-mono hover:bg-[#DF8D84]/20 border border-transparent hover:border-[#DF8D84]/30 text-[#DF8D84] rounded-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#212226] border-t border-[#333235] text-xs font-mono text-[#AAA5A0]">
            <div>
              Trang {page + 1} / {totalPages} ({totalElements} sản phẩm)
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 bg-[#191A1D] hover:bg-[#212226] text-[#F5F0E9] disabled:opacity-30 rounded-xs border border-[#333235] cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 bg-[#191A1D] hover:bg-[#212226] text-[#F5F0E9] disabled:opacity-30 rounded-xs border border-[#333235] cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail / Create Modal */}
      {modalProductId !== null && (
        <OwnerProductDetailModal
          isOpen={true}
          productId={modalProductId === 'CREATE' ? null : modalProductId}
          onClose={() => setModalProductId(null)}
          onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}

      {/* Product Status Change Modal */}
      {statusModalProduct && (
        <OwnerProductStatusModal
          isOpen={true}
          productId={statusModalProduct.id}
          productName={statusModalProduct.name}
          currentStatus={statusModalProduct.status}
          onClose={() => setStatusModalProduct(null)}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
}
