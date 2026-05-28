import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * The URL and anon key are PUBLIC by design (the anon key is gated by
 * Row-Level Security policies on the database, not by secrecy). They
 * ship in the client bundle.
 *
 * NEXT_PUBLIC_* variables are inlined at build time by Next.js. We
 * intentionally hard-fail with a clear error if either is missing,
 * because a silent fallback would mean the app boots empty in
 * production with no obvious cause.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set them in .env.local for development and in Vercel project settings ' +
      'for production.',
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        // Persist the session in localStorage so the admin login survives
        // page reloads. (Anon visitors don't sign in, so this is harmless.)
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
