'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, Lock, Code, Database, Zap, Server, Key, ExternalLink, ChevronRight, AlertTriangle, Activity, Github } from 'lucide-react'

export default function AuditPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const auditCategories = [
    {
      title: 'BIP-322 Security Verification',
      icon: <Key className="w-6 h-6" />,
      stats: '32/32 Tests Passed',
      color: 'from-orange-500 to-amber-600',
      tests: [
        {
          name: 'BIP-322 Security Audit',
          description: 'Complete BIP-322 signature verification with 32 comprehensive security tests',
          status: '32/32 PASSING',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/docs/SECURITY_AUDIT_BIP322.md'
        },
        {
          name: 'Public Verification Workflow',
          description: 'Anyone can run BIP-322 tests via GitHub Actions - transparent and verifiable',
          status: 'PUBLIC TESTING',
          link: 'https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml'
        },
        {
          name: 'CodeQL Security Analysis',
          description: 'GitHub automated security scanning for vulnerabilities',
          status: 'NO ISSUES',
          link: 'https://github.com/reservebtc/app.reservebtc.io/security/code-scanning'
        },
        {
          name: 'Cryptographic Attack Prevention',
          description: 'Protection against signature forgery, replay attacks, and address substitution',
          status: '8/8 PROTECTED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/scripts/security-audit-bip322-ci.js'
        },
        {
          name: 'Injection Attack Blocking',
          description: 'SQL, XSS, NoSQL, Command, and Path Traversal injection prevention',
          status: '7/7 BLOCKED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/scripts/security-audit-bip322-ci.js'
        },
        {
          name: 'Input Validation',
          description: 'Comprehensive validation for empty inputs, malformed data, and edge cases',
          status: '12/12 VALIDATED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/backend/bitcoin-provider/src/bip322-verify.ts'
        }
      ]
    },
    {
      title: 'Smart Contract Security',
      icon: <Shield className="w-6 h-6" />,
      stats: '206/206 Tests Passed',
      color: 'from-emerald-500 to-green-600',
      tests: [
        {
          name: 'Comprehensive Security Tests',
          description: 'Full smart contract security audit with 206 tests covering all attack vectors',
          status: '206/206 PASSING',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/README_Comprehensive_Security_Tests.md'
        },
        {
          name: 'Reentrancy Protection',
          description: 'All state-changing functions protected against reentrancy attacks',
          status: 'PROTECTED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/VaultWrBTC_ERC20_Unit.t.sol'
        },
        {
          name: 'Access Control',
          description: 'Committee-based multi-signature security implementation',
          status: 'VERIFIED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/OracleAggregator.sol'
        }
      ]
    },
    {
      title: 'Oracle System Security',
      icon: <Server className="w-6 h-6" />,
      stats: '9/9 Oracle Tests Passed',
      color: 'from-blue-500 to-indigo-600',
      tests: [
        {
          name: 'Oracle Resilience',
          description: 'Stress testing with spike protection and noise filtering',
          status: 'SPIKE PROTECTED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_Resilience_Unit.t.sol'
        },
        {
          name: 'Oracle Boundary Testing',
          description: 'Comprehensive fuzz testing for edge cases',
          status: 'FUZZ TESTED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Oracle_BoundaryFuzz_Invariants.t.sol'
        },
        {
          name: 'Live Oracle Monitoring',
          description: '24/7 active monitoring with 99.9% uptime',
          status: '24/7 ACTIVE',
          link: 'https://oracle.reservebtc.io'
        }
      ]
    },
    {
      title: 'Fee System Security',
      icon: <Database className="w-6 h-6" />,
      stats: '31/31 Tests Passed',
      color: 'from-purple-500 to-pink-600',
      tests: [
        {
          name: 'FeeVault Conservation',
          description: 'Mathematical invariants verified for fee conservation',
          status: 'INVARIANT VERIFIED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/FeeVault_Conservation_Invariant.t.sol'
        },
        {
          name: 'FeePolicy Overflow Protection',
          description: 'Integer overflow protection with Solidity 0.8+',
          status: 'NO OVERFLOW',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/FeePolicy_Edges_Unit.t.sol'
        },
        {
          name: 'Emergency Burn Protection',
          description: 'Automatic protection when fees below threshold',
          status: 'PROTECTED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/FeeVault_Comprehensive_Security.t.sol'
        }
      ]
    },
    {
      title: 'Frontend & API Security',
      icon: <Code className="w-6 h-6" />,
      stats: '67/67 Tests Passed',
      color: 'from-cyan-500 to-teal-600',
      tests: [
        {
          name: 'Frontend Test Suite',
          description: 'Complete UI component and interaction testing',
          status: '67/67 PASSING',
          link: 'https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml'
        },
        {
          name: 'API Endpoint Security',
          description: 'All 19 API endpoints tested for vulnerabilities',
          status: '19/19 SECURE',
          link: 'https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-tests.yml'
        },
        {
          name: 'WCAG Accessibility',
          description: 'Web Content Accessibility Guidelines compliance',
          status: 'AA COMPLIANT',
          link: 'https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-test-suite.yml'
        }
      ]
    },
    {
      title: 'Performance & Monitoring',
      icon: <Activity className="w-6 h-6" />,
      stats: '99.9% Uptime',
      color: 'from-red-500 to-rose-600',
      tests: [
        {
          name: 'Gas Optimization',
          description: 'Smart contract gas usage optimized for production',
          status: 'OPTIMIZED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/.gas-snapshot'
        },
        {
          name: 'Performance Monitoring',
          description: 'Continuous monitoring with <1s response time',
          status: 'MONITORED',
          link: 'https://github.com/reservebtc/app.reservebtc.io/actions/workflows/coverage-performance.yml'
        },
        {
          name: 'Security Canary',
          description: 'Automated corruption and attack detection',
          status: 'NO CORRUPTION',
          link: 'https://github.com/reservebtc/app.reservebtc.io/blob/main/contracts/test/Security_Canary_OracleAndVault.t.sol'
        }
      ]
    }
  ]

  const overallStats = [
    { label: 'Total Tests Passed', value: '350/350', color: 'text-emerald-400' },
    { label: 'Security Score', value: '10/10', color: 'text-blue-400' },
    { label: 'Critical Issues', value: '0', color: 'text-green-400' },
    { label: 'Audit Rating', value: 'HIGH', color: 'text-yellow-400' }
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-emerald-500/30 dark:border-emerald-500/30">
              <Shield className="w-16 h-16 text-emerald-400 dark:text-emerald-400" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Security Audit Report
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Comprehensive security analysis and test results for the ReserveBTC Protocol
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Github className="w-5 h-5" />
              <span>Run BIP-322 Tests (Public)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/reservebtc/app.reservebtc.io/security/code-scanning"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition-all duration-300"
            >
              <Shield className="w-5 h-5" />
              <span>CodeQL Security</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {overallStats.map((stat, index) => (
            <div key={index} className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Interactive Public Verification */}
        <div className="mb-16 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-2 border-orange-500/30 rounded-3xl p-10 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 animate-pulse"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl animate-bounce">
                <Github className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Verify Our Claims Yourself
              </h2>
            </div>

            <p className="text-center text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
              Don't trust our security claims? <span className="font-bold text-orange-400">Run the tests yourself!</span> Our BIP-322 implementation is publicly verifiable through GitHub Actions.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/40 dark:bg-black/40 border border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/50 transition-all">
                <div className="text-4xl font-bold text-orange-400 mb-2">32</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Security Tests</div>
              </div>
              <div className="bg-white/40 dark:bg-black/40 border border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/50 transition-all">
                <div className="text-4xl font-bold text-orange-400 mb-2">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
              </div>
              <div className="bg-white/40 dark:bg-black/40 border border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/50 transition-all">
                <div className="text-4xl font-bold text-orange-400 mb-2">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <a
                href="https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-orange-500/50"
              >
                <Github className="w-7 h-7" />
                <span>Click Here to Run Tests on GitHub</span>
                <ExternalLink className="w-6 h-6 animate-pulse" />
              </a>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-2xl">
                Click "Run workflow" on GitHub → Watch all 32 tests execute → See results in real-time<br/>
                <span className="text-orange-400 font-semibold">No installation required. Works in your browser.</span>
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-orange-500/20">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/30 dark:bg-black/30 border border-orange-500/20 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-400" />
                    What Gets Tested?
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>• Signature forgery prevention (8 tests)</li>
                    <li>• Injection attack blocking (7 tests)</li>
                    <li>• Input validation (12 tests)</li>
                    <li>• Edge case handling (5 tests)</li>
                  </ul>
                </div>

                <div className="bg-white/30 dark:bg-black/30 border border-orange-500/20 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    Automated Security
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>• GitHub CodeQL scanning (continuous)</li>
                    <li>• Dependency vulnerability checks</li>
                    <li>• Smart contract audit (206 tests)</li>
                    <li>• Frontend security (67 tests)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Categories */}
        <div className="space-y-8">
          {auditCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-br ${category.color} rounded-xl bg-opacity-20`}>
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
                    <p className="text-emerald-400 font-medium mt-1">{category.stats}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {category.tests.map((test, testIndex) => (
                  <div key={testIndex} className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-black/50 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{test.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{test.description}</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 text-sm font-medium">{test.status}</span>
                        </div>
                      </div>
                      <a
                        href={test.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Third-Party Verification Notice */}
        <div className="mt-16 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Github className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Independent Verification Available</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our BIP-322 implementation can be independently verified by anyone. We've made our security tests publicly
                accessible through GitHub Actions, allowing any developer to run the complete test suite and verify our claims.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/30 dark:bg-black/30 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Run Tests Yourself</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Visit our GitHub Actions and click "Run workflow" to execute all 32 BIP-322 security tests
                  </p>
                  <a
                    href="https://github.com/reservebtc/app.reservebtc.io/actions/workflows/bip322-public-verification.yml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Public Test Workflow →
                  </a>
                </div>
                <div className="bg-white/30 dark:bg-black/30 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automated Security Scans</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    GitHub CodeQL automatically scans our code for vulnerabilities on every commit
                  </p>
                  <a
                    href="https://github.com/reservebtc/app.reservebtc.io/security/code-scanning"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Security Alerts →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Continuous Security Monitoring</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Our security infrastructure is continuously monitored and tested. All smart contracts undergo regular audits,
                and our Oracle system maintains 99.9% uptime with real-time threat detection. The protocol has been thoroughly
                tested with 350 total tests achieving 100% pass rate.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <a href="https://github.com/reservebtc/app.reservebtc.io" target="_blank" rel="noopener noreferrer"
                   className="text-amber-400 hover:text-amber-300 underline text-sm">
                  View GitHub Repository
                </a>
                <a href="https://oracle.reservebtc.io/status" target="_blank" rel="noopener noreferrer"
                   className="text-amber-400 hover:text-amber-300 underline text-sm">
                  Oracle Status Dashboard
                </a>
                <a href="/docs" className="text-amber-400 hover:text-amber-300 underline text-sm">
                  Technical Documentation
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-500 text-sm">
          <p>Last Audit: October 4, 2025 | Protocol Version: v2.2 | Network: MegaETH Testnet</p>
          <p className="mt-2">BIP-322 tests can be independently verified by anyone on GitHub Actions</p>
        </div>
      </div>
    </div>
  )
}