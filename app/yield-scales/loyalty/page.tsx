// app/yield-scales/loyalty/page.tsx
'use client'

import { LoyaltyProgram } from '@/components/yield-scales/loyalty-program'

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8">
        <LoyaltyProgram />
      </div>
    </div>
  )
}