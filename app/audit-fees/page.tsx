import { DollarSign, Shield, CheckCircle, ExternalLink, Calendar, Users } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audit Fees & Security Investment | ReserveBTC - Transparent Security Costs',
  description: 'View ReserveBTC audit fees, security investment breakdown, and transparency in protocol security funding. Supporting continuous security improvements since 2025.',
  keywords: 'audit fees, security investment, ReserveBTC costs, protocol security funding, audit transparency, security budget',
  openGraph: {
    title: 'Audit Fees & Security Investment - ReserveBTC',
    description: 'Transparent security investment and audit fee structure for ReserveBTC protocol',
    type: 'website'
  },
  alternates: {
    canonical: '/audit-fees'
  }
}

export default function AuditFeesPage() {
  const securityInvestments = [
    {
      category: 'Smart Contract Audits',
      amount: '$15,000',
      description: 'Comprehensive security testing of all smart contracts',
      status: 'Ongoing',
      frequency: 'Quarterly',
      providers: ['Internal Security Team', 'External Auditors']
    },
    {
      category: 'Penetration Testing',
      amount: '$8,500',
      description: 'Regular penetration testing of infrastructure and APIs',
      status: 'Completed',
      frequency: 'Bi-annually',
      providers: ['Cybersecurity Specialists']
    },
    {
      category: 'Code Review & Analysis',
      amount: '$12,000',
      description: 'Automated and manual code analysis tools and services',
      status: 'Active',
      frequency: 'Continuous',
      providers: ['SonarQube', 'CodeQL', 'Slither']
    },
    {
      category: 'Bug Bounty Program',
      amount: '$25,000',
      description: 'Rewards for security researchers finding vulnerabilities',
      status: 'Active',
      frequency: 'Ongoing',
      providers: ['Community Security Researchers']
    },
    {
      category: 'Infrastructure Security',
      amount: '$6,000',
      description: 'Security monitoring, WAF, DDoS protection',
      status: 'Active',
      frequency: 'Monthly',
      providers: ['Cloudflare', 'AWS Security']
    }
  ]

  const totalInvestment = securityInvestments.reduce((sum, item) => {
    const amount = parseInt(item.amount.replace(/[$,]/g, ''))
    return sum + amount
  }, 0)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'completed':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'planned':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Security Investment & Audit Fees</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          ReserveBTC maintains full transparency in our security investments. View our comprehensive 
          security budget allocation and ongoing audit fee structure for 2025.
        </p>
      </div>

      {/* Investment Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold">Total Security Investment</h3>
          <div className="text-2xl font-bold text-green-600">
            ${totalInvestment.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            Annual security budget for 2025
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold">Security Categories</h3>
          <div className="text-2xl font-bold text-blue-600">
            {securityInvestments.length}
          </div>
          <p className="text-sm text-muted-foreground">
            Different security investment areas
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold">Security Partners</h3>
          <div className="text-2xl font-bold text-purple-600">12+</div>
          <p className="text-sm text-muted-foreground">
            Security providers and auditors
          </p>
        </div>
      </div>

      {/* Security Investment Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Security Investment Breakdown</h2>
        
        {securityInvestments.map((investment, index) => (
          <div key={index} className="bg-card border rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold">{investment.category}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                    {investment.status}
                  </span>
                </div>
                <p className="text-muted-foreground">{investment.description}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{investment.frequency}</span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-2xl font-bold text-primary">{investment.amount}</div>
                <div className="text-sm text-muted-foreground">Investment</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Security Providers</h4>
              <div className="flex flex-wrap gap-2">
                {investment.providers.map((provider, providerIndex) => (
                  <span
                    key={providerIndex}
                    className="px-3 py-1 bg-muted rounded-full text-sm font-medium"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fee Transparency */}
      <div className="bg-muted/50 border rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-semibold">Fee Transparency Commitment</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>What We Fund</span>
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Regular smart contract security audits</li>
              <li>• Bug bounty rewards for security researchers</li>
              <li>• Infrastructure security monitoring</li>
              <li>• Continuous code analysis and testing</li>
              <li>• Security consulting and advisory services</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span>Our Commitment</span>
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 100% transparency in security spending</li>
              <li>• Regular public reports on security investments</li>
              <li>• Community-driven security priorities</li>
              <li>• Open source audit reports and findings</li>
              <li>• Continuous improvement of security measures</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Budget Allocation Chart */}
      <div className="bg-card border rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-semibold">2025 Security Budget Allocation</h2>
        <div className="space-y-4">
          {securityInvestments.map((investment, index) => {
            const amount = parseInt(investment.amount.replace(/[$,]/g, ''))
            const percentage = ((amount / totalInvestment) * 100).toFixed(1)
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{investment.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {percentage}% ({investment.amount})
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contact for Security */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Security Questions?</h2>
        <p className="text-muted-foreground">
          Have questions about our security investments or want to contribute to our security efforts?
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="mailto:reservebtcproof@gmail.com"
            className="inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>Contact Security Team</span>
          </a>
          <a
            href="https://github.com/reservebtc/app.reservebtc.io/tree/main/contracts/test"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Security Tests</span>
          </a>
        </div>
      </div>
    </div>
  )
}