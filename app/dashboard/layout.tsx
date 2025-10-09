import type { Metadata } from 'next'

// Force dynamic rendering and disable all caching for real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Metadata with cache-busting timestamp
export const metadata: Metadata = {
  title: 'Dashboard | ReserveBTC',
  description: 'Manage your Bitcoin reserves and rBTC tokens - Real-time blockchain data',
  robots: {
    index: false, // Don't index dashboard pages
    follow: false,
  },
  // Force browser to never cache this page
  other: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Real-time dashboard - no caching */}
      {children}
    </>
  )
}