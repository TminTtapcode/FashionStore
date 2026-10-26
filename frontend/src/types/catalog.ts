export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  children: Category[];
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  status: string;
}

export interface ProductImage {
  id: number;
  variantId: number | null;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  brand?: string;
  material?: string;
  fitStyle?: string;
  minPrice: number;
  maxPrice: number;
  compareAtPrice?: number | null;
  outOfStock: boolean;
  primaryImageUrl: string;
  secondaryImageUrl: string;
  availableColors: ColorSwatch[];
  availableSizes: string[];
  categoryName?: string;
  categorySlug?: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  material?: string;
  fitStyle?: string;
  careInstructions?: string;
  specifications?: string; // JSON string with size_guide, etc.
  minPrice: number;
  maxPrice: number;
  compareAtPrice?: number | null;
  outOfStock: boolean;
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  variants: ProductVariant[];
  images: ProductImage[];
  availableColors: ColorSwatch[];
  availableSizes: string[];
}

export interface ProductFilterParams {
  categoryId?: number;
  categorySlug?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
