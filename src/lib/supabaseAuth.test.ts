import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { registerUserInSupabase, loginUserWithSupabase } from './supabaseAuth.ts';

describe('supabaseAuth validation & auth logic', () => {
  it('should reject invalid or short usernames on register', async () => {
    const res1 = await registerUserInSupabase('ab', 'password123');
    assert.equal(res1.success, false);
    assert.ok(res1.message?.includes('3-30 karakter'));

    const res2 = await registerUserInSupabase('invalid name with spaces', 'password123');
    assert.equal(res2.success, false);
    assert.ok(res2.message?.includes('huruf, angka'));
  });

  it('should reject short passwords on register', async () => {
    const res = await registerUserInSupabase('validuser', '123');
    assert.equal(res.success, false);
    assert.ok(res.message?.includes('minimal 4 karakter'));
  });

  it('should reject empty credentials on login', async () => {
    const res = await loginUserWithSupabase('', '');
    assert.equal(res.success, false);
    assert.ok(res.message?.includes('wajib diisi'));
  });

  it('should allow root admin AdminKawaaii default credentials', async () => {
    const res = await loginUserWithSupabase('AdminKawaaii', 'admin123');
    assert.equal(res.success, true);
    assert.equal(res.user?.role, 'admin');
    assert.equal(res.user?.username, 'AdminKawaaii');
  });

  it('should reject root admin with wrong password', async () => {
    const res = await loginUserWithSupabase('AdminKawaaii', 'wrongpassword');
    assert.equal(res.success, false);
  });
});
