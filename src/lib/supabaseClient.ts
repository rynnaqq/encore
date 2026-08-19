import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://czriatollbnjycispbap.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_21nWAISuO9F0z_RAO7hkiA_FUfYPA36';

// Get default credentials from environment variables with guaranteed fallback
export function getSupabaseCredentials() {
  let url = DEFAULT_SUPABASE_URL;
  let key = DEFAULT_SUPABASE_KEY;

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_URL) {
        url = import.meta.env.VITE_SUPABASE_URL;
      }
      if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      }
    }
  } catch (e) {
    // ignore
  }

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
