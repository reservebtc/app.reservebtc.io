'use client'

import { useEffect, useState } from 'react'
import { Wallet, X, AlertCircle } from 'lucide-react'

interface WalletRequiredToastProps {
  show: boolean
  onClose: () => void
}

export function WalletRequiredToast({ show, onClose }: WalletRequiredToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setIsLeaving(false)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [show])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsLeaving(false)
      onClose()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className={`fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-[calc(100%-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-md ${
      isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
    }`}>
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-lg border border-amber-500/30 rounded-xl shadow-xl p-3 sm:p-4 md:p-6">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Wallet Connection Required
              </h3>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              Please connect your MetaMask wallet to access the Dashboard
            </p>

            {/* Progress bar */}
            <div className="h-1 bg-amber-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-progress"
                style={{
                  animation: 'progress 5s linear forwards'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}