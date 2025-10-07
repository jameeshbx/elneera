"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, XCircle, RefreshCw } from "lucide-react"
import { useState } from "react"

interface AccessDeniedModalProps {
  isOpen: boolean
  status: 'PENDING' | 'REJECTED'
  onRetry?: () => void
}

export default function AccessDeniedModal({ isOpen, status, onRetry }: AccessDeniedModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRetry = async () => {
    setIsRefreshing(true)
    if (onRetry) {
      await onRetry()
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {status === 'PENDING' ? (
            <>
              <div className="mb-4 rounded-full bg-yellow-100 p-3">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Application Under Review
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Your agency registration is currently being reviewed by our admin team. 
                You&apos;ll receive an email notification once your application is approved.
              </p>
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  onClick={handleRetry} 
                  disabled={isRefreshing}
                  className="w-full"
                  variant="outline"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Status
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Status updates automatically every 30 seconds
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Application Rejected
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Your agency registration is currently being reviewed by our admin team. 
                You&apos;ll receive an email notification once your application is approved.
              </p>
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  onClick={handleRetry} 
                  disabled={isRefreshing}
                  className="w-full"
                  variant="outline"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Status
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => window.location.href = 'mailto:support@buyexchange.in'}
                  className="w-full"
                  variant="default"
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}