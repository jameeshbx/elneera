// lib/validation.ts
import { z } from 'zod'

export const flightEnquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  departureCity: z.string().optional(),
  returnCity: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  preferredAirlineClass: z.enum(["economy", "premium-economy", "business", "first"]).default("economy"),
  numberOfTravellers: z.string().optional(),
  numberOfKids: z.string().optional(),
  assignedStaff: z.string().optional(),
  pointOfContact: z.string().optional(),
  notes: z.string().optional(),
  leadSource: z.string().default("Direct"),
})

export const accommodationEnquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  locations: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  adults: z.number().min(1).default(2),
  children: z.number().min(0).default(0),
  under5: z.number().min(0).default(0),
  from6to12: z.number().min(0).default(0),
  budget: z.number().min(0).default(500),
  accommodationType: z.array(z.string()).default([]),
  hotelPreference: z.array(z.string()).default([]),
  assignedStaff: z.string().optional(),
  pointOfContact: z.string().optional(),
  notes: z.string().optional(),
  leadSource: z.string().default("Direct"),
})