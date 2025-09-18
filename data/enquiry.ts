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
  pickupLocation: string
  dropLocation: string
  numberOfTravellers: string
  numberOfKids: string
  travelingWithPets: string
  flightsRequired: string
  leadSource: string
  tags: string
  mustSeeSpots: string
  status:
    | "enquiry"
    | "itinerary_creation"
    | "customer_feedback"
    | "itinerary_confirmed"
    | "dmc_quotation"
    | "price_finalization"
    | "booking_request"
    | "booking_progress"
    | "payment_forex"
    | "trip_in_progress"
    | "completed"
  enquiryDate: string
}

export interface Column {
  id: string
  title: string
  icon: string
  enquiries: Enquiry[]
}

export const initialColumns: Column[] = [
  {
    id: "enquiry",
    title: "Enquiry",
    icon: "/Vectors1.png",
    enquiries: [],
  },
  {
    id: "itinerary_creation",
    title: "Itinerary Creation",
    icon: "/Vectors2.png",
    enquiries: [],
  },
  {
    id: "customer_feedback",
    title: "Customer Feedback",
    icon: "/Vectors3.png",
    enquiries: [],
  },
  {
    id: "itinerary_confirmed",
    title: "Itinerary Confirmed",
    icon: "/Vectors4.png",
    enquiries: [],
  },
  {
    id: "dmc_quotation",
    title: "DMC Quotation",
    icon: "/Vectors5.png",
    enquiries: [],
  },
  {
    id: "price_finalization",
    title: "Price Finalization",
    icon: "/Vectors1.png",
    enquiries: [],
  },
  {
    id: "booking_request",
    title: "Booking Request",
    icon: "/Vectors2.png",
    enquiries: [],
  },
  {
    id: "booking_progress",
    title: "Booking Progress",
    icon: "/Vectors3.png",
    enquiries: [],
  },
  {
    id: "payment_forex",
    title: "Payment & Forex",
    icon: "/Vectors1.png?height=32&width=32",
    enquiries: [],
  },
  {
    id: "trip_in_progress",
    title: "Trip in Progress",
    icon: "/Vectors1.png?height=32&width=32",
    enquiries: [],
  },
  {
    id: "completed",
    title: "Completed",
    icon: "/Vectors1.png?height=32&width=32",
    enquiries: [],
  },
]
