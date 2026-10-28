import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import * as catalogUtils from './catalogUrl.ts';
import type { ProductFilterParams, Category } from '../types/catalog.ts';

// Transpile actual CategoryFilterBar.tsx component once for integration testing
const componentPath = path.resolve(import.meta.dirname, '../components/CategoryFilterBar.tsx');
const componentSource = fs.readFileSync(componentPath, 'utf8');
const compiledComponent = ts.transpileModule(componentSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

interface HarnessOptions {
  initialQuery?: string;
  initialFilters?: ProductFilterParams;
}

/**
 * Component Test Harness
 * Exercises the ACTUAL transpiled CategoryFilterBar.tsx React component
 * with realistic React hooks simulation and fake timers.
 */
function createComponentHarness(options: HarnessOptions = {}) {
  const slots: any[] = [];
  const timers = new Map<number, () => void>();
  const calls: Array<{ filters: ProductFilterParams; options?: { replace?: boolean } }> = [];
  let cursor = 0;
  let dirty = false;
  let scheduledEffects: Array<() => void> = [];
  let cleanupFns: Array<(() => void) | void> = [];
  let tree: any;
  let timerId = 0;

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
    useEffect(effectFn: () => (() => void) | void, deps?: any[]) {
      const index = cursor++;
      const prev = slots[index];
      const hasChanged = !prev || !deps || deps.some((d, i) => !Object.is(d, prev.deps[i]));

      if (hasChanged) {
        scheduledEffects.push(() => {
          prev?.cleanup?.();
          const cleanup = effectFn();
          slots[index] = { deps, cleanup };
          if (cleanup) cleanupFns.push(cleanup);
        });
      }
    },
  };

  const moduleObj = { exports: {} as any };
  vm.runInNewContext(
    compiledComponent,
    {
      exports: moduleObj.exports,
      module: moduleObj,
      require(name: string) {
        if (name === 'react') return mockReact;
        if (name === 'react/jsx-runtime') return jsxRuntime;
        if (name === '../utils/catalogUrl') return catalogUtils;
        throw new Error(`Unexpected runtime import in test: ${name}`);
      },
      setTimeout(callback: () => void, _ms: number) {
        const id = ++timerId;
        timers.set(id, callback);
        return id;
      },
      clearTimeout(id: number) {
        timers.delete(id);
      },
    },
    { filename: 'CategoryFilterBar.actual.js' }
  );

  const defaultCategories: Category[] = [
    { id: 1, slug: 'thoi-trang-nam', name: 'Thời trang Nam', description: '', parentId: null, sortOrder: 0, children: [] },
    { id: 2, slug: 'thoi-trang-nu', name: 'Thời trang Nữ', description: '', parentId: null, sortOrder: 1, children: [] },
  ];

  const initialFilters: ProductFilterParams =
    options.initialFilters ??
    (options.initialQuery ? catalogUtils.parseCatalogUrl(options.initialQuery) : { ...catalogUtils.DEFAULT_FILTERS });

  const props = {
    categories: defaultCategories,
    filters: initialFilters,
    totalProducts: 24,
    onFilterChange(newFilters: ProductFilterParams, callOptions?: { replace?: boolean }) {
      calls.push({ filters: { ...newFilters }, options: callOptions });
      props.filters = newFilters;
    },
  };

  function renderComponent() {
    let loopCount = 0;
    do {
      if (++loopCount > 25) throw new Error('Infinite re-render detected in CategoryFilterBar');
      dirty = false;
      cursor = 0;
      scheduledEffects = [];
      tree = moduleObj.exports.default(props);
    } while (dirty);

    // Execute scheduled effects after render settles (just like React browser behavior)
    scheduledEffects.forEach((fn) => fn());
  }

  function findNode(node: any, predicate: (n: any) => boolean): any {
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findNode(child, predicate);
        if (found) return found;
      }
    } else if (node && typeof node === 'object') {
      if (predicate(node)) return node;
      return findNode(node.props?.children, predicate);
    }
    return null;
  }

  function getNodeText(node: any): string {
    if (Array.isArray(node)) return node.map(getNodeText).join('');
    if (node && typeof node === 'object') return getNodeText(node.props?.children);
    return node === false || node == null ? '' : String(node);
  }

  const getSearchInput = () =>
    findNode(tree, (n) => n?.type === 'input' && n.props?.placeholder?.includes('Tìm kiếm'));

  // Initial render
  renderComponent();

  return {
    typeSearch(val: string) {
      const input = getSearchInput();
      assert.ok(input, 'Search input element not found');
      input.props.onChange({ target: { value: val } });
      renderComponent();
    },
    pressEnterKey() {
      const input = getSearchInput();
      assert.ok(input, 'Search input element not found');
      input.props.onKeyDown({ key: 'Enter', preventDefault: () => {} });
      renderComponent();
    },
    simulatePopstate(query: string) {
      props.filters = catalogUtils.parseCatalogUrl(query);
      renderComponent();
    },
    updateFiltersProp(newFilters: ProductFilterParams) {
      props.filters = newFilters;
      renderComponent();
    },
    clickButtonByTitle(title: string) {
      const btn = findNode(tree, (n) => n?.type === 'button' && n.props?.title === title);
      assert.ok(btn, `Button with title "${title}" not found`);
      btn.props.onClick();
      renderComponent();
    },
    clickButtonByText(text: string) {
      const btn = findNode(tree, (n) => n?.type === 'button' && getNodeText(n.props?.children).trim() === text);
      assert.ok(btn, `Button with text "${text}" not found`);
      btn.props.onClick();
      renderComponent();
    },
    toggleFilterDrawer() {
      const btn = findNode(tree, (n) => n?.type === 'button' && getNodeText(n.props?.children).includes('BỘ LỌC'));
      assert.ok(btn, 'Filter drawer toggle button not found');
      btn.props.onClick();
      renderComponent();
    },
    selectSort(sortValue: string) {
      const select = findNode(tree, (n) => n?.type === 'select');
      assert.ok(select, 'Sort select element not found');
      select.props.onChange({ target: { value: sortValue } });
      renderComponent();
    },
    findChipByText(text: string) {
      return findNode(tree, (n) => getNodeText(n).includes(text));
    },
    expirePendingTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((cb) => cb());
      renderComponent();
    },
    unmount() {
      cleanupFns.forEach((fn) => fn?.());
      cleanupFns = [];
    },
    getSnapshot() {
      const input = getSearchInput();
      return {
        filters: { ...props.filters },
        inputValue: input?.props?.value ?? '',
        pendingTimersCount: timers.size,
        recordedCalls: [...calls],
      };
    },
  };
}

describe('CategoryFilterBar Component Integration Tests (Actual Component Transpiled)', () => {
  it('1. P1: Back navigation cancels pending search timer even when search string is unchanged', () => {
    const harness = createComponentHarness({ initialQuery: '?category=thoi-trang-nam' });

    // User types "linen"
    harness.typeSearch('linen');
    assert.equal(harness.getSnapshot().inputValue, 'linen');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1, 'Debounce timer must be scheduled');

    // Popstate Back navigation occurs to thoi-trang-nu (both had search = undefined)
    harness.simulatePopstate('?category=thoi-trang-nu');

    // Assert immediately after Back: timer must be cancelled and input cleared
    const snapshotBeforeTimer = harness.getSnapshot();
    assert.equal(snapshotBeforeTimer.filters.categorySlug, 'thoi-trang-nu');
    assert.equal(snapshotBeforeTimer.pendingTimersCount, 0, 'Pending timer MUST be cancelled on popstate');
    assert.equal(snapshotBeforeTimer.inputValue, '', 'Input must be reset to committed search');

    // Fast-forward any timers: no trailing callback must run
    harness.expirePendingTimers();
    const snapshotAfterTimer = harness.getSnapshot();
    assert.equal(snapshotAfterTimer.filters.categorySlug, 'thoi-trang-nu', 'Category must NOT be overwritten');
  });

  it('2. P2: Deleting price chip while debounce is pending cancels timer and does not resurrect price', () => {
    const harness = createComponentHarness({ initialQuery: '?maxPrice=500000' });

    // User types "blazer"
    harness.typeSearch('blazer');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // User deletes price chip
    harness.clickButtonByTitle('Bỏ lọc khoảng giá');

    // Assert price is cleared and timer cancelled
    const snapshotRemoved = harness.getSnapshot();
    assert.equal(snapshotRemoved.filters.maxPrice, undefined);
    assert.equal(snapshotRemoved.pendingTimersCount, 0, 'Timer must be cancelled when price chip is removed');

    // Expire debounce
    harness.expirePendingTimers();
    const snapshotAfter = harness.getSnapshot();
    assert.equal(snapshotAfter.filters.maxPrice, undefined, 'Old price must NOT be resurrected');
  });

  it('3. P2: Category switch cancels unapplied search draft and synchronizes input', () => {
    const harness = createComponentHarness({ initialQuery: '?category=thoi-trang-nam' });

    // User types "blazer"
    harness.typeSearch('blazer');
    assert.equal(harness.getSnapshot().inputValue, 'blazer');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // User immediately clicks Category "Thời trang Nữ"
    harness.clickButtonByText('Thời trang Nữ');

    // Assert timer is cancelled and search draft is cleared
    const snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.categorySlug, 'thoi-trang-nu');
    assert.equal(snapshot.filters.search, undefined);
    assert.equal(snapshot.inputValue, '', 'Search input must be reset to match actual filter state');
    assert.equal(snapshot.pendingTimersCount, 0);
  });

  it('4. Enter key flushes search immediately without waiting for 350ms debounce', () => {
    const harness = createComponentHarness({ initialQuery: '' });

    // User types "linen"
    harness.typeSearch('linen');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // User presses Enter
    harness.pressEnterKey();

    // Assert: Search was committed immediately, timer was cancelled
    const snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.search, 'linen');
    assert.equal(snapshot.pendingTimersCount, 0, 'Timer must be cleared after Enter flush');
    assert.ok(snapshot.recordedCalls.some((c) => c.filters.search === 'linen'));
  });

  it('5. Rapid consecutive typing: keeps only 1 active timer and commits only the final query', () => {
    const harness = createComponentHarness({ initialQuery: '' });

    harness.typeSearch('b');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);
    harness.typeSearch('bl');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);
    harness.typeSearch('bla');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);
    harness.typeSearch('blazer');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // No calls should have been made before timer expiration
    assert.equal(harness.getSnapshot().recordedCalls.length, 0);

    // Expire timer
    harness.expirePendingTimers();

    // Exactly 1 call made with final query "blazer"
    const calls = harness.getSnapshot().recordedCalls;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].filters.search, 'blazer');
  });

  it('6. Timer is cleanly cancelled on unmount to avoid dangling callbacks', () => {
    const harness = createComponentHarness({ initialQuery: '' });

    harness.typeSearch('linen');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // Component unmounts
    harness.unmount();

    // Expire timers after unmount: should not make any callback calls
    harness.expirePendingTimers();
    assert.equal(harness.getSnapshot().recordedCalls.length, 0, 'No calls should be made after unmount');
  });

  it('7. Referential re-render with identical filter values preserves user typing draft', () => {
    const harness = createComponentHarness({ initialQuery: '?category=thoi-trang-nam' });

    // User starts typing "lin"
    harness.typeSearch('lin');
    assert.equal(harness.getSnapshot().inputValue, 'lin');

    // Parent re-renders and passes a new object reference, but with identical semantic filter values
    const newRefFilters = { ...harness.getSnapshot().filters };
    harness.updateFiltersProp(newRefFilters);

    // Assert: User typing draft "lin" is NOT wiped out by referential re-render!
    assert.equal(harness.getSnapshot().inputValue, 'lin', 'Legitimate typing draft must be preserved');
  });

  it('8. Changing filter context (size/color/sort/stock) while search debounce is pending cancels uncommitted draft and resets input', () => {
    const harness = createComponentHarness({ initialQuery: '?category=thoi-trang-nam' });

    // User types "vest" (uncommitted draft)
    harness.typeSearch('vest');
    assert.equal(harness.getSnapshot().inputValue, 'vest');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1, 'Debounce timer must be pending');

    // User changes filter context (e.g. toggles size "L")
    harness.updateFiltersProp({
      ...harness.getSnapshot().filters,
      size: 'L',
    });

    // Assert: Timer cancelled, search input reset to committed query (empty)
    const snapshot = harness.getSnapshot();
    assert.equal(snapshot.pendingTimersCount, 0, 'Timer must be cancelled when context filter changes');
    assert.equal(snapshot.inputValue, '', 'Input must be reset to committed query so UI matches catalog results');
    assert.equal(snapshot.filters.size, 'L');

    // Expire any timers: no trailing search callback
    harness.expirePendingTimers();
    assert.equal(harness.getSnapshot().filters.search, undefined, 'Search must remain undefined');
  });

  it('9. Price Presets: selecting preset applies bounds and clicking same preset toggles it off', () => {
    const harness = createComponentHarness({ initialQuery: '' });

    // Open filter drawer
    harness.toggleFilterDrawer();

    // Click "≤ 500k"
    harness.clickButtonByText('≤ 500k');
    let snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.maxPrice, 500000);
    assert.equal(snapshot.filters.minPrice, undefined);

    // Click "500k – 1 triệu"
    harness.clickButtonByText('500k – 1 triệu');
    snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.minPrice, 500000);
    assert.equal(snapshot.filters.maxPrice, 1000000);

    // Click "500k – 1 triệu" again -> toggles off!
    harness.clickButtonByText('500k – 1 triệu');
    snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.minPrice, undefined);
    assert.equal(snapshot.filters.maxPrice, undefined);
  });

  it('10. Active Filter Chips: Sort chip renders when sort is not newest and clicking remove resets to newest', () => {
    const harness = createComponentHarness({ initialQuery: '?category=thoi-trang-nam' });

    // Open filter drawer and change sort to price_asc
    harness.toggleFilterDrawer();
    harness.selectSort('price_asc');

    // Assert: Sort is committed and Sort Chip exists
    let snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.sort, 'price_asc');
    assert.ok(harness.findChipByText('Xếp: Giá: Tăng dần'), 'Sort chip must be displayed');

    // Click '✕' on Sort Chip
    harness.clickButtonByTitle('Bỏ sắp xếp tùy chỉnh');

    // Assert: Sort reverted to 'newest' and Category filter was preserved intact!
    snapshot = harness.getSnapshot();
    assert.equal(snapshot.filters.sort, 'newest');
    assert.equal(snapshot.filters.categorySlug, 'thoi-trang-nam', 'Category filter must be preserved');
  });

  it('11. Clear All Filters (XÓA TẤT CẢ): resets all filters, cancels pending debounce, and clears search input', () => {
    const harness = createComponentHarness({
      initialQuery: '?category=thoi-trang-nu&size=M&maxPrice=1000000&sort=price_desc',
    });

    // User types "dress"
    harness.typeSearch('dress');
    assert.equal(harness.getSnapshot().inputValue, 'dress');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // User clicks "Xóa tất cả"
    harness.clickButtonByText('Xóa tất cả');

    // Assert: everything reset to defaults
    const snapshot = harness.getSnapshot();
    assert.equal(snapshot.pendingTimersCount, 0, 'Debounce timer must be cancelled');
    assert.equal(snapshot.inputValue, '', 'Search input must be cleared');
    assert.equal(snapshot.filters.categorySlug, undefined);
    assert.equal(snapshot.filters.size, undefined);
    assert.equal(snapshot.filters.maxPrice, undefined);
    assert.equal(snapshot.filters.sort, 'newest');
    assert.equal(snapshot.filters.page, 0);

    // Expire any lingering timers: no search callback fired
    harness.expirePendingTimers();
    assert.equal(harness.getSnapshot().filters.search, undefined);
  });

  it('12. Search Version Guard: stale in-flight timer callback does NOT overwrite newer filter mutations', () => {
    const harness = createComponentHarness({ initialQuery: '' });

    // User types "linen"
    harness.typeSearch('linen');
    assert.equal(harness.getSnapshot().pendingTimersCount, 1);

    // While timer is pending, user selects a category
    harness.updateFiltersProp({
      ...harness.getSnapshot().filters,
      categorySlug: 'thoi-trang-nam',
    });

    // Assert: timer was cleared and version bumped
    assert.equal(harness.getSnapshot().pendingTimersCount, 0);

    // Force run any callbacks (even if a callback was somehow dispatched in macrotask queue)
    harness.expirePendingTimers();

    // Category remains thoi-trang-nam, search is NOT committed
    assert.equal(harness.getSnapshot().filters.categorySlug, 'thoi-trang-nam');
    assert.equal(harness.getSnapshot().filters.search, undefined);
  });
});
