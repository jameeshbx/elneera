// Customer Payment Types
export interface CustomerPaymentData {
  customerName: string;
  itineraryReference: string;
  totalCost: string;
  amountPaid: string;
  paymentDate: string;
  remainingBalance: string;
  paymentStatus: string;
  shareMethod: 'whatsapp' | 'email';
  paymentLink: string;
}

// DMC Payment Types

export interface DMCPaymentData {
  id: string;
  dmcName: string;
  itineraryReference: string;
  paymentMode: 'Offline' | 'Online';
  totalCost: string;
  amountPaid: string;
  paymentDate: string;
  remainingBalance: string;
  paymentStatus: string;
  paymentChannel: string;
  transactionId: string;
  selectedBank: string;
  paymentGateway: string;
  currency: string;
}

// Shared Types

// Common types used across the application

export interface Reminder {
  id: number
  type: string
  message: string
  time: string
  date: string
  status: "SENT" | "RECENT" | "PENDING" | "FAILED"
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "agency" | "staff"
}

export interface Enquiry {
  id: string
  name: string
  phone: string
  email: string
  locations: string
  tourType: string
  estimatedDates: string
  currency: string
  budget: number
  notes: string
  assignedStaff: string
  pointOfContact: string
  tags: string
  status: string
  enquiryDate: string
  createdAt?: string
  updatedAt?: string
}

export interface FlightEnquiry {
  id: string
  name: string
  phone: string
  email: string
  departureCity: string
  returnCity: string
  departureDate: string
  returnDate: string
  preferredAirlineClass: string
  numberOfTravellers: string
  numberOfKids: string
  assignedStaff: string
  pointOfContact: string
  notes: string
  status: string
  enquiryDate: string
  createdAt?: string
  updatedAt?: string
}

export interface Itinerary {
  activeStatus: boolean;
  enquiryId: string;
  customerId: string;
  id: string
  destinations: string
  startDate: string
  endDate: string
  duration?: string
  createdAt: string
  status: string
  enquiry?: Enquiry
  selectedDMCs?: Array<{
    status: string;
    dmc?: {
      name: string;
    };
    dmcName?: string;
  }>;
}

