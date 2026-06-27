'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user } = useUser()
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newToken, setNewToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadTokens()
  }, [])

  async function loadTokens() {
    try {
      const res = await fetch('/api/auth/token/manage')
      if (res.ok) {
        const data = await res.json()
        setTokens(data)
      }
    } catch (err) {
      console.error('Failed to load tokens', err)
    } finally {
      setLoading(false)
    }
  }

  async function generateToken() {
    try {
      const res = await fetch('/api/auth/token/manage', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNewToken(data.token)
        setShowToken(true)
        await loadTokens()
      } else {
        alert('Failed to generate token')
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    }
  }

  async function deleteToken(id: string) {
    if (!confirm('Delete this token? Any extension using it will stop syncing.')) return
    try {
      const res = await fetch('/api/auth/token/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        await loadTokens()
      }
    } catch (err) {
      console.error('Failed to delete token', err)
    }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">&larr; Dashboard</Link>
            <h1 className="text-xl font-bold text-blue-600">PriceWatch</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.emailAddresses[0]?.emailAddress}</span>
            <SignOutButton>
              <button className="text-sm text-gray-400 hover:text-gray-600">Sign Out</button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        {/* Extension Sync Token */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-2">Extension Sync</h3>
          <p className="text-gray-600 text-sm mb-6">
            Generate an API token to sync your PriceWatch Chrome extension with the cloud.
            Copy this token and paste it in the extension&apos;s settings page.
          </p>

          {showToken && newToken && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">Your new API token:</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-mono break-all">
                  {newToken}
                </code>
                <button onClick={copyToken} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">Save this token now. You won&apos;t be able to see it again.</p>
            </div>
          )}

          <button onClick={generateToken} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
            Generate New Token
          </button>

          {loading ? (
            <p className="text-gray-400 text-sm mt-4">Loading tokens...</p>
          ) : tokens.length > 0 ? (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Active Tokens</h4>
              <div className="space-y-2">
                {tokens.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-400">
                        Created {new Date(t.created_at).toLocaleDateString()}
                        {t.last_used_at ? ' · Last used ' + new Date(t.last_used_at).toLocaleDateString() : ' · Never used'}
                      </p>
                    </div>
                    <button onClick={() => deleteToken(t.id)} className="text-red-500 text-sm hover:underline">Revoke</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-4">No tokens yet. Generate one above.</p>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-2">Account</h3>
          <p className="text-sm text-gray-600">
            Signed in as: <strong>{user?.emailAddresses[0]?.emailAddress}</strong>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Plan: Free (3 subscriptions)
          </p>
        </div>
      </main>
    </div>
  )
}
