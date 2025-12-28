import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate public env vars explicitly
const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const missingPublicEnvVars: string[] = [];
if (!publicSupabaseUrl) missingPublicEnvVars.push('NEXT_PUBLIC_SUPABASE_URL');
if (!publicSupabaseAnonKey) missingPublicEnvVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (missingPublicEnvVars.length > 0) {
  // Warn instead of throw. This allows the app to start even if keys are missing.
  console.warn(
    `Missing required environment variable(s): ${missingPublicEnvVars.join(', ')}. ` +
    'Required for public Supabase client. Data fetching will likely fail.'
  );
}

// Create client with fallbacks if missing to prevent crash on module load
const supabase = createClient(
  publicSupabaseUrl || 'https://example.com',
  publicSupabaseAnonKey || 'placeholder-key'
);

// Singleton pattern for admin client to reduce resource waste
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get or create a singleton admin Supabase client
 * This prevents creating multiple client instances and improves performance
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'getSupabaseAdmin must only be used in server-side code (API routes, server actions, middleware, or SSR). '
    );
  }

  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.SUPABASE_ALLOW_DEV_ANON_FALLBACK === 'true'
    ) {
      console.warn(
        '[supabase] SUPABASE_SERVICE_ROLE_KEY missing; using anon key fallback in development (explicitly allowed via SUPABASE_ALLOW_DEV_ANON_FALLBACK)'
      );
      supabaseAdminInstance = createClient(publicSupabaseUrl as string, publicSupabaseAnonKey as string, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseAdminInstance;
    }

    // In dev, assuming user might not have keys, return a dummy or warn?
    // If we throw here, any server-side usage will crash.
    // Let's warn and return a dummy client that will fail on real calls.
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Admin client will not function correctly.');
    supabaseAdminInstance = createClient(
      publicSupabaseUrl || 'https://example.com',
      'placeholder-service-role-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseAdminInstance;
    // throw new Error(
    //   'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
    //     'The admin client bypasses RLS and must only be used server-side (API routes, server actions, middleware, or SSR).'
    // );
  }

  supabaseAdminInstance = createClient(publicSupabaseUrl as string, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminInstance;
}

// Legacy function for backward compatibility - now uses singleton
export function createSupabaseAdmin(): SupabaseClient {
  return getSupabaseAdmin();
}