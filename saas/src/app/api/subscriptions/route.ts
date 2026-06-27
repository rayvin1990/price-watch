import { validateAuth, unauthorizedResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const FREE_TIER_LIMIT = 3;

// GET /api/subscriptions — list user's subscriptions
export async function GET(request: Request) {
  const { userId, error } = await validateAuth(request)
  if (!userId) return unauthorizedResponse(error)

  const { data, error: dbError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/subscriptions — add a subscription
export async function POST(request: Request) {
  const { userId, error } = await validateAuth(request)
  if (!userId) return unauthorizedResponse(error)

  try {
    const body = await request.json()
    const { id, name, url, current_price, currency, interval } = body

    if (!name || current_price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const price = parseFloat(current_price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (count !== null && count >= FREE_TIER_LIMIT) {
      return NextResponse.json({
        error: 'Free plan limit reached (max 3 subscriptions). Upgrade to Pro for unlimited tracking.'
      }, { status: 403 })
    }

    const subscription = {
      id: id || Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      user_id: userId,
      name,
      url: url || '',
      current_price: price,
      currency: currency || '$',
      interval: interval || 'month',
      last_checked_at: new Date().toISOString(),
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: historyError } = await supabaseAdmin
      .from('price_history')
      .insert({ subscription_id: data.id, price, currency: currency || '$', source: 'manual' })

    if (historyError) {
      console.error('Failed to record price history:', historyError);
    }

    return NextResponse.json(data, { status: 201 })

  } catch (err) {
    console.error('POST /api/subscriptions error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
