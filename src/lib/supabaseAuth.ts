import { getSupabaseClient } from './supabaseClient';

export interface UserProfile {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

const GUEST_TABLE = 'guest_accounts';
const ADMIN_TABLE = 'admin_accounts';

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

/**
 * Fetch public user directory without exposing password hashes.
 */
export async function fetchPublicProfilesFromSupabase(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const profiles: UserProfile[] = [];

  try {
    const { data: adminData, error: adminError } = await supabase
      .from(ADMIN_TABLE)
      .select('username, role, created_at');

    if (!adminError && adminData) {
      adminData.forEach((item: any) => {
        profiles.push({
          username: item.username,
          role: 'admin',
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        });
      });
    }
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn('Supabase admin profiles fetch warning:', err);
    }
  }

  try {
    const { data: guestData, error: guestError } = await supabase
      .from(GUEST_TABLE)
      .select('username, role, created_at');

    if (!guestError && guestData) {
      guestData.forEach((item: any) => {
        profiles.push({
          username: item.username,
          role: item.role === 'admin' ? 'admin' : 'user',
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        });
      });
    }
  } catch (err: any) {
    if (!isTableNotFoundError(err)) {
      console.warn('Supabase guest profiles fetch warning:', err);
    }
  }

  return profiles;
}
