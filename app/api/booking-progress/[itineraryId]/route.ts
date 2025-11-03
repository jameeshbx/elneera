import { type NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import { type Prisma, BookingStatus } from "@prisma/client"


// Helper function to safely get params
async function getParams<T extends object>(params: Promise<T>): Promise<T> {
  return await params
}

// Use shared Prisma client from lib/prisma to avoid multiple engine instances during dev HMR

// Import specific types we need
import type { BookingProgress } from "@prisma/client"

// Type guard to check if a string is a valid BookingStatus
function isBookingStatus(status: string): status is BookingStatus {
  return Object.values(BookingStatus).includes(status as BookingStatus)
}

// Helper function to safely parse booking status
function parseBookingStatus(status: unknown): BookingStatus {
  if (typeof status === "string" && isBookingStatus(status)) {
    return status
  }
  return "PENDING" // Default status
}

// Get booking progress by itineraryId or enquiryId
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get("enquiryId")
    const { itineraryId } = await getParams(context.params)

    console.log("GET /api/booking-progress called with:", { itineraryId, enquiryId })

    if (!itineraryId && !enquiryId) {
      return NextResponse.json(
        { success: false, error: "Either itineraryId or enquiryId is required" },
        { status: 400 },
      )
    }

    try {
      // Build the where clause based on available parameters
      const whereClause: Prisma.BookingProgressWhereInput = {
        OR: [],
      }

      if (enquiryId) {
        ;(whereClause.OR as Array<Prisma.BookingProgressWhereInput>).push({ enquiryId })
      }
      if (itineraryId) {
        ;(whereClause.OR as Array<Prisma.BookingProgressWhereInput>).push({ itineraryId })
      }

      if (enquiryId) {
        whereClause.enquiryId = enquiryId
      } else if (itineraryId) {
        whereClause.itineraryId = itineraryId
      }

      console.log("Querying database with where clause:", JSON.stringify(whereClause))

      // Fetch data from the database
      const data = await prisma.bookingProgress.findMany({
        where: whereClause,
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      })

      console.log(`Found ${data.length} booking progress items`)

      // Format the data for the response
      // Define the type for the booking progress item
      type BookingProgressItem = BookingProgress & {
        date: Date | null
        service: string | null
        status: string | null
        dmcNotes: string | null
        enquiryId: string | null
        itineraryId: string | null
      }

      const formattedData = data
        .map((item: BookingProgressItem) => {
          try {
            const formattedItem = {
              id: item.id,
              date: item.date ? new Date(item.date).toISOString().split("T")[0] : null,
              service: String(item.service || "Unnamed Service").trim(),
              status: item.status || "PENDING",
              dmcNotes: item.dmcNotes || null,
              enquiryId: item.enquiryId || null,
              itineraryId: item.itineraryId || null,
              createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
            }

            console.log("Formatted item:", formattedItem)
            return formattedItem
          } catch (mapError) {
            console.error("Error formatting item:", mapError, "Item:", item)
            return null
          }
        })
        .filter(Boolean) // Remove any null entries from mapping errors

      console.log(`Successfully formatted ${formattedData.length} items`)

      // Return the successful response
      return NextResponse.json({
        success: true,
        data: formattedData,
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database operation failed"
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in GET /api/booking-progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch booking progress",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Create new booking progress
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itineraryId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const enquiryId = searchParams.get("enquiryId")
  const { itineraryId } = await context.params

  try {
    const body = await request.json()
    const { date, service, status, dmcNotes } = body

    console.log("Received booking progress data:", { date, service, status, dmcNotes })

    // Validate required fields
    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    if (!service) {
      return NextResponse.json({ success: false, error: "Service is required" }, { status: 400 })
    }

    // Parse and validate the status
    const statusValue = parseBookingStatus(status || "PENDING")

    // Prepare the data with exactly what's in the schema
    const data: Prisma.BookingProgressCreateInput = {
      date: new Date(date),
      service: String(service),
      status: statusValue,
      ...(itineraryId && { itineraryId }),
      ...(enquiryId && { enquiryId }),
      ...(dmcNotes && { dmcNotes: String(dmcNotes) }),
    }

    console.log("Creating booking progress with data:", data)

    const progress = await prisma.bookingProgress.create({
      data,
      select: {
        id: true,
        date: true,
        service: true,
        status: true,
        dmcNotes: true,
        enquiryId: true,
        itineraryId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log("Successfully created booking progress:", progress)

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        date: progress.date.toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error creating booking progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking progress",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Update existing booking progress
export async function PUT(
  request: NextRequest) {
  try {
    const body = await request.json()
    const { id, date, service, status, dmcNotes } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking progress ID is required" },
        { status: 400 }
      )
    }

    console.log(`Updating booking progress ${id} with data:`, { date, service, status, dmcNotes })

    // Prepare update data with only the fields that are provided
    const updateData: Prisma.BookingProgressUpdateInput = {}

    if (date !== undefined) updateData.date = new Date(date)
    if (service !== undefined) updateData.service = String(service)
    if (status !== undefined) updateData.status = parseBookingStatus(status)
    if (dmcNotes !== undefined) {
      updateData.dmcNotes = dmcNotes ? String(dmcNotes) : null
    }

    console.log("Update data prepared:", updateData)

    const progress = await prisma.bookingProgress.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        date: true,
        service: true,
        status: true,
        dmcNotes: true,
        enquiryId: true,
        itineraryId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log("Successfully updated booking progress:", progress)

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        date: progress.date.toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error updating booking progress:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update booking progress",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
