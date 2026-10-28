import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ProductFilterParams } from '../types/catalog';

/**
 * Filter Coordinator State Machine
 * Encapsulates the exact coordination logic used in CategoryFilterBar:
 * - Local searchInput state
 * - Latest filtersRef
 * - Timer management and cancellation
 * - Render-time state synchronization when filters prop changes
 */
class FilterCoordinator {
  public filters: ProductFilterParams;
  public filtersRef: { current: ProductFilterParams };
  public prevFilters: ProductFilterParams;
  public searchInput: string;
  public customMinPrice: string;
  public customMaxPrice: string;
  public searchTimer: NodeJS.Timeout | null = null;
  public committedFilters: ProductFilterParams[] = [];

  constructor(initialFilters: ProductFilterParams) {
    this.filters = initialFilters;
    this.filtersRef = { current: initialFilters };
    this.prevFilters = initialFilters;
    this.searchInput = initialFilters.search || '';
    this.customMinPrice = initialFilters.minPrice !== undefined ? initialFilters.minPrice.toString() : '';
    this.customMaxPrice = initialFilters.maxPrice !== undefined ? initialFilters.maxPrice.toString() : '';
    this.committedFilters.push({ ...initialFilters });
  }

  // Simulated onFilterChange callback from parent
  private triggerFilterChange(newFilters: ProductFilterParams) {
    this.committedFilters.push({ ...newFilters });
    // Simulate parent updating prop
    this.receiveNewFiltersProp(newFilters);
  }

  // Simulates React component receiving updated filters prop
  public receiveNewFiltersProp(newFilters: ProductFilterParams) {
    this.filters = newFilters;
    this.filtersRef.current = newFilters;

    // React render adjustment: if (filters !== prevFilters)
    if (this.filters !== this.prevFilters) {
      this.prevFilters = this.filters;
      this.searchInput = this.filters.search || '';
      this.customMinPrice = this.filters.minPrice !== undefined ? this.filters.minPrice.toString() : '';
      this.customMaxPrice = this.filters.maxPrice !== undefined ? this.filters.maxPrice.toString() : '';
    }

    // React useEffect([filters]): cancel timer whenever filters change
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  // User types in search input
  public handleSearchChange(val: string, debounceMs = 50) {
    this.searchInput = val;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.triggerFilterChange({
        ...this.filtersRef.current,
        search: val.trim() || undefined,
        page: 0,
      });
    }, debounceMs);
  }

  // User clicks Category tab
  public handleCategorySelect(slug: string) {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.triggerFilterChange({
      ...this.filtersRef.current,
      categorySlug: slug || undefined,
      page: 0,
    });
  }

  // User clears price chip
  public handleClearPrice() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.customMinPrice = '';
    this.customMaxPrice = '';
    this.triggerFilterChange({
      ...this.filtersRef.current,
      minPrice: undefined,
      maxPrice: undefined,
      page: 0,
    });
  }
}

describe('Phase 5A.1 Concurrency & Timer Coordination Fixes', () => {
  it('P1 Fix: Back navigation cancels pending search timer even when search keyword was unchanged', async () => {
    // 1. User starts on Category A with search = undefined
    const coordinator = new FilterCoordinator({
      categorySlug: 'thoi-trang-nam',
      page: 0,
    });

    // 2. User types "blazer" (timer scheduled)
    coordinator.handleSearchChange('blazer', 50);
    assert.equal(coordinator.searchInput, 'blazer');
    assert.ok(coordinator.searchTimer !== null, 'Search timer must be active');

    // 3. User hits Back navigation: parent (App.tsx) receives popstate and passes new filters:
    // goes to Category "all" (categorySlug: undefined, search: undefined)
    // Note: search was undefined before, and is still undefined after Back!
    const backFilters = {
      categorySlug: undefined,
      page: 0,
    };
    coordinator.committedFilters.push(backFilters);
    coordinator.receiveNewFiltersProp(backFilters);

    // 4. Assert: Timer MUST be cancelled immediately, and searchInput reset
    assert.equal(coordinator.searchTimer, null, 'Search timer must be cancelled by Back navigation');
    assert.equal(coordinator.searchInput, '', 'Search input must be reverted to committed search');

    // 5. Wait past debounce time
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 6. Assert: No trailing callback fired to overwrite categorySlug back to "thoi-trang-nam"
    const latestCommitted = coordinator.committedFilters[coordinator.committedFilters.length - 1];
    assert.equal(latestCommitted.categorySlug, undefined, 'Old category must not be restored');
    assert.equal(latestCommitted.search, undefined, 'Search must remain undefined');
  });

  it('P2 Fix: Deleting price chip while debounce is pending cancels timer and does not resurrect price', async () => {
    // 1. User has active price range
    const coordinator = new FilterCoordinator({
      categorySlug: 'thoi-trang-nam',
      minPrice: 500000,
      maxPrice: 1000000,
      page: 0,
    });

    // 2. User types "linen" in search
    coordinator.handleSearchChange('linen', 50);
    assert.ok(coordinator.searchTimer !== null, 'Search timer must be active');

    // 3. While debounce is pending, user deletes the price chip
    coordinator.handleClearPrice();

    // 4. Assert: price is immediately cleared in committed state
    const afterClearPrice = coordinator.committedFilters[coordinator.committedFilters.length - 1];
    assert.equal(afterClearPrice.minPrice, undefined);
    assert.equal(afterClearPrice.maxPrice, undefined);
    assert.equal(coordinator.searchTimer, null, 'Search timer must be cancelled upon chip deletion');

    // 5. Wait past debounce duration
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 6. Assert: Old price was NOT resurrected
    const finalState = coordinator.committedFilters[coordinator.committedFilters.length - 1];
    assert.equal(finalState.minPrice, undefined, 'minPrice must remain undefined');
    assert.equal(finalState.maxPrice, undefined, 'maxPrice must remain undefined');
  });

  it('P2 Fix: Fast category switch resets searchInput if search timer was cancelled before commit', async () => {
    // 1. User is on Root Category with no search
    const coordinator = new FilterCoordinator({
      categorySlug: undefined,
      page: 0,
    });

    // 2. User types "Áo khoác"
    coordinator.handleSearchChange('Áo khoác', 50);
    assert.equal(coordinator.searchInput, 'Áo khoác');
    assert.ok(coordinator.searchTimer !== null);

    // 3. User immediately clicks "thoi-trang-nu" category before 50ms elapses
    coordinator.handleCategorySelect('thoi-trang-nu');

    // 4. Assert: Timer is cancelled AND searchInput is reset to committed search (empty)
    assert.equal(coordinator.searchTimer, null, 'Timer must be cancelled');
    assert.equal(coordinator.searchInput, '', 'Unapplied search text must be cleared so input matches results');

    // 5. Wait past debounce time
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 6. Assert: Result has category "thoi-trang-nu" and NO search query
    const latest = coordinator.committedFilters[coordinator.committedFilters.length - 1];
    assert.equal(latest.categorySlug, 'thoi-trang-nu');
    assert.equal(latest.search, undefined);
  });
});
