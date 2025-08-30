import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, AlertTriangle, CheckCircle, Code } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Smart Contract Security | ReserveBTC Documentation',
  description: 'Comprehensive security analysis of ReserveBTC smart contracts including security measures, best practices, and audit findings.',
  keywords: 'smart contract security, blockchain security, ReserveBTC audit, DeFi security, contract verification',
}

export default function ContractSecurityPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Smart Contract Security</h1>
          <p className="text-lg text-muted-foreground">
            ReserveBTC implements multiple layers of security measures to ensure the safety of user funds and the integrity of the protocol.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Security Overview</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Our smart contracts undergo rigorous security testing and auditing processes to ensure they meet the highest 
            standards of security and reliability in the DeFi ecosystem.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100">All contracts audited and verified</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Code className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Smart Contract Architecture</h3>
            </div>
            <p className="text-muted-foreground">
              Modular design with clear separation of concerns, upgradeable components with timelock controls, 
              and comprehensive access control mechanisms.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Access Control</h3>
            </div>
            <p className="text-muted-foreground">
              Role-based access control with multi-signature requirements for critical functions, 
              emergency pause mechanisms, and decentralized governance integration.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Transparency</h3>
            </div>
            <p className="text-muted-foreground">
              All contracts are verified on block explorers, comprehensive documentation available, 
              and real-time monitoring of all protocol activities.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Risk Mitigation</h3>
            </div>
            <p className="text-muted-foreground">
              Circuit breakers for unusual activity, rate limiting mechanisms, 
              and comprehensive testing including fuzzing and formal verification.
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Security Measures</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Multi-Layer Validation
              </h3>
              <p className="text-muted-foreground mb-3">
                Every transaction undergoes multiple validation layers including signature verification, 
                balance checks, and oracle confirmation.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• BIP-322 signature validation</li>
                <li>• Real-time balance verification</li>
                <li>• Oracle consensus mechanisms</li>
                <li>• Smart contract state validation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Emergency Response
              </h3>
              <p className="text-muted-foreground mb-3">
                Comprehensive emergency response system to handle potential security incidents or system failures.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Circuit breaker mechanisms</li>
                <li>• Emergency pause functionality</li>
                <li>• Multi-signature recovery procedures</li>
                <li>• Automated monitoring and alerting</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Continuous Monitoring
              </h3>
              <p className="text-muted-foreground mb-3">
                Real-time monitoring of all protocol activities with automated anomaly detection and response.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• 24/7 system monitoring</li>
                <li>• Anomaly detection algorithms</li>
                <li>• Real-time security alerts</li>
                <li>• Performance and health metrics</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Comprehensive Testing Suite</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ReserveBTC implements a comprehensive testing strategy with multiple layers of validation, 
              including unit tests, E2E integration tests, and security canary checks.
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">Test Results: 7/7 (100%) ✅</span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                All test suites passing - Unit Tests (39), Component Tests (6), API Tests (6), plus Security & Accessibility tests
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">E2E Integration Tests</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Complete end-to-end scenarios testing Oracle sync, fee deduction, and multi-user invariants
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• User registration & fee prepayment</li>
                  <li>• Positive sync with fee deduction</li>
                  <li>• Negative sync without fees</li>
                  <li>• Multi-user balance invariants</li>
                  <li>• Fee cap boundary conditions</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Security Canary Tests</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Edge case security validation and attack scenario prevention
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Zero-address constructor protection</li>
                  <li>• Fee collector self-destruct resilience</li>
                  <li>• State corruption prevention</li>
                  <li>• EIP-6780 compliance checks</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Oracle Resilience Tests</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Stress testing and timing scenarios for Oracle system
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Small noise delta handling (+1/-1)</li>
                  <li>• Large spike delta validation</li>
                  <li>• Fee cap enforcement under stress</li>
                  <li>• Zero delta no-op behavior</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Security Best Practices for Users</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Verify Contract Addresses</p>
                <p className="text-muted-foreground text-sm">Always verify you're interacting with official ReserveBTC contracts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Use Hardware Wallets</p>
                <p className="text-muted-foreground text-sm">For maximum security, use hardware wallets for transaction signing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Review Transactions</p>
                <p className="text-muted-foreground text-sm">Always review transaction details before confirming</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Stay Updated</p>
                <p className="text-muted-foreground text-sm">Follow official channels for security updates and announcements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/audit" 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-center font-medium transition-colors"
          >
            View Audit Reports
          </Link>
          <Link 
            href="/docs/security" 
            className="flex-1 bg-card border hover:bg-muted/50 rounded-lg p-4 text-center font-medium transition-colors"
          >
            Security Model
          </Link>
        </div>
      </div>
    </div>
  )
}