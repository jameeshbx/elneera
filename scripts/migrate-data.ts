/* // scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingData() {
  // Example: Migrate from old Enquiry table to new FlightEnquiry table
  const oldFlightEnquiries = await prisma.enquiry.findMany({
    where: { tags: 'flights' }
  })

  for (const enquiry of oldFlightEnquiries) {
    await prisma.flightEnquiry.create({
      data: {
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email,
        departureCity: enquiry.departureCity || '',
        returnCity: enquiry.returnCity || '',
        departureDate: enquiry.departureDate || '',
        returnDate: enquiry.returnDate || '',
        preferredAirlineClass: enquiry.preferredAirlineClass || 'economy',
        numberOfTravellers: enquiry.numberOfTravellers || '',
        numberOfKids: enquiry.numberOfKids || '',
        assignedStaff: enquiry.assignedStaff,
        pointOfContact: enquiry.pointOfContact,
        notes: enquiry.notes,
        leadSource: enquiry.leadSource || 'Direct',
        status: enquiry.status,
        enquiryDate: enquiry.enquiryDate,
      }
    })
  }
  
  console.log(`Migrated ${oldFlightEnquiries.length} flight enquiries`)
}

migrateExistingData()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) */