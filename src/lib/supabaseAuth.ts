import { getSupabaseClient, getSupabaseCredentials } from './supabaseClient.ts';
import bcrypt from 'bcryptjs';

export interface UserProfile {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export const GUEST_TABLE = 'guest_accounts';
export const ADMIN_TABLE = 'admin_accounts';

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || error.details || '';
  return (
    error.code === 'PGRST301' ||
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation')
  );
}

/**
 * Fetch public user directory from Supabase tables (admin_accounts & guest_accounts)
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
    // 1. Fetch from admin_accounts
    try {
      const { data, error } = await supabase
        .from(ADMIN_TABLE)
        .select('username, role, created_at');

      if (!error && Array.isArray(data)) {
        data.forEach((item: any) => {
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
        console.warn(`Supabase ${ADMIN_TABLE} fetch warning:`, err);
      }
    }

    // 2. Fetch from guest_accounts
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
        console.warn(`Supabase ${GUEST_TABLE} fetch warning:`, err);
      }
    }
  } else {
    // Direct REST API fallback
    const { url, key } = getSupabaseCredentials();
    if (url && key) {
      for (const [tbl, role] of [[ADMIN_TABLE, 'admin'], [GUEST_TABLE, 'user']] as const) {
        try {
          const res = await fetch(`${url}/rest/v1/${tbl}?select=username,role,created_at`, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                if (item?.username && !profilesMap.has(item.username.toLowerCase())) {
                  profilesMap.set(item.username.toLowerCase(), {
                    username: item.username,
                    role: item.role === 'admin' ? 'admin' : role,
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
  }

  return Array.from(profilesMap.values());
}

/**
 * Register a user or admin account into the appropriate Supabase table
 * (guest_accounts for user, admin_accounts for admin)
 * Uses plain 'password' column without hashing
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

  const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
  const effectiveRole: 'user' | 'admin' = isRootAdmin ? 'admin' : role;
  const targetTable = effectiveRole === 'admin' ? ADMIN_TABLE : GUEST_TABLE;

  const supabase = getSupabaseClient();
  const now = Date.now();

  if (supabase) {
    try {
      // 1. Check if username already exists in admin_accounts or guest_accounts
      const { data: adminUser } = await supabase
        .from(ADMIN_TABLE)
        .select('username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (adminUser) {
        return { success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' };
      }

      const { data: guestUser } = await supabase
        .from(GUEST_TABLE)
        .select('username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (guestUser) {
        return { success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' };
      }

      const payload = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        password: password,
        role: effectiveRole,
        created_at: new Date().toISOString()
      };

      // 2. Insert into primary target table (guest_accounts or admin_accounts)
      const { error: insertError } = await supabase.from(targetTable).insert([payload]);

      if (insertError) {
        console.error(`Supabase insert error on ${targetTable}:`, insertError);
        return {
          success: false,
          message: `Gagal menyimpan ke database Supabase (${targetTable}): ${insertError.message || insertError.details || 'Periksa tabel dan izin RLS di Supabase.'}`
        };
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
      const restRes = await fetch(`${url}/rest/v1/${targetTable}`, {
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
          password: password,
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
      } else {
        const errText = await restRes.text();
        return { success: false, message: `Database error (${restRes.status}): ${errText}` };
      }
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal menghubungi server database' };
    }
  }

  return { success: false, message: 'Database Supabase tidak terhubung. Periksa kredensial VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.' };
}

/**
 * Login user against admin_accounts or guest_accounts tables in Supabase
 * Verifies with plain 'password' column
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
      let foundRecord: any = null;
      let foundRole: 'user' | 'admin' = 'user';

      // 1. Check admin_accounts table
      try {
        const { data: adminRecord, error: adminError } = await supabase
          .from(ADMIN_TABLE)
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (!adminError && adminRecord) {
          foundRecord = adminRecord;
          foundRole = 'admin';
        }
      } catch (e) {}

      // 2. If not found in admin, check guest_accounts table
      if (!foundRecord) {
        try {
          const { data: guestRecord, error: guestError } = await supabase
            .from(GUEST_TABLE)
            .select('*')
            .ilike('username', cleanUsername)
            .maybeSingle();

          if (!guestError && guestRecord) {
            foundRecord = guestRecord;
            foundRole = (guestRecord.role === 'admin') ? 'admin' : 'user';
          }
        } catch (e) {}
      }

      if (!foundRecord) {
        return { success: false, message: 'Akun tidak ditemukan di database. Silakan daftar akun terlebih dahulu.' };
      }

      // Verify plain password or legacy hash
      const storedPassword = foundRecord.password || foundRecord.password_hash || '';
      let isPasswordValid = false;

      if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        isPasswordValid = bcrypt.compareSync(password, storedPassword);
      } else if (storedPassword) {
        isPasswordValid = storedPassword === password;
      } else {
        // Record without password
        isPasswordValid = true;
      }

      if (!isPasswordValid) {
        return { success: false, message: 'Password salah. Periksa kembali password Anda.' };
      }

      return {
        success: true,
        user: {
          username: foundRecord.username,
          role: foundRole,
          createdAt: foundRecord.created_at ? new Date(foundRecord.created_at).getTime() : Date.now()
        }
      };
    } catch (err: any) {
      console.error('Supabase login error:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat masuk' };
    }
  }

  // Direct REST API fallback
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    for (const [tbl, defaultRole] of [[ADMIN_TABLE, 'admin'], [GUEST_TABLE, 'user']] as const) {
      try {
        const restRes = await fetch(`${url}/rest/v1/${tbl}?username=ilike.${encodeURIComponent(cleanUsername)}&select=*`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
          }
        });
        if (restRes.ok) {
          const rows = await restRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const userRecord = rows[0];
            const storedPassword = userRecord.password || userRecord.password_hash || '';
            const isValid = (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$'))
              ? bcrypt.compareSync(password, storedPassword)
              : storedPassword === password || !storedPassword;

            if (isValid) {
              return {
                success: true,
                user: {
                  username: userRecord.username,
                  role: (userRecord.role === 'admin' || defaultRole === 'admin') ? 'admin' : 'user',
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
  }

  return { success: false, message: 'Database Supabase tidak terhubung. Periksa kredensial API key.' };
}

/**
 * Change password in guest_accounts or admin_accounts table
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

  if (supabase) {
    for (const tbl of [ADMIN_TABLE, GUEST_TABLE]) {
      try {
        const { error } = await supabase
          .from(tbl)
          .update({
            password: newPassword,
            updated_at: new Date().toISOString()
          })
          .ilike('username', cleanUsername);

        if (!error) return { success: true };
      } catch (err) {}
    }
  }

  return { success: true };
}

/**
 * Delete a user from guest_accounts and admin_accounts tables
 */
export async function deleteUserFromSupabase(username: string): Promise<{ success: boolean; message?: string }> {
  const clean = username.trim().toLowerCase();
  if (clean === 'adminkawaaii' || clean === 'encore' || clean === 'developer') {
    return { success: false, message: 'Akun Master Developer tidak dapat dihapus' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    for (const tbl of [GUEST_TABLE, ADMIN_TABLE]) {
      try {
        await supabase.from(tbl).delete().ilike('username', username.trim());
      } catch (e) {}
    }
    return { success: true };
  }

  return { success: true };
}

/**
 * Update user role: move/update between guest_accounts and admin_accounts
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
      const sourceTable = role === 'admin' ? GUEST_TABLE : ADMIN_TABLE;
      const targetTable = role === 'admin' ? ADMIN_TABLE : GUEST_TABLE;

      // 1. Check if user exists in source table
      const { data: existing } = await supabase
        .from(sourceTable)
        .select('*')
        .ilike('username', username.trim())
        .maybeSingle();

      if (existing) {
        // Insert into new table and delete from old table
        await supabase.from(targetTable).insert([{
          id: existing.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          username: existing.username,
          password: existing.password || existing.password_hash || 'user123',
          role,
          created_at: existing.created_at || new Date().toISOString()
        }]);

        await supabase.from(sourceTable).delete().ilike('username', username.trim());
      } else {
        // Just update role in any table it resides in
        for (const tbl of [GUEST_TABLE, ADMIN_TABLE]) {
          try {
            await supabase.from(tbl).update({ role }).ilike('username', username.trim());
          } catch (e) {}
        }
      }
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
