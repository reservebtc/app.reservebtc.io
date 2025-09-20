import { Suspense } from 'react'
// import { WrapRBTC } from '@/components/wrap/wrap-rbtc'
import { Loader2 } from 'lucide-react'

/*
function WrapRBTCWrapper() {
  return <WrapRBTC />
}
*/

export default function WrapPage() {
  // Temporarily disabled wrap functionality
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Wrap Feature Temporarily Unavailable</h1>
        <p className="text-muted-foreground">This feature is currently under maintenance.</p>
      </div>
    </div>
  )
  
  /*
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Wrap Interface...</span>
        </div>
      </div>
    }>
      <WrapRBTCWrapper />
    </Suspense>
  )
  */
}

export const metadata = {
  title: 'Wrap rBTC-SYNTH | ReserveBTC',
  description: 'Convert your soulbound rBTC-SYNTH tokens into transferable wrBTC. Create Bitcoin liquidity certificates while maintaining non-custodial control.',
  keywords: 'Bitcoin wrap, rBTC-SYNTH, wrBTC, Bitcoin liquidity, DeFi, non-custodial, Full-Reserve',
  openGraph: {
    title: 'Wrap rBTC-SYNTH | ReserveBTC Protocol',
    description: 'Convert soulbound rBTC into transferable wrBTC certificates. Enable DeFi trading while maintaining Bitcoin custody.',
    type: 'website',
  },
}