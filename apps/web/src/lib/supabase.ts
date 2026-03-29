import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Debug logging
console.log('[Unplug] Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
console.log('[Unplug] Supabase Key:', supabaseAnonKey ? 'SET' : 'NOT SET')
console.log('[Unplug] Cloud mode:', isSupabaseConfigured ? 'ENABLED' : 'DISABLED')

// Create client only if configured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

if (!isSupabaseConfigured) {
  console.info(
    '[Unplug] Running in local-only mode. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local for cloud sync.'
  )
}

// Helper to get non-null client (throws if not configured)
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }
  return supabase
}
