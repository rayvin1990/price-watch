import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Extension calls this to get a session token for API auth.
// In production, this should return a signed JWT the extension sends as Bearer token.
// For MVP, the extension sends the userId and the API validates via Clerk auth().
export async function POST() {
  const { userId, getToken } = auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get a signed Clerk session token the extension can use
  const token = await getToken({ template: 'default' }).catch(() => null);

  return NextResponse.json({
    token: token || userId, // prefer signed JWT, fallback to userId for dev
    userId,
  })
}

// GET also works for simplicity
export { POST as GET }
