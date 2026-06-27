import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export type AuthResult = {
  userId: string | null
  error?: string
  status?: number
}

// Validate auth for both Clerk sessions and API tokens
export async function validateAuth(request?: Request): Promise<AuthResult> {
  // Try Clerk auth first (for web app users)
  const { userId } = auth()
  if (userId) {
    return { userId }
  }

  // Fallback: check API token from Authorization header (for extension)
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
        // Update last_used_at (fire and forget)
        supabaseAdmin
          .from('api_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('token', token)
          .then(() => {})
          .catch(() => {})

        return { userId: data.user_id }
      }
    }
  }

  return { userId: null, error: 'Unauthorized', status: 401 }
}

// Helper to return unauthorized response
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}
