import { Metadata } from 'next'
import ProtocolFAQClient from './protocol-faq-client'

export const metadata: Metadata = {
  title: 'Protocol FAQ | ReserveBTC - Technical Protocol Questions',
  description: 'Deep technical FAQ about ReserveBTC protocol including smart contracts, BIP-322 signatures, MegaETH integration, and security architecture.',
  keywords: 'ReserveBTC protocol FAQ, smart contract FAQ, BIP-322 technical, MegaETH integration, Bitcoin DeFi protocol',
  openGraph: {
    title: 'Protocol FAQ - ReserveBTC',
    description: 'Technical questions and answers about ReserveBTC protocol architecture',
    type: 'website'
  },
  alternates: {
    canonical: '/protocol-faq'
  }
}

export default function ProtocolFAQPage() {
  return <ProtocolFAQClient />
}