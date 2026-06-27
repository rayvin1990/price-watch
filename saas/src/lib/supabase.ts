import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client - falls back to anon key if service role key is not available
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  serviceRoleKey !== supabaseAnonKey
    ? { auth: { autoRefreshToken: false, persistSession: false } }
    : {}
)
