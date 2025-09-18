import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const itinerary = await prisma.itineraries.findUnique({
      where: { id },
      include: {
        enquiry: true, // Include the related enquiry data
      },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    return NextResponse.json(itinerary)
  } catch (error) {
    console.error("Error fetching itinerary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const updatedItinerary = await prisma.itineraries.update({
      where: { id },
      data: {
        destinations: Array.isArray(data.destinations) ? data.destinations.join(", ") : data.destinations,
        startDate: data.startDate,
        endDate: data.endDate,
        travelType: data.travelType,
        adults: data.adults,
        children: data.children,
        under6: data.under6,
        from7to12: data.from7to12,
        flightsRequired: data.flightsRequired,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        currency: data.currency,
        budget: data.budget,
        activityPreferences: Array.isArray(data.activityPreferences)
          ? data.activityPreferences.join(", ")
          : data.activityPreferences,
        hotelPreferences: Array.isArray(data.hotelPreferences)
          ? data.hotelPreferences.join(", ")
          : data.hotelPreferences,
        mealPreference: Array.isArray(data.mealPreference) ? data.mealPreference.join(", ") : data.mealPreference,
        dietaryPreference: Array.isArray(data.dietaryPreference)
          ? data.dietaryPreference.join(", ")
          : data.dietaryPreference,
        transportPreferences: Array.isArray(data.transportPreferences)
          ? data.transportPreferences.join(", ")
          : data.transportPreferences,
        travelingWithPets: data.travelingWithPets,
        additionalRequests: data.additionalRequests,
        moreDetails: data.moreDetails,
        mustSeeSpots: data.mustSeeSpots,
        status: data.status || "draft",
        dailyItinerary: data.dailyItinerary, // Handle as JSON
        accommodation: data.accommodation, // Handle as JSON
      },
      include: {
        enquiry: true,
      },
    })

    return NextResponse.json(updatedItinerary)
  } catch (error) {
    console.error("Error updating itinerary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    await prisma.itineraries.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Itinerary deleted successfully" })
  } catch (error) {
    console.error("Error deleting itinerary:", error)
    return NextResponse.json(
      { error: "Failed to delete itinerary", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
