import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { InventorySummaryDto, OwnerInventoryFilterParams } from '../../api/ownerInventoryApi';
import { getOwnerInventoryOverviewApi } from '../../api/ownerInventoryApi';
import { getCategoriesApi } from '../../api/catalogApi';
import type { Category } from '../../types/catalog';
import { OwnerStockReceiptModal } from './OwnerStockReceiptModal';
import { OwnerStockAdjustmentModal } from './OwnerStockAdjustmentModal';
import { OwnerInventoryLedgerDrawer } from './OwnerInventoryLedgerDrawer';

export const OwnerInventoryView: React.FC = () => {
  const [items, setItems] = useState<InventorySummaryDto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | ''>('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modals & Drawers state
  const [selectedVariantForReceipt, setSelectedVariantForReceipt] = useState<InventorySummaryDto | null>(null);
  const [selectedVariantForAdjustment, setSelectedVariantForAdjustment] = useState<InventorySummaryDto | null>(null);
  const [selectedVariantForLedger, setSelectedVariantForLedger] = useState<InventorySummaryDto | null>(null);

  // Load categories
  useEffect(() => {
    getCategoriesApi()
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch Inventory Overview
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const params: OwnerInventoryFilterParams = {
        page,
        size: pageSize,
        stockStatus: stockStatus || undefined,
        categoryId: categoryId || undefined,
        search: search.trim() || undefined,
      };

      const response = await getOwnerInventoryOverviewApi(params);
      setItems(response.items || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tồn kho';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, stockStatus, categoryId, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchInventory();
  };

  // Stats calculation
  const stats = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    let totalStockUnits = 0;

    items.forEach((item) => {
      totalStockUnits += item.currentStock;
      if (item.currentStock === 0) outOfStock++;
      else if (item.currentStock <= 5) lowStock++;
      else inStock++;
    });

    return { outOfStock, lowStock, inStock, totalStockUnits };
  }, [items]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng biến thể SKU</div>
            <div className="text-2xl font-black text-gray-900 font-mono mt-1">{totalElements}</div>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
            🏷️
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Còn hàng an toàn (&gt; 5)</div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{stats.inStock}</div>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
            ✅
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Sắp hết hàng (≤ 5)</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">{stats.lowStock}</div>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
            ⚠️
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Hết hàng (0 chiếc)</div>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">{stats.outOfStock}</div>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">
            🚨
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full md:w-auto">
            <button
              type="button"
              onClick={() => { setStockStatus(''); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stockStatus === ''
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('LOW_STOCK'); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stockStatus === 'LOW_STOCK'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚠️ Sắp hết (≤ 5)
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('OUT_OF_STOCK'); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stockStatus === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚨 Hết hàng (0)
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('IN_STOCK'); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stockStatus === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✅ Còn hàng (&gt; 5)
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={categoryId || ''}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm SKU hoặc tên sản phẩm..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </form>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-2">
            <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Đang nạp dữ liệu tồn kho...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-gray-400 text-sm">
            Không tìm thấy biến thể nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Sản phẩm & SKU</th>
                  <th className="py-3.5 px-4 font-bold">Phân loại</th>
                  <th className="py-3.5 px-4 font-bold">Danh mục</th>
                  <th className="py-3.5 px-4 font-bold">Đơn giá</th>
                  <th className="py-3.5 px-4 font-bold text-center">Tồn khả dụng (ATS)</th>
                  <th className="py-3.5 px-4 font-bold">Biến động gần nhất</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-gray-50/70 transition-colors">
                    {/* Product & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.primaryImageUrl ? (
                          <img
                            src={item.primaryImageUrl}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                            👕
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 text-sm line-clamp-1 max-w-xs">
                            {item.productName}
                          </div>
                          <span className="font-mono text-[11px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 inline-block mt-0.5">
                            {item.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Variant Size/Color */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                          {item.size}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          {item.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shadow-xs"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span>{item.colorName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                      {item.categoryName}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </td>

                    {/* Stock Quantity */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        item.currentStock === 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.currentStock <= 5
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        <span>{item.currentStock}</span>
                        <span className="font-sans text-[10px] font-medium">chiếc</span>
                      </span>
                    </td>

                    {/* Last Movement */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-gray-500">
                      {item.lastMovementAt ? (
                        <div>
                          <div>{new Date(item.lastMovementAt).toLocaleDateString('vi-VN')}</div>
                          <span className="text-[10px] text-gray-400 font-mono">{item.lastMovementType || ''}</span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVariantForReceipt(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                          title="Nhập thêm hàng từ xưởng/nhà cung cấp"
                        >
                          <span>📥</span>
                          <span>Nhập</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedVariantForAdjustment(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1"
                          title="Bù trừ kiểm kê sai lệch thực tế"
                        >
                          <span>⚖️</span>
                          <span>Kiểm kê</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedVariantForLedger(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1"
                          title="Xem toàn bộ lịch sử sổ cái biến động kho"
                        >
                          <span>📜</span>
                          <span>Sổ cái</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              Hiển thị <strong>{items.length}</strong> / <strong>{totalElements}</strong> biến thể (Trang {page + 1}/{totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0 || isLoading}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <OwnerStockReceiptModal
        variant={selectedVariantForReceipt}
        isOpen={Boolean(selectedVariantForReceipt)}
        onClose={() => setSelectedVariantForReceipt(null)}
        onSuccess={() => {
          fetchInventory();
          if (selectedVariantForLedger) {
            setSelectedVariantForLedger((prev) =>
              prev ? { ...prev, currentStock: prev.currentStock + 10 } : null
            );
          }
        }}
      />

      <OwnerStockAdjustmentModal
        variant={selectedVariantForAdjustment}
        isOpen={Boolean(selectedVariantForAdjustment)}
        onClose={() => setSelectedVariantForAdjustment(null)}
        onSuccess={() => {
          fetchInventory();
        }}
      />

      <OwnerInventoryLedgerDrawer
        variant={selectedVariantForLedger}
        isOpen={Boolean(selectedVariantForLedger)}
        onClose={() => setSelectedVariantForLedger(null)}
        onStockUpdated={() => fetchInventory()}
      />
    </div>
  );
};
