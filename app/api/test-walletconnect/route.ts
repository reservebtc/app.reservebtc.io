import { NextResponse } from 'next/server'

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

  return NextResponse.json({
    success: true,
    hasProjectId: !!projectId,
    projectIdPreview: projectId ? `${projectId.slice(0, 8)}...${projectId.slice(-4)}` : 'NOT FOUND',
    instructions: {
      step1: 'If projectIdPreview shows your ID - WalletConnect is configured correctly',
      step2: 'Open /mint page and click "Connect Wallet"',
      step3: 'Look for WalletConnect option with QR code',
      step4: 'If QR code shows - WalletConnect is working!',
    },
    websocketInfo: {
      walletConnectRelay: 'wss://relay.walletconnect.com (for QR code)',
      megaethPrivate: 'wss://carrot.megaeth.com/mafia/ws/... (for blockchain events)',
      note: 'These are DIFFERENT WebSockets - no conflicts!'
    }
  })
}