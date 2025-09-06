import { Suspense } from 'react'
import { MintRBTC } from '@/components/mint/mint-rbtc'
import { Loader2 } from 'lucide-react'

function MintRBTCWrapper() {
  return <MintRBTC />
}

export default function MintPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <MintRBTCWrapper />
    </Suspense>
  )
}