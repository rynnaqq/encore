import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://czriatollbnjycispbap.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_21nWAISuO9F0z_RAO7hkiA_FUfYPA36';

// Get default credentials from environment variables with fallback
export function getSupabaseCredentials() {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

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
