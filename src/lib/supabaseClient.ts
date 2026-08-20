import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials strictly from environment variables
export function getSupabaseCredentials() {
  let url = '';
  let key = '';

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      url = import.meta.env.VITE_SUPABASE_URL || '';
      key =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_KEY ||
        '';
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
