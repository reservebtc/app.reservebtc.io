import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Go Home</span>
        </Link>

        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>

        <Link
          href="/docs"
          className="flex items-center justify-center space-x-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Search className="h-4 w-4" />
          <span>Browse Docs</span>
        </Link>
      </motion.div>

      {/* Suggested Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-card border rounded-xl p-8 space-y-4"
      >
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
      </motion.div>
    </div>
  )
}