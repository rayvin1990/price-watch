import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">PriceWatch</h1>
          <div className="flex gap-4 items-center">
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link href="/sign-up" className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-medium">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Never miss a<br/>price hike again
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            PriceWatch automatically monitors your subscriptions for price changes.
            Netflix bumped their price? Your API doubled? Be the first to know.
          </p>
          <Link href="/sign-up"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 shadow-lg">
            Start Monitoring →
          </Link>
          <p className="text-sm text-gray-400 mt-3">Free to start, no credit card required</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Auto-Detect</h3>
            <p className="text-gray-600">Browse any subscription page and add it to tracking with one click</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
            <p className="text-gray-600">Get notified via browser notification or email when a price changes</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Price History</h3>
            <p className="text-gray-600">View the complete history of every subscription and see who raised prices most</p>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        PriceWatch &copy; 2026
      </footer>
    </div>
  )
}
