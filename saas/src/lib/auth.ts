import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
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

      const { data, error } = await supabaseAdmin
        .from('api_tokens')
        .select('user_id')
        .eq('token', token)
        .single()

      if (data && !error) {
        try {
          await supabaseAdmin
            .from('api_tokens')
            .update({ last_used_at: new Date().toISOString() })
            .eq('token', token)
        } catch (_e) {
          // non-fatal
        }

        return { userId: data.user_id }
      }
    }
  }

  return { userId: null, error: 'Unauthorized', status: 401 }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}
