import { FAQContent } from './faq-content'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | ReserveBTC - Frequently Asked Questions',
  description: 'Get answers to frequently asked questions about ReserveBTC, including fees, protocol security, BIP-322 signatures, and Bitcoin verification.',
  keywords: 'ReserveBTC FAQ, Bitcoin DeFi questions, BIP-322 FAQ, rBTC token questions, MegaETH FAQ',
  openGraph: {
    title: 'FAQ - ReserveBTC',
    description: 'Find answers to common questions about ReserveBTC protocol and Bitcoin verification',
    type: 'website'
  },
  alternates: {
    canonical: '/faq'
  }
}

export default function FAQPage() {
  return <FAQContent />
}