import { WalletVerification } from '@/components/verification/wallet-verification'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Bitcoin Wallet | ReserveBTC - BIP-322 Signature Verification',
  description: 'Verify your Bitcoin wallet ownership using BIP-322 signatures. Connect supported wallets like Sparrow, Electrum, and more to mint rBTC on MegaETH.',
  keywords: 'Bitcoin wallet verification, BIP-322, signature verification, ReserveBTC, rBTC, MegaETH',
  openGraph: {
    title: 'Verify Bitcoin Wallet - ReserveBTC',
    description: 'Prove ownership of your Bitcoin address with BIP-322 signatures',
    type: 'website'
  }
}

export default function VerifyPage() {
  return <WalletVerification />
}