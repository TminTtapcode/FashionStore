import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  InventorySummaryDto,
  OwnerInventoryFilterParams,
  InventoryGlobalStatsDto,
} from '../../api/ownerInventoryApi';
import {
  getOwnerInventoryOverviewApi,
  getGlobalInventoryStatsApi,
} from '../../api/ownerInventoryApi';
import { getCategoriesApi } from '../../api/catalogApi';
import type { Category } from '../../types/catalog';
import { OwnerStockReceiptModal } from './OwnerStockReceiptModal';
import { OwnerStockAdjustmentModal } from './OwnerStockAdjustmentModal';
import { OwnerInventoryLedgerDrawer } from './OwnerInventoryLedgerDrawer';

export const OwnerInventoryView: React.FC = () => {
  const [items, setItems] = useState<InventorySummaryDto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalStats, setGlobalStats] = useState<InventoryGlobalStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | ''>('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);
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

  // Fetch Global Stats across entire catalog
  const fetchGlobalStats = useCallback(async () => {
    try {
      const stats = await getGlobalInventoryStatsApi();
      setGlobalStats(stats);
    } catch (err: unknown) {
      console.warn('Could not fetch global inventory stats endpoint, falling back to local computation:', err);
    }
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

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchInventory();
  };

  // Harmonized Stats: Prioritize backend global metrics (store-wide) over local page count
  const effectiveStats = useMemo(() => {
    if (globalStats) {
      return {
        total: globalStats.totalSku,
        healthy: globalStats.healthyStockSku,
        low: globalStats.lowStockSku,
        out: globalStats.outOfStockSku,
        totalUnits: globalStats.totalStockUnits,
      };
    }

    // Fallback if stats API is loading/unavailable
    let out = 0;
    let low = 0;
    let healthy = 0;
    let units = 0;

    items.forEach((item) => {
      units += item.currentStock;
      if (item.currentStock === 0) out++;
      else if (item.currentStock <= 5) low++;
      else healthy++;
    });

    return {
      total: totalElements || items.length,
      healthy,
      low,
      out,
      totalUnits: units,
    };
  }, [globalStats, items, totalElements]);

  // Donut chart degree calculation
  const donutBackground = useMemo(() => {
    const total = effectiveStats.total || 1;
    const degHealthy = (effectiveStats.healthy / total) * 360;
    const degLow = (effectiveStats.low / total) * 360;
    return `conic-gradient(#8BC9A8 0deg ${degHealthy}deg, #E4BB78 ${degHealthy}deg ${degHealthy + degLow}deg, #DF8D84 ${degHealthy + degLow}deg 360deg)`;
  }, [effectiveStats]);

  const getStockClass = (stock: number) => {
    if (stock === 0) return 'text-[#DF8D84]';
    if (stock <= 5) return 'text-[#E4BB78]';
    return 'text-[#8BC9A8]';
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#DF8D84] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DF8D84]" />
          <span>Hết hàng</span>
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#E4BB78] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4BB78]" />
          <span>Sắp hết</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8BC9A8] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8BC9A8]" />
        <span>Còn hàng</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* 1. Page Header Line */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[2.5px] text-[#D6B27C] uppercase font-bold">
            OPERATIONS / INVENTORY STUDIO
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#F5F0E9] mt-1.5 font-normal tracking-tight">
            Tồn kho & Kiểm toán
          </h1>
          <p className="text-xs sm:text-sm text-[#AAA5A0] mt-1 font-sans">
            Một góc nhìn rõ ràng cho từng biến thể, biến động và số dư khả dụng (ATS).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setSelectedVariantForLedger(items[0])}
                className="px-4 py-2 border border-[#49423A] hover:border-[#D6B27C] text-[#F5F0E9] hover:text-[#D6B27C] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#D6B27C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Xem sổ cái</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariantForReceipt(items[0])}
                className="px-4 py-2 bg-[#D6B27C] hover:bg-[#E4C18E] text-[#191A1D] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nhập kho</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Section Label */}
      <div>
        <div className="flex items-center gap-2.5 text-[10px] font-mono tracking-[2px] text-[#AAA5A0] uppercase font-bold mb-3.5">
          <span className="w-5 h-[1px] bg-[#D6B27C]" />
          <span>CHỈ SỐ TỒN KHO TOÀN CỬA HÀNG</span>
        </div>

        {/* 4 KPI Cards: 4 columns desktop, 2x2 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Tổng biến thể */}
          <div className="bg-gradient-to-br from-[#222225] to-[#191A1C] border border-[#333235] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                TỔNG BIẾN THỂ SKU
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#D6B27C]/10 text-[#D6B27C] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-normal text-[#F5F0E9] my-2 tabular-nums">
              {effectiveStats.total}
            </div>
            <div className="text-[11px] text-[#777574]">Tất cả các biến thể đã tạo</div>
          </div>

          {/* Card 2: Còn hàng an toàn */}
          <div className="bg-gradient-to-br from-[#222225] to-[#191A1C] border border-[#333235] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                CÒN HÀNG AN TOÀN
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#8BC9A8]/10 text-[#8BC9A8] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-normal text-[#8BC9A8] my-2 tabular-nums">
              {effectiveStats.healthy}
            </div>
            <div className="text-[11px] text-[#777574]">Trên 5 sản phẩm khả dụng</div>
          </div>

          {/* Card 3: Sắp hết hàng */}
          <div className="bg-gradient-to-br from-[#222225] to-[#191A1C] border border-[#333235] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                SẮP HẾT HÀNG
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#E4BB78]/10 text-[#E4BB78] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-normal text-[#E4BB78] my-2 tabular-nums">
              {effectiveStats.low}
            </div>
            <div className="text-[11px] text-[#777574]">Từ 1 đến 5 sản phẩm</div>
          </div>

          {/* Card 4: Hết hàng */}
          <div className="bg-gradient-to-br from-[#222225] to-[#191A1C] border border-[#333235] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#AAA5A0] uppercase font-bold">
                HẾT HÀNG
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#DF8D84]/10 text-[#DF8D84] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-normal text-[#DF8D84] my-2 tabular-nums">
              {effectiveStats.out}
            </div>
            <div className="text-[11px] text-[#777574]">0 sản phẩm khả dụng</div>
          </div>
        </div>
      </div>

      {/* 3. Analytics Panels: 2 Equal Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1: Sức khỏe tồn kho (Donut Chart) */}
        <div className="bg-[#191A1D] border border-[#333235] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-editorial text-xl font-normal text-[#F5F0E9]">Sức khỏe tồn kho</h2>
              <p className="text-[11px] text-[#777574] mt-1">Tỷ trọng SKU theo ngưỡng khả dụng hiện tại</p>
            </div>
            <span className="text-[10px] text-[#D6B27C] border border-[#5D4836] bg-[#D6B27C]/10 px-2.5 py-1 rounded-full font-mono">
              Toàn bộ cửa hàng
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
            {/* Donut graphic */}
            <div
              className="w-44 h-44 rounded-full flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: donutBackground }}
            >
              <div className="w-32 h-32 rounded-full bg-[#191A1D] flex flex-col items-center justify-center text-center">
                <strong className="text-3xl font-editorial font-normal text-[#F5F0E9] tabular-nums">
                  {effectiveStats.total}
                </strong>
                <small className="text-[10px] text-[#AAA5A0] mt-0.5">biến thể SKU</small>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-3.5 text-xs text-[#AAA5A0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8BC9A8]" />
                  <span>Còn hàng (&gt; 5)</span>
                </div>
                <strong className="text-white tabular-nums font-mono">{effectiveStats.healthy}</strong>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E4BB78]" />
                  <span>Sắp hết (1–5)</span>
                </div>
                <strong className="text-white tabular-nums font-mono">{effectiveStats.low}</strong>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DF8D84]" />
                  <span>Hết hàng (0)</span>
                </div>
                <strong className="text-white tabular-nums font-mono">{effectiveStats.out}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Nhịp vận hành (7-day activity) */}
        <div className="bg-[#191A1D] border border-[#333235] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-editorial text-xl font-normal text-[#F5F0E9]">Nhịp vận hành</h2>
              <p className="text-[11px] text-[#777574] mt-1">Khối lượng giao dịch 7 ngày gần nhất</p>
            </div>
            <span className="text-[10px] text-[#D6B27C] border border-[#5D4836] bg-[#D6B27C]/10 px-2.5 py-1 rounded-full font-mono">
              7 ngày gần nhất
            </span>
          </div>

          <div className="pt-6">
            {/* Visual Bar Chart */}
            <div className="flex items-end justify-around gap-2.5 h-36 border-b border-[#3D3A37] pb-2">
              {[
                { day: 'T2', val: 3, h: '38%' },
                { day: 'T3', val: 5, h: '62%' },
                { day: 'T4', val: 4, h: '50%' },
                { day: 'T5', val: 7, h: '88%' },
                { day: 'T6', val: 6, h: '75%' },
                { day: 'T7', val: 4, h: '50%' },
                { day: 'CN', val: 8, h: '100%', today: true },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 max-w-[44px] flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[10px] text-[#AAA5A0] tabular-nums font-mono">{item.val}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      item.today
                        ? 'bg-gradient-to-t from-[#AF8455] to-[#E4C18E] shadow-[0_0_12px_rgba(214,178,124,0.25)]'
                        : 'bg-gradient-to-t from-[#4D3A25] to-[#D6B27C] opacity-75'
                    }`}
                    style={{ height: item.h }}
                  />
                  <span className="text-[10px] text-[#777574] mt-1">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#777574] mt-3">
              <span>Biến động kho hàng (Nhập xưởng + Xuất đơn + Hoàn trả)</span>
              <span className="text-[#D6B27C] font-mono">Phase 5C.5 CDC Streaming</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Catalog & Inventory Table Panel */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-2xl overflow-hidden shadow-xl">
        {/* Panel Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl font-normal text-[#F5F0E9]">Danh mục tồn kho</h2>
            <p className="text-[11px] text-[#777574] mt-0.5">Tra cứu theo sản phẩm, kích cỡ, màu sắc và mã SKU</p>
          </div>
          <span className="text-[11px] font-mono text-[#D6B27C] border border-[#5D4836] bg-[#D6B27C]/10 px-3 py-1 rounded-full">
            {totalElements} SKU
          </span>
        </div>

        {/* Filters Bar */}
        <div className="px-5 sm:px-6 pb-5 flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="inline-flex items-center gap-1 bg-[#101113] p-1 border border-[#333235] rounded-xl overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setStockStatus(''); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockStatus === '' ? 'bg-[#34302A] text-[#D6B27C]' : 'text-[#AAA5A0] hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('IN_STOCK'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockStatus === 'IN_STOCK' ? 'bg-[#34302A] text-[#D6B27C]' : 'text-[#AAA5A0] hover:text-white'
              }`}
            >
              Còn hàng
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('LOW_STOCK'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockStatus === 'LOW_STOCK' ? 'bg-[#34302A] text-[#D6B27C]' : 'text-[#AAA5A0] hover:text-white'
              }`}
            >
              Sắp hết
            </button>
            <button
              type="button"
              onClick={() => { setStockStatus('OUT_OF_STOCK'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockStatus === 'OUT_OF_STOCK' ? 'bg-[#34302A] text-[#D6B27C]' : 'text-[#AAA5A0] hover:text-white'
              }`}
            >
              Hết hàng
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
            <svg className="w-4 h-4 text-[#777574] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm SKU hoặc tên sản phẩm..."
              className="w-full h-10 pl-10 pr-4 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-[#F5F0E9] placeholder-[#777574] focus:outline-none focus:border-[#D6B27C] transition-colors"
            />
          </form>

          {/* Category Dropdown */}
          <select
            value={categoryId !== undefined ? String(categoryId) : ''}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="h-10 px-3 bg-[#111214] border border-[#3A393A] rounded-xl text-xs text-[#F5F0E9] focus:outline-none focus:border-[#D6B27C] transition-colors cursor-pointer"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mb-4 p-3 bg-[#5A302E]/30 border border-[#8A4441] rounded-xl text-[#DF8D84] text-xs">
            {errorMessage}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="py-16 text-center text-xs text-[#AAA5A0] space-y-2">
            <div className="w-7 h-7 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono">Đang tải danh sách tồn kho...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="py-16 text-center text-xs text-[#AAA5A0] space-y-2">
            <span className="text-3xl">🏷️</span>
            <p className="font-medium text-[#F5F0E9]">Không tìm thấy biến thể SKU nào phù hợp</p>
            <p className="text-[11px] text-[#777574]">Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        )}

        {/* Desktop Table View (>= 768px) */}
        {!isLoading && items.length > 0 && (
          <div className="hidden md:block w-full overflow-hidden">
            <table className="w-full border-collapse table-fixed text-left text-xs">
              <thead>
                <tr className="bg-[#202123] text-[#777574] font-bold uppercase tracking-wider text-[10px] border-y border-[#333235]">
                  <th className="py-3.5 px-6 w-[35%]">Sản phẩm / SKU</th>
                  <th className="py-3.5 px-4 w-[16%]">Danh mục</th>
                  <th className="py-3.5 px-4 w-[15%]">Biến thể</th>
                  <th className="py-3.5 px-4 w-[14%]">Tồn ATS</th>
                  <th className="py-3.5 px-4 w-[10%]">Trạng thái</th>
                  <th className="py-3.5 px-6 w-[10%] text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333235]/40 text-[#F5F0E9]">
                {items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-white/[0.02] transition-colors">
                    {/* Product & SKU */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-[#615444] to-[#2F2B29] border border-white/10 flex items-center justify-center text-[#DBC6A7] shrink-0 overflow-hidden">
                          {item.primaryImageUrl ? (
                            <img src={item.primaryImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate text-xs">{item.productName}</div>
                          <div className="font-mono text-[10px] text-[#AAA5A0] tracking-tight truncate mt-0.5" title={item.sku}>
                            {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-[#AAA5A0] truncate">
                      {item.categoryName || '—'}
                    </td>

                    {/* Variant Size & Color */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{item.size}</span>
                        <span className="text-[#777574]">·</span>
                        <span className="text-[#AAA5A0] truncate">{item.colorName}</span>
                        {item.colorHex && (
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: item.colorHex }} />
                        )}
                      </div>
                    </td>

                    {/* Stock ATS */}
                    <td className="py-4 px-4">
                      <span className={`text-sm font-bold font-mono ${getStockClass(item.currentStock)} tabular-nums`}>
                        {item.currentStock}
                      </span>
                      <span className="text-[10px] text-[#777574] ml-1">chiếc</span>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-4 px-4">
                      {getStockBadge(item.currentStock)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVariantForLedger(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#534538] text-[#D6B27C] bg-[#D6B27C]/05 hover:bg-[#D6B27C]/15 font-semibold text-[11px] transition-all cursor-pointer whitespace-nowrap"
                        >
                          Sổ cái ↗
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card List View (< 768px) */}
        {!isLoading && items.length > 0 && (
          <div className="md:hidden divide-y divide-[#333235]/40 p-4 pt-0 space-y-3">
            {items.map((item) => (
              <div key={item.variantId} className="pt-3 pb-2 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-[#615444] to-[#2F2B29] border border-white/10 flex items-center justify-center text-[#DBC6A7] shrink-0 overflow-hidden">
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-xs truncate">{item.productName}</div>
                      <div className="font-mono text-[10px] text-[#AAA5A0] truncate">{item.sku}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.size}</span>
                    <span className="text-[#777574]">·</span>
                    <span className="text-[#AAA5A0]">{item.colorName}</span>
                    <span className="text-[#777574]">|</span>
                    <span className={`font-mono font-bold ${getStockClass(item.currentStock)}`}>
                      {item.currentStock} chiếc
                    </span>
                    <span className="text-[#777574]">·</span>
                    {getStockBadge(item.currentStock)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedVariantForLedger(item)}
                    className="px-2.5 py-1 rounded-lg border border-[#534538] text-[#D6B27C] bg-[#D6B27C]/05 hover:bg-[#D6B27C]/15 font-semibold text-[11px]"
                  >
                    Sổ cái ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#333235] bg-[#161719] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#AAA5A0]">
            <span>
              Hiển thị <strong>{items.length}</strong> / <strong>{totalElements}</strong> biến thể (Trang {page + 1}/{totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 0 || isLoading}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#3A3734] bg-[#262527] text-[#AAA5A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  className={`min-w-[32px] h-[30px] rounded-lg border text-xs font-mono font-bold transition-colors ${
                    page === idx
                      ? 'bg-[#D6B27C] text-[#191A1D] border-[#D6B27C]'
                      : 'border-[#3A3734] bg-[#262527] text-[#AAA5A0] hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#3A3734] bg-[#262527] text-[#AAA5A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modals & Drawers */}
      <OwnerStockReceiptModal
        variant={selectedVariantForReceipt}
        isOpen={Boolean(selectedVariantForReceipt)}
        onClose={() => setSelectedVariantForReceipt(null)}
        onSuccess={() => {
          fetchInventory();
          fetchGlobalStats();
        }}
      />

      <OwnerStockAdjustmentModal
        variant={selectedVariantForAdjustment}
        isOpen={Boolean(selectedVariantForAdjustment)}
        onClose={() => setSelectedVariantForAdjustment(null)}
        onSuccess={() => {
          fetchInventory();
          fetchGlobalStats();
        }}
      />

      <OwnerInventoryLedgerDrawer
        variant={selectedVariantForLedger}
        isOpen={Boolean(selectedVariantForLedger)}
        onClose={() => setSelectedVariantForLedger(null)}
        onStockUpdated={() => {
          fetchInventory();
          fetchGlobalStats();
        }}
      />
    </div>
  );
};
