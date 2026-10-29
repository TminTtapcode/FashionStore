import { useState, useEffect, useRef } from 'react';
import {
  signUploadApi,
  uploadToCloudinaryApi,
  getProductImagesApi,
  addProductImageApi,
  updateProductImageApi,
  setPrimaryProductImageApi,
  reorderProductImagesApi,
  deleteProductImageApi,
  type ProductImageDetail,
  type SignUploadResponse,
} from '../../api/ownerMediaApi';
import {
  getOwnerProductsApi,
  getOwnerProductDetailApi,
  type OwnerProductSummary,
  type OwnerVariant,
} from '../../api/ownerProductApi';

interface OwnerMediaViewProps {
  initialProductId?: number;
}

export default function OwnerMediaView({ initialProductId }: OwnerMediaViewProps) {
  // Products listing for selection
  const [products, setProducts] = useState<OwnerProductSummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(initialProductId || null);
  const [selectedProductVariants, setSelectedProductVariants] = useState<OwnerVariant[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  // Images state
  const [images, setImages] = useState<ProductImageDetail[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<SignUploadResponse | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [altText, setAltText] = useState<string>('');
  const [makePrimary, setMakePrimary] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search filter for product selector
  const [productSearch, setProductSearch] = useState('');

  // 1. Load products for selector
  useEffect(() => {
    let ignore = false;
    getOwnerProductsApi({ page: 0, size: 100 })
      .then((data) => {
        if (!ignore) {
          setProducts(data.items);
          if (!selectedProductId && data.items.length > 0) {
            setSelectedProductId(data.items[0].id);
            setSelectedProductName(data.items[0].name);
          }
        }
      })
      .catch((err) => console.error('Failed to load products for media view', err));

    // Also probe signUpload to know if Cloudinary is in mock mode or live mode
    signUploadApi()
      .then((res) => {
        if (!ignore) setUploadStatus(res);
      })
      .catch((err) => console.warn('Cloudinary config probe', err));

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Load images & variants when selected product changes
  useEffect(() => {
    if (!selectedProductId) return;

    let ignore = false;
    setIsLoadingImages(true);
    setUploadError(null);
    setSuccessMessage(null);

    Promise.all([
      getProductImagesApi(selectedProductId),
      getOwnerProductDetailApi(selectedProductId),
    ])
      .then(([imgs, detail]) => {
        if (!ignore) {
          setImages(imgs);
          setSelectedProductVariants(detail.variants);
          setSelectedProductName(detail.name);
          setIsLoadingImages(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load images or variants', err);
          setIsLoadingImages(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedProductId]);

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setUploadFile(null);
      setUploadPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ chấp nhận tệp hình ảnh (.jpg, .jpeg, .png, .webp, .avif)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Kích thước ảnh không được vượt quá 10MB');
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreview(objectUrl);
  };

  // Perform Signed Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedProductId) return;

    try {
      setIsUploading(true);
      setUploadProgress(20);
      setUploadError(null);

      // 1. Get signed upload parameters from backend
      const signData = await signUploadApi({
        productId: selectedProductId,
        folder: 'fashion_store/products',
      });
      setUploadProgress(40);

      // 2. Upload file directly to Cloudinary (or mock endpoint)
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      if (signData.folder) {
        formData.append('folder', signData.folder);
      }

      const uploadResult = await uploadToCloudinaryApi(signData.uploadUrl, formData);
      setUploadProgress(75);

      // 3. Save uploaded image record into backend product catalog
      await addProductImageApi(selectedProductId, {
        variantId: selectedVariantId,
        imageUrl: uploadResult.secure_url,
        storageKey: uploadResult.public_id,
        altText: altText.trim() || `${selectedProductName} lookbook`,
        sortOrder: images.length,
        isPrimary: makePrimary || images.length === 0,
        fileSize: uploadResult.bytes || uploadFile.size,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      });

      setUploadProgress(100);

      // Reload gallery list
      const updatedList = await getProductImagesApi(selectedProductId);
      setImages(updatedList);

      // Reset upload form
      setUploadFile(null);
      setUploadPreview(null);
      setAltText('');
      setMakePrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMessage('Tải ảnh lên thư viện Cloudinary thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Tải ảnh thất bại');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Set as Primary
  const handleSetPrimary = async (imageId: number) => {
    if (!selectedProductId) return;
    try {
      await setPrimaryProductImageApi(selectedProductId, imageId);
      const updatedList = await getProductImagesApi(selectedProductId);
      setImages(updatedList);
      setSuccessMessage('Đã đặt làm ảnh đại diện chính của sản phẩm');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Không thể đặt ảnh chính');
    }
  };

  // Change variant association
  const handleChangeVariant = async (imageId: number, newVariantId: number | null) => {
    if (!selectedProductId) return;
    try {
      await updateProductImageApi(selectedProductId, imageId, {
        variantId: newVariantId,
      });
      const updatedList = await getProductImagesApi(selectedProductId);
      setImages(updatedList);
      setSuccessMessage('Đã cập nhật biến thể liên kết cho ảnh');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Không thể cập nhật biến thể');
    }
  };

  // Move image order
  const handleMoveOrder = async (index: number, direction: 'left' | 'right') => {
    if (!selectedProductId) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newOrder = [...images];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const imageIds = newOrder.map((img) => img.id);
    try {
      const reordered = await reorderProductImagesApi(selectedProductId, imageIds);
      setImages(reordered);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Không thể đổi thứ tự');
    }
  };

  // Delete image
  const handleDeleteImage = async (image: ProductImageDetail) => {
    if (!selectedProductId) return;
    const isPrimaryConfirm = image.isPrimary
      ? ' Ảnh này là ảnh đại diện chính; nếu xóa, hệ thống sẽ tự động chỉ định ảnh kế tiếp làm ảnh chính.'
      : '';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ảnh này khỏi sản phẩm?${isPrimaryConfirm}`)) {
      return;
    }

    try {
      await deleteProductImageApi(selectedProductId, image.id);
      const updatedList = await getProductImagesApi(selectedProductId);
      setImages(updatedList);
      setSuccessMessage('Đã xóa ảnh thành công');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Không thể xóa ảnh');
    }
  };

  // Filtered products for selector
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Group unique colors for variant display
  const colorOptions = Array.from(
    new Map(
      selectedProductVariants.map((v) => [
        v.colorName,
        { id: v.id, colorName: v.colorName, colorHex: v.colorHex || '#1A1A1A', size: v.size },
      ])
    ).values()
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#333235]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[2px] text-[#D6B27C] uppercase font-bold">
            <span>MEDIA STUDIO</span>
            <span className="text-[#534839]">/</span>
            <span>CLOUDINARY GALLERY</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[#F5F0E9] mt-1">
            Thư viện Ảnh & Quản lý Gallery
          </h1>
          <p className="text-xs text-[#AAA5A0] mt-1 max-w-2xl leading-relaxed">
            Tải ảnh chất lượng cao lên Cloudinary qua chữ ký số Signed Upload bảo mật. Gán ảnh theo biến thể màu sắc, thiết lập ảnh đại diện chính và kiểm soát thứ tự hiển thị lookbook.
          </p>
        </div>

        {/* Cloudinary Integration Status Pill */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {uploadStatus?.isMock ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E4BB78]/10 border border-[#E4BB78]/30 rounded-full text-xs font-mono text-[#E4BB78]">
              <span className="w-2 h-2 rounded-full bg-[#E4BB78] animate-pulse" />
              <span>Chế độ giả lập (Mock Fallback)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8BC9A8]/10 border border-[#8BC9A8]/30 rounded-full text-xs font-mono text-[#8BC9A8]">
              <span className="w-2 h-2 rounded-full bg-[#8BC9A8] shadow-[0_0_6px_rgba(139,201,168,0.5)]" />
              <span>Cloudinary Live Signed</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-[#8BC9A8]/15 border border-[#8BC9A8]/40 text-[#8BC9A8] text-xs rounded-xl flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 font-medium">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#8BC9A8] hover:text-white text-xs px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-[#DF8D84]/15 border border-[#DF8D84]/40 text-[#DF8D84] text-xs rounded-xl flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 font-medium">
            <span>✕</span>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[#DF8D84] hover:text-white text-xs px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Controls: Product Selector Card */}
      <div className="bg-[#191A1D] border border-[#333235] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label htmlFor="media-product-select" className="text-xs font-mono text-[#AAA5A0] uppercase tracking-wider font-semibold">
            Chọn sản phẩm cần quản lý ảnh:
          </label>
          <div className="text-[11px] font-mono text-[#D6B27C]">
            Đang chọn: <span className="font-bold text-[#F5F0E9]">{selectedProductName || 'Chưa chọn'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <select
              id="media-product-select"
              value={selectedProductId || ''}
              onChange={(e) => {
                const pid = Number(e.target.value);
                setSelectedProductId(pid);
                const found = products.find((p) => p.id === pid);
                if (found) setSelectedProductName(found.name);
              }}
              className="w-full px-3.5 py-2.5 bg-[#212226] border border-[#333235] focus:border-[#D6B27C] text-[#F5F0E9] rounded-xl text-xs font-mono focus:outline-none appearance-none cursor-pointer"
            >
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.categoryName}) — {p.variantCount} biến thể
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#AAA5A0] text-xs">
              ▼
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Lọc nhanh danh sách sản phẩm..."
              className="w-full px-3.5 py-2.5 bg-[#212226] border border-[#333235] focus:border-[#D6B27C] text-[#F5F0E9] placeholder-[#777574] rounded-xl text-xs focus:outline-none"
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => setProductSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777574] hover:text-[#F5F0E9] text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Two-column layout (Upload Form + Gallery Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Signed Upload Dropzone (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-[#191A1D] border border-[#333235] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#333235]">
            <h2 className="text-sm font-semibold text-[#F5F0E9] tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D6B27C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Tải ảnh lên Cloudinary</span>
            </h2>
            <span className="text-[10px] font-mono text-[#AAA5A0] bg-[#212226] px-2 py-0.5 rounded-full border border-[#333235]">
              Max 10MB
            </span>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Dropzone Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[170px] ${
                isDragging
                  ? 'border-[#D6B27C] bg-[#D6B27C]/10'
                  : uploadPreview
                  ? 'border-[#8BC9A8]/50 bg-[#212226]'
                  : 'border-[#333235] hover:border-[#D6B27C]/60 bg-[#212226]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {uploadPreview ? (
                <div className="relative w-full aspect-[3/4] max-h-48 rounded-lg overflow-hidden border border-[#333235] mx-auto group">
                  <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-mono">
                    Nhấp để đổi ảnh khác
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#212226] border border-[#333235] text-[#D6B27C] flex items-center justify-center mx-auto text-lg">
                    +
                  </div>
                  <div className="text-xs text-[#F5F0E9] font-medium">
                    Kéo thả ảnh vào đây, hoặc <span className="text-[#D6B27C] underline">chọn tệp</span>
                  </div>
                  <div className="text-[10px] text-[#777574] font-mono">
                    Hỗ trợ JPG, PNG, WEBP, AVIF (Tối đa 10MB)
                  </div>
                </div>
              )}
            </div>

            {/* Target Variant / Color Selection */}
            <div>
              <label htmlFor="media-variant-select" className="block text-[11px] font-mono text-[#AAA5A0] uppercase tracking-wider mb-1.5 font-semibold">
                Phân loại theo biến thể:
              </label>
              <select
                id="media-variant-select"
                value={selectedVariantId || ''}
                onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 bg-[#212226] border border-[#333235] focus:border-[#D6B27C] text-[#F5F0E9] rounded-xl text-xs font-mono focus:outline-none"
              >
                <option value="">Ảnh chung (Hiển thị cho toàn bộ biến thể)</option>
                {selectedProductVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    Màu: {v.colorName} — Size: {v.size} ({v.sku})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#777574] mt-1">
                Storefront Lookbook sẽ tự động ưu tiên ảnh theo màu khách hàng chọn.
              </p>
            </div>

            {/* Alt Text */}
            <div>
              <label htmlFor="media-alt-input" className="block text-[11px] font-mono text-[#AAA5A0] uppercase tracking-wider mb-1.5 font-semibold">
                Mô tả văn bản thay thế (Alt Text):
              </label>
              <input
                id="media-alt-input"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={`VD: ${selectedProductName} góc chính diện`}
                className="w-full px-3 py-2 bg-[#212226] border border-[#333235] focus:border-[#D6B27C] text-[#F5F0E9] placeholder-[#777574] rounded-xl text-xs focus:outline-none"
              />
            </div>

            {/* Make Primary Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="media-make-primary"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                className="w-4 h-4 rounded border-[#333235] bg-[#212226] text-[#D6B27C] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="media-make-primary" className="text-xs text-[#F5F0E9] cursor-pointer select-none">
                Đặt làm ảnh đại diện chính (Primary Lookbook)
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-mono text-[#D6B27C]">
                  <span>Đang tải lên Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#212226] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D6B27C] to-[#E4C18E] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!uploadFile || isUploading || !selectedProductId}
              className="w-full py-2.5 bg-[#D6B27C] hover:bg-[#E4C18E] disabled:bg-[#333235] text-[#191A1D] disabled:text-[#777574] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#191A1D] border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý tải ảnh...</span>
                </>
              ) : (
                <span>Tải ảnh vào Gallery</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Gallery Grid (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-[#191A1D] border border-[#333235] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#333235]">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[#F5F0E9] tracking-wide">
                Gallery Ảnh Lookbook
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#212226] text-[#D6B27C] border border-[#333235] font-bold">
                {images.length} ảnh
              </span>
            </div>

            <div className="text-[11px] font-mono text-[#AAA5A0]">
              Thứ tự hiển thị: <span className="text-[#D6B27C]">Trái qua phải (Sort Order)</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingImages ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs font-mono text-[#AAA5A0] space-y-3">
              <div className="w-8 h-8 border-2 border-[#D6B27C] border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh mục ảnh sản phẩm...</span>
            </div>
          ) : images.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center border-2 border-dashed border-[#333235] rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#212226] border border-[#333235] text-[#AAA5A0] flex items-center justify-center mx-auto text-xl font-mono">
                📷
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F0E9]">Chưa có hình ảnh nào</h3>
                <p className="text-xs text-[#AAA5A0] max-w-sm mx-auto mt-1">
                  Sản phẩm chưa có ảnh hiển thị. Hãy sử dụng bảng điều khiển bên trái để tải lên ảnh đầu tiên.
                </p>
              </div>
            </div>
          ) : (
            /* Images Gallery Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((img, idx) => {
                // Find associated variant if any
                const variant = selectedProductVariants.find((v) => v.id === img.variantId);

                return (
                  <div
                    key={img.id}
                    className={`group relative bg-[#212226] border rounded-xl overflow-hidden flex flex-col transition-all hover:border-[#D6B27C]/60 shadow-xs ${
                      img.isPrimary
                        ? 'border-[#D6B27C] shadow-[0_0_12px_rgba(214,178,124,0.15)] ring-1 ring-[#D6B27C]/40'
                        : 'border-[#333235]'
                    }`}
                  >
                    {/* Aspect Ratio 3:4 Image Container */}
                    <div className="relative aspect-[3/4] w-full bg-[#111214] overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={img.altText || selectedProductName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Primary Gold Badge */}
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#D6B27C] text-[#191A1D] rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                          <span>★</span>
                          <span>Ảnh Chính</span>
                        </div>
                      )}

                      {/* Sort Order Index */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono flex items-center justify-center border border-white/20">
                        #{idx + 1}
                      </div>

                      {/* Variant Badge overlay */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        {variant ? (
                          <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono text-[#F5F0E9] border border-white/10 flex items-center gap-1.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 border border-white/30"
                              style={{ backgroundColor: variant.colorHex || '#1A1A1A' }}
                            />
                            <span className="truncate">{variant.colorName}</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono text-[#AAA5A0] border border-white/10">
                            Ảnh chung
                          </div>
                        )}

                        {img.format && (
                          <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono uppercase text-[#777574]">
                            {img.format}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Image Metadata & Quick Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between bg-[#191A1D]">
                      {/* Variant Dropdown to switch on the fly */}
                      <div className="space-y-1">
                        <label htmlFor={`media-img-variant-${img.id}`} className="text-[9px] font-mono text-[#777574] uppercase block">
                          Gán biến thể:
                        </label>
                        <select
                          id={`media-img-variant-${img.id}`}
                          value={img.variantId || ''}
                          onChange={(e) =>
                            handleChangeVariant(img.id, e.target.value ? Number(e.target.value) : null)
                          }
                          className="w-full px-2 py-1 bg-[#212226] border border-[#333235] text-[10px] font-mono text-[#F5F0E9] rounded-md focus:outline-none cursor-pointer"
                        >
                          <option value="">Ảnh chung</option>
                          {colorOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.colorName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 border-t border-[#333235] flex items-center justify-between gap-1">
                        {/* Primary Button */}
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          disabled={img.isPrimary}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            img.isPrimary
                              ? 'text-[#D6B27C] cursor-default font-bold'
                              : 'text-[#AAA5A0] hover:text-[#D6B27C] hover:bg-white/5 border border-transparent hover:border-[#333235]'
                          }`}
                          title={img.isPrimary ? 'Ảnh đại diện chính hiện tại' : 'Đặt làm ảnh đại diện chính'}
                        >
                          {img.isPrimary ? '★ Đang là ảnh chính' : '☆ Đặt làm chính'}
                        </button>

                        {/* Reorder and Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 text-[#AAA5A0] hover:text-white disabled:text-[#777574]/30 rounded hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed text-xs"
                            title="Di chuyển sang trái"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'right')}
                            disabled={idx === images.length - 1}
                            className="p-1 text-[#AAA5A0] hover:text-white disabled:text-[#777574]/30 rounded hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed text-xs"
                            title="Di chuyển sang phải"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img)}
                            className="p-1 text-[#DF8D84] hover:bg-[#DF8D84]/20 rounded transition-colors cursor-pointer text-xs ml-1"
                            title="Xóa ảnh khỏi gallery"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
