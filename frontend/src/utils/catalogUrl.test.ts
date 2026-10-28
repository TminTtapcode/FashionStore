import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCatalogUrl,
  serializeCatalogUrl,
  buildCatalogUrl,
  DEFAULT_FILTERS,
} from './catalogUrl.ts';

describe('catalogUrl utility test suite', () => {
  describe('parseCatalogUrl', () => {
    it('returns default filters when query string is empty or just "?"', () => {
      const res1 = parseCatalogUrl('');
      assert.deepEqual(res1, DEFAULT_FILTERS);

      const res2 = parseCatalogUrl('?');
      assert.deepEqual(res2, DEFAULT_FILTERS);
    });

    it('correctly parses category, search query (q), and inStockOnly', () => {
      const parsed = parseCatalogUrl('?category=thoi-trang-nam&q=Áo%20Linen&inStock=true');
      assert.equal(parsed.categorySlug, 'thoi-trang-nam');
      assert.equal(parsed.search, 'Áo Linen');
      assert.equal(parsed.inStockOnly, true);
    });

    it('preserves UTF-8 Vietnamese color names and hex codes intact', () => {
      const parsedVietnamese = parseCatalogUrl('?color=%C4%90en');
      assert.equal(parsedVietnamese.color, 'Đen');

      const parsedHex = parseCatalogUrl('?color=%23121316');
      assert.equal(parsedHex.color, '#121316');
    });

    it('strictly normalizes and whitelists sort options', () => {
      // Direct snake_case match
      assert.equal(parseCatalogUrl('?sort=price_desc').sort, 'price_desc');
      // Kebab-case normalized to snake_case
      assert.equal(parseCatalogUrl('?sort=price-asc').sort, 'price_asc');
      assert.equal(parseCatalogUrl('?sort=name-asc').sort, 'name_asc');
      // Invalid sort value falls back to newest
      assert.equal(parseCatalogUrl('?sort=random_hacker_sort').sort, 'newest');
      assert.equal(parseCatalogUrl('?sort=').sort, 'newest');
    });

    it('strictly validates page number as a positive integer (>= 1)', () => {
      // 1-based in URL becomes 0-based in state
      assert.equal(parseCatalogUrl('?page=1').page, 0);
      assert.equal(parseCatalogUrl('?page=4').page, 3);

      // Invalid pages fallback to page 1 (0-based: 0)
      assert.equal(parseCatalogUrl('?page=0').page, 0);
      assert.equal(parseCatalogUrl('?page=-3').page, 0);
      assert.equal(parseCatalogUrl('?page=1.5').page, 0);
      assert.equal(parseCatalogUrl('?page=abc').page, 0);
      assert.equal(parseCatalogUrl('?page=Infinity').page, 0);
      assert.equal(parseCatalogUrl('?page=999999').page, 0); // Out of upper bound
    });

    it('validates price ranges and discards both bounds if minPrice > maxPrice', () => {
      const valid = parseCatalogUrl('?minPrice=200000&maxPrice=800000');
      assert.equal(valid.minPrice, 200000);
      assert.equal(valid.maxPrice, 800000);

      // minPrice > maxPrice: must discard both!
      const invalidRange = parseCatalogUrl('?minPrice=900000&maxPrice=300000');
      assert.equal(invalidRange.minPrice, undefined);
      assert.equal(invalidRange.maxPrice, undefined);

      // Negative prices ignored
      const negative = parseCatalogUrl('?minPrice=-50000&maxPrice=300000');
      assert.equal(negative.minPrice, undefined);
      assert.equal(negative.maxPrice, 300000);

      // maxPrice = 0 is preserved as a valid non-negative number
      const zeroMax = parseCatalogUrl('?maxPrice=0');
      assert.equal(zeroMax.maxPrice, 0);
    });
  });

  describe('serializeCatalogUrl', () => {
    it('omits defaults to keep URL clean', () => {
      const serialized = serializeCatalogUrl({
        sort: 'newest',
        page: 0,
        limit: 12,
      });
      assert.equal(serialized, '');
    });

    it('serializes active filters cleanly with 1-based page', () => {
      const serialized = serializeCatalogUrl({
        categorySlug: 'ao-khoac',
        sort: 'price_asc',
        page: 1, // 0-based 1 -> 1-based 2
        minPrice: 500000,
      });
      const params = new URLSearchParams(serialized.slice(1));
      assert.equal(params.get('category'), 'ao-khoac');
      assert.equal(params.get('sort'), 'price_asc');
      assert.equal(params.get('page'), '2');
      assert.equal(params.get('minPrice'), '500000');
    });

    it('preserves non-catalog query parameters (e.g. UTM marketing parameters)', () => {
      const currentSearch = '?utm_source=facebook&utm_campaign=summer&ref=affiliate123';
      const serialized = serializeCatalogUrl(
        {
          categorySlug: 'dam-vay',
          size: 'M',
        },
        currentSearch
      );

      const params = new URLSearchParams(serialized.slice(1));
      assert.equal(params.get('utm_source'), 'facebook');
      assert.equal(params.get('utm_campaign'), 'summer');
      assert.equal(params.get('ref'), 'affiliate123');
      assert.equal(params.get('category'), 'dam-vay');
      assert.equal(params.get('size'), 'M');
    });

    it('correctly replaces existing catalog keys without leaving stale values', () => {
      const currentSearch = '?category=old-category&size=S&utm_source=google';
      const serialized = serializeCatalogUrl(
        {
          categorySlug: 'new-category',
          // size is now omitted
        },
        currentSearch
      );

      const params = new URLSearchParams(serialized.slice(1));
      assert.equal(params.get('utm_source'), 'google');
      assert.equal(params.get('category'), 'new-category');
      assert.equal(params.has('size'), false); // Old size was removed
    });
  });

  describe('buildCatalogUrl', () => {
    it('updates query string while preserving pathname and hash', () => {
      const url = buildCatalogUrl(
        { categorySlug: 'phu-kien' },
        { pathname: '/collection/summer', search: '?utm_source=email', hash: '#lookbook' }
      );
      assert.equal(url, '/collection/summer?utm_source=email&category=phu-kien#lookbook');
    });
  });
});
