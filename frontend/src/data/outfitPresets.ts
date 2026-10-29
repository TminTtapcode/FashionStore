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
        colorHex: '#C7AD83',
        size: 'M',
        price: 850000,
        stockQuantity: 18,
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'ao-nu',
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
      },
      LOWER_BODY: {
        slot: 'LOWER_BODY',
        productId: 4,
        productSlug: 'quan-jeans-ong-suong-cap-cao-vintage-denim',
        productName: 'Quần Jeans Ống Suông Cạp Cao Vintage Denim',
        variantId: 19,
        sku: 'JEANS-SUONG-XANH-30',
        colorName: 'Xanh Vintage',
        colorHex: '#4A6B82',
        size: '30',
        price: 520000,
        stockQuantity: 18,
        imageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'quan-nu',
      },
    },
  },
  {
    id: 'preset-silk-gala-evening',
    name: 'Silk Gala Evening',
    tagline: 'Quyến rũ Dạ tiệc cùng Lụa & Blazer Đen',
    description: 'Đầm dạ hội lụa tơ tằm cổ yếm kết hợp cùng áo blazer đen than khoác hờ bờ vai tạo vẻ ngoài kiêu sa.',
    slots: {
      ONE_PIECE: {
        slot: 'ONE_PIECE',
        productId: 6,
        productSlug: 'dam-da-hoi-lua-to-tam-co-yem',
        productName: 'Đầm Dạ Hội Lụa Tơ Tằm Cổ Yếm',
        variantId: 34,
        sku: 'DAM-DA-HOI-LUA-TO-TAM-CO-DEN-S',
        colorName: 'Đen',
        colorHex: '#111214',
        size: 'S',
        price: 500000,
        stockQuantity: 10,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'dam-va-vay',
      },
      OUTERWEAR: {
        slot: 'OUTERWEAR',
        productId: 3,
        productSlug: 'ao-blazer-linen-phom-rong-minimalist',
        productName: 'Áo Blazer Linen Phom Rộng Minimalist',
        variantId: 15,
        sku: 'BLAZER-LINEN-DEN-S',
        colorName: 'Đen Than',
        colorHex: '#151518',
        size: 'S',
        price: 890000,
        stockQuantity: 8,
        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
        inStock: true,
        categorySlug: 'ao-nu',
      },
    },
  },
];
