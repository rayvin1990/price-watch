import { auth } from '@clerk/nextjs/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export type AuthResult = {
  userId: string | null
  error?: string
  status?: number
}

export async function validateAuth(request?: Request): Promise<AuthResult> {
  const { userId } = auth()
  if (userId) {
    return { userId }
  }

  if (request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer pw_')) {
      const token = authHeader.slice(7)

      // Try RPC first (no service_role_key needed)
      const { data, error } = await supabase.rpc('verify_api_token', { p_token: token })

      if (data && !error) {
        // Touch last_used_at (fire and forget)
        supabase.rpc('touch_api_token', { p_token: token }).then(() => {}).catch(() => {})
        return { userId: data }
      }

      // Fallback: try admin client if available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('api_tokens')
          .select('user_id')
          .eq('token', token)
          .single()

        if (adminData && !adminError) {
          try {
            await supabaseAdmin
              .from('api_tokens')
              .update({ last_used_at: new Date().toISOString() })
              .eq('token', token)
          } catch (_e) {}
          return { userId: adminData.user_id }
        }
      }
    }
  }

  return { userId: null, error: 'Unauthorized', status: 401 }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}
