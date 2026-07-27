const fs = require('fs');
const file = 'src/lib/supabaseClient.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get default credentials from environment variables
export function getSupabaseCredentials() {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || '';
  const key = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

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
`;

fs.writeFileSync(file, replacement);
