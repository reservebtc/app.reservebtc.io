// app/yield-scales/risks/page.tsx
'use client'

import { RiskDisclosure } from '@/components/yield-scales/risk-disclosure'

export default function RisksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8">
        <RiskDisclosure />
      </div>
    </div>
  )
}