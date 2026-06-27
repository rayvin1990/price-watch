import { validateAuth, unauthorizedResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await validateAuth(request)
  if (!userId) return unauthorizedResponse(error)

  const { data: sub, error: dbError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (dbError || !sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: history } = await supabaseAdmin
    .from('price_history')
    .select('*')
    .eq('subscription_id', params.id)
    .order('recorded_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ ...sub, history })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await validateAuth(request)
  if (!userId) return unauthorizedResponse(error)

  try {
    const body = await request.json()
    const { current_price } = body

    if (current_price === undefined) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    }

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('current_price, currency')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (!sub) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const oldPrice = sub.current_price
    const newPrice = parseFloat(current_price)

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ current_price: newPrice, last_checked_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('price_history')
      .insert({ subscription_id: params.id, price: newPrice, currency: sub.currency, source: 'auto_check' })

    if (newPrice > oldPrice) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          subscription_id: params.id,
          type: 'price_up',
          old_price: oldPrice,
          new_price: newPrice,
          message: sub.currency + oldPrice + ' -> ' + sub.currency + newPrice,
        })
    }

    return NextResponse.json({ success: true, old_price: oldPrice, new_price: newPrice })

  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await validateAuth(request)
  if (!userId) return unauthorizedResponse(error)

  const { error: dbError } = await supabaseAdmin
    .from('subscriptions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
