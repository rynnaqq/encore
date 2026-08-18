import { getSupabaseClient } from './supabaseClient';

/**
 * SQL snippet to create tables in Supabase SQL Editor:
 * 
 * -- Table 1: Admin Accounts
 * CREATE TABLE IF NOT EXISTS public.admin_accounts (
 *   username text PRIMARY KEY,
 *   password text NOT NULL,
 *   role text NOT NULL DEFAULT 'admin',
 *   created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Table 2: Guest Accounts
 * CREATE TABLE IF NOT EXISTS public.guest_accounts (
 *   username text PRIMARY KEY,
 *   password text NOT NULL,
 *   role text NOT NULL DEFAULT 'user',
 *   created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- RLS Policies
 * ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public read admin_accounts" ON public.admin_accounts FOR SELECT USING (true);
 * CREATE POLICY "Public insert admin_accounts" ON public.admin_accounts FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Public update admin_accounts" ON public.admin_accounts FOR UPDATE USING (true);
 * CREATE POLICY "Public delete admin_accounts" ON public.admin_accounts FOR DELETE USING (true);
 * 
 * ALTER TABLE public.guest_accounts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public read guest_accounts" ON public.guest_accounts FOR SELECT USING (true);
 * CREATE POLICY "Public insert guest_accounts" ON public.guest_accounts FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Public update guest_accounts" ON public.guest_accounts FOR UPDATE USING (true);
 * CREATE POLICY "Public delete guest_accounts" ON public.guest_accounts FOR DELETE USING (true);
 * 
 * -- Secure admin initialization via password hash:
 * INSERT INTO public.admin_accounts (username, password, role)
 * VALUES ('AdminKawaaii', '$2a$10$YOUR_BCRYPT_HASH_HERE', 'admin')
 * ON CONFLICT (username) DO NOTHING;
 */

export interface StoredUserAccount {
  username: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: number;
}

const ADMIN_TABLE = 'admin_accounts';
const GUEST_TABLE = 'guest_accounts';
const LEGACY_TABLE = 'user_accounts';

export const DEFAULT_USERS: StoredUserAccount[] = [];

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || error.details || '';
  return (
    error.code === 'PGRST301' ||
    error.code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

export async function fetchUsersFromSupabase(): Promise<StoredUserAccount[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const accounts: StoredUserAccount[] = [];

  // 1. Fetch from admin_accounts
  try {
    const { data: adminData, error: adminError } = await supabase
      .from(ADMIN_TABLE)
      .select('username, password, role, created_at');

    if (!adminError && adminData) {
      adminData.forEach((item: any) => {
        accounts.push({
          username: item.username,
          password: item.password,
          role: 'admin',
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        });
      });
    }
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn('Error fetching admin accounts:', err);
    }
  }

  // 2. Fetch from guest_accounts
  try {
    const { data: guestData, error: guestError } = await supabase
      .from(GUEST_TABLE)
      .select('username, password, role, created_at');

    if (!guestError && guestData) {
      guestData.forEach((item: any) => {
        accounts.push({
          username: item.username,
          password: item.password,
          role: 'user',
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        });
      });
    }
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn('Error fetching guest accounts:', err);
    }
  }

  // 3. Fallback to legacy user_accounts table if both tables were empty
  if (accounts.length === 0) {
    try {
      const { data: legacyData, error: legacyError } = await supabase
        .from(LEGACY_TABLE)
        .select('username, password, role, created_at');

      if (!legacyError && legacyData) {
        legacyData.forEach((item: any) => {
          accounts.push({
            username: item.username,
            password: item.password,
            role: item.role === 'admin' ? 'admin' : 'user',
            createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          });
        });
      }
    } catch (err: any) {
      if (!isTableNotFoundError(err)) {
        // silent
      }
    }
  }

  return accounts;
}

export async function saveUserToSupabase(account: StoredUserAccount): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const targetTable = account.role === 'admin' ? ADMIN_TABLE : GUEST_TABLE;
  const otherTable = account.role === 'admin' ? GUEST_TABLE : ADMIN_TABLE;

  try {
    // Upsert into target table
    const { error } = await supabase.from(targetTable).upsert(
      {
        username: account.username,
        password: account.password,
        role: account.role,
        created_at: new Date(account.createdAt || Date.now()).toISOString(),
      },
      { onConflict: 'username' }
    );

    if (error && !isTableNotFoundError(error)) {
      console.warn(`Supabase saveUserToSupabase error on ${targetTable}:`, error.message);
    }

    // Try removing from other table if role changed
    await supabase.from(otherTable).delete().eq('username', account.username);

    return true;
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.error('Error saving user to Supabase:', err);
    }
    return false;
  }
}

export async function deleteUserFromSupabase(username: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    await supabase.from(ADMIN_TABLE).delete().eq('username', username);
    await supabase.from(GUEST_TABLE).delete().eq('username', username);
    await supabase.from(LEGACY_TABLE).delete().eq('username', username);
    return true;
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.error('Error deleting user from Supabase:', err);
    }
    return false;
  }
}

export async function updateUserRoleInSupabase(
  username: string,
  role: 'user' | 'admin',
  password?: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const targetTable = role === 'admin' ? ADMIN_TABLE : GUEST_TABLE;
  const sourceTable = role === 'admin' ? GUEST_TABLE : ADMIN_TABLE;

  try {
    // Delete from source table
    await supabase.from(sourceTable).delete().eq('username', username);

    // Upsert into target table
    const { error } = await supabase.from(targetTable).upsert(
      {
        username,
        password: password || 'password123',
        role,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'username' }
    );

    if (error && !isTableNotFoundError(error)) {
      console.warn(`Supabase updateUserRoleInSupabase error:`, error.message);
    }

    return true;
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.error('Error updating user role in Supabase:', err);
    }
    return false;
  }
}

