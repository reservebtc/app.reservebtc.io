import { ExternalLink, Book, Shield, Code, Zap } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | ReserveBTC - Protocol Guides & API Reference',
  description: 'Complete documentation for ReserveBTC protocol including API reference, security guides, BIP-322 signatures, and developer resources.',
  keywords: 'ReserveBTC documentation, API reference, BIP-322 guide, Bitcoin DeFi docs, smart contract documentation, developer guide',
  openGraph: {
    title: 'Documentation - ReserveBTC',
    description: 'Comprehensive documentation for the ReserveBTC Bitcoin-backed synthetic assets protocol',
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
      description: 'Learn about the ReserveBTC protocol and how it works',
      links: [
        { title: 'Introduction to ReserveBTC', href: '/docs/introduction' },
        { title: 'How It Works', href: '/docs/how-it-works' },
        { title: 'BIP-322 Signatures', href: '/docs/bip322' },
        { title: 'MegaETH Integration', href: '/docs/megaeth' }
      ]
    },
    {
      title: 'Security & Audits',
      icon: Shield,
      description: 'Security documentation and audit reports',
      links: [
        { title: 'Security Model', href: '/docs/security' },
        { title: 'Audit Reports', href: '/audit' },
        { title: 'Smart Contract Security', href: '/docs/contract-security' },
        { title: 'Best Practices', href: '/docs/best-practices' }
      ]
    },
    {
      title: 'Developer Resources',
      icon: Code,
      description: 'Technical documentation for developers',
      links: [
        { title: 'API Documentation', href: '/docs/api' },
        { title: 'Smart Contract ABI', href: '/docs/abi' },
        { title: 'SDK and Libraries', href: '/docs/sdk' },
        { title: 'Integration Guide', href: '/docs/integration' }
      ]
    },
    {
      title: 'Getting Started',
      icon: Zap,
      description: 'Quick start guides and tutorials',
      links: [
        { title: 'Wallet Setup', href: '/docs/wallet-setup' },
        { title: 'First Mint Tutorial', href: '/docs/first-mint' },
        { title: 'Verification Process', href: '/docs/verification' },
        { title: 'Troubleshooting', href: '/docs/troubleshooting' }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete documentation for the ReserveBTC protocol, including guides, 
          API references, and security information.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="p-2 bg-primary/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Book className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Quick Start</h3>
          <p className="text-muted-foreground text-sm">
            Get up and running with ReserveBTC in minutes
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
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="text-muted-foreground text-sm">
            Learn about our security model and audit reports
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
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-12 h-12 flex items-center justify-center">
            <Code className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">API Reference</h3>
          <p className="text-muted-foreground text-sm">
            Complete API documentation for developers
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
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <h3 className="font-medium">GitHub Repository</h3>
            <p className="text-muted-foreground text-sm">
              View source code and contribute
            </p>
            <a 
              href="https://github.com/reservebtc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>View on GitHub</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Community</h3>
            <p className="text-muted-foreground text-sm">
              Join our community discussions
            </p>
            <a 
              href="https://discord.gg/reservebtc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>Join Discord</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Whitepaper</h3>
            <p className="text-muted-foreground text-sm">
              Read the technical whitepaper
            </p>
            <a 
              href="/whitepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary hover:underline"
            >
              <span>Download PDF</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}