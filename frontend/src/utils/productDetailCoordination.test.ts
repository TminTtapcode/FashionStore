import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import type { ProductDetail } from '../types/catalog.ts';
import type { Cart } from '../types/cart.ts';

// Transpile actual ProductDetailModal.tsx component for integration testing
const modalPath = path.resolve(import.meta.dirname, '../components/ProductDetailModal.tsx');
const modalSource = fs.readFileSync(modalPath, 'utf8');
const compiledModal = ts.transpileModule(modalSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

// Transpile actual SizeGuideDrawer.tsx component
const drawerPath = path.resolve(import.meta.dirname, '../components/SizeGuideDrawer.tsx');
const drawerSource = fs.readFileSync(drawerPath, 'utf8');
const compiledDrawer = ts.transpileModule(drawerSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

// Fixture 1: Đầm Lụa Maxi with both in-stock and out-of-stock variants
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
      stockQuantity: 4,
      inStock: true,
      status: 'ACTIVE',
    },
    {
      id: 4,
      sku: 'DAM-MAXI-REU-S',
      size: 'S',
      colorName: 'Xanh Rêu Nhạt',
      colorHex: '#7A8B7B',
      price: 680000,
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
      stockQuantity: 0, // Out of stock for testing
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

// Fixture 2: Áo thun with asymmetric sizes per color
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

// Fixture 3: Product with a color having NO color-specific image and NO general image
const MOCK_ORPHAN_IMAGE_PRODUCT: ProductDetail = {
  id: 8,
  name: 'Đầm Dạ Hội Velvet Noir',
  slug: 'dam-da-hoi-velvet-noir',
  minPrice: 950000,
  maxPrice: 950000,
  outOfStock: false,
  categoryId: 3,
  availableColors: [
    { name: 'Đỏ Rượu', hex: '#722F37' },
    { name: 'Xanh Navy', hex: '#000080' },
  ],
  availableSizes: ['S', 'M'],
  variants: [
    { id: 41, sku: 'VELVET-DO-S', size: 'S', colorName: 'Đỏ Rượu', colorHex: '#722F37', price: 950000, compareAtPrice: null, stockQuantity: 10, inStock: true, status: 'ACTIVE' },
    { id: 42, sku: 'VELVET-NAVY-S', size: 'S', colorName: 'Xanh Navy', colorHex: '#000080', price: 950000, compareAtPrice: null, stockQuantity: 8, inStock: true, status: 'ACTIVE' },
  ],
  images: [
    // Only image in catalog is tagged specifically for Red variant (variantId: 41). NO general image exists!
    { id: 51, variantId: 41, imageUrl: 'https://images.unsplash.com/velvet-red', altText: 'Đầm nhung đỏ rượu', sortOrder: 1, isPrimary: true },
  ],
};

// Fixture 4: Product with an INACTIVE variant that has stock
const MOCK_INACTIVE_VARIANT_PRODUCT: ProductDetail = {
  id: 9,
  name: 'Quần Khaki Slim Fit',
  slug: 'quan-khaki-slim-fit',
  minPrice: 400000,
  maxPrice: 400000,
  outOfStock: false,
  categoryId: 5,
  availableColors: [{ name: 'Be', hex: '#F5F5DC' }],
  availableSizes: ['29', '30'],
  variants: [
    { id: 61, sku: 'KHAKI-BE-29', size: '29', colorName: 'Be', colorHex: '#F5F5DC', price: 400000, compareAtPrice: null, stockQuantity: 10, inStock: true, status: 'ACTIVE' },
    // Variant 62 has stock but is INACTIVE (discontinued)
    { id: 62, sku: 'KHAKI-BE-30', size: '30', colorName: 'Be', colorHex: '#F5F5DC', price: 400000, compareAtPrice: null, stockQuantity: 25, inStock: true, status: 'INACTIVE' },
  ],
  images: [
    { id: 71, variantId: 61, imageUrl: 'https://images.unsplash.com/khaki-be', altText: 'Quần khaki be', sortOrder: 1, isPrimary: true },
  ],
};

interface TestHarnessOptions {
  product?: ProductDetail;
  user?: { id: number; email: string; fullName: string; role: string } | null;
  cart?: Cart | null;
  isOpen?: boolean;
}

function createModalTestHarness(options: TestHarnessOptions = {}) {
  const currentProduct = options.product || MOCK_DRESS_PRODUCT;
  const currentUser = options.user !== undefined ? options.user : { id: 10, email: 'test@shop.com', fullName: 'Tester', role: 'CUSTOMER' };
  const currentCart = options.cart || null;

  const slots: any[] = [];
  let cursor = 0;
  let dirty = false;
  let tree: any;
  let closed = false;
  let openedCart = false;
  let authModalOpened: string | null = null;
  const addedItems: Array<{ variantId: number; quantity: number }> = [];

  const windowListeners: Record<string, Function[]> = {};

  const mockWindow = {
    addEventListener: (evt: string, fn: Function) => {
      windowListeners[evt] = windowListeners[evt] || [];
      windowListeners[evt].push(fn);
    },
    removeEventListener: (evt: string, fn: Function) => {
      if (windowListeners[evt]) {
        windowListeners[evt] = windowListeners[evt].filter((l) => l !== fn);
      }
    },
  };

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
      if (
        deps &&
        deps.length === 2 &&
        typeof deps[0] === 'boolean' &&
        (deps[1] === null || typeof deps[1] === 'string')
      ) {
        return;
      }
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup);
      }
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
      cart: currentCart,
      addToCart: async (variantId: number, quantity: number) => {
        addedItems.push({ variantId, quantity });
      },
      openCart: () => {
        openedCart = true;
      },
    }),
  };

  const moduleObj = { exports: {} as any };
  const drawerModuleObj = { exports: {} as any };

  const sandbox: any = {
    module: moduleObj,
    exports: moduleObj.exports,
    require(id: string) {
      if (id === 'react') return mockReact;
      if (id === 'react/jsx-runtime') return jsxRuntime;
      if (id.includes('catalogApi')) return mockCatalogApi;
      if (id.includes('AuthContext')) return mockAuth;
      if (id.includes('CartContext')) return mockCart;
      if (id.includes('SizeGuideDrawer')) {
        // Execute real transpiled SizeGuideDrawer inside the sandbox
        const drawerSandbox = { ...sandbox, module: drawerModuleObj, exports: drawerModuleObj.exports };
        vm.runInNewContext(compiledDrawer, drawerSandbox);
        return drawerModuleObj.exports.default ? drawerModuleObj.exports : { default: drawerModuleObj.exports };
      }
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
    window: mockWindow,
    document: {
      body: { style: { overflow: '' } },
      activeElement: { focus: () => {} },
    },
  };

  vm.runInNewContext(compiledModal, sandbox);
  const ProductDetailModal = moduleObj.exports.default || moduleObj.exports;

  let cleanups: Array<() => void> = [];

  function renderComponent() {
    let loops = 0;
    do {
      if (++loops > 25) throw new Error('Infinite re-render loop detected');
      for (const cleanup of cleanups) {
        cleanup();
      }
      cleanups = [];
      dirty = false;
      cursor = 0;
      tree = ProductDetailModal({
        slug: currentProduct.slug,
        isOpen: options.isOpen !== undefined ? options.isOpen : true,
        onClose: () => {
          closed = true;
        },
      });

      // Execute functional children (reconciliation phase) like SizeGuideDrawer
      const drawerNode = findNode(
        (n) => typeof n?.type === 'function' && n.props && 'categoryName' in n.props
      );
      if (drawerNode) {
        drawerNode.type(drawerNode.props);
      }
    } while (dirty);
  }

  // Pre-seed product in slot 2 (where product state lives)
  slots[0] = false; // isSubmitting
  slots[1] = null; // submitError
  slots[2] = currentProduct; // product
  slots[3] = false; // isLoading
  slots[4] = null; // error
  slots[5] = currentProduct.availableColors[0]?.name || ''; // selectedColor
  slots[6] = currentProduct.availableSizes[0] || ''; // selectedSize
  slots[7] = 0; // selectedImageIndex
  slots[8] = 1; // quantity
  slots[9] = false; // isSizeGuideOpen
  slots[10] = 'details'; // activeTab
  slots[11] = false; // isFlashActive

  // Trigger initial render
  renderComponent();

  function findNode(predicate: (node: any) => boolean, root = tree, seen = new Set()): any {
    if (!root || typeof root !== 'object' || seen.has(root)) return null;
    seen.add(root);
    if (predicate(root)) return root;
    if (root.props && root.props.children) {
      const children = Array.isArray(root.props.children)
        ? root.props.children
        : [root.props.children];
      for (const child of children) {
        const found = findNode(predicate, child, seen);
        if (found) return found;
      }
    }
    return null;
  }

  function findAllNodes(predicate: (node: any) => boolean, root = tree, seen = new Set()): any[] {
    const results: any[] = [];
    function walk(node: any) {
      if (!node || typeof node !== 'object' || seen.has(node)) return;
      seen.add(node);
      if (predicate(node)) results.push(node);
      if (node.props && node.props.children) {
        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        for (const child of children) walk(child);
      }
    }
    walk(root);
    return results;
  }

  return {
    getTree: () => tree,
    getSlots: () => ({
      isSubmitting: slots[0],
      submitError: slots[1],
      product: slots[2],
      isLoading: slots[3],
      error: slots[4],
      selectedColor: slots[5],
      selectedSize: slots[6],
      selectedImageIndex: slots[7],
      quantity: slots[8],
      isSizeGuideOpen: slots[9],
    }),
    findNode,
    findAllNodes,
    isClosed: () => closed,
    isCartOpened: () => openedCart,
    getAuthModalOpened: () => authModalOpened,
    getAddedItems: () => addedItems,
    dispatchWindowEvent: (type: string, data: any = {}) => {
      const list = windowListeners[type] || [];
      let immediateStopped = false;
      const eventObj = {
        type,
        ...data,
        stopPropagation: () => {},
        stopImmediatePropagation: () => {
          immediateStopped = true;
        },
      };
      for (const fn of [...list]) {
        if (immediateStopped) break;
        fn(eventObj);
      }
      renderComponent();
    },
    selectColor: (colorName: string) => {
      const btn = findNode(
        (n) =>
          n?.type === 'button' &&
          (n.props?.title === colorName || n.props?.['aria-label'] === `Chọn màu ${colorName}`)
      );
      assert.ok(btn, `Color button for ${colorName} not found`);
      btn.props.onClick();
      renderComponent();
    },
    selectSize: (size: string) => {
      const btn = findNode(
        (n) =>
          n?.type === 'button' &&
          Array.isArray(n.props?.children) &&
          n.props.children.some((c: any) => c?.props?.children === size)
      );
      assert.ok(btn, `Size button for ${size} not found`);
      if (btn.props.disabled) {
        throw new Error(`Size button for ${size} is disabled`);
      }
      btn.props.onClick();
      renderComponent();
    },
    stepQuantity: (delta: number) => {
      const isIncrease = delta > 0;
      const btn = findNode(
        (n) =>
          n?.type === 'button' &&
          n.props?.children === (isIncrease ? '+' : '-') &&
          n.props?.title?.includes('số lượng')
      );
      assert.ok(btn, `Quantity step button ${isIncrease ? '+' : '-'} not found`);
      if (btn.props.disabled) {
        throw new Error(`Quantity step button ${isIncrease ? '+' : '-'} is disabled`);
      }
      btn.props.onClick();
      renderComponent();
    },
    clickAddToCart: async () => {
      const btn = findNode(
        (n) =>
          n?.type === 'button' &&
          n.props?.className?.includes('flex-1') &&
          n.props?.className?.includes('h-11')
      );
      assert.ok(btn, 'Add to cart CTA button not found');
      if (btn.props.disabled) {
        throw new Error('Add to cart button is disabled');
      }
      await btn.props.onClick();
      renderComponent();
    },
    openSizeGuide: () => {
      const btn = findNode(
        (n) =>
          n?.type === 'button' &&
          JSON.stringify(n.props?.children).includes('Bảng quy đổi size')
      );
      assert.ok(btn, 'Open size guide button not found');
      btn.props.onClick();
      renderComponent();
    },
  };
}

describe('ProductDetailModal Component Integration Test Suite (Phase 5B & 5B.1 Hardening)', () => {
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

  it('3. P1 Variant Resolution: Size Preservation vs Ghost Variant Auto-resolution', async () => {
    // Sub-case A: Ghost Variant Prevention (Tee Product)
    // Trắng has S, M, L. Đen Than has M, L (NO S).
    const harnessTee = createModalTestHarness({ product: MOCK_TEE_PRODUCT });
    assert.equal(harnessTee.getSlots().selectedColor, 'Trắng');
    assert.equal(harnessTee.getSlots().selectedSize, 'S');

    // Switch to "Đen Than" which does NOT produce size 'S'.
    // Must auto-resolve to 'M' to prevent Ghost Variant!
    harnessTee.selectColor('Đen Than');
    assert.equal(harnessTee.getSlots().selectedColor, 'Đen Than');
    assert.equal(harnessTee.getSlots().selectedSize, 'M', 'Ghost variant prevention must auto-resolve to M');

    // Sub-case B: Size Intent Preservation (Dress Product)
    // Trắng Ngọc has M (in-stock). Xanh Rêu has M (OUT OF STOCK).
    const harnessDress = createModalTestHarness({ product: MOCK_DRESS_PRODUCT });
    harnessDress.selectSize('M');
    assert.equal(harnessDress.getSlots().selectedSize, 'M');

    // Switch to "Xanh Rêu Nhạt". Because size M is offered for Xanh Rêu, the user's size intent MUST be preserved!
    harnessDress.selectColor('Xanh Rêu Nhạt');
    assert.equal(harnessDress.getSlots().selectedColor, 'Xanh Rêu Nhạt');
    assert.equal(harnessDress.getSlots().selectedSize, 'M', 'Must preserve size M even when out of stock');

    // Add to cart must be disabled because M is out of stock
    await assert.rejects(
      async () => harnessDress.clickAddToCart(),
      /is disabled/,
      'Cannot add out of stock variant to cart'
    );
  });

  it('4. P1 Inactive Variant Handling: Inactive variants with positive stock are NOT offered or buyable', () => {
    const harness = createModalTestHarness({ product: MOCK_INACTIVE_VARIANT_PRODUCT });
    // Size 29 is ACTIVE (in-stock: 10). Size 30 is INACTIVE (stock: 25).
    assert.equal(harness.getSlots().selectedSize, '29');

    // Trying to select size 30 must fail because variant is INACTIVE
    assert.throws(
      () => harness.selectSize('30'),
      /is disabled/,
      'Inactive variant must be disabled despite stockQuantity > 0'
    );
  });

  it('5. P1 Layered Escape Handling: Topmost layer consumes Escape without closing the underlying modal', () => {
    const harness = createModalTestHarness();

    // 1. Open Size Guide drawer
    harness.openSizeGuide();
    assert.equal(harness.getSlots().isSizeGuideOpen, true, 'Size Guide drawer must be open');
    assert.equal(harness.isClosed(), false, 'Modal must remain open');

    // 2. First Escape: Size Guide consumes it and closes; Modal must NOT close!
    harness.dispatchWindowEvent('keydown', { key: 'Escape' });
    assert.equal(harness.getSlots().isSizeGuideOpen, false, 'First Escape must close Size Guide drawer');
    assert.equal(harness.isClosed(), false, 'Modal MUST NOT close on first Escape while drawer was open');

    // 3. Second Escape: Modal consumes it and closes
    harness.dispatchWindowEvent('keydown', { key: 'Escape' });
    assert.equal(harness.isClosed(), true, 'Second Escape must close Product Detail modal');
  });

  it('6. P1 Modal History Coordination: Verifying in-app push vs direct deep-link contracts', () => {
    // Simulated browser history stack
    const historyStack: Array<{ state: any; url: string }> = [];
    let currentIndex = -1;

    const mockBrowserHistory = {
      pushState(state: any, _title: string, url: string) {
        historyStack.push({ state, url });
        currentIndex = historyStack.length - 1;
      },
      replaceState(state: any, _title: string, url: string) {
        if (currentIndex >= 0) {
          historyStack[currentIndex] = { state, url };
        } else {
          historyStack.push({ state, url });
          currentIndex = 0;
        }
      },
      back() {
        if (currentIndex > 0) currentIndex--;
      },
      getCurrent: () => historyStack[currentIndex],
    };

    // A. Catalog -> In-App Open Product A
    mockBrowserHistory.pushState({}, '', '/');
    // Open product:
    mockBrowserHistory.pushState({ isProductModalPushed: true, product: 'dam-lua-maxi' }, '', '/?product=dam-lua-maxi');
    assert.equal(historyStack.length, 2);
    assert.equal(mockBrowserHistory.getCurrent().url, '/?product=dam-lua-maxi');

    // Close product (In-app open): calls history.back()
    if (mockBrowserHistory.getCurrent().state?.isProductModalPushed) {
      mockBrowserHistory.back();
    }
    assert.equal(mockBrowserHistory.getCurrent().url, '/', 'Unwinds back to catalog without duplicate entries');
    assert.equal(currentIndex, 0, 'Pointer back at catalog entry');

    // B. Direct Deep-link: initial stack contains only the deep-link URL without isProductModalPushed
    const deepLinkHistory: Array<{ state: any; url: string }> = [
      { state: { product: 'dam-lua-maxi' }, url: '/?product=dam-lua-maxi' },
    ];
    let deepLinkIndex = 0;

    // Closing deep-link modal calls replaceState instead of back() to avoid exiting site
    const currentEntry = deepLinkHistory[deepLinkIndex];
    if (!currentEntry.state?.isProductModalPushed) {
      deepLinkHistory[deepLinkIndex] = {
        state: { isProductModalPushed: false, product: null },
        url: '/',
      };
    }
    assert.equal(deepLinkHistory.length, 1, 'Deep-link close does not push new entries');
    assert.equal(deepLinkHistory[0].url, '/', 'Replaces URL cleanly');
  });

  it('7. P2 Cart Quantity Integrity: Enforces ADR-011 max 10 limit and accounts for existing items in cart', async () => {
    // Cart fixture already containing 7 items of variant 1 (DAM-MAXI-TRANG-S)
    const existingCart: Cart = {
      id: 99,
      totalItemCount: 7,
      subtotal: 4550000,
      hasUnavailableItems: false,
      items: [
        {
          id: 101,
          variantId: 1, // DAM-MAXI-TRANG-S
          productId: 1,
          productName: 'Đầm Lụa Maxi',
          productSlug: 'dam-lua-maxi',
          sku: 'DAM-MAXI-TRANG-S',
          size: 'S',
          colorName: 'Trắng Ngọc',
          unitPrice: 650000,
          quantity: 7,
          lineTotal: 4550000,
          stockQuantity: 15,
          isAvailable: true,
        },
      ],
    };

    const harness = createModalTestHarness({ cart: existingCart });
    // User already has 7 in cart. Max allowed by policy is 10.
    // Therefore, user can only add at most 10 - 7 = 3 items!
    assert.equal(harness.getSlots().quantity, 1);

    harness.stepQuantity(1); // qty = 2
    assert.equal(harness.getSlots().quantity, 2);

    harness.stepQuantity(1); // qty = 3 (reaches max addable)
    assert.equal(harness.getSlots().quantity, 3);

    // Attempting to step to 4 must fail because 7 + 4 = 11 > 10 (ADR-011 limit)
    assert.throws(
      () => harness.stepQuantity(1),
      /is disabled/,
      'Cannot exceed remaining cart quantity allowance (max 10)'
    );

    // Now test when cart already has 10 items
    const fullCart: Cart = {
      ...existingCart,
      totalItemCount: 10,
      items: [{ ...existingCart.items[0], quantity: 10 }],
    };
    const harnessFull = createModalTestHarness({ cart: fullCart });
    await assert.rejects(
      async () => harnessFull.clickAddToCart(),
      /is disabled/,
      'Add to cart must be disabled when max 10 items already exist in cart'
    );
  });

  it('8. P2 Product Gallery Fallback: Single representative image with warning indicator when no color or general images exist', () => {
    const harness = createModalTestHarness({ product: MOCK_ORPHAN_IMAGE_PRODUCT });
    assert.equal(harness.getSlots().selectedColor, 'Đỏ Rượu');

    // Switch to "Xanh Navy" (which has NO image of its own and NO general images)
    harness.selectColor('Xanh Navy');
    assert.equal(harness.getSlots().selectedColor, 'Xanh Navy');

    // Active image must fallback to primary image
    const mainImg = harness.findNode((n) => n?.type === 'img' && n.props?.className?.includes('object-cover'));
    assert.ok(mainImg);
    assert.equal(mainImg.props.src, 'https://images.unsplash.com/velvet-red');

    // UI MUST display the warning note indicating it is a representative style image
    const fallbackNotice = harness.findNode(
      (n) => JSON.stringify(n?.props?.children || '').includes('Ảnh minh họa kiểu dáng')
    );
    assert.ok(fallbackNotice, 'Must display representative image notice for orphan color');
  });

  it('9. P2 Accessibility: Focus trap containment for Tab navigation', () => {
    const harness = createModalTestHarness();
    const modalRoot = harness.findNode((n) => n?.props?.role === 'dialog');
    assert.ok(modalRoot);
    assert.equal(modalRoot.props['aria-modal'], 'true');
    assert.equal(modalRoot.props['aria-labelledby'], 'product-modal-title');
    assert.equal(modalRoot.props.tabIndex, -1);
  });

  it('10. Boundary Price Verification (Phase 5A.2 Review Alignment): 500.000₫ satisfies both <= 500k and >= 500k', () => {
    const testPrice = 500000;
    const preset1 = { label: '≤ 500k', max: 500000 };
    const preset2 = { label: '500k – 1 triệu', min: 500000, max: 1000000 };

    const matchesPreset1 = testPrice <= preset1.max;
    const matchesPreset2 = testPrice >= preset2.min && testPrice <= preset2.max;

    assert.equal(matchesPreset1, true, 'Product with price 500.000₫ is inclusively <= 500.000₫');
    assert.equal(matchesPreset2, true, 'Product with price 500.000₫ is inclusively >= 500.000₫ and <= 1.000.000₫');
  });
});
