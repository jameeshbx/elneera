// lib/api.ts
export interface CreateDMCInput {
  name: string
  contactPerson?: string
  designation?: string
  phoneNumber?: string
  phoneCountryCode?: string
  ownerName?: string
  email?: string
  ownerPhoneNumber?: string
  ownerPhoneCode?: string
  website?: string
  primaryCountry?: string
  destinationsCovered?: string
  cities?: string
  gstRegistered?: boolean
  gstNumber?: string
  yearOfRegistration?: string
  panNumber?: string
  panType?: 'INDIVIDUAL' | 'COMPANY' | 'TRUST' | 'OTHER'
  headquarters?: string
  country?: string
  yearsOfExperience?: string
  registrationCertificateId?: string
  createdBy: string
}

export const fetchDMCs = async (params: {
  search?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  limit?: number
}) => {
  try {
    const query = new URLSearchParams()
    
    if (params.search) query.set('search', params.search)
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortOrder) query.set('sortOrder', params.sortOrder)
    if (params.page) query.set('page', params.page.toString())
    if (params.limit) query.set('limit', params.limit.toString())

    const response = await fetch(`/api/dmc?${query.toString()}`)
    
    if (!response.ok) {
      // Get error details from response
      let errorMessage = 'Failed to fetch DMCs'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  } catch (error) {
    console.error('fetchDMCs error:', error)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error - please check your connection')
    }
    throw error
  }
}

type DMCCreateData = {
  dmcName: string
  primaryContact: string
  phoneNumber: string
  primaryPhoneExtension: string
  designation: string
  ownerName: string
  ownerPhoneNumber: string
  ownerPhoneExtension: string
  email: string
  website?: string
  primaryCountry: string
  destinationsCovered?: string
  cities?: string
  gstRegistration: string
  gstNo?: string
  yearOfRegistration?: string
  panNo: string
  panType: string
  headquarters?: string
  country: string
  yearOfExperience?: string
}

export const createDMC = async (data: DMCCreateData) => {
  try {
    const response = await fetch('/api/dmc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      let errorMessage = 'Failed to create DMC'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = `${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  } catch (error) {
    console.error('createDMC error:', error)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error - please check your connection')
    }
    throw error
  }
}