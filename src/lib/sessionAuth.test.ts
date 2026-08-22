import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from './sessionAuth.ts';

describe('sessionAuth token signing & verification', () => {
  it('should generate a valid signed session token', () => {
    const user = { username: 'AdminKawaaii', role: 'admin' as const, createdAt: Date.now() };
    const token = createSessionToken(user);
    assert.ok(token);
    assert.equal(token.split('.').length, 2);
  });

  it('should verify and decode valid session token accurately', () => {
    const user = { username: 'testuser', role: 'user' as const, createdAt: 123456789 };
    const token = createSessionToken(user, 3600000, 'secret-key');

    const decoded = verifySessionToken(token, 'secret-key');
    assert.ok(decoded);
    assert.equal(decoded.username, 'testuser');
    assert.equal(decoded.role, 'user');
    assert.equal(decoded.createdAt, 123456789);
  });

  it('should reject tampered signature tokens', () => {
    const user = { username: 'hacker', role: 'user' as const, createdAt: Date.now() };
    const token = createSessionToken(user, 3600000, 'secret-1');

    // Attempt to verify with wrong secret
    assert.equal(verifySessionToken(token, 'different-secret'), null);

    // Tamper with payload (modify role to admin)
    const [payloadB64, sig] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ username: 'hacker', role: 'admin', exp: Date.now() + 100000 })).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${sig}`;

    assert.equal(verifySessionToken(tamperedToken, 'secret-1'), null);
  });

  it('should reject expired session tokens', () => {
    const user = { username: 'testuser', role: 'user' as const };
    const token = createSessionToken(user, -1000, 'secret-key'); // Expired 1s ago

    assert.equal(verifySessionToken(token, 'secret-key'), null);
  });

  it('should handle malformed or null tokens gracefully', () => {
    assert.equal(verifySessionToken(''), null);
    assert.equal(verifySessionToken('random-gibberish'), null);
    assert.equal(verifySessionToken(null as any), null);
    assert.equal(verifySessionToken(undefined as any), null);
  });
});
