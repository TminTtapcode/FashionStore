export type LayerType = 'TOP' | 'BOTTOM' | 'OUTERWEAR';

export type StudioBackground = 'pearl' | 'sage' | 'ink' | 'runway';

export interface StylingItem {
  id: string;
  name: string;
  category: LayerType;
  price: number;
  colorName: string;
  colorHex: string;
  variantId: number;
  assetUrl?: string;
  description?: string;
}

export interface OutfitSelection {
  top: StylingItem;
  bottom: StylingItem;
  outerwear?: StylingItem | null;
  background: StudioBackground;
}

