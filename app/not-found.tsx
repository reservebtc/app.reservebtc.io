import { Home, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
      <div className="space-y-6">
        <div className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Go Home</span>
        </Link>

        <Link
          href="/docs"
          className="flex items-center justify-center space-x-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Browse Docs</span>
        </Link>
      </div>

      <div className="bg-card border rounded-xl p-8 space-y-4">
        <h2 className="font-semibold">Popular Pages</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Link href="/verify" className="text-primary hover:underline">
            Verify Wallet
          </Link>
          <Link href="/mint" className="text-primary hover:underline">
            Mint rBTC
          </Link>
          <Link href="/stats" className="text-primary hover:underline">
            Statistics
          </Link>
          <Link href="/faq" className="text-primary hover:underline">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  )
}