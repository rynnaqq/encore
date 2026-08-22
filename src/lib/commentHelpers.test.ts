import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommentText, serializeCommentText, sanitizeText } from './commentHelpers.ts';

describe('commentHelpers', () => {
  it('should parse standard unpinned plain comments correctly', () => {
    const raw = 'Halo semuanya! Keren portofolionya.';
    const result = parseCommentText(raw);
    assert.equal(result.isPinned, false);
    assert.equal(result.parentId, null);
    assert.equal(result.replyToUsername, null);
    assert.equal(result.text, 'Halo semuanya! Keren portofolionya.');
  });

  it('should parse pinned comments correctly', () => {
    const raw = '[PINNED]:Pengumuman penting di sini!';
    const result = parseCommentText(raw);
    assert.equal(result.isPinned, true);
    assert.equal(result.parentId, null);
    assert.equal(result.replyToUsername, null);
    assert.equal(result.text, 'Pengumuman penting di sini!');
  });

  it('should parse threaded reply comments correctly', () => {
    const raw = '[REPLY_TO:cmt-123:AdminKawaaii]Terima kasih atas masukannya!';
    const result = parseCommentText(raw);
    assert.equal(result.isPinned, false);
    assert.equal(result.parentId, 'cmt-123');
    assert.equal(result.replyToUsername, 'AdminKawaaii');
    assert.equal(result.text, 'Terima kasih atas masukannya!');
  });

  it('should parse pinned threaded reply comments correctly', () => {
    const raw = '[PINNED]:[REPLY_TO:cmt-456:Ryan]Pinned reply message';
    const result = parseCommentText(raw);
    assert.equal(result.isPinned, true);
    assert.equal(result.parentId, 'cmt-456');
    assert.equal(result.replyToUsername, 'Ryan');
    assert.equal(result.text, 'Pinned reply message');
  });

  it('should serialize comments with reply headers and pin prefix accurately', () => {
    const serialized = serializeCommentText('Balasan keren', true, 'parent-99', 'Encore');
    assert.equal(serialized, '[PINNED]:[REPLY_TO:parent-99:Encore]Balasan keren');
  });

  it('should sanitize HTML tags to prevent XSS vulnerabilities', () => {
    const malicious = '<script>alert("hacked")</script><img src="x" onerror="steal()"/>';
    const sanitized = sanitizeText(malicious);
    assert.equal(sanitized.includes('<script>'), false);
    assert.equal(sanitized.includes('&lt;script&gt;'), true);
    assert.equal(sanitized.includes('&quot;'), true);
  });
});
