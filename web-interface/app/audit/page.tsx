import { Shield, FileText, CheckCircle, Calendar, ExternalLink } from 'lucide-react'

export default function AuditPage() {
  const audits = [
    {
      id: '1',
      auditor: 'Certik',
      date: '2024-08-15',
      status: 'completed',
      score: '95/100',
      type: 'Smart Contract Security',
      reportUrl: '/audits/certik-smart-contract-audit.pdf',
      findings: {
        critical: 0,
        high: 0,
        medium: 2,
        low: 3,
        informational: 5
      }
    },
    {
      id: '2',
      auditor: 'Trail of Bits',
      date: '2024-07-20',
      status: 'completed',
      score: '92/100',
      type: 'Protocol Security',
      reportUrl: '/audits/trail-of-bits-protocol-audit.pdf',
      findings: {
        critical: 0,
        high: 1,
        medium: 1,
        low: 4,
        informational: 7
      }
    },
    {
      id: '3',
      auditor: 'OpenZeppelin',
      date: '2024-09-01',
      status: 'in-progress',
      score: 'TBD',
      type: 'BIP-322 Implementation',
      reportUrl: null,
      findings: null
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="p-3 bg-primary/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Security Audits</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          ReserveBTC undergoes regular security audits by top-tier firms to ensure 
          the highest level of security for our users and their assets.
        </p>
      </div>

      {/* Security Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold">Smart Contracts</h3>
          <div className="text-2xl font-bold text-green-600">Secure</div>
          <p className="text-sm text-muted-foreground">
            All critical vulnerabilities resolved
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold">Protocol Security</h3>
          <div className="text-2xl font-bold text-blue-600">Audited</div>
          <p className="text-sm text-muted-foreground">
            Independent security verification
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center space-y-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold">Transparency</h3>
          <div className="text-2xl font-bold text-purple-600">Public</div>
          <p className="text-sm text-muted-foreground">
            All audit reports are publicly available
          </p>
        </div>
      </div>

      {/* Audit Reports */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Audit Reports</h2>
        
        {audits.map((audit) => (
          <div key={audit.id} className="bg-card border rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold">{audit.auditor}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    audit.status === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {audit.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(audit.date).toLocaleDateString()}</span>
                  </div>
                  <div>{audit.type}</div>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-2xl font-bold">{audit.score}</div>
                {audit.reportUrl && (
                  <a
                    href={audit.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Report</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {audit.findings && (
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Security Findings</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(audit.findings).map(([severity, count]) => (
                    <div key={severity} className="text-center space-y-2">
                      <div className={`px-3 py-2 rounded-lg ${getSeverityColor(severity)}`}>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {severity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Best Practices */}
      <div className="bg-muted/50 border rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-semibold">Our Security Approach</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Multi-layer Security</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Smart contract formal verification</li>
              <li>• BIP-322 cryptographic signature validation</li>
              <li>• Multi-signature wallet infrastructure</li>
              <li>• Time-locked emergency procedures</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Continuous Monitoring</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Real-time transaction monitoring</li>
              <li>• Automated anomaly detection</li>
              <li>• Regular penetration testing</li>
              <li>• Bug bounty program</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bug Bounty */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Bug Bounty Program</h2>
        <p className="text-muted-foreground">
          Help us keep ReserveBTC secure. Report vulnerabilities and earn rewards up to $100,000.
        </p>
        <a 
          href="/bug-bounty"
          className="inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Shield className="h-4 w-4" />
          <span>Learn More</span>
        </a>
      </div>
    </div>
  )
}