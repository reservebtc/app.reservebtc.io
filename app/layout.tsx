import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WalletConnect } from '@/components/wallet/wallet-connect'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReserveBTC - Mint 1:1 backed rBTC tokens',
  description: 'Deposit Bitcoin to mint 1:1 backed rBTC tokens on MegaETH',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} transition-colors duration-300 ease-in-out`}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <h1 className="text-2xl font-bold">ReserveBTC</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <WalletConnect />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-background/95">
              <div className="container mx-auto px-4 py-8">
                <div className="text-center space-y-4">
                  <p className="text-2xl font-semibold">Bitcoin stays in your wallet</p>
                  <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
                    <a href="/audit" className="hover:text-foreground transition-colors">
                      Audit
                    </a>
                    <a href="/faq#fees" className="hover:text-foreground transition-colors">
                      Fees FAQ
                    </a>
                    <a href="/faq#protocol" className="hover:text-foreground transition-colors">
                      Protocol FAQ
                    </a>
                    <a href="/docs" className="hover:text-foreground transition-colors">
                      Docs
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}