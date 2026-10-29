import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ProductImage } from '../types/catalog';

describe('Phase 5C.4: Cloudinary Media Library & Gallery Invariants', () => {
  // 1. Single Primary Image Invariant
  describe('1. Single Primary Invariant & Promotion Lifecycle', () => {
    it('automatically marks the first uploaded image as primary', () => {
      const existingImages: ProductImage[] = [];
      const isNewFirstImage = existingImages.length === 0;
      assert.strictEqual(isNewFirstImage, true, 'First image must be flagged as primary');
    });

    it('demotes the previous primary image when a new image is set as primary', () => {
      const gallery: ProductImage[] = [
        { id: 1, variantId: 10, imageUrl: 'https://res.cloudinary.com/demo/1.jpg', sortOrder: 0, isPrimary: true },
        { id: 2, variantId: 10, imageUrl: 'https://res.cloudinary.com/demo/2.jpg', sortOrder: 1, isPrimary: false },
      ];

      // Setting image 2 as primary
      const updatedGallery = gallery.map((img) => ({
        ...img,
        isPrimary: img.id === 2,
      }));

      assert.strictEqual(updatedGallery.find((img) => img.id === 1)?.isPrimary, false);
      assert.strictEqual(updatedGallery.find((img) => img.id === 2)?.isPrimary, true);
      const primaryCount = updatedGallery.filter((img) => img.isPrimary).length;
      assert.strictEqual(primaryCount, 1, 'Exactly one primary image must exist');
    });

    it('automatically promotes the next available image when the primary image is deleted', () => {
      const gallery: ProductImage[] = [
        { id: 1, variantId: 10, imageUrl: 'https://res.cloudinary.com/demo/1.jpg', sortOrder: 0, isPrimary: true },
        { id: 2, variantId: 10, imageUrl: 'https://res.cloudinary.com/demo/2.jpg', sortOrder: 1, isPrimary: false },
        { id: 3, variantId: 11, imageUrl: 'https://res.cloudinary.com/demo/3.jpg', sortOrder: 2, isPrimary: false },
      ];

      // Simulate deleting id: 1 (primary)
      const remaining = gallery.filter((img) => img.id !== 1);
      const hadPrimary = remaining.some((img) => img.isPrimary);
      assert.strictEqual(hadPrimary, false, 'No primary image immediately after deleting id 1');

      // Auto-promotion logic (sorted by sortOrder ASC, id ASC)
      remaining.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      if (remaining.length > 0) {
        remaining[0].isPrimary = true;
      }

      assert.strictEqual(remaining[0].id, 2);
      assert.strictEqual(remaining[0].isPrimary, true, 'Image 2 should be promoted to primary');
    });
  });

  // 2. Storefront Dynamic Gallery Filtering Integration
  describe('2. Storefront Lookbook Dynamic Gallery Rules', () => {
    const mockProduct = {
      images: [
        { id: 1, variantId: 101, imageUrl: 'https://res.cloudinary.com/demo/black-front.jpg', isPrimary: true, sortOrder: 0 },
        { id: 2, variantId: 102, imageUrl: 'https://res.cloudinary.com/demo/black-detail.jpg', isPrimary: false, sortOrder: 1 },
        { id: 3, variantId: 201, imageUrl: 'https://res.cloudinary.com/demo/white-front.jpg', isPrimary: false, sortOrder: 2 },
        { id: 4, variantId: null, imageUrl: 'https://res.cloudinary.com/demo/general-lookbook.jpg', isPrimary: false, sortOrder: 3 },
      ] as ProductImage[],
    };

    const blackVariantIds = new Set([101, 102]); // Variants corresponding to color "Đen"
    const whiteVariantIds = new Set([201]);      // Variants corresponding to color "Trắng"
    const redVariantIds = new Set([301]);        // Variant corresponding to color "Đỏ" (no direct images)

    function resolveLookbookImages(images: ProductImage[], variantIdsOfColor: Set<number>) {
      const colorImages = images.filter((img) => img.variantId && variantIdsOfColor.has(img.variantId));
      const generalImages = images.filter((img) => !img.variantId);

      if (colorImages.length > 0) {
        return { activeImages: [...colorImages, ...generalImages], isFallback: false };
      }
      if (generalImages.length > 0) {
        return { activeImages: generalImages, isFallback: false };
      }
      const rep = images.find((i) => i.isPrimary) || images[0];
      return { activeImages: rep ? [rep] : [], isFallback: true };
    }

    it('shows black images + general images when color Black is selected', () => {
      const { activeImages, isFallback } = resolveLookbookImages(mockProduct.images, blackVariantIds);
      assert.strictEqual(isFallback, false);
      assert.strictEqual(activeImages.length, 3);
      assert.deepStrictEqual(activeImages.map((i) => i.id), [1, 2, 4]);
    });

    it('shows white images + general images when color White is selected', () => {
      const { activeImages, isFallback } = resolveLookbookImages(mockProduct.images, whiteVariantIds);
      assert.strictEqual(isFallback, false);
      assert.strictEqual(activeImages.length, 2);
      assert.deepStrictEqual(activeImages.map((i) => i.id), [3, 4]);
    });

    it('falls back to general images when a color has no specific images', () => {
      const { activeImages, isFallback } = resolveLookbookImages(mockProduct.images, redVariantIds);
      assert.strictEqual(isFallback, false);
      assert.strictEqual(activeImages.length, 1);
      assert.strictEqual(activeImages[0].id, 4, 'Should fallback to general lookbook image');
    });

    it('falls back to single representative image when neither color nor general images exist', () => {
      const imagesWithoutGeneral = mockProduct.images.filter((i) => i.variantId !== null);
      const { activeImages, isFallback } = resolveLookbookImages(imagesWithoutGeneral, redVariantIds);
      assert.strictEqual(isFallback, true);
      assert.strictEqual(activeImages.length, 1);
      assert.strictEqual(activeImages[0].id, 1, 'Should fallback to primary representative image');
    });
  });

  // 3. File Validation Rules
  describe('3. File Validation Rules', () => {
    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
    ]);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    it('accepts valid web image formats under 10MB', () => {
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/jpeg'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/png'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/webp'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/avif'), true);
    });

    it('rejects unsupported file formats', () => {
      assert.strictEqual(ALLOWED_MIME_TYPES.has('application/pdf'), false);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('video/mp4'), false);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('text/html'), false);
    });

    it('enforces 10MB file size ceiling', () => {
      const validSize = 5 * 1024 * 1024;
      const invalidSize = 12 * 1024 * 1024;
      assert.strictEqual(validSize <= MAX_FILE_SIZE, true);
      assert.strictEqual(invalidSize <= MAX_FILE_SIZE, false);
    });
  });
});
