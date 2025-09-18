import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: itineraryId } = await params

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    const itinerary = await prisma.itineraries.findUnique({
      where: { id: itineraryId },
      include: {
        enquiry: {
          select: {
            name: true,
            email: true,
            phone: true,
            locations: true,
            tourType: true,
            estimatedDates: true,
            currency: true,
            budget: true,
            numberOfTravellers: true,
            numberOfKids: true,
            flightsRequired: true,
            pickupLocation: true,
            dropLocation: true,
            mustSeeSpots: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            whatsappNumber: true,
          },
        },
      },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Check if PDF already exists
    if (itinerary.pdfUrl) {
      console.log("Existing PDF URL:", itinerary.pdfUrl)
    }

    // Generate PDF content and log it for debugging
    const pdfContent = generateItineraryPDF(itinerary)
    console.log("Generated PDF content:", pdfContent.title)

    // Mock PDF generation
    const mockPdfUrl = `/api/itineraries/${itineraryId}/pdf`

    // Update itinerary with PDF URL
    await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        pdfUrl: mockPdfUrl,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "PDF generated successfully",
      pdfUrl: mockPdfUrl,
      downloadUrl: `/api/itineraries/${itineraryId}/pdf`,
      pdfContent: pdfContent,
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

function generateItineraryPDF(itinerary: {
  id: string
  destinations?: string | null
  startDate?: string | null
  endDate?: string | null
  budget?: number | null
  currency?: string | null
  enquiry?: {
    name: string
    email: string
    phone: string
    locations: string | null
    tourType: string | null
    estimatedDates: string | null
    currency: string | null
    budget: number | null
    numberOfTravellers?: string | null
    numberOfKids?: string | null
    flightsRequired: string | null
    pickupLocation?: string | null
    dropLocation?: string | null
    mustSeeSpots?: string | null
   
  } | null
  customer?: {
    name: string
    email: string
    phone?: string | null
    whatsappNumber?: string | null
  } | null
  accommodation: unknown
  dailyItinerary: unknown
}) {
  const customerName = itinerary.enquiry?.name || itinerary.customer?.name || "Customer"
  const destinations = itinerary.destinations || itinerary.enquiry?.locations || "Various destinations"
  const tourType = itinerary.enquiry?.tourType || "Custom tour"
  const budget = itinerary.budget || itinerary.enquiry?.budget || 0
  const currency = itinerary.currency || itinerary.enquiry?.currency || "USD"

  console.log("Generating PDF for:", {
    itineraryId: itinerary.id,
    customerName,
    destinations,
    tourType,
    budget,
    currency,
    accommodation: itinerary.accommodation,
    dailyItinerary: itinerary.dailyItinerary,
  })

  return {
    title: `Travel Itinerary - ${customerName}`,
    content: {
      customerInfo: {
        name: customerName,
        email: itinerary.enquiry?.email || itinerary.customer?.email,
        phone: itinerary.enquiry?.phone || itinerary.customer?.phone,
      },
      tripDetails: {
        destinations,
        tourType,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        budget: `${currency} ${budget}`,
        travellers: itinerary.enquiry?.numberOfTravellers,
        children: itinerary.enquiry?.numberOfKids,
      },
      itinerary: itinerary.dailyItinerary,
      accommodation: itinerary.accommodation,
    },
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: itineraryId } = await params
    const body = await request.json()
    const { regenerate = false } = body

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    const itinerary = await prisma.itineraries.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Check if PDF exists and regenerate is not requested
    if (itinerary.pdfUrl && !regenerate) {
      return NextResponse.json({
        success: true,
        message: "PDF already exists",
        pdfUrl: itinerary.pdfUrl,
        downloadUrl: itinerary.pdfUrl,
      })
    }

    // Generate new PDF
    const mockPdfUrl = `/api/itineraries/${itineraryId}/pdf?v=${Date.now()}`

    await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        pdfUrl: mockPdfUrl,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "PDF regenerated successfully",
      pdfUrl: mockPdfUrl,
      downloadUrl: mockPdfUrl,
    })
  } catch (error) {
    console.error("Error regenerating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
