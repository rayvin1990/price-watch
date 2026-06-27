import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">PriceWatch</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 27, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-700 mb-3">PriceWatch collects the following information when you use our Chrome extension and web application:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Account Information:</strong> Email address and name when you sign up via Clerk authentication.</li>
            <li><strong>Subscription Data:</strong> Names, URLs, and prices of subscriptions you choose to track.</li>
            <li><strong>Browsing Data:</strong> Price information detected on pages you visit while using the extension, used only for auto-detection features.</li>
            <li><strong>Usage Data:</strong> Anonymous usage statistics to improve the service.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>To provide and maintain the subscription price tracking service</li>
            <li>To send price change alerts via browser notifications</li>
            <li>To improve and optimize the extension and web application</li>
            <li>To sync your data across devices when you enable cloud sync</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
          <p className="text-gray-700 mb-3">Your data is stored in two places:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Local Storage:</strong> Your subscription data is stored locally in your browser using Chrome&apos;s storage API. This data never leaves your browser unless you enable cloud sync.</li>
            <li><strong>Cloud Storage (optional):</strong> When you enable cloud sync, your data is stored securely on Supabase (PostgreSQL) servers. We use industry-standard encryption for data in transit and at rest.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Clerk:</strong> Used for authentication. Your login credentials are managed by Clerk, not stored on our servers.</li>
            <li><strong>Supabase:</strong> Used for cloud database storage.</li>
            <li><strong>Stripe:</strong> Used for payment processing (if you upgrade to a paid plan). We do not store credit card information.</li>
            <li><strong>Vercel:</strong> Used for hosting the web application.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-gray-700">You can delete your data at any time by removing subscriptions from the extension or dashboard. If you delete your account, all associated data will be permanently deleted within 30 days.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-gray-700">You have the right to access, correct, or delete your personal data at any time. Contact us at the email below to exercise these rights.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-gray-700">For privacy-related inquiries, please contact us at: <a href="mailto:rayvin19901110@gmail.com" className="text-blue-600 hover:underline">rayvin19901110@gmail.com</a></p>
        </section>
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        PriceWatch &copy; 2026
      </footer>
    </div>
  )
}
