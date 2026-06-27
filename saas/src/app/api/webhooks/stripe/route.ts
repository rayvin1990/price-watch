import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Stripe Webhook — 处理支付事件
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId

        if (userId) {
          // 创建用户订阅记录
          await supabaseAdmin.from('user_plans').insert({
            user_id: userId,
            plan_id: session.metadata?.planId || 'pro',
            stripe_subscription_id: session.subscription,
            status: 'active',
            current_period_start: new Date(session.created * 1000).toISOString(),
            current_period_end: new Date(session.expires_at * 1000).toISOString(),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        // 降级为免费计划
        await supabaseAdmin
          .from('user_plans')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Stripe webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
