import { useState, useEffect, useRef } from 'react';
import {
  getOwnerProductDetailApi,
  createOwnerProductApi,
  updateOwnerProductApi,
  addOwnerVariantApi,
  updateOwnerVariantApi,
  type OwnerProductDetail,
  type OwnerVariant,
  type CreateVariantPayload,
} from '../../api/ownerProductApi';
import { getCategoriesApi } from '../../api/catalogApi';
import type { Category } from '../../types/catalog';
import OwnerMediaView from './OwnerMediaView';

interface OwnerProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null; // null means Create Product mode
  onSuccess: () => void;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREESIZE', '28', '29', '30', '31', '32'];
const DEFAULT_COLORS = [
  { name: 'Trắng', hex: '#FFFFFF' },
  { name: 'Đen', hex: '#1A1A1A' },
  { name: 'Xanh Navy', hex: '#000080' },
  { name: 'Be', hex: '#F5F5DC' },
  { name: 'Hồng Pastel', hex: '#FFD1DC' },
  { name: 'Xanh Rêu', hex: '#4B5320' },
];

export default function OwnerProductDetailModal({
  isOpen,
  onClose,
  productId,
  onSuccess,
}: OwnerProductDetailModalProps) {
  const isCreateMode = productId === null;

  // Form State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brand, setBrand] = useState('IVRE Atelier');
  const [material, setMaterial] = useState('');
  const [fitStyle, setFitStyle] = useState('Regular Fit');
  const [careInstructions, setCareInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('{}');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');

  // Variants in Create Mode
  const [createVariants, setCreateVariants] = useState<CreateVariantPayload[]>([
    { size: 'S', colorName: 'Trắng', colorHex: '#FFFFFF', price: 500000, compareAtPrice: 650000, stockQuantity: 10, status: 'ACTIVE' },
    { size: 'M', colorName: 'Trắng', colorHex: '#FFFFFF', price: 500000, compareAtPrice: 650000, stockQuantity: 10, status: 'ACTIVE' },
  ]);

  // Quick Matrix Generator state
  const [matrixSizes, setMatrixSizes] = useState<string[]>(['S', 'M', 'L']);
  const [matrixColorNames, setMatrixColorNames] = useState<string>('Trắng, Đen');
  const [matrixBasePrice, setMatrixBasePrice] = useState<number>(500000);
  const [matrixComparePrice, setMatrixComparePrice] = useState<number>(650000);
  const [matrixInitialStock, setMatrixInitialStock] = useState<number>(10);
  const [showMatrixGenerator, setShowMatrixGenerator] = useState(false);

  // Loaded Details in Edit Mode
  const [loadedProduct, setLoadedProduct] = useState<OwnerProductDetail | null>(null);
  const [editingVariant, setEditingVariant] = useState<OwnerVariant | null>(null);
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  // New variant form in Edit Mode
  const [newVarSize, setNewVarSize] = useState('S');
  const [newVarColor, setNewVarColor] = useState('Đen');
  const [newVarHex, setNewVarHex] = useState('#1A1A1A');
  const [newVarPrice, setNewVarPrice] = useState(500000);
  const [newVarComparePrice, setNewVarComparePrice] = useState(650000);
  const [newVarStock, setNewVarStock] = useState(10);
  const [newVarSku, setNewVarSku] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load Categories on mount
  useEffect(() => {
    if (!isOpen) return;
    getCategoriesApi()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0 && isCreateMode) {
          const firstSub = cats[0].children?.[0]?.id || cats[0].id;
          setCategoryId(firstSub);
        }
      })
      .catch((err) => console.error('Failed to load categories', err));
  }, [isOpen, isCreateMode]);

  // Load Product in Edit Mode
  useEffect(() => {
    if (!isOpen) return;
    if (productId !== null) {
      setIsLoading(true);
      setError(null);
      getOwnerProductDetailApi(productId)
        .then((p) => {
          setLoadedProduct(p);
          setCategoryId(p.categoryId);
          setName(p.name);
          setSlug(p.slug);
          setBrand(p.brand || '');
          setMaterial(p.material || '');
          setFitStyle(p.fitStyle || '');
          setCareInstructions(p.careInstructions || '');
          setDescription(p.description || '');
          setSpecifications(p.specifications || '{}');
          setStatus(p.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT');
          setIsDirty(false);
        })
        .catch((err) => {
          setError(err.message || 'Không thể tải chi tiết sản phẩm');
        })
        .finally(() => setIsLoading(false));
    } else {
      // Reset Create Form
      setName('');
      setSlug('');
      setBrand('IVRE Atelier');
      setMaterial('');
      setFitStyle('Regular Fit');
      setCareInstructions('');
      setDescription('');
      setSpecifications('{}');
      setStatus('DRAFT');
      setCreateVariants([
        { size: 'S', colorName: 'Trắng', colorHex: '#FFFFFF', price: 500000, compareAtPrice: 650000, stockQuantity: 10, status: 'ACTIVE' },
        { size: 'M', colorName: 'Trắng', colorHex: '#FFFFFF', price: 500000, compareAtPrice: 650000, stockQuantity: 10, status: 'ACTIVE' },
      ]);
      setLoadedProduct(null);
      setIsDirty(false);
    }
  }, [isOpen, productId]);

  const handleSafeClose = () => {
    if (isDirty) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?')) {
        return;
      }
    }
    onClose();
  };

  // Trap Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  // Quick Matrix Generator logic
  const handleGenerateMatrix = () => {
    const rawColors = matrixColorNames
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (rawColors.length === 0 || matrixSizes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kích cỡ và 1 màu sắc');
      return;
    }

    const generated: CreateVariantPayload[] = [];
    for (const color of rawColors) {
      const matched = DEFAULT_COLORS.find(
        (dc) => dc.name.toLowerCase() === color.toLowerCase()
      );
      const hex = matched ? matched.hex : '#1A1A1A';

      for (const size of matrixSizes) {
        generated.push({
          size,
          colorName: color,
          colorHex: hex,
          price: matrixBasePrice,
          compareAtPrice: matrixComparePrice || undefined,
          stockQuantity: matrixInitialStock,
          status: 'ACTIVE',
        });
      }
    }

    setCreateVariants(generated);
    setShowMatrixGenerator(false);
    setIsDirty(true);
  };

  // Save General Product Form (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên sản phẩm không được để trống');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isCreateMode) {
        await createOwnerProductApi({
          categoryId,
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          brand: brand.trim() || undefined,
          material: material.trim() || undefined,
          fitStyle: fitStyle.trim() || undefined,
          careInstructions: careInstructions.trim() || undefined,
          specifications: specifications.trim() || undefined,
          status,
          variants: createVariants,
        });
      } else if (productId !== null) {
        await updateOwnerProductApi(productId, {
          categoryId,
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          brand: brand.trim() || undefined,
          material: material.trim() || undefined,
          fitStyle: fitStyle.trim() || undefined,
          careInstructions: careInstructions.trim() || undefined,
          specifications: specifications.trim() || undefined,
        });
      }

      setIsDirty(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi lưu sản phẩm');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Variant in Edit Mode
  const handleAddVariantInEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    try {
      setIsSaving(true);
      setError(null);
      await addOwnerVariantApi(productId, {
        sku: newVarSku.trim() || undefined,
        size: newVarSize,
        colorName: newVarColor,
        colorHex: newVarHex,
        price: newVarPrice,
        compareAtPrice: newVarComparePrice || null,
        stockQuantity: newVarStock,
        status: 'ACTIVE',
      });

      // Reload product details
      const refreshed = await getOwnerProductDetailApi(productId);
      setLoadedProduct(refreshed);
      setIsAddingVariant(false);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể thêm biến thể');
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing variant in Edit Mode
  const handleUpdateVariantInEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !editingVariant) return;

    try {
      setIsSaving(true);
      setError(null);
      await updateOwnerVariantApi(productId, editingVariant.id, {
        sku: editingVariant.sku,
        size: editingVariant.size,
        colorName: editingVariant.colorName,
        colorHex: editingVariant.colorHex || undefined,
        price: editingVariant.price,
        compareAtPrice: editingVariant.compareAtPrice,
        status: editingVariant.status,
      });

      const refreshed = await getOwnerProductDetailApi(productId);
      setLoadedProduct(refreshed);
      setEditingVariant(null);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật biến thể');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs focus:outline-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-product-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-[#191A1D] border border-[#333235] rounded-t-xl sm:rounded-xs shadow-2xl text-[#F5F0E9] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#333235] bg-[#0E0F11]/60">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#D6B27C] block mb-0.5">
              {isCreateMode ? 'KHỞI TẠO SẢN PHẨM MỚI' : 'CHỈNH SỬA SẢN PHẨM'}
            </span>
            <h2 id="owner-product-modal-title" className="text-base sm:text-lg font-serif font-medium text-[#F5F0E9] line-clamp-1">
              {isCreateMode ? (name || 'Sản phẩm mới') : loadedProduct?.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!isCreateMode && loadedProduct && (
              <button
                type="button"
                onClick={() => setShowMediaModal(true)}
                className="px-3 py-1.5 bg-[#212226] hover:bg-[#333235] border border-[#333235] hover:border-[#D6B27C] text-[#D6B27C] text-xs font-mono rounded-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Quản lý thư viện ảnh Cloudinary cho sản phẩm này"
              >
                <span>📷</span>
                <span>Thư viện ảnh ({loadedProduct.images?.length || 0})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSafeClose}
              className="w-8 h-8 flex items-center justify-center text-[#AAA5A0] hover:text-[#F5F0E9] rounded-full hover:bg-[#212226] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-[#DF8D84]/10 border border-[#DF8D84]/30 text-[#DF8D84] text-xs rounded-xs">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#AAA5A0] animate-pulse font-mono">
              <div className="w-6 h-6 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải thông tin sản phẩm...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Section 1: Thông tin cơ bản */}
              <div className="bg-[#212226] p-4 rounded-xs border border-[#333235] space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D6B27C] border-b border-[#333235] pb-2">
                  1. THÔNG TIN CƠ BẢN
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Tên sản phẩm <span className="text-[#DF8D84]">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Ví dụ: Đầm Lụa Maxi Cổ Chữ V"
                      required
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Danh mục thời trang <span className="text-[#DF8D84]">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(Number(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] focus:outline-hidden focus:border-[#D6B27C]"
                    >
                      {categories.map((cat) => (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.id}>{cat.name} (Tất cả)</option>
                          {cat.children?.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              &nbsp;&nbsp;↳ {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Thương hiệu / Dòng sản phẩm
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="IVRE Atelier"
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Chất liệu vải
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => {
                        setMaterial(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Ví dụ: 100% Lụa Tơ Tằm, Cotton Organic..."
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Form dáng (Fit Style)
                    </label>
                    <input
                      type="text"
                      value={fitStyle}
                      onChange={(e) => {
                        setFitStyle(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Ví dụ: Regular Fit, Dáng xòe, Oversized..."
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                      Đường dẫn tĩnh (Slug) - Tùy chọn
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Tự động sinh từ tên nếu để trống"
                      className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                    Hướng dẫn bảo quản & Giặt ủi
                  </label>
                  <input
                    type="text"
                    value={careInstructions}
                    onChange={(e) => {
                      setCareInstructions(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Giặt tay nhẹ với nước lạnh, không dùng chất tẩy, ủi hơi nước nhiệt độ thấp"
                    className="w-full bg-[#191A1D] border border-[#333235] rounded-xs px-3 py-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#AAA5A0] mb-1">
                    Mô tả kiểu dáng & Hoàn cảnh mặc
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setIsDirty(true);
                    }}
                    rows={2}
                    placeholder="Mô tả phong cách, sự kiện phù hợp (dạo phố, công sở, dạ hội)..."
                    className="w-full bg-[#191A1D] border border-[#333235] rounded-xs p-2 text-xs text-[#F5F0E9] placeholder-[#AAA5A0]/50 focus:outline-hidden focus:border-[#D6B27C]"
                  />
                </div>
              </div>

              {/* Section 2: Quản lý Ma trận Biến thể */}
              <div className="bg-[#212226] p-4 rounded-xs border border-[#333235] space-y-4">
                <div className="flex items-center justify-between border-b border-[#333235] pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D6B27C]">
                    2. MA TRẬN BIẾN THỂ (SIZE × MÀU SẮC)
                  </h3>

                  {isCreateMode ? (
                    <button
                      type="button"
                      onClick={() => setShowMatrixGenerator(!showMatrixGenerator)}
                      className="px-2.5 py-1 text-[11px] font-mono text-[#D6B27C] bg-[#D6B27C]/10 hover:bg-[#D6B27C]/20 border border-[#D6B27C]/30 rounded-xs cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <span>⚡ Sinh ma trận tự động</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingVariant(!isAddingVariant)}
                      className="px-2.5 py-1 text-[11px] font-mono text-[#D6B27C] bg-[#D6B27C]/10 hover:bg-[#D6B27C]/20 border border-[#D6B27C]/30 rounded-xs cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <span>+ Thêm biến thể mới</span>
                    </button>
                  )}
                </div>

                {/* Create Mode: Quick Matrix Generator Panel */}
                {isCreateMode && showMatrixGenerator && (
                  <div className="p-4 bg-[#191A1D] border border-[#D6B27C]/40 rounded-xs space-y-3">
                    <p className="text-xs font-mono font-bold text-[#D6B27C]">CÔNG CỤ SINH MA TRẬN BIẾN THỂ NHANH</p>
                    <div>
                      <span className="block text-[11px] font-mono text-[#AAA5A0] mb-1">Chọn kích cỡ:</span>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_SIZES.map((sz) => (
                          <label key={sz} className="flex items-center gap-1.5 text-xs bg-[#212226] px-2.5 py-1 rounded-xs border border-[#333235] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={matrixSizes.includes(sz)}
                              onChange={(e) => {
                                if (e.target.checked) setMatrixSizes([...matrixSizes, sz]);
                                else setMatrixSizes(matrixSizes.filter((s) => s !== sz));
                              }}
                              className="accent-[#D6B27C]"
                            />
                            <span>{sz}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-mono text-[#AAA5A0] mb-1">
                          Các màu sản xuất (ngăn cách bằng dấu phẩy):
                        </label>
                        <input
                          type="text"
                          value={matrixColorNames}
                          onChange={(e) => setMatrixColorNames(e.target.value)}
                          placeholder="Ví dụ: Trắng, Đen, Xanh Navy, Be"
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2.5 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#AAA5A0] mb-1">Tồn kho mỗi size:</label>
                        <input
                          type="number"
                          min="0"
                          value={matrixInitialStock}
                          onChange={(e) => setMatrixInitialStock(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2.5 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-[#AAA5A0] mb-1">Giá bán cơ sở (VNĐ):</label>
                        <input
                          type="number"
                          step="1000"
                          value={matrixBasePrice}
                          onChange={(e) => setMatrixBasePrice(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2.5 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#AAA5A0] mb-1">Giá niêm yết (gạch ngang):</label>
                        <input
                          type="number"
                          step="1000"
                          value={matrixComparePrice}
                          onChange={(e) => setMatrixComparePrice(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2.5 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowMatrixGenerator(false)}
                        className="px-3 py-1 text-xs text-[#AAA5A0] hover:text-[#F5F0E9]"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateMatrix}
                        className="px-3 py-1 text-xs font-mono font-bold bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] rounded-xs cursor-pointer"
                      >
                        Áp Dụng Ma Trận
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Mode: Add Variant Form Panel */}
                {!isCreateMode && isAddingVariant && (
                  <div className="p-4 bg-[#191A1D] border border-[#D6B27C]/40 rounded-xs space-y-3">
                    <p className="text-xs font-mono font-bold text-[#D6B27C]">THÊM BIẾN THỂ MỚI</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Kích cỡ:</label>
                        <select
                          value={newVarSize}
                          onChange={(e) => setNewVarSize(e.target.value)}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        >
                          {COMMON_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Tên màu:</label>
                        <input
                          type="text"
                          value={newVarColor}
                          onChange={(e) => setNewVarColor(e.target.value)}
                          placeholder="Trắng, Đen..."
                          required
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Mã Hex:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newVarHex}
                            onChange={(e) => setNewVarHex(e.target.value)}
                            className="w-7 h-7 rounded-xs border border-[#333235] cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={newVarHex}
                            onChange={(e) => setNewVarHex(e.target.value)}
                            className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1 text-xs text-[#F5F0E9] font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Tồn kho khởi tạo:</label>
                        <input
                          type="number"
                          min="0"
                          value={newVarStock}
                          onChange={(e) => setNewVarStock(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Giá bán (VNĐ):</label>
                        <input
                          type="number"
                          step="1000"
                          value={newVarPrice}
                          onChange={(e) => setNewVarPrice(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Giá niêm yết (VNĐ):</label>
                        <input
                          type="number"
                          step="1000"
                          value={newVarComparePrice}
                          onChange={(e) => setNewVarComparePrice(Number(e.target.value))}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Mã SKU (để trống tự sinh):</label>
                        <input
                          type="text"
                          value={newVarSku}
                          onChange={(e) => setNewVarSku(e.target.value)}
                          placeholder="Tự động sinh..."
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingVariant(false)}
                        className="px-3 py-1 text-xs text-[#AAA5A0] hover:text-[#F5F0E9]"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleAddVariantInEdit}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs font-mono font-bold bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] rounded-xs cursor-pointer"
                      >
                        {isSaving ? 'Đang thêm...' : 'Lưu Biến Thể'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Mode: Edit Existing Variant Sub-Modal / Panel */}
                {!isCreateMode && editingVariant && (
                  <div className="p-4 bg-[#191A1D] border border-[#D6B27C]/40 rounded-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono font-bold text-[#D6B27C]">
                        CHỈNH SỬA BIẾN THỂ: {editingVariant.sku}
                      </p>
                      {editingVariant.hasOrders && (
                        <span className="text-[10px] bg-[#E4BB78]/20 text-[#E4BB78] border border-[#E4BB78]/40 px-2 py-0.5 rounded-xs">
                          🔒 Đã có đơn hàng - Khóa sửa SKU
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Kích cỡ:</label>
                        <select
                          value={editingVariant.size}
                          onChange={(e) => setEditingVariant({ ...editingVariant, size: e.target.value })}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        >
                          {COMMON_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Tên màu:</label>
                        <input
                          type="text"
                          value={editingVariant.colorName}
                          onChange={(e) => setEditingVariant({ ...editingVariant, colorName: e.target.value })}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Giá bán (VNĐ):</label>
                        <input
                          type="number"
                          step="1000"
                          value={editingVariant.price}
                          onChange={(e) => setEditingVariant({ ...editingVariant, price: Number(e.target.value) })}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#AAA5A0] mb-1">Trạng thái:</label>
                        <select
                          value={editingVariant.status}
                          onChange={(e) => setEditingVariant({ ...editingVariant, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                          className="w-full bg-[#212226] border border-[#333235] rounded-xs px-2 py-1.5 text-xs text-[#F5F0E9]"
                        >
                          <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                          <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingVariant(null)}
                        className="px-3 py-1 text-xs text-[#AAA5A0] hover:text-[#F5F0E9]"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateVariantInEdit}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs font-mono font-bold bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] rounded-xs cursor-pointer"
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Variants Table */}
                <div className="overflow-x-auto border border-[#333235] rounded-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#191A1D] font-mono text-[10px] uppercase text-[#D6B27C] border-b border-[#333235]">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Kích cỡ</th>
                        <th className="p-2.5">Màu sắc</th>
                        <th className="p-2.5">Giá bán</th>
                        <th className="p-2.5">Giá niêm yết</th>
                        <th className="p-2.5">Tồn kho</th>
                        <th className="p-2.5">Trạng thái</th>
                        <th className="p-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333235] text-[#F5F0E9]/90">
                      {isCreateMode ? (
                        createVariants.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-[#AAA5A0]">
                              Chưa có biến thể nào. Hãy bấm ⚡ Sinh ma trận tự động ở trên!
                            </td>
                          </tr>
                        ) : (
                          createVariants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-[#191A1D]/50">
                              <td className="p-2.5 font-mono text-[11px] text-[#AAA5A0]">
                                {v.sku || '(Tự động sinh)'}
                              </td>
                              <td className="p-2.5 font-bold font-mono text-[#F5F0E9]">{v.size}</td>
                              <td className="p-2.5 flex items-center gap-1.5">
                                {v.colorHex && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-[#333235]"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                )}
                                <span>{v.colorName}</span>
                              </td>
                              <td className="p-2.5 font-mono text-[#F5F0E9]">{v.price.toLocaleString('vi-VN')}₫</td>
                              <td className="p-2.5 font-mono text-[#AAA5A0]">
                                {v.compareAtPrice ? `${v.compareAtPrice.toLocaleString('vi-VN')}₫` : '—'}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-[#F5F0E9]">{v.stockQuantity ?? 0}</td>
                              <td className="p-2.5">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#8BC9A8]/10 text-[#8BC9A8] border border-[#8BC9A8]/30">
                                  ACTIVE
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreateVariants(createVariants.filter((_, i) => i !== idx));
                                    setIsDirty(true);
                                  }}
                                  className="text-[#DF8D84] hover:text-[#eb9d95] text-xs cursor-pointer"
                                  title="Xóa biến thể"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )
                      ) : (
                        loadedProduct?.variants.map((v) => (
                          <tr key={v.id} className="hover:bg-[#191A1D]/50">
                            <td className="p-2.5 font-mono text-[11px] text-[#D6B27C]">
                              {v.sku}
                            </td>
                            <td className="p-2.5 font-bold font-mono text-[#F5F0E9]">{v.size}</td>
                            <td className="p-2.5 flex items-center gap-1.5">
                              {v.colorHex && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-[#333235]"
                                  style={{ backgroundColor: v.colorHex }}
                                />
                              )}
                              <span>{v.colorName}</span>
                            </td>
                            <td className="p-2.5 font-mono text-[#F5F0E9]">{v.price.toLocaleString('vi-VN')}₫</td>
                            <td className="p-2.5 font-mono text-[#AAA5A0]">
                              {v.compareAtPrice ? `${v.compareAtPrice.toLocaleString('vi-VN')}₫` : '—'}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-[#F5F0E9]">{v.stockQuantity}</td>
                            <td className="p-2.5">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${
                                v.status === 'ACTIVE'
                                  ? 'bg-[#8BC9A8]/10 text-[#8BC9A8] border-[#8BC9A8]/30'
                                  : 'bg-[#212226] text-[#AAA5A0] border-[#333235]'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setEditingVariant(v)}
                                className="text-xs font-mono text-[#D6B27C] hover:underline cursor-pointer"
                              >
                                Sửa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#333235]">
                <div className="text-[11px] text-[#AAA5A0] font-mono">
                  {isCreateMode
                    ? `Tổng số biến thể: ${createVariants.length}`
                    : `Tổng số biến thể: ${loadedProduct?.variants.length || 0}`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSafeClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs text-[#AAA5A0] hover:text-[#F5F0E9] border border-[#333235] bg-[#212226] rounded-xs cursor-pointer transition-colors"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-mono font-bold bg-[#D6B27C] text-[#0E0F11] hover:bg-[#E5C592] disabled:opacity-50 rounded-xs cursor-pointer transition-colors shadow-sm"
                  >
                    {isSaving ? 'ĐANG LƯU...' : isCreateMode ? 'TẠO SẢN PHẨM' : 'LƯU THAY ĐỔI'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Cloudinary Media Modal */}
      {showMediaModal && loadedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#111214] border border-[#333235] rounded-2xl overflow-y-auto p-4 sm:p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowMediaModal(false);
                // Refresh loaded product to get updated image count & primary image
                if (productId) {
                  getOwnerProductDetailApi(productId)
                    .then(setLoadedProduct)
                    .catch((err) => console.error('Failed to reload product', err));
                }
              }}
              className="absolute top-4 right-4 p-2 text-[#AAA5A0] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer z-20 text-sm font-mono"
              title="Đóng thư viện ảnh"
            >
              ✕
            </button>
            <OwnerMediaView initialProductId={loadedProduct.id} />
          </div>
        </div>
      )}
    </div>
  );
}
