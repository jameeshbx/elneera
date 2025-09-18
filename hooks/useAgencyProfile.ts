// hooks/useAgentAdminProfile.ts
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AgentAdminProfileData {
  profileData: {
    name: string
    email: string
    fullName: string
    mobile: string
    location: string
    avatarUrl: string | null
  }
  accountData: {
    username: string
    password: string
    role: string
    location: string
    status: string
    lastLoggedIn: string
  }
  teamMembers: Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
    lastLoggedIn: string
    avatarColor: string
  }>
  commentData: {
    id: string
    author: string
    authorAvatar: string | null
    content: string
    timestamp: string
  } | null
  companyInformation: {
    name: string
    gstRegistration: string
    gstNo: string
    ownerName: string
    mobile: string
    email: string
    website: string
    logo: string | null
    country: string
    yearOfRegistration: string
    panNo: string
    panType: string
    headquarters: string
    yearsOfOperation: string
    landingPageColor: string
  }
}

export function useAgentAdminProfile() {
  const [data, setData] = useState<AgentAdminProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/agency-profile-admin')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch agent admin profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<AgentAdminProfileData>) => {
    try {
      const response = await fetch('/api/auth/agency-profile-admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Profile updated successfully')
        await fetchProfile() // Refresh the data
        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast.error('Failed to update profile')
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return { data, loading, error, updateProfile, refetch: fetchProfile }
}