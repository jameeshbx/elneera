import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Define the activity structure
interface Activity {
  time?: string
  title?: string
  description?: string
  type?: string
  image?: string
}

// Define the daily itinerary item structure
interface DailyItineraryItem {
  day: number
  date?: string
  location?: string
  title?: string
  description?: string
  activities?: Activity[] // This should be an array, not a single object
  richContent?: string
}

// Fix: Make params async for App Router
type RouteParams = {
  params: Promise<{
    id: string
  }>
}

// Define the update request body type
interface UpdateItineraryRequest {
  dailyItinerary?: DailyItineraryItem[]
  richContent?: string
  updatedAt?: string
  pdfUrl?: string
  [key: string]: string | DailyItineraryItem[] | undefined
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params since it's now a Promise
    const { id } = await params
    const body: UpdateItineraryRequest = await request.json()

    console.log("Updating itinerary with ID:", id)
    console.log("Update data:", body)

    // Get the existing itinerary
    const existingItinerary = await prisma.itineraries.findUnique({
      where: { id },
      include: {
        enquiry: true,
      },
    })

    if (!existingItinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    const updateData: {
      updatedAt: string
      dailyItinerary?: string
      richContent?: string
      pdfUrl?: string
      [key: string]: string | undefined
    } = {
      updatedAt: new Date().toISOString(),
    }

    // Handle dailyItinerary updates - properly stringify for database storage
    if (body.dailyItinerary) {
      updateData.dailyItinerary = JSON.stringify(body.dailyItinerary)
    }

    // Handle richContent updates
    if (body.richContent !== undefined) {
      updateData.richContent = body.richContent
    }

    // Handle PDF URL updates
    if (body.pdfUrl !== undefined) {
      updateData.pdfUrl = body.pdfUrl
    }

    // Add any other fields from the body
    Object.keys(body).forEach((key) => {
      if (key !== "dailyItinerary" && key !== "richContent" && key !== "updatedAt" && key !== "pdfUrl") {
        const value = body[key]
        if (value !== undefined) {
          // For complex objects, ensure they're properly serializable
          if (value !== null && typeof value === "object") {
            updateData[key] = JSON.stringify(value)
          } else {
            updateData[key] = value as string
          }
        }
      }
    })

    console.log("Final update data:", updateData)

    // Update the itinerary in the database
    const updatedItinerary = await prisma.itineraries.update({
      where: { id },
      data: updateData,
      include: {
        enquiry: true,
      },
    })

    if (!updatedItinerary) {
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to update itinerary in database",
          message: "The itinerary could not be updated"
        },
        { status: 500 }
      )
    }

    let responseData;
    try {
      // Safely parse dailyItinerary if it exists and is a string
      const parseDailyItinerary = (data: string) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try {
            return data.trim() ? JSON.parse(data) : [];
          } catch (e) {
            console.error('Error parsing dailyItinerary string:', e);
            return [];
          }
        }
        return [];
      };

      responseData = {
        success: true,
        ...updatedItinerary,
        dailyItinerary: parseDailyItinerary(updatedItinerary.dailyItinerary as string),
      };
    } catch (parseError) {
      console.error("Error parsing dailyItinerary:", parseError);
      responseData = {
        success: true,
        ...updatedItinerary,
        dailyItinerary: [],
        _warning: "There was an error parsing the daily itinerary data"
      }
    }

    console.log("Successfully updated itinerary:", updatedItinerary.id)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating itinerary:", error)
    
    const errorResponse = {
      success: false,
      error: "Failed to update itinerary",
      message: "An error occurred while updating the itinerary",
      details: error instanceof Error ? error.message : String(error)
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Add GET handler to fetch a single itinerary
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params since it's now a Promise
    const { id } = await params

    const itinerary = await prisma.itineraries.findUnique({
      where: { id },
      include: {
        enquiry: true,
      },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Safely parse dailyItinerary with error handling
    let dailyItinerary = [];
    if (itinerary.dailyItinerary) {
      try {
        // If it's already an array, use it directly
        if (Array.isArray(itinerary.dailyItinerary)) {
          dailyItinerary = itinerary.dailyItinerary;
        } 
        // If it's a string, try to parse it
        else if (typeof itinerary.dailyItinerary === 'string') {
          // Handle empty or invalid JSON strings
          const trimmed = itinerary.dailyItinerary.trim();
          if (trimmed) {
            dailyItinerary = JSON.parse(trimmed);
            // Ensure it's an array after parsing
            if (!Array.isArray(dailyItinerary)) {
              console.warn('dailyItinerary is not an array after parsing, defaulting to empty array');
              dailyItinerary = [];
            }
          }
        }
      } catch (error) {
        console.error('Error parsing dailyItinerary:', error);
        // In case of any error, default to empty array
        dailyItinerary = [];
      }
    }

    const responseData = {
      ...itinerary,
      dailyItinerary,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching itinerary:", error)
    return NextResponse.json({ error: "Failed to fetch itinerary" }, { status: 500 })
  }
}

// Add DELETE handler
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params since it's now a Promise
    const { id } = await params

    // First, check if the itinerary exists
    const existingItinerary = await prisma.itineraries.findUnique({
      where: { id },
    })

    if (!existingItinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Delete the itinerary
    await prisma.itineraries.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting itinerary:", error)
    return NextResponse.json({ error: "Failed to delete itinerary" }, { status: 500 })
  }
}
