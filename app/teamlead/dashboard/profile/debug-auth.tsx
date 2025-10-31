"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugAuth() {
  const [authStatus, setAuthStatus] = useState<string>('Not tested')
  const [apiStatus, setApiStatus] = useState<string>('Not tested')
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-auth', {
        credentials: 'include'
      })
      const data = await response.json()
      setAuthStatus(JSON.stringify(data, null, 2))
    } catch (error) {
      setAuthStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testProfileAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/agency-profile-admin', {
        credentials: 'include'
      })
      const data = await response.json()
      setApiStatus(JSON.stringify(data, null, 2))
    } catch (error) {
      setApiStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Debug Authentication</h2>
      
      <div className="space-y-4">
        <div>
          <Button 
            onClick={testAuth} 
            disabled={loading}
            className="mr-2"
          >
            Test Auth
          </Button>
          <Button 
            onClick={testProfileAPI} 
            disabled={loading}
          >
            Test Profile API
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Auth Status:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {authStatus}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Profile API Status:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {apiStatus}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
