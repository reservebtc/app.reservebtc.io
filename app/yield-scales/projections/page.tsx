// app/yield-scales/projections/page.tsx
'use client'

import { RealisticYieldProjections } from '@/components/yield-scales/realistic-yield-projections'

export default function ProjectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8">
        <RealisticYieldProjections />
      </div>
    </div>
  )
}