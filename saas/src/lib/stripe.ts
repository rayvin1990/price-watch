import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Pricing config
export const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    maxSubscriptions: 3,
    features: ['Track 3 subscriptions', 'Browser notifications', '7-day price history'],
  },
  pro: {
    name: 'Pro',
    price: 5,
    interval: 'month',
    maxSubscriptions: 50,
    features: ['Track 50 subscriptions', 'Browser notifications', 'Email alerts', '1-year price history', 'Data export'],
  },
  pro_yearly: {
    name: 'Pro Yearly',
    price: 49,
    interval: 'year',
    maxSubscriptions: 50,
    features: ['Track 50 subscriptions', 'Browser notifications', 'Email alerts', '1-year price history', 'Data export'],
  },
}
