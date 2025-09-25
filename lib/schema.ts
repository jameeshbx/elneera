import { pgTable, text, timestamp, boolean, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

// Base interfaces for type safety
export interface BaseItinerary {
  id: string;
  enquiryId: string;
  location: string;
  numberOfDays: string;
  travelStyle: string;
  destinations: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  under6: number;
  from7to12: number;
  flightsRequired: string;
  pickupLocation: string | null;
  dropLocation: string | null;
  currency: string;
  budget: number;
  activityPreferences: string;
  hotelPreferences: string;
  mealPreference: string;
  dietaryPreference: string;
  transportPreferences: string;
  travelingWithPets: string;
  additionalRequests: string | null;
  moreDetails: string | null;
  mustSeeSpots: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  richContent?: string;
}

export interface CsvItineraryData {
  quoteId: string;
  name: string;
  days: number;
  nights: number;
  startDate: string;
  costINR: number;
  costUSD: number;
  guests: number;
  adults: number;
  kids: number;
  dailyItinerary: string[];
  locationMatched?: string;
  description?: string;
}

export interface EnquiryDetails {
  description: string;
  moreDetails?: string;
}

export const itineraries = pgTable('itineraries', {
  id: text('id').primaryKey(),
  enquiryId: text('enquiry_id').notNull(),
  location: text('location'),
  // Add other fields from your Prisma schema
  pdfUrl: text('pdf_url'),
  originalPdfUrl: text('original_pdf_url'),
  editedPdfUrl: text('edited_pdf_url'),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  richContent: text('rich_content'),
  dailyItinerary: jsonb('daily_itinerary'),
  // Add fields that are used in the interface
  numberOfDays: text('number_of_days'),
  travelStyle: text('travel_style'),
  destinations: text('destinations'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  adults: integer('adults'),
  children: integer('children'),
  under6: integer('under6'),
  from7to12: integer('from7to12'),
  flightsRequired: text('flights_required'),
  pickupLocation: text('pickup_location'),
  dropLocation: text('drop_location'),
  currency: text('currency'),
  budget: numeric('budget'),
  activityPreferences: text('activity_preferences'),
  hotelPreferences: text('hotel_preferences'),
  mealPreference: text('meal_preference'),
  dietaryPreference: text('dietary_preference'),
  transportPreferences: text('transport_preferences'),
  travelingWithPets: text('traveling_with_pets'),
  additionalRequests: text('additional_requests'),
  mustSeeSpots: text('must_see_spots'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;

// Add other tables as needed
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  // Add other customer fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// Add types for the enquiry data
export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  locations: string;
  tourType: string;
  estimatedDates: string;
  currency: string;
  budget: number;
  enquiryDate: string;
  assignedStaff: string | null;
  pointOfContact: string | null;
  notes: string | null;
  moreDetails: string;  // Update this line
}

// Add types for the display data
export interface DisplayData extends BaseItinerary {
  days?: number;
  nights?: number;
  kids?: number;
  costINR?: number;
  costUSD?: number;
  name?: string;
  locationMatched?: string;
  enquiry?: Enquiry;
}
