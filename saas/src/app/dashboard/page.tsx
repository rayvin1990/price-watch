'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Subscription = {
  id: string
  name: string
  url?: string
  current_price: number
  currency: string
  interval: string
  last_checked_at: string
  previous_price?: number
}

export default function Dashboard() {
  const { user } = useUser()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data)
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions', err)
    } finally {
      setLoading(false)
    }
  }

  const monthlyTotal = subscriptions.reduce((sum, s) => {
    const price = Number(s.current_price)
    if (isNaN(price)) return sum
    return s.interval === 'year' ? sum + price / 12 : sum + price
  }, 0)

  const changes = subscriptions.filter(
    s => s.previous_price && Number(s.previous_price) !== Number(s.current_price)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">PriceWatch</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.emailAddresses[0]?.emailAddress}</span>
            <SignOutButton>
              <button className="text-sm text-gray-400 hover:text-gray-600">Sign Out</button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Step 1: Install the Chrome Extension</h2>
          <p className="text-gray-600 mb-4">Track any subscription page with a single click</p>
          <a href="#" className="text-blue-600 font-medium hover:underline">Coming to Chrome Web Store {'->'}</a>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-3xl font-bold text-blue-600">{subscriptions.length}</div>
            <div className="text-sm text-gray-500 mt-1">Subscriptions Tracked</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-3xl font-bold text-red-500">{changes.length}</div>
            <div className="text-sm text-gray-500 mt-1">Price Changes</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-3xl font-bold text-blue-600">
              {subscriptions.length > 0 ? '$' + monthlyTotal.toFixed(2) : '$0'}
            </div>
            <div className="text-sm text-gray-500 mt-1">Monthly Spend</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Subscriptions</h2>
            <div className="flex gap-3 items-center">
              <Link href="/dashboard/settings" className="text-blue-600 text-sm hover:underline">Settings</Link>
              <Link href="/dashboard/add" className="text-blue-600 text-sm hover:underline">+ Add Subscription</Link>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">No subscriptions yet</div>
              <p className="text-sm text-gray-400 mt-2">Install the Chrome extension to add subscriptions with one click</p>
            </div>
          ) : (
            <div className="divide-y">
              {subscriptions.map(sub => (
                <div key={sub.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-sm text-gray-400">{sub.url || ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {sub.currency}{sub.current_price}
                      <span className="text-sm text-gray-400 font-normal">/{sub.interval}</span>
                    </div>
                    {sub.previous_price && Number(sub.previous_price) !== Number(sub.current_price) && (
                      <div className="text-xs text-red-500">
                        {sub.currency}{sub.previous_price} {'->'} {sub.currency}{sub.current_price}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
