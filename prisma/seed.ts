import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Create sample customers
  const customer1 = await prisma.customers.create({
    data: {
      id: "cust_001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567890",
      whatsappNumber: "+1234567890",
    },
  })

  const customer2 = await prisma.customers.create({
    data: {
      id: "cust_002",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1987654321",
      whatsappNumber: "+1987654321",
    },
  })

  console.log("✅ Created sample customers")

  // Create sample enquiries
  const enquiry1 = await prisma.enquiries.create({
    data: {
      id: "enq_001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567890",
      locations: "Paris, Rome, Barcelona",
      tourType: "Cultural",
      estimatedDates: "2024-06-15 to 2024-06-30",
      currency: "USD",
      budget: 5000,
      enquiryDate: "2024-05-01", // Changed to string
      assignedStaff: "Alice Cooper",
      leadSource: "Website",
      tags: "luxury, cultural, couples",
      mustSeeSpots: "Eiffel Tower, Colosseum, Sagrada Familia",
      flightsRequired: "yes",
      notes: "Prefer 4-star hotels, interested in food tours",
      customerId: customer1.id,
    },
  })

  const enquiry2 = await prisma.enquiries.create({
    data: {
      id: "enq_002",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1987654321",
      locations: "Tokyo, Osaka, Kyoto",
      tourType: "Adventure",
      estimatedDates: "2024-07-10 to 2024-07-25",
      currency: "USD",
      budget: 4000,
      enquiryDate: "2024-05-15", // Changed to string
      assignedStaff: "Bob Wilson",
      leadSource: "Referral",
      tags: "adventure, solo, photography",
      mustSeeSpots: "Mount Fuji, Fushimi Inari, Osaka Castle",
     
      flightsRequired: "yes",
      notes: "Photography enthusiast, vegetarian meals",
      customerId: customer2.id,
    },
  })

  console.log("✅ Created sample enquiries")

  // Create sample itineraries
  const itinerary1 = await prisma.itineraries.create({
    data: {
      id: "itin_001",
      enquiryId: enquiry1.id,
      customerId: customer1.id, // Added customerId
      destinations: "Paris, Rome, Barcelona",
      startDate: "2024-06-15",
      endDate: "2024-06-30",
      travelType: "Leisure",
      adults: 2,
      children: 0,
      under6: 0,
      from7to12: 0,
      flightsRequired: "yes",
      pickupLocation: "New York JFK",
      dropLocation: "Barcelona Airport",
      currency: "USD",
      budget: 5000,
      activityPreferences: "Museums, Food tours, Sightseeing",
      hotelPreferences: "4-star, Central location",
      mealPreference: "All meals included",
      dietaryPreference: "No restrictions",
      transportPreferences: "Private transfers, High-speed trains",
      travelingWithPets: "no",
      additionalRequests: "Room with view, Late checkout",
      moreDetails: "Honeymoon trip, prefer romantic experiences",
      mustSeeSpots: "Eiffel Tower, Colosseum, Sagrada Familia",
      
      status: "confirmed",
      dailyItinerary: [
        {
          day: 1,
          date: "2024-06-15",
          city: "Paris",
          activities: ["Arrival at CDG Airport", "Check-in at Hotel", "Evening Seine River Cruise"],
          accommodation: "Hotel Le Meurice",
          meals: ["Welcome Dinner at Eiffel Tower Restaurant"],
        },
        {
          day: 2,
          date: "2024-06-16",
          city: "Paris",
          activities: ["Louvre Museum Tour", "Lunch at Café de Flore", "Evening at Montmartre"],
          accommodation: "Hotel Le Meurice",
          meals: ["Breakfast", "Lunch", "Dinner"],
        },
      ],
      accommodation: [
        {
          city: "Paris",
          hotel: "Hotel Le Meurice",
          checkIn: "2024-06-15",
          checkOut: "2024-06-20",
          roomType: "Deluxe Room with Eiffel Tower View",
          nights: 5,
        },
        {
          city: "Rome",
          hotel: "Hotel de Russie",
          checkIn: "2024-06-20",
          checkOut: "2024-06-25",
          roomType: "Superior Room",
          nights: 5,
        },
      ],
      pdfUrl: "/uploads/itineraries/itinerary-001.pdf",
      activeStatus: true,
    },
  })

  const itinerary2 = await prisma.itineraries.create({
    data: {
      id: "itin_002",
      enquiryId: enquiry2.id,
      customerId: customer2.id, // Added customerId
      destinations: "Tokyo, Osaka, Kyoto",
      startDate: "2024-07-10",
      endDate: "2024-07-25",
      travelType: "Adventure",
      adults: 1,
      children: 0,
      under6: 0,
      from7to12: 0,
      flightsRequired: "yes",
      pickupLocation: "Los Angeles LAX",
      dropLocation: "Tokyo Narita",
      currency: "USD",
      budget: 4000,
      activityPreferences: "Hiking, Photography, Cultural experiences",
      hotelPreferences: "3-star, Traditional style",
      mealPreference: "Breakfast only",
      dietaryPreference: "Vegetarian",
      transportPreferences: "Public transport, JR Pass",
      travelingWithPets: "no",
      additionalRequests: "Photography equipment storage",
      moreDetails: "Solo traveler, interested in traditional culture",
      mustSeeSpots: "Mount Fuji, Fushimi Inari, Osaka Castle",
      
      status: "draft",
      dailyItinerary: [
        {
          day: 1,
          date: "2024-07-10",
          city: "Tokyo",
          activities: ["Arrival at Narita", "Check-in", "Explore Shibuya"],
          accommodation: "Ryokan Traditional Inn",
          meals: ["Welcome Vegetarian Dinner"],
        },
      ],
      accommodation: [
        {
          city: "Tokyo",
          hotel: "Ryokan Traditional Inn",
          checkIn: "2024-07-10",
          checkOut: "2024-07-15",
          roomType: "Traditional Tatami Room",
          nights: 5,
        },
      ],
      pdfUrl: "/uploads/itineraries/itinerary-002.pdf",
      activeStatus: true,
    },
  })

  console.log("✅ Created sample itineraries")

  // Create sample customer feedbacks
  await prisma.customer_feedbacks.create({
    data: {
      customerId: customer1.id,
      itineraryId: itinerary1.id,
      type: "feedback",
      title: "Hotel Upgrade Request",
      description:
        "Would like to upgrade to a suite in Rome for our anniversary. Can you please check availability and pricing?",
      status: "pending",
    },
  })

  await prisma.customer_feedbacks.create({
    data: {
      customerId: customer1.id,
      itineraryId: itinerary1.id,
      type: "note",
      title: "Dietary Requirements Update",
      description: "My partner is allergic to shellfish. Please ensure all restaurants are informed.",
      status: "confirmed",
    },
  })

  await prisma.customer_feedbacks.create({
    data: {
      customerId: customer2.id,
      itineraryId: itinerary2.id,
      type: "change_request",
      title: "Add Mount Fuji Day Trip",
      description:
        "I would like to add a day trip to Mount Fuji with early morning photography session. Can this be arranged?",
      status: "changes",
    },
  })

  console.log("✅ Created sample customer feedbacks")

  // Create sample sent itineraries
  await prisma.sent_itineraries.create({
    data: {
      customerId: customer1.id,
      itineraryId: itinerary1.id,
      customerName: "John Smith",
      email: "john.smith@email.com",
      whatsappNumber: "+1234567890",
      notes: "Final itinerary with confirmed bookings. Please review and let us know if any changes needed.",
      status: "delivered",
      sentDate: new Date("2024-05-20T10:30:00Z"),
    },
  })

  await prisma.sent_itineraries.create({
    data: {
      customerId: customer2.id,
      itineraryId: itinerary2.id,
      customerName: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      whatsappNumber: "+1987654321",
      notes: "Draft itinerary for your review. We can customize any part of this trip.",
      status: "sent",
      sentDate: new Date("2024-05-25T14:15:00Z"),
    },
  })

  console.log("✅ Created sample sent itineraries")

  console.log("🎉 Database seeding completed successfully!")

  // Print sample URLs for testing
  console.log("\n📋 Sample URLs for testing:")
  console.log(`Share Dashboard - Customer 1: /share-customer-dashboard?customerId=${customer1.id}`)
  console.log(`Share Dashboard - Customer 2: /share-customer-dashboard?customerId=${customer2.id}`)
  console.log(
    `Share Dashboard - Specific Itinerary: /share-customer-dashboard?customerId=${customer1.id}&itineraryId=${itinerary1.id}`,
  )
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
