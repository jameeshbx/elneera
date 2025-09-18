import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { itineraryId, activeStatus, enquiryId, customerId } = body

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    // If setting this itinerary as active, deactivate all others for the same customer/enquiry
    if (activeStatus === true) {
      // First, deactivate all other itineraries for this customer/enquiry
      if (enquiryId) {
        await prisma.itineraries.updateMany({
          where: {
            enquiryId: enquiryId,
            id: { not: itineraryId },
          },
          data: { activeStatus: false },
        })
      } else if (customerId) {
        await prisma.itineraries.updateMany({
          where: {
            customerId: customerId,
            id: { not: itineraryId },
          },
          data: { activeStatus: false },
        })
      }
    }

    // Update the target itinerary
    const updatedItinerary = await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        activeStatus: activeStatus,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        activeStatus: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Itinerary status updated successfully",
      itinerary: updatedItinerary,
    })
  } catch (error) {
    console.error("Error updating itinerary status:", error)
    return NextResponse.json(
      {
        error: "Failed to update itinerary status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
