"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AccessDeniedModal from "@/components/AccessDeniedModal"

export default function UnderReviewPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'PENDING' | 'REJECTED' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/agencyform')
      
      if (response.status === 404) {
        router.push('/agency-admin/agency-form')
        return
      }
      
      const data = await response.json()
      
      if (data.data) {
        const currentStatus = data.data.status?.toUpperCase()
        
        if (currentStatus === 'APPROVED' || currentStatus === 'ACTIVE') {
          router.push('/agency-admin/dashboard')
          return
        }
        
        if (currentStatus === 'PENDING' || currentStatus === 'UNDER_REVIEW') {
          setStatus('PENDING')
        } else if (currentStatus === 'REJECTED' || currentStatus === 'DECLINED') {
          setStatus('REJECTED')
        }
      } else {
        router.push('/agency-admin/agency-form')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {status && (
        <AccessDeniedModal 
          isOpen={true} 
          status={status}
          onRetry={checkStatus}
        />
      )}
    </div>
  )
}