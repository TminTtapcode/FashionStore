import type { OutfitSlotsMap } from '../types/outfit';

export interface OutfitPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  slots: OutfitSlotsMap;
}

export const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: 'preset-urbanist-tailoring',
    name: 'The Urbanist Tailoring',
    tagline: 'Phối đồ Menswear & Casual Sang trọng',
    description: 'Kết hợp áo blazer phom rộng phóng khoáng cùng sơ mi Oxford chuẩn mực và jeans ống suông vintage.',
    slots: {
      OUTERWEAR: {
        slot: 'OUTERWEAR',
        productId: 3,
        productSlug: 'ao-blazer-linen-phom-rong-minimalist',
        productName: 'Áo Blazer Linen Phom Rộng Minimalist',
        variantId: 13,
        sku: 'BLAZER-LINEN-BE-M',
        colorName: 'Be Cát',
        colorHex: '#D8C7B5',
        size: 'M',
        price: 850000,
        stockQuantity: 18,
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'ao-nu',
        isRepresentativeImage: true,
      },
      UPPER_BODY: {
        slot: 'UPPER_BODY',
        productId: 2,
        productSlug: 'ao-so-mi-oxford-cotton-co-button-down',
        productName: 'Áo Sơ Mi Oxford Cotton Cổ Button-Down',
        variantId: 7,
        sku: 'SOMI-OXFORD-TRANG-M',
        colorName: 'Trắng',
        colorHex: '#FFFFFF',
        size: 'M',
        price: 450000,
        stockQuantity: 45,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'ao-nam',
        isRepresentativeImage: true,
      },
      LOWER_BODY: {
        slot: 'LOWER_BODY',
        productId: 4,
        productSlug: 'quan-jeans-ong-suong-cap-cao-vintage-denim',
        productName: 'Quần Jeans Ống Suông Cạp Cao Vintage Denim',
        variantId: 19,
        sku: 'JEANS-SUONG-XANH-30',
        colorName: 'Xanh Vintage',
        colorHex: '#4E6E8E',
        size: '30',
        price: 520000,
        stockQuantity: 18,
        imageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'quan-nu',
        isRepresentativeImage: false,
      },
    },
  },
  {
    id: 'preset-silk-gala-evening',
    name: 'Silk Gala Evening',
    tagline: 'Quyến rũ Dạ tiệc cùng Lụa & Blazer Đen',
    description: 'Đầm lụa maxi dáng xòe thướt tha kết hợp cùng áo blazer đen than khoác hờ bờ vai tạo vẻ ngoài kiêu sa.',
    slots: {
      ONE_PIECE: {
        slot: 'ONE_PIECE',
        productId: 1,
        productSlug: 'dam-lua-maxi-co-chu-v-dang-xoe',
        productName: 'Đầm Lụa Maxi Cổ Chữ V Dáng Xòe',
        variantId: 1,
        sku: 'DAM-MAXI-TRANG-S',
        colorName: 'Trắng Ngọc',
        colorHex: '#FDFBF7',
        size: 'S',
        price: 650000,
        stockQuantity: 15,
        imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'dam-va-vay',
        isRepresentativeImage: false,
      },
      OUTERWEAR: {
        slot: 'OUTERWEAR',
        productId: 3,
        productSlug: 'ao-blazer-linen-phom-rong-minimalist',
        productName: 'Áo Blazer Linen Phom Rộng Minimalist',
        variantId: 15,
        sku: 'BLAZER-LINEN-DEN-S',
        colorName: 'Đen Than',
        colorHex: '#1C1C1C',
        size: 'S',
        price: 890000,
        stockQuantity: 8,
        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'ao-nu',
        isRepresentativeImage: false,
      },
    },
  },
];

