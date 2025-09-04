import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReserveBTC - Mint 1:1 backed rBTC tokens',
  description: 'Verify Bitcoin ownership to mint 1:1 backed rBTC tokens on MegaETH',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.svg',
    shortcut: '/favicon.svg',
  },
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon-16x16.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon-32x32.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${inter.className} transition-colors duration-300 ease-in-out bg-background text-foreground overscroll-none`}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-background/95">
              <div className="container mx-auto px-4 py-8">
                <div className="text-center space-y-6">
                  {/* Key Security Message */}
                  <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/10 rounded-lg">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      🛡️ Bitcoin stays in your wallet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Non-custodial protocol • Your keys, your coins
                    </p>
                  </div>
                  
                  {/* Navigation Links */}
                  <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
                    <a href="/audit" className="hover:text-foreground transition-colors">
                      Audit
                    </a>
                    <a href="/faq" className="hover:text-foreground transition-colors">
                      FAQ
                    </a>
                    <a href="/faq#protocol" className="hover:text-foreground transition-colors">
                      Protocol FAQ
                    </a>
                    <a href="/docs" className="hover:text-foreground transition-colors">
                      Docs
                    </a>
                  </div>

                  {/* Social Media Links */}
                  <div className="flex justify-center space-x-6">
                    <a 
                      href="https://x.com/reserveBTC" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-card border hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Follow ReserveBTC on X (Twitter)"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="https://github.com/reservebtc" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-card border hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="View ReserveBTC on GitHub"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="mailto:reservebtcproof@gmail.com"
                      className="p-3 rounded-full bg-card border hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Email ReserveBTC Support"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                    
                    <a 
                      href="https://chatgpt.com/g/g-68a3e198b3348191bf4be2ce6e06ba0b-reservebtc-agent-support-docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-card border hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Chat with ReserveBTC AI Assistant"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </a>
                  </div>
                  
                  {/* Copyright */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      © 2025 ReserveBTC. Non-custodial Bitcoin-backed synthetic assets on MegaETH.
                    </p>
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
