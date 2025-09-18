export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  whatsappNumber?: string
  createdAt: string
  updatedAt: string
}

export interface Itinerary {
  id: string
  enquiryId: string
  destinations: string
  startDate: string
  endDate: string
  budget: number
  currency: string
  pdfUrl?: string
  activeStatus: boolean
  dateGenerated: string
  pdf?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CustomerFeedback {
  id: string
  customerId: string
  itineraryId?: string
  type: string
  title: string
  description: string
  status: string
  documentUrl?: string
  documentName?: string
  createdAt: string
  updatedAt: string
}

export interface SentItinerary {
  id: string
  customerId: string
  itineraryId: string
  customerName: string
  email: string
  whatsappNumber: string
  notes?: string
  status: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface FormData {
  name: string
  email: string
  whatsappNumber: string
  notes: string
  supportingDocument: File | null
}

export interface NewNote {
  title: string
  description: string
  type: string
  document: File | null
}

export interface CustomerDashboardData {
  customer?: Customer
  itineraries: Itinerary[]
  feedbacks: CustomerFeedback[]
  sentItineraries: SentItinerary[]
}
