import { Metadata } from 'next'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export const metadata: Metadata = {
  title: 'Dashboard | ReserveBTC - Track Your rBTC Portfolio',
  description: 'Monitor your verified Bitcoin addresses, rBTC-SYNTH balance, wrBTC holdings, and transaction history on ReserveBTC dashboard.',
  keywords: 'ReserveBTC dashboard, rBTC portfolio, Bitcoin verification status, wrBTC balance, transaction history, MegaETH',
  openGraph: {
    title: 'ReserveBTC Dashboard - Your Portfolio Overview',
    description: 'Track your rBTC holdings and Bitcoin verification status',
    type: 'website'
  }
}

export default function DashboardPage() {
  return <DashboardContent />
}