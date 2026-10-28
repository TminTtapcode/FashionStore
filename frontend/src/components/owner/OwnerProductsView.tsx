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
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-2xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ACTIVE
          </span>
        );
      case 'DRAFT':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-2xs bg-amber-500/10 text-amber-300 border border-amber-500/30">
            DRAFT
          </span>
        );
      case 'HIDDEN':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-2xs bg-white/10 text-white/60 border border-white/20">
            HIDDEN
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-2xs bg-red-500/10 text-red-400 border border-red-500/30">
            ARCHIVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            QUẢN LÝ SẢN PHẨM & BIẾN THỂ
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Quản trị catalog, ma trận biến thể, bảng size guide và trạng thái hiển thị
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalProductId('CREATE')}
          className="px-4 py-2 bg-[#C7AD83] text-black hover:bg-[#b5996f] font-mono font-bold text-xs uppercase tracking-wider rounded-2xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <span>+ THÊM SẢN PHẨM MỚI</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#181818] border border-white/10 rounded-xs p-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-white/10 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-2xs transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? 'bg-[#C7AD83] text-black font-bold shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
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
            className="bg-[#141414] border border-white/20 rounded-2xs px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C7AD83]"
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
              className="flex-1 bg-[#141414] border border-white/20 rounded-2xs px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C7AD83]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs rounded-2xs cursor-pointer"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-200 text-xs rounded-2xs">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-[#181818] border border-white/10 rounded-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-white/50 animate-pulse font-mono">
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-white/40 space-y-2">
            <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('');
                setSelectedCategoryId(undefined);
                setSearchQuery('');
                setSearchInput('');
              }}
              className="text-[#C7AD83] underline font-mono text-xs cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] font-mono text-[10px] uppercase text-white/50 border-b border-white/10">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Danh mục</th>
                  <th className="p-3">Số biến thể</th>
                  <th className="p-3">Khoảng giá</th>
                  <th className="p-3">Tổng tồn kho</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Cập nhật</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.primaryImageUrl ? (
                          <img
                            src={p.primaryImageUrl}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-2xs border border-white/10 bg-white/5"
                          />
                        ) : (
                          <div className="w-10 h-12 rounded-2xs border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/30">
                            No img
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white line-clamp-1">{p.name}</div>
                          <div className="font-mono text-[10px] text-white/40">{p.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-white/80">{p.categoryName}</td>

                    <td className="p-3 font-mono font-bold text-white/90">
                      {p.variantCount} biến thể
                    </td>

                    <td className="p-3 font-mono text-white/90">
                      {p.minPrice === p.maxPrice
                        ? `${p.minPrice.toLocaleString('vi-VN')}₫`
                        : `${p.minPrice.toLocaleString('vi-VN')}₫ – ${p.maxPrice.toLocaleString('vi-VN')}₫`}
                    </td>

                    <td className="p-3 font-mono">
                      <span className={p.totalStock === 0 ? 'text-red-400 font-bold' : 'text-white/80'}>
                        {p.totalStock} cái
                      </span>
                    </td>

                    <td className="p-3">{renderStatusBadge(p.status)}</td>

                    <td className="p-3 font-mono text-[10px] text-white/40">
                      {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalProductId(p.id)}
                        className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/15 border border-white/15 text-[#C7AD83] rounded-2xs cursor-pointer"
                        title="Xem chi tiết và chỉnh sửa biến thể"
                      >
                        Sửa & Biến thể
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusModalProduct({ id: p.id, name: p.name, status: p.status })}
                        className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 rounded-2xs cursor-pointer"
                        title="Đổi trạng thái hiển thị (DRAFT, ACTIVE, HIDDEN, ARCHIVED)"
                      >
                        Đổi trạng thái
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        className="px-2 py-1 text-[11px] font-mono hover:bg-red-950/30 border border-transparent hover:border-red-500/30 text-red-400 rounded-2xs cursor-pointer"
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
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-t border-white/10 text-xs font-mono text-white/60">
            <div>
              Trang {page + 1} / {totalPages} ({totalElements} sản phẩm)
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-2xs border border-white/10 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-2xs border border-white/10 cursor-pointer"
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

