import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Key, AlertTriangle, CheckCircle, Users, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security Model | ReserveBTC Documentation',
  description: 'Comprehensive overview of ReserveBTC security architecture, cryptographic proofs, Oracle security, and risk mitigation strategies.',
  keywords: 'ReserveBTC security, Bitcoin DeFi security, BIP-322 security, Oracle security, smart contract security',
}

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Security Model</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC implements a comprehensive security architecture designed to protect user assets 
            while maintaining the decentralized and trustless nature of Bitcoin and DeFi.
          </p>
        </div>

        {/* Core Security Principles */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-green-800 dark:text-green-200 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Core Security Principles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Self-Custody First</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Users maintain full control of their Bitcoin at all times. No custody transfer required.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Cryptographic Proofs</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    BIP-322 signatures provide mathematical certainty of Bitcoin ownership.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Transparent Operations</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All protocol operations are verifiable on-chain and open source.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Decentralized Architecture</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    No single point of failure in the protocol design or Oracle system.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Continuous Monitoring</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Real-time balance verification ensures perfect backing ratios.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Audited Code</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Smart contracts undergo rigorous security audits by leading firms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Layers */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Multi-Layer Security Architecture</h2>
          <div className="space-y-6">
            {/* Layer 1 */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Bitcoin Layer Security</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Self-Custody Model</h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Bitcoin remains in user's wallet</li>
                    <li>• No private key sharing required</li>
                    <li>• No bridge or custody risks</li>
                    <li>• Users control their own security</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Address Verification</h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• BIP-322 cryptographic signatures</li>
                    <li>• All Bitcoin address types supported</li>
                    <li>• Mathematically provable ownership</li>
                    <li>• Industry-standard methodology</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200">Oracle Layer Security</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Data Integrity</h4>
                  <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                    <li>• Multiple Bitcoin API sources</li>
                    <li>• Cross-validation mechanisms</li>
                    <li>• Fraud detection algorithms</li>
                    <li>• Automated anomaly detection</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Decentralization</h4>
                  <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                    <li>• Multiple Oracle node operators</li>
                    <li>• Consensus-based verification</li>
                    <li>• No single point of failure</li>
                    <li>• Economic incentive alignment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">Smart Contract Security</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Code Quality</h4>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• Comprehensive test coverage</li>
                    <li>• Formal verification methods</li>
                    <li>• Security audit by top firms</li>
                    <li>• Open source transparency</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Access Control</h4>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• Multi-signature governance</li>
                    <li>• Role-based permissions</li>
                    <li>• Time-locked upgrades</li>
                    <li>• Emergency pause mechanisms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2" />
            Risk Assessment & Mitigation
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-red-600">Identified Risks</h3>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-red-800 dark:text-red-200">Oracle Manipulation</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Risk of false balance reporting</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-red-800 dark:text-red-200">Smart Contract Bugs</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Potential code vulnerabilities</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-red-800 dark:text-red-200">User Key Security</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Private key compromise risks</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-red-800 dark:text-red-200">Network Attacks</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Blockchain network disruptions</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-green-600">Mitigation Strategies</h3>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-green-800 dark:text-green-200">Multi-Oracle Consensus</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Multiple independent verifications required</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-green-800 dark:text-green-200">Extensive Auditing</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Regular security audits and formal verification</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-green-800 dark:text-green-200">User Education</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Security best practices and guidance</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-1 text-green-800 dark:text-green-200">Redundant Systems</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Multiple failsafes and backup mechanisms</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit & Verification */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Audits & Verification
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Eye className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Smart Contract Audits</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Independent security audits by leading blockchain security firms
              </p>
              <Link 
                href="/audit" 
                className="text-primary hover:underline text-sm font-medium"
              >
                View Audit Reports
              </Link>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-2">Formal Verification</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Mathematical proofs of smart contract correctness and security
              </p>
              <Link 
                href="/docs/contract-security" 
                className="text-primary hover:underline text-sm font-medium"
              >
                Learn More
              </Link>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2">Community Review</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Open source code reviewed by the global developer community
              </p>
              <a 
                href="https://github.com/reservebtc" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Key className="h-6 w-6 mr-2" />
            Security Best Practices for Users
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">✅ Recommended Practices</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Use hardware wallets for Bitcoin storage</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Keep wallet software updated</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Verify all transaction details</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Use official ReserveBTC interface only</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Enable 2FA on all accounts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Regular security backups</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-red-600">❌ Security Risks</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Never share private keys or seed phrases</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Avoid public WiFi for transactions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Don't use custodial exchange wallets</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Never sign unknown messages</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Avoid phishing websites</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span>Don't trust unverified communications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Procedures */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">🚨 Emergency Procedures</h2>
          <div className="grid md:grid-cols-2 gap-6 text-red-700 dark:text-red-300">
            <div>
              <h3 className="font-semibold mb-2">If You Suspect Compromise</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Immediately move Bitcoin to new address</li>
                <li>Revoke all connected app permissions</li>
                <li>Change wallet passwords</li>
                <li>Monitor for unauthorized transactions</li>
                <li>Contact support if tokens affected</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Protocol Emergency Response</h3>
              <ul className="space-y-1 text-sm">
                <li>• Pause mechanism for critical issues</li>
                <li>• Governance voting for major changes</li>
                <li>• Multi-sig protection for upgrades</li>
                <li>• Community notification systems</li>
                <li>• Bug bounty program active</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/audit" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            View Audit Reports
          </Link>
          <Link 
            href="/docs/best-practices" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Security Best Practices
          </Link>
        </div>
      </div>
    </div>
  )
}