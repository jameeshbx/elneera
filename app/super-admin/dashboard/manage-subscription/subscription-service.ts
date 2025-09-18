export async function fetchSubscriptions(params: {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  paymentStatus?: string[]
  plans?: string[]
  fromDate?: Date | null
  toDate?: Date | null
}) {
  const queryParams = new URLSearchParams()
  
  if (params.search) queryParams.append('search', params.search)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)
  
  params.paymentStatus?.forEach(status => queryParams.append('paymentStatus', status))
  params.plans?.forEach(plan => queryParams.append('plans', plan))
  
  if (params.fromDate) queryParams.append('fromDate', params.fromDate.toISOString())
  if (params.toDate) queryParams.append('toDate', params.toDate.toISOString())

  const res = await fetch(`/api/subscriptions?${queryParams.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch subscriptions')
  return res.json()
}

export async function downloadSubscriptions(format: string) {
  const res = await fetch(`/api/subscriptions/download?format=${format}`)
  if (!res.ok) throw new Error('Failed to download subscriptions')
  return res.blob()
}