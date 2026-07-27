import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get default credentials from environment variables or localStorage override
export function getSupabaseCredentials() {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_url') : null;
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  return { url, key, isConfigured: Boolean(url && key) };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof localStorage !== 'undefined') {
    if (url) localStorage.setItem('supabase_url', url);
    else localStorage.removeItem('supabase_url');

    if (key) localStorage.setItem('supabase_anon_key', key);
    else localStorage.removeItem('supabase_anon_key');
  }
  supabaseInstance = null; // reset instance
}
