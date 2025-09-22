// app/dashboard/fee-monitor/page.tsx
'use client'

import { FeeBalanceMonitor } from '@/components/dashboard/fee-balance-monitor'

export default function FeeMonitorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Fee Balance Monitor</h1>
          <p className="text-muted-foreground">
            Track your fee vault balance and prevent emergency burns
          </p>
        </div>
        <FeeBalanceMonitor />
      </div>
    </div>
  )
}