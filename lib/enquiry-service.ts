import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export interface FlightEnquiry {
  id?: string
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
  assignedStaff?: string | null
  pointOfContact?: string | null
  notes?: string | null
  status: string
  enquiryDate: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AccommodationEnquiry {
  id: string
  name: string
  phone: string
  email: string
  locations: string[]
  startDate: string
  endDate: string
  adults: number
  children: number
  under5: number
  from6to12: number
  budget: number
  accommodationType: string[]
  hotelPreference: string[]
  assignedStaff: string | null
  pointOfContact: string | null
  notes: string | null
  status: string
  enquiryDate: string
  createdAt?: string
  updatedAt?: string
}

export interface EnquiryFilters {
  search?: string
  status?: string
  assignedStaff?: string
  page?: number
  limit?: number
}

export class EnquiryService {
  // --- Flight Enquiry Methods ---

  // Get all flight enquiries (with optional filters)
  static async getFlightEnquiries(filters: EnquiryFilters = {}): Promise<FlightEnquiry[]> {
    try {
      const { search, status, assignedStaff, limit = 50, page = 1 } = filters
      const skip = (page - 1) * limit

      const enquiries = await prisma.flightEnquiry.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }),
          ...(status && { status }),
          ...(assignedStaff && { assignedStaff }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      })
      return enquiries
    } catch (error) {
      console.error("Error fetching flight enquiries:", error)
      throw new Error("Failed to fetch flight enquiries")
    }
  }

  // Get flight enquiry by ID
  static async getFlightEnquiryById(id: string): Promise<FlightEnquiry | null> {
    try {
      const enquiry = await prisma.flightEnquiry.findUnique({
        where: { id },
      })
      return enquiry
    } catch (error) {
      console.error("Error fetching flight enquiry:", error)
      throw new Error("Failed to fetch flight enquiry")
    }
  }

  // Create new flight enquiry
  static async createFlightEnquiry(
    data: Omit<FlightEnquiry, "id" | "createdAt" | "updatedAt">,
  ): Promise<FlightEnquiry> {
    try {
      const enquiry = await prisma.flightEnquiry.create({
        data: {
          ...data,
          enquiryDate: data.enquiryDate || new Date().toISOString(),
          status: data.status || "enquiry", // Default status
        },
      })
      return enquiry
    } catch (error) {
      console.error("Error creating flight enquiry:", error)
      throw new Error("Failed to create flight enquiry")
    }
  }

  // Update flight enquiry
  static async updateFlightEnquiry(id: string, data: Partial<FlightEnquiry>): Promise<FlightEnquiry> {
    try {
      const enquiry = await prisma.flightEnquiry.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })
      return enquiry
    } catch (error) {
      console.error("Error updating flight enquiry:", error)
      throw new Error("Failed to update flight enquiry")
    }
  }

  // Delete flight enquiry
  static async deleteFlightEnquiry(id: string): Promise<void> {
    try {
      await prisma.flightEnquiry.delete({
        where: { id },
      })
    } catch (error) {
      console.error("Error deleting flight enquiry:", error)
      throw new Error("Failed to delete flight enquiry")
    }
  }

  // --- Accommodation Enquiry Methods ---

  // Get all accommodation enquiries (with optional filters)
  static async getAccommodationEnquiries(filters: EnquiryFilters = {}): Promise<AccommodationEnquiry[]> {
    try {
      const { search, status, assignedStaff, limit = 50, page = 1 } = filters
      const skip = (page - 1) * limit

      const enquiries = await prisma.accommodationEnquiry.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { locations: { has: search } }, // Assuming locations is a string array
            ],
          }),
          ...(status && { status }),
          ...(assignedStaff && { assignedStaff }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      })
      return enquiries as unknown as AccommodationEnquiry[] // Cast to ensure type compatibility
    } catch (error) {
      console.error("Error fetching accommodation enquiries:", error)
      throw new Error("Failed to fetch accommodation enquiries")
    }
  }

  // Get accommodation enquiry by ID
  static async getAccommodationEnquiryById(id: string): Promise<AccommodationEnquiry | null> {
    try {
      const enquiry = await prisma.accommodationEnquiry.findUnique({
        where: { id },
      })
      return enquiry as AccommodationEnquiry | null // Cast to ensure type compatibility
    } catch (error) {
      console.error("Error fetching accommodation enquiry:", error)
      throw new Error("Failed to fetch accommodation enquiry")
    }
  }

  // Create new accommodation enquiry
  static async createAccommodationEnquiry(
    data: Omit<AccommodationEnquiry, "id" | "createdAt" | "updatedAt">,
  ): Promise<AccommodationEnquiry> {
    try {
      const enquiry = await prisma.accommodationEnquiry.create({
        data: {
          ...data,
          enquiryDate: data.enquiryDate || new Date().toISOString(),
          status: data.status || "enquiry", // Default status
        },
      })
      return enquiry as unknown as AccommodationEnquiry // Cast to ensure type compatibility
    } catch (error) {
      console.error("Error creating accommodation enquiry:", error)
      throw new Error("Failed to create accommodation enquiry")
    }
  }

  // Update accommodation enquiry
  static async updateAccommodationEnquiry(
    id: string,
    data: Partial<AccommodationEnquiry>,
  ): Promise<AccommodationEnquiry> {
    try {
      const enquiry = await prisma.accommodationEnquiry.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })
      return enquiry as unknown as AccommodationEnquiry // Cast to ensure type compatibility
    } catch (error) {
      console.error("Error updating accommodation enquiry:", error)
      throw new Error("Failed to update accommodation enquiry")
    }
  }

  // Delete accommodation enquiry
  static async deleteAccommodationEnquiry(id: string): Promise<void> {
    try {
      await prisma.accommodationEnquiry.delete({
        where: { id },
      })
    } catch (error) {
      console.error("Error deleting accommodation enquiry:", error)
      throw new Error("Failed to delete accommodation enquiry")
    }
  }
}

// Utility function for error responses
export function createErrorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "An unknown error occurred"
  return NextResponse.json({ error: message }, { status })
}

// Export individual functions for convenience (optional, but matches original structure)
export const {
  getFlightEnquiries,
  getFlightEnquiryById,
  createFlightEnquiry,
  updateFlightEnquiry,
  deleteFlightEnquiry,
  getAccommodationEnquiries,
  getAccommodationEnquiryById,
  createAccommodationEnquiry,
  updateAccommodationEnquiry,
  deleteAccommodationEnquiry,
} = EnquiryService