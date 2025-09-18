'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function UserAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6 py-12">
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            User Agreement
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              By clicking "WRAP" and interacting with the protocol, you confirm and agree to the following:
            </p>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  1. No Company / No Legal Entity
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  This project is open-source software published on GitHub.<br/>
                  There is no company, legal entity, or organization operating or controlling wrBTC.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  2. No Custody / No Funds Held
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We never hold, receive, or custody any of your Bitcoin, Ether, or tokens.<br/>
                  All actions are performed directly by you through public smart contracts.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  3. Experimental / Play Token
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  wrBTC is not money, not a security, not a stablecoin, and not an investment.<br/>
                  It is an experimental, user-generated token that may have <strong>zero or highly volatile value</strong>.<br/>
                  Any value comes only from other users voluntarily trading it.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  4. No Responsibility
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  The software is provided <em>"AS IS"</em>, without warranties of any kind.<br/>
                  We make no guarantees regarding price, liquidity, or usability of wrBTC.<br/>
                  We are not responsible for any losses, damages, or claims that may arise from your use of wrBTC.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  5. International Users
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  If you wrap, sell, or transfer wrBTC to another person (including in the United States or any other jurisdiction),<br/>
                  <strong>you are solely responsible</strong> for compliance with all applicable laws.<br/>
                  You agree that no claim, legal action, or demand shall be made against the developers, contributors, or maintainers of this software.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  6. Assumption of Risk
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  By using this protocol, you accept full responsibility for your actions.<br/>
                  You understand and agree that you may lose 100% of the value of wrBTC.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                ✅ By proceeding, you acknowledge that:
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li>• You understand wrBTC is experimental and has no guaranteed value.</li>
                <li>• You release the developers and contributors from all liability.</li>
                <li>• You assume all risks, including regulatory and financial.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}