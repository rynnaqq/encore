import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidRasterDataUrl } from './imageCompressor.ts';

describe('imageCompressor', () => {
  it('should accept valid raster webp, png, and jpeg base64 strings', () => {
    const validWebp = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/vlNAAA==';
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const validJpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    assert.equal(isValidRasterDataUrl(validWebp), true);
    assert.equal(isValidRasterDataUrl(validPng), true);
    assert.equal(isValidRasterDataUrl(validJpg), true);
  });

  it('should reject non-raster data URLs like SVG to prevent XSS execution', () => {
    const svgData = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=';
    assert.equal(isValidRasterDataUrl(svgData), false);
  });

  it('should reject invalid or excessively large payload data URLs', () => {
    const hugePayload = 'data:image/png;base64,' + 'A'.repeat(2 * 1024 * 1024);
    assert.equal(isValidRasterDataUrl(hugePayload, 1024 * 1024), false);
    assert.equal(isValidRasterDataUrl(null), false);
    assert.equal(isValidRasterDataUrl(undefined), false);
    assert.equal(isValidRasterDataUrl(12345), false);
  });
});
