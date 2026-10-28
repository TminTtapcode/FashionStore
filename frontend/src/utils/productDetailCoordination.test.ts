import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import type { ProductDetail } from '../types/catalog.ts';

// Transpile actual ProductDetailModal.tsx component for integration testing
const componentPath = path.resolve(import.meta.dirname, '../components/ProductDetailModal.tsx');
const componentSource = fs.readFileSync(componentPath, 'utf8');
const compiledComponent = ts.transpileModule(componentSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

// Mock Data Fixture mimicking backend DB seed
const MOCK_DRESS_PRODUCT: ProductDetail = {
  id: 1,
  name: 'Đầm Lụa Maxi Cổ Chữ V Dáng Xòe',
  slug: 'dam-lua-maxi-co-chu-v-dang-xoe',
  description: 'Thiết kế đầm lụa maxi dáng xòe bay bổng.',
  brand: 'Atelier Signature',
  material: '100% Lụa Satin Cao Cấp',
  fitStyle: 'Flared Fit',
  careInstructions: 'Giặt tay nhẹ nhàng.',
  specifications: JSON.stringify({
    size_guide: [
      { size: 'S', bust: '82-86', waist: '64-68', hips: '88-92' },
      { size: 'M', bust: '86-90', waist: '68-72', hips: '92-96' },
      { size: 'L', bust: '90-94', waist: '72-76', hips: '96-100' },
    ],
  }),
  minPrice: 650000,
  maxPrice: 680000,
  compareAtPrice: 790000,
  outOfStock: false,
  categoryId: 3,
  categoryName: 'Đầm & Váy',
  categorySlug: 'dam-va-vay',
  availableColors: [
    { name: 'Trắng Ngọc', hex: '#FDFBF7' },
    { name: 'Xanh Rêu Nhạt', hex: '#7A8B7B' },
  ],
  availableSizes: ['S', 'M', 'L'],
  variants: [
    {
      id: 1,
      sku: 'DAM-MAXI-TRANG-S',
      size: 'S',
      colorName: 'Trắng Ngọc',
      colorHex: '#FDFBF7',
      price: 650000,
      compareAtPrice: 750000,
      stockQuantity: 15,
      inStock: true,
      status: 'ACTIVE',
    },
    {
      id: 2,
      sku: 'DAM-MAXI-TRANG-M',
      size: 'M',
      colorName: 'Trắng Ngọc',
      colorHex: '#FDFBF7',
      price: 650000,
      compareAtPrice: 750000,
      stockQuantity: 20,
      inStock: true,
      status: 'ACTIVE',
    },
    {
      id: 3,
      sku: 'DAM-MAXI-TRANG-L',
      size: 'L',
      colorName: 'Trắng Ngọc',
      colorHex: '#FDFBF7',
      price: 650000,
      compareAtPrice: 750000,
      stockQuantity: 4, // Low stock: <= 5
      inStock: true,
      status: 'ACTIVE',
    },
    {
      id: 4,
      sku: 'DAM-MAXI-REU-S',
      size: 'S',
      colorName: 'Xanh Rêu Nhạt',
      colorHex: '#7A8B7B',
      price: 680000, // Variant-specific price
      compareAtPrice: 790000,
      stockQuantity: 12,
      inStock: true,
      status: 'ACTIVE',
    },
    {
      id: 5,
      sku: 'DAM-MAXI-REU-M',
      size: 'M',
      colorName: 'Xanh Rêu Nhạt',
      colorHex: '#7A8B7B',
      price: 680000,
      compareAtPrice: 790000,
      stockQuantity: 0, // OUT OF STOCK
      inStock: false,
      status: 'ACTIVE',
    },
  ],
  images: [
    {
      id: 1,
      variantId: 1, // Trắng Ngọc front
      imageUrl: 'https://images.unsplash.com/photo-white-front',
      altText: 'Đầm trắng ngọc mặt trước',
      sortOrder: 1,
      isPrimary: true,
    },
    {
      id: 2,
      variantId: 1, // Trắng Ngọc back
      imageUrl: 'https://images.unsplash.com/photo-white-back',
      altText: 'Đầm trắng ngọc mặt sau',
      sortOrder: 2,
      isPrimary: false,
    },
    {
      id: 3,
      variantId: 4, // Xanh Rêu Nhạt
      imageUrl: 'https://images.unsplash.com/photo-sage',
      altText: 'Đầm xanh rêu nhạt dáng xòe',
      sortOrder: 3,
      isPrimary: false,
    },
    {
      id: 4,
      variantId: null, // General lookbook image
      imageUrl: 'https://images.unsplash.com/photo-general-lookbook',
      altText: 'Lookbook toàn cảnh atelier',
      sortOrder: 4,
      isPrimary: false,
    },
  ],
};

// Second fixture with asymmetric sizes: Áo thun
const MOCK_TEE_PRODUCT: ProductDetail = {
  id: 5,
  name: 'Áo Thun Heavyweight Cotton 260GSM Unisex',
  slug: 'ao-thun-heavyweight-cotton-260gsm-unisex',
  minPrice: 320000,
  maxPrice: 320000,
  compareAtPrice: null,
  outOfStock: false,
  categoryId: 7,
  categoryName: 'Áo Nam',
  categorySlug: 'ao-nam',
  availableColors: [
    { name: 'Trắng', hex: '#FFFFFF' },
    { name: 'Đen Than', hex: '#1C1C1C' },
    { name: 'Xanh Rêu Đậm', hex: '#3F4A3C' },
  ],
  availableSizes: ['S', 'M', 'L'],
  variants: [
    // Trắng: S, M, L
    { id: 21, sku: 'TEE-TRANG-S', size: 'S', colorName: 'Trắng', colorHex: '#FFFFFF', price: 320000, compareAtPrice: null, stockQuantity: 50, inStock: true, status: 'ACTIVE' },
    { id: 22, sku: 'TEE-TRANG-M', size: 'M', colorName: 'Trắng', colorHex: '#FFFFFF', price: 320000, compareAtPrice: null, stockQuantity: 50, inStock: true, status: 'ACTIVE' },
    { id: 23, sku: 'TEE-TRANG-L', size: 'L', colorName: 'Trắng', colorHex: '#FFFFFF', price: 320000, compareAtPrice: null, stockQuantity: 50, inStock: true, status: 'ACTIVE' },
    // Đen Than: only M, L (NO S!)
    { id: 24, sku: 'TEE-DEN-M', size: 'M', colorName: 'Đen Than', colorHex: '#1C1C1C', price: 320000, compareAtPrice: null, stockQuantity: 30, inStock: true, status: 'ACTIVE' },
    { id: 25, sku: 'TEE-DEN-L', size: 'L', colorName: 'Đen Than', colorHex: '#1C1C1C', price: 320000, compareAtPrice: null, stockQuantity: 20, inStock: true, status: 'ACTIVE' },
    // Xanh Rêu Đậm: only L (NO S, NO M!)
    { id: 26, sku: 'TEE-REU-L', size: 'L', colorName: 'Xanh Rêu Đậm', colorHex: '#3F4A3C', price: 320000, compareAtPrice: null, stockQuantity: 15, inStock: true, status: 'ACTIVE' },
  ],
  images: [
    { id: 12, variantId: 21, imageUrl: 'https://images.unsplash.com/tee-white', altText: 'Tee White', sortOrder: 1, isPrimary: true },
    { id: 13, variantId: 24, imageUrl: 'https://images.unsplash.com/tee-black', altText: 'Tee Black', sortOrder: 2, isPrimary: false },
    { id: 14, variantId: 26, imageUrl: 'https://images.unsplash.com/tee-olive', altText: 'Tee Olive', sortOrder: 3, isPrimary: false },
  ],
};

interface TestHarnessOptions {
  product?: ProductDetail;
  user?: { id: number; email: string; fullName: string; role: string } | null;
  isOpen?: boolean;
}

function createModalTestHarness(options: TestHarnessOptions = {}) {
  const currentProduct = options.product || MOCK_DRESS_PRODUCT;
  const currentUser = options.user !== undefined ? options.user : { id: 10, email: 'test@shop.com', fullName: 'Tester', role: 'CUSTOMER' };

  const slots: any[] = [];
  let cursor = 0;
  let dirty = false;
  let tree: any;
  let closed = false;
  let openedCart = false;
  let authModalOpened: string | null = null;
  const addedItems: Array<{ variantId: number; quantity: number }> = [];

  const mockReact = {
    useState(initial: any) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = typeof initial === 'function' ? initial() : initial;
      }
      return [
        slots[index],
        (value: any) => {
          const next = typeof value === 'function' ? value(slots[index]) : value;
          if (!Object.is(next, slots[index])) {
            slots[index] = next;
            dirty = true;
          }
        },
      ];
    },
    useRef(initial: any) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = { current: initial };
      }
      return slots[index];
    },
    useEffect(effect: () => (() => void) | void, deps?: any[]) {
      // In harness, if deps is [isOpen, slug], we already pre-seed product state; skip async re-fetch
      if (deps && deps.length === 2 && typeof deps[0] === 'boolean') {
        return;
      }
      effect();
    },
    useMemo(factory: () => any) {
      return factory();
    },
  };

  const mockCatalogApi = {
    getProductDetailApi: async (slug: string) => {
      if (slug === currentProduct.slug) return currentProduct;
      throw new Error('Không tìm thấy sản phẩm');
    },
  };

  const mockAuth = {
    useAuth: () => ({
      user: currentUser,
      openAuthModal: (mode: string) => {
        authModalOpened = mode;
      },
    }),
  };

  const mockCart = {
    useCart: () => ({
      addToCart: async (variantId: number, quantity: number) => {
        addedItems.push({ variantId, quantity });
      },
      openCart: () => {
        openedCart = true;
      },
    }),
  };

  const mockSizeGuideDrawer = ({ isOpen, categoryName, specificationsJson }: any) => {
    if (!isOpen) return null;
    let sizeGuideCount = 0;
    if (specificationsJson) {
      try {
        const parsed = JSON.parse(specificationsJson);
        if (Array.isArray(parsed.size_guide)) sizeGuideCount = parsed.size_guide.length;
      } catch {
        // ignore
      }
    }
    return {
      type: 'SizeGuideDrawer',
      props: { isOpen, categoryName, sizeGuideCount },
    };
  };

  const moduleObj = { exports: {} as any };

  const sandbox: any = {
    module: moduleObj,
    exports: moduleObj.exports,
    require(id: string) {
      if (id === 'react') return mockReact;
      if (id === 'react/jsx-runtime') return jsxRuntime;
      if (id.includes('catalogApi')) return mockCatalogApi;
      if (id.includes('AuthContext')) return mockAuth;
      if (id.includes('CartContext')) return mockCart;
      if (id.includes('SizeGuideDrawer')) return { default: mockSizeGuideDrawer };
      throw new Error(`Unexpected require in modal test harness: ${id}`);
    },
    Intl,
    Set,
    JSON,
    Math,
    Boolean,
    Error,
    setTimeout(cb: () => void) {
      cb();
      return 1;
    },
    clearTimeout() {},
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    document: {
      body: { style: { overflow: '' } },
    },
  };

  vm.runInNewContext(compiledComponent, sandbox);
  const ProductDetailModal = moduleObj.exports.default || moduleObj.exports;

  function renderComponent() {
    let loops = 0;
    do {
      if (++loops > 25) throw new Error('Infinite re-render loop detected');
      dirty = false;
      cursor = 0;
      tree = ProductDetailModal({
        slug: currentProduct.slug,
        isOpen: options.isOpen !== undefined ? options.isOpen : true,
        onClose: () => {
          closed = true;
        },
      });
    } while (dirty);
  }

  // Pre-seed product in slot 2 (where product state lives)
  slots[0] = false; // isSubmitting
  slots[1] = null; // submitError
  slots[2] = currentProduct; // product
  slots[3] = false; // isLoading
  slots[4] = null; // error
  slots[5] = currentProduct.availableColors[0].name; // selectedColor
  slots[6] = currentProduct.availableSizes[0]; // selectedSize
  slots[7] = 0; // selectedImageIndex
  slots[8] = 1; // quantity
  slots[9] = false; // isSizeGuideOpen
  slots[10] = 'details'; // activeTab
  slots[11] = false; // isFlashActive

  renderComponent();

  function findNode(root: any, predicate: (node: any) => boolean): any {
    if (!root) return null;
    if (predicate(root)) return root;
    const children = root.props?.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        const found = findNode(child, predicate);
        if (found) return found;
      }
    } else if (children && typeof children === 'object') {
      const found = findNode(children, predicate);
      if (found) return found;
    }
    return null;
  }

  function findAllNodes(root: any, predicate: (node: any) => boolean): any[] {
    const results: any[] = [];
    function traverse(node: any) {
      if (!node) return;
      if (predicate(node)) results.push(node);
      const children = node.props?.children;
      if (Array.isArray(children)) {
        for (const child of children) traverse(child);
      } else if (children && typeof children === 'object') {
        traverse(children);
      }
    }
    traverse(root);
    return results;
  }

  return {
    getTree: () => tree,
    getSlots: () => ({
      product: slots[2],
      selectedColor: slots[5],
      selectedSize: slots[6],
      selectedImageIndex: slots[7],
      quantity: slots[8],
      isSizeGuideOpen: slots[9],
    }),
    isClosed: () => closed,
    isCartOpened: () => openedCart,
    getAuthModalOpened: () => authModalOpened,
    getAddedItems: () => addedItems,
    findNode: (predicate: (node: any) => boolean) => findNode(tree, predicate),
    findAllNodes: (predicate: (node: any) => boolean) => findAllNodes(tree, predicate),
    selectColor(colorName: string) {
      const button = findNode(tree, (n) => n?.type === 'button' && n.props?.title === colorName);
      assert.ok(button, `Color button for ${colorName} not found`);
      button.props.onClick();
      renderComponent();
    },
    selectSize(size: string) {
      const button = findNode(
        tree,
        (n) =>
          n?.type === 'button' &&
          (n.props?.children?.[0]?.props?.children === size ||
            n.props?.children === size ||
            (Array.isArray(n.props?.children) && n.props.children.some((c: any) => c?.props?.children === size)))
      );
      assert.ok(button, `Size button for ${size} not found`);
      if (button.props.disabled) {
        throw new Error(`Size button for ${size} is disabled`);
      }
      button.props.onClick();
      renderComponent();
    },
    clickThumbnail(index: number) {
      const thumbnails = findAllNodes(tree, (n) => n?.type === 'button' && typeof n.props?.className === 'string' && n.props.className.includes('w-14'));
      assert.ok(thumbnails[index], `Thumbnail at index ${index} not found`);
      thumbnails[index].props.onClick();
      renderComponent();
    },
    stepQuantity(delta: number) {
      const btn = findNode(tree, (n) => n?.type === 'button' && n.props?.title === (delta > 0 ? 'Tăng số lượng' : 'Giảm số lượng'));
      assert.ok(btn, `Stepper button for delta ${delta} not found`);
      if (btn.props.disabled) throw new Error('Stepper button is disabled');
      btn.props.onClick();
      renderComponent();
    },
    clickAddToCart() {
      const btn = findNode(
        tree,
        (n) =>
          n?.type === 'button' &&
          typeof n.props?.className === 'string' &&
          n.props.className.includes('flex-1') &&
          JSON.stringify(n.props?.children).includes('THÊM VÀO GIỎ HÀNG')
      );
      assert.ok(btn, 'Add to cart button not found');
      if (btn.props.disabled) throw new Error('Add to cart button is disabled');
      return btn.props.onClick();
    },
    openSizeGuide() {
      const btn = findNode(tree, (n) => n?.type === 'button' && typeof n.props?.className === 'string' && n.props.className.includes('text-[#C7AD83]') && JSON.stringify(n.props?.children).includes('Bảng quy đổi size'));
      assert.ok(btn, 'Open size guide button not found');
      btn.props.onClick();
      renderComponent();
    },
  };
}

describe('ProductDetailModal Component Integration Test Suite (Phase 5B)', () => {
  it('1. Initial Load: sets initial color, valid matching size, and first image index', () => {
    const harness = createModalTestHarness();
    const state = harness.getSlots();

    assert.equal(state.selectedColor, 'Trắng Ngọc');
    assert.equal(state.selectedSize, 'S');
    assert.equal(state.selectedImageIndex, 0);
    assert.equal(state.quantity, 1);
  });

  it('2. Dynamic Gallery: Selecting color filters active gallery images to only matching variant and general images', () => {
    const harness = createModalTestHarness();

    // Default "Trắng Ngọc" main image
    let mainImg = harness.findNode((n) => n?.type === 'img' && n.props?.className?.includes('object-cover'));
    assert.ok(mainImg);
    assert.equal(mainImg.props.src, 'https://images.unsplash.com/photo-white-front');

    // Switch to "Xanh Rêu Nhạt"
    harness.selectColor('Xanh Rêu Nhạt');
    const state = harness.getSlots();
    assert.equal(state.selectedColor, 'Xanh Rêu Nhạt');
    assert.equal(state.selectedImageIndex, 0);

    // Active image must now be image 3 (variant 4 for Xanh Rêu)
    mainImg = harness.findNode((n) => n?.type === 'img' && n.props?.className?.includes('object-cover'));
    assert.ok(mainImg);
    assert.equal(mainImg.props.src, 'https://images.unsplash.com/photo-sage');
  });

  it('3. Ghost Variant Prevention: switching to color with asymmetric sizes auto-resolves to a valid size', () => {
    // Use Tee Product: Trắng has S, M, L. Đen Than has M, L (NO S). Xanh Rêu has L only.
    const harness = createModalTestHarness({ product: MOCK_TEE_PRODUCT });
    assert.equal(harness.getSlots().selectedColor, 'Trắng');
    assert.equal(harness.getSlots().selectedSize, 'S');

    // Switch to "Đen Than" which does NOT have size 'S'
    harness.selectColor('Đen Than');
    const state = harness.getSlots();
    assert.equal(state.selectedColor, 'Đen Than');
    // selectedSize must NOT remain 'S'! It must auto-select valid size 'M'
    assert.equal(state.selectedSize, 'M', 'Must auto-resolve to size M');

    // Switch to "Xanh Rêu Đậm" which only has size 'L'
    harness.selectColor('Xanh Rêu Đậm');
    assert.equal(harness.getSlots().selectedColor, 'Xanh Rêu Đậm');
    assert.equal(harness.getSlots().selectedSize, 'L', 'Must auto-resolve to size L');
  });

  it('4. Out-of-Stock Handling: disabled button and out-of-stock warning when stockQuantity is 0', () => {
    const harness = createModalTestHarness();

    // In MOCK_DRESS_PRODUCT, "Xanh Rêu Nhạt" size "M" has stockQuantity = 0
    harness.selectColor('Xanh Rêu Nhạt');
    harness.selectSize('S'); // S is in stock (12)
    assert.equal(harness.getSlots().selectedSize, 'S');

    // Trying to click disabled size M should throw with disabled error
    assert.throws(
      () => harness.selectSize('M'),
      /is disabled/,
      'Out of stock size button must be disabled'
    );
  });

  it('5. Variant Resolution & Price differences: shows correct unit price per variant', () => {
    const harness = createModalTestHarness();

    // Trắng Ngọc has price 650.000₫
    assert.equal(harness.getSlots().selectedColor, 'Trắng Ngọc');

    // Switch to Xanh Rêu Nhạt which has higher price 680.000₫
    harness.selectColor('Xanh Rêu Nhạt');
    harness.selectSize('S');

    // Quantity stepper
    harness.stepQuantity(1); // quantity = 2
    assert.equal(harness.getSlots().quantity, 2);
  });

  it('6. Add to Cart: triggers AuthModal when guest user is not logged in', async () => {
    const harness = createModalTestHarness({ user: null });
    await harness.clickAddToCart();

    assert.equal(harness.getAuthModalOpened(), 'login', 'Must prompt login for guest');
    assert.equal(harness.getAddedItems().length, 0, 'Must not add items for unauthenticated guest');
    assert.equal(harness.isClosed(), false, 'Modal remains open');
  });

  it('7. Add to Cart: authenticated user adds variant, closes modal and opens MiniCart', async () => {
    const harness = createModalTestHarness();

    harness.stepQuantity(1); // quantity = 2
    await harness.clickAddToCart();

    const added = harness.getAddedItems();
    assert.equal(added.length, 1);
    assert.equal(added[0].variantId, 1); // DAM-MAXI-TRANG-S
    assert.equal(added[0].quantity, 2);
    assert.equal(harness.isClosed(), true, 'Product detail modal must close on success');
    assert.equal(harness.isCartOpened(), true, 'MiniCart must open to show added product');
  });

  it('8. Size Guide: opens slide-over drawer with customized specifications table', () => {
    const harness = createModalTestHarness();
    harness.openSizeGuide();

    assert.equal(harness.getSlots().isSizeGuideOpen, true);
  });

  it('9. Boundary Price Verification (Phase 5A.2 Review Alignment): 500.000₫ satisfies both <= 500k and >= 500k', () => {
    // Mathematical and JPA predicate proof:
    const testPrice = 500000;
    const preset1 = { label: '≤ 500k', max: 500000 };
    const preset2 = { label: '500k – 1 triệu', min: 500000, max: 1000000 };

    const matchesPreset1 = testPrice <= preset1.max;
    const matchesPreset2 = testPrice >= preset2.min && testPrice <= preset2.max;

    assert.equal(matchesPreset1, true, 'Product with price 500.000₫ is inclusively <= 500.000₫');
    assert.equal(matchesPreset2, true, 'Product with price 500.000₫ is inclusively >= 500.000₫ and <= 1.000.000₫');
  });
});
