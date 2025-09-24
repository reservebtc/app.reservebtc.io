import { ExternalLink, Book, Shield, Code, Zap, Scale, Server, DollarSign, Users } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | ReserveBTC - Complete Protocol & API Reference',
  description: 'Comprehensive documentation for ReserveBTC protocol v2.2 including Yield Scales, Oracle system, API reference, security guides, and developer resources.',
  keywords: 'ReserveBTC documentation, Yield Scales protocol, Oracle v2.2, API reference, BIP-322 guide, Bitcoin DeFi docs, smart contract documentation',
  openGraph: {
    title: 'Documentation - ReserveBTC v2.2',
    description: 'Complete documentation for the ReserveBTC Bitcoin-backed synthetic assets protocol with Yield Scales DeFi',
    type: 'website'
  },
  alternates: {
    canonical: '/docs'
  }
}

export default function DocsPage() {
  const documentationSections = [
    {
      title: 'Protocol Overview',
      icon: Book,
      description: 'Understanding ReserveBTC core protocol and architecture',
      links: [
        { title: 'Introduction to ReserveBTC', href: '/docs/introduction' },
        { title: 'How It Works', href: '/docs/how-it-works' },
        { title: 'BIP-322 Signatures', href: '/docs/bip322' },
        { title: 'MegaETH Integration', href: '/docs/megaeth' },
        { title: 'Mint Protection System', href: '/docs/mint-protection' },
        { title: 'Emergency Burn Mechanism', href: '/docs/emergency-burn' }
      ]
    },
    {
      title: 'Yield Scales Protocol',
      icon: Scale,
      description: 'Revolutionary DeFi yield generation without custody risk',
      links: [
        { title: 'Yield Scales Overview', href: '/yield-scales' },
        { title: 'Balance Scale Mechanism', href: '/docs/balance-scales' },
        { title: 'Yield Projections (3-7% APY)', href: '/yield-scales/projections' },
        { title: 'Risk Disclosure', href: '/yield-scales/risks' },
        { title: 'Loyalty Program', href: '/yield-scales/loyalty' },
        { title: 'Partner Integration', href: '/partners/docs' }
      ]
    },
    {
      title: 'Oracle System v2.2',
      icon: Server,
      description: '24/7 automated monitoring with 99.9% uptime',
      links: [
        { title: 'Oracle Architecture', href: '/docs/oracle-architecture' },
        { title: 'Multi-Source Verification', href: '/docs/multi-source' },
        { title: 'Transparency Dashboard', href: '/oracle-transparency' },
        { title: 'API Explorer', href: '/api-explorer/oracle' },
        { title: 'Oracle Status Monitor', href: 'https://oracle.reservebtc.io/status' },
        { title: 'Dispute Resolution', href: '/dispute' }
      ]
    },
    {
      title: 'Security & Audits',
      icon: Shield,
      description: '318 tests passed with 100% coverage',
      links: [
        { title: 'Security Model', href: '/docs/security' },
        { title: 'Comprehensive Audit Report', href: '/audit' },
        { title: 'Smart Contract Security (206 Tests)', href: '/docs/contract-security' },
        { title: 'Fee Monitor System', href: '/dashboard/fee-monitor' },
        { title: 'Best Practices', href: '/docs/best-practices' },
        { title: 'GitHub Security Tests', href: 'https://github.com/reservebtc/app.reservebtc.io/tree/main/contracts/test' }
      ]
    },
    {
      title: 'Smart Contracts',
      icon: Code,
      description: '6 deployed contracts on MegaETH testnet',
      links: [
        { title: 'Contract Addresses', href: '/docs/megaeth' },
        { title: 'OracleAggregator ABI', href: '/docs/abi#oracle' },
        { title: 'RBTCSynth (Soulbound)', href: '/docs/abi#rbtcsynth' },
        { title: 'VaultWrBTC (ERC-20)', href: '/docs/abi#wrbtc' },
        { title: 'YieldScalesPool', href: '/docs/abi#yieldscales' },
        { title: 'FeeVault & FeePolicy', href: '/docs/abi#fees' }
      ]
    },
    {
      title: 'Developer Resources',
      icon: Code,
      description: 'Complete technical documentation for integration',
      links: [
        { title: 'API Documentation', href: '/docs/api' },
        { title: 'Partner API Integration', href: '/partners/docs' },
        { title: 'SDK and Libraries', href: '/docs/sdk' },
        { title: 'WebSocket Real-time Events', href: '/docs/websocket' },
        { title: 'Bitcoin Balance Sync API', href: '/api/cron/bitcoin-balance-sync' },
        { title: 'Integration Examples', href: '/docs/integration' }
      ]
    },
    {
      title: 'Getting Started',
      icon: Zap,
      description: 'Quick start guides and tutorials',
      links: [
        { title: 'MegaETH Wallet Setup', href: '/docs/wallet-setup' },
        { title: 'Get Testnet Funds', href: '/faucet' },
        { title: 'First Mint Tutorial', href: '/docs/first-mint' },
        { title: 'BIP-322 Verification Process', href: '/docs/verification' },
        { title: 'Dashboard Overview', href: '/docs/dashboard-guide' },
        { title: 'Troubleshooting', href: '/docs/troubleshooting' }
      ]
    },
    {
      title: 'Economics & Tokenomics',
      icon: DollarSign,
      description: 'Fee structure and token economics',
      links: [
        { title: 'Fee Structure (0.1% + 1 gwei/sat)', href: '/docs/fee-structure' },
        { title: 'rBTC-SYNTH Token Model', href: '/docs/rbtc-synth' },
        { title: 'wrBTC Transferable Token', href: '/docs/wrbtc' },
        { title: 'FeeVault Minimum (0.001 ETH)', href: '/docs/feevault' },
        { title: 'Yield Distribution Model', href: '/docs/yield-distribution' },
        { title: 'Principal Protection Guarantee', href: '/docs/principal-protection' }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Documentation v2.2</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete documentation for the ReserveBTC protocol, including Yield Scales DeFi integration, 
          Oracle v2.2 system, API references, and comprehensive security information.
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-green-600">✓ 318 Tests Passed</span>
          <span className="text-blue-600">✓ 99.9% Uptime</span>
          <span className="text-yellow-600">✓ 100% Coverage</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="p-2 bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Book className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Quick Start</h3>
          <p className="text-muted-foreground text-sm">
            Start minting rBTC in 5 minutes
          </p>
          <a 
            href="/docs/quick-start"
            className="inline-flex items-center space-x-1 text-primary hover:underline"
          >
            <span>Get Started</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Security Audits</h3>
          <p className="text-muted-foreground text-sm">
            318 security tests with 0 vulnerabilities
          </p>
          <a 
            href="/audit"
            className="inline-flex items-center space-x-1 text-primary hover:underline"
          >
            <span>View Audits</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Scale className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold">Yield Scales</h3>
          <p className="text-muted-foreground text-sm">
            Earn 3-7% APY without custody risk
          </p>
          <a 
            href="/yield-scales"
            className="inline-flex items-center space-x-1 text-primary hover:underline"
          >
            <span>Learn More</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Code className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">API Reference</h3>
          <p className="text-muted-foreground text-sm">
            19 endpoints for developers
          </p>
          <a 
            href="/docs/api"
            className="inline-flex items-center space-x-1 text-primary hover:underline"
          >
            <span>Explore API</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {documentationSections.map((section, index) => (
          <div key={section.title} className="bg-card border rounded-xl p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <section.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {section.links.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <span className="font-medium">{link.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="bg-muted/50 border rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-semibold text-center">Additional Resources</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <h3 className="font-medium">GitHub Repository</h3>
            <p className="text-muted-foreground text-sm">
              Source code & contributions
            </p>
            <a 
              href="https://github.com/reservebtc/app.reservebtc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>View on GitHub</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Oracle Dashboard</h3>
            <p className="text-muted-foreground text-sm">
              Live monitoring 24/7
            </p>
            <a 
              href="https://oracle.reservebtc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>Oracle Status</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Partner Portal</h3>
            <p className="text-muted-foreground text-sm">
              DeFi integration docs
            </p>
            <a 
              href="/partners"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>Partner Docs</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Support</h3>
            <p className="text-muted-foreground text-sm">
              Get help & updates
            </p>
            <a 
              href="https://x.com/reserveBTC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>Twitter/X</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Protocol Version: v2.2 | Oracle: v2.2 | Network: MegaETH Testnet | Last Updated: September 2025</p>
      </div>
    </div>
  )
}