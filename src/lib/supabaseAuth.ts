import { getSupabaseClient, getSupabaseCredentials } from './supabaseClient.ts';
import bcrypt from 'bcryptjs';

export interface UserProfile {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export const USER_TABLE = 'user_accounts';
export const GUEST_TABLE = 'guest_accounts';
export const ADMIN_TABLE = 'admin_accounts';

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || error.details || '';
  return (
    error.code === 'PGRST301' ||
    error.code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation')
  );
}

/**
 * Fetch public user directory from Supabase
 */
export async function fetchPublicProfilesFromSupabase(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  const profilesMap = new Map<string, UserProfile>();

  // Always ensure default root admin is in the list
  profilesMap.set('adminkawaaii', {
    username: 'AdminKawaaii',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 30
  });

  if (supabase) {
    // 1. Try unified user_accounts table
    try {
      const { data, error } = await supabase
        .from(USER_TABLE)
        .select('username, role, created_at');

      if (!error && Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item?.username) {
            profilesMap.set(item.username.toLowerCase(), {
              username: item.username,
              role: item.role === 'admin' ? 'admin' : 'user',
              createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
            });
          }
        });
      }
    } catch (err: any) {
      if (!isTableNotFoundError(err)) {
        console.warn('Supabase user_accounts fetch warning:', err);
      }
    }

    // 2. Try guest_accounts table
    try {
      const { data: guestData, error: guestError } = await supabase
        .from(GUEST_TABLE)
        .select('username, role, created_at');

      if (!guestError && Array.isArray(guestData)) {
        guestData.forEach((item: any) => {
          if (item?.username && !profilesMap.has(item.username.toLowerCase())) {
            profilesMap.set(item.username.toLowerCase(), {
              username: item.username,
              role: item.role === 'admin' ? 'admin' : 'user',
              createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
            });
          }
        });
      }
    } catch (err: any) {
      if (!isTableNotFoundError(err)) {
        console.warn('Supabase guest_accounts fetch warning:', err);
      }
    }

    // 3. Try admin_accounts table
    try {
      const { data: adminData, error: adminError } = await supabase
        .from(ADMIN_TABLE)
        .select('username, role, created_at');

      if (!adminError && Array.isArray(adminData)) {
        adminData.forEach((item: any) => {
          if (item?.username) {
            profilesMap.set(item.username.toLowerCase(), {
              username: item.username,
              role: 'admin',
              createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
            });
          }
        });
      }
    } catch (err: any) {
      if (!isTableNotFoundError(err)) {
        console.warn('Supabase admin_accounts fetch warning:', err);
      }
    }
  } else {
    // Direct REST API fallback if SDK is unavailable
    const { url, key } = getSupabaseCredentials();
    if (url && key) {
      try {
        const res = await fetch(`${url}/rest/v1/${USER_TABLE}?select=username,role,created_at`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item?.username) {
                profilesMap.set(item.username.toLowerCase(), {
                  username: item.username,
                  role: item.role === 'admin' ? 'admin' : 'user',
                  createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
                });
              }
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return Array.from(profilesMap.values());
}

/**
 * Register a user account in Supabase
 */
export async function registerUserInSupabase(
  username: string,
  password: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
  const cleanUsername = username.trim();
  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
    return { success: false, message: 'Username harus memiliki panjang 3-30 karakter' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return { success: false, message: 'Username hanya boleh berisi huruf, angka, dan underscore (_)' };
  }

  if (!password || password.length < 4) {
    return { success: false, message: 'Password minimal 4 karakter' };
  }

  const supabase = getSupabaseClient();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const now = Date.now();
  const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
  const effectiveRole = isRootAdmin ? 'admin' : role;

  if (supabase) {
    try {
      // 1. Check if user already exists in user_accounts
      const { data: existingUser, error: checkError } = await supabase
        .from(USER_TABLE)
        .select('username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!checkError && existingUser) {
        return { success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' };
      }

      // 2. Insert into user_accounts
      const { error: insertError } = await supabase.from(USER_TABLE).insert([
        {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          username: cleanUsername,
          password_hash: hashedPassword,
          role: effectiveRole,
          created_at: new Date().toISOString()
        }
      ]);

      if (insertError) {
        // If table user_accounts doesn't exist yet, fallback to guest_accounts
        if (isTableNotFoundError(insertError)) {
          const { error: guestError } = await supabase.from(GUEST_TABLE).insert([
            { username: cleanUsername, role: effectiveRole }
          ]);
          if (guestError && !isTableNotFoundError(guestError)) {
            return { success: false, message: `Gagal menyimpan ke database: ${guestError.message}` };
          }
        } else {
          return { success: false, message: `Gagal mendaftar: ${insertError.message}` };
        }
      }

      return {
        success: true,
        user: {
          username: cleanUsername,
          role: effectiveRole,
          createdAt: now
        }
      };
    } catch (err: any) {
      console.error('Supabase registration error:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat registrasi' };
    }
  }

  // REST API fallback
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      const restRes = await fetch(`${url}/rest/v1/${USER_TABLE}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          username: cleanUsername,
          password_hash: hashedPassword,
          role: effectiveRole,
          created_at: new Date().toISOString()
        })
      });

      if (restRes.ok || restRes.status === 201) {
        return {
          success: true,
          user: {
            username: cleanUsername,
            role: effectiveRole,
            createdAt: now
          }
        };
      }
    } catch (e) {
      // ignore
    }
  }

  return { success: false, message: 'Database Supabase tidak terhubung. Periksa konfigurasi API key.' };
}

/**
 * Login user against Supabase
 */
export async function loginUserWithSupabase(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  // Handle Root Admin default fallback
  if (cleanUsername.toLowerCase() === 'adminkawaaii' && password === 'admin123') {
    return {
      success: true,
      user: {
        username: 'AdminKawaaii',
        role: 'admin',
        createdAt: Date.now()
      }
    };
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Query user from user_accounts
      const { data, error } = await supabase
        .from(USER_TABLE)
        .select('username, password_hash, role, created_at')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (error && !isTableNotFoundError(error)) {
        return { success: false, message: `Koneksi database error: ${error.message}` };
      }

      if (!data) {
        // Fallback: check guest_accounts or admin_accounts
        const { data: guestData } = await supabase
          .from(GUEST_TABLE)
          .select('username, role, created_at')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (guestData) {
          // Found in legacy table
          return {
            success: true,
            user: {
              username: guestData.username,
              role: guestData.role === 'admin' ? 'admin' : 'user',
              createdAt: guestData.created_at ? new Date(guestData.created_at).getTime() : Date.now()
            }
          };
        }

        return { success: false, message: 'Akun tidak ditemukan. Silakan daftar akun terlebih dahulu.' };
      }

      // Verify password hash
      const storedHash = data.password_hash || '';
      let isPasswordValid = false;

      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        isPasswordValid = bcrypt.compareSync(password, storedHash);
      } else {
        // Plain text match fallback
        isPasswordValid = storedHash === password;
      }

      if (!isPasswordValid) {
        return { success: false, message: 'Password salah. Periksa kembali password Anda.' };
      }

      return {
        success: true,
        user: {
          username: data.username,
          role: data.role === 'admin' ? 'admin' : 'user',
          createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
        }
      };
    } catch (err: any) {
      console.error('Supabase login error:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat masuk' };
    }
  }

  // REST API fallback
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      const restRes = await fetch(`${url}/rest/v1/${USER_TABLE}?username=ilike.${encodeURIComponent(cleanUsername)}&select=username,password_hash,role,created_at`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });
      if (restRes.ok) {
        const rows = await restRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const userRecord = rows[0];
          const storedHash = userRecord.password_hash || '';
          const isValid = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')
            ? bcrypt.compareSync(password, storedHash)
            : storedHash === password;

          if (isValid) {
            return {
              success: true,
              user: {
                username: userRecord.username,
                role: userRecord.role === 'admin' ? 'admin' : 'user',
                createdAt: userRecord.created_at ? new Date(userRecord.created_at).getTime() : Date.now()
              }
            };
          }
          return { success: false, message: 'Password salah. Periksa kembali password Anda.' };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return { success: false, message: 'Database Supabase tidak terhubung. Periksa konfigurasi API key.' };
}

/**
 * Change password in Supabase
 */
export async function changeUserPasswordInSupabase(
  username: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  const cleanUsername = username.trim();
  if (!cleanUsername || !oldPassword || !newPassword) {
    return { success: false, message: 'Semua kolom password wajib diisi' };
  }

  if (newPassword.length < 4) {
    return { success: false, message: 'Password baru minimal 4 karakter' };
  }

  // Verify old password first
  const loginRes = await loginUserWithSupabase(cleanUsername, oldPassword);
  if (!loginRes.success) {
    return { success: false, message: 'Password lama salah' };
  }

  const supabase = getSupabaseClient();
  const newHash = bcrypt.hashSync(newPassword, 10);

  if (supabase) {
    try {
      const { error } = await supabase
        .from(USER_TABLE)
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString()
        })
        .ilike('username', cleanUsername);

      if (error) {
        return { success: false, message: `Gagal memperbarui password: ${error.message}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memperbarui password' };
    }
  }

  return { success: true };
}

/**
 * Delete a user from Supabase
 */
export async function deleteUserFromSupabase(username: string): Promise<{ success: boolean; message?: string }> {
  const clean = username.trim().toLowerCase();
  if (clean === 'adminkawaaii' || clean === 'encore' || clean === 'developer') {
    return { success: false, message: 'Akun Master Developer tidak dapat dihapus' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from(USER_TABLE).delete().ilike('username', username.trim());
      await supabase.from(GUEST_TABLE).delete().ilike('username', username.trim());
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal menghapus user dari Supabase' };
    }
  }

  return { success: true };
}

/**
 * Update user role in Supabase
 */
export async function updateUserRoleInSupabase(
  username: string,
  role: 'user' | 'admin'
): Promise<{ success: boolean; message?: string }> {
  const clean = username.trim().toLowerCase();
  if (clean === 'adminkawaaii' || clean === 'encore' || clean === 'developer') {
    return { success: false, message: 'Role Akun Master Developer tidak dapat diubah' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from(USER_TABLE).update({ role }).ilike('username', username.trim());
      await supabase.from(GUEST_TABLE).update({ role }).ilike('username', username.trim());
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal mengubah role user di Supabase' };
    }
  }

  return { success: true };
}

/**
 * Legacy helper for backwards compatibility
 */
export async function registerGuestInSupabase(username: string): Promise<boolean> {
  const res = await registerUserInSupabase(username, 'guest123', 'user');
  return res.success;
}
