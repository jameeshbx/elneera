import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Itinerary {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  pdfUrl: string | null;
  activeStatus: boolean | null;
  status: string;
  enquiry?: {
    name: string;
    locations: string | null;
  };
  destinations: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  currency: string | null;
  enquiryId: string;
  customerId: string | null;
}

interface CustomerFeedback {
  id: string;
  customerId: string | null;
  itineraryId: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  documentUrl: string | null;
  documentName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SentItinerary {
  id: string;
  customerId: string | null;
  enquiryId: string | null;
  customerName: string;
  email: string;
  whatsappNumber: string | null;
  notes: string | null;
  status: string;
  sentDate: Date;
  itineraryId: string | null;
  pdfUrl: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

type PrismaFilter = {
  itineraryId?: string;
  customerId?: string;
  enquiryId?: string;
};

type ItineraryFilter = {
  id?: string;
  enquiryId?: string;
  customerId?: string;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const enquiryId = searchParams.get("enquiryId")
    const customerId = searchParams.get("customerId")
    const itineraryId = searchParams.get("itineraryId")

    console.log("API Parameters:", { enquiryId, customerId, itineraryId })

    // Handle both enquiryId and customerId parameters
    let customerData: CustomerData | null = null
    let finalCustomerId: string | null = null

    if (enquiryId) {
      // Fetch enquiry first to get customer info
      const enquiry = await prisma.enquiries.findUnique({
        where: { id: enquiryId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          locations: true,
          tourType: true,
          estimatedDates: true,
          currency: true,
          budget: true,
          enquiryDate: true,
          assignedStaff: true,
          pointOfContact: true,
          notes: true,
          tags: true,
          mustSeeSpots: true,
          flightsRequired: true,
          numberOfTravellers: true,
          numberOfKids: true,
          travelingWithPets: true,
          pickupLocation: true,
          dropLocation: true,
          
        },
      })

      if (!enquiry) {
        return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
      }

      // Create customer object from enquiry data
      customerData = {
        id: enquiry.id, // Use enquiry ID as customer ID for this workflow
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        whatsappNumber: enquiry.phone, // Use phone as whatsapp for enquiry-based flow
     
        createdAt: new Date(enquiry.enquiryDate),
        updatedAt: new Date(),
      }
      finalCustomerId = enquiry.id
    } else if (customerId) {
      // Fetch user with CUSTOMER role
      const customer = await prisma.user.findUnique({
        where: { 
          id: customerId,
          role: 'CUSTOMER' // Ensure we only fetch users with CUSTOMER role
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!customer) {
        return NextResponse.json({ error: "Customer not found or user is not a customer" }, { status: 404 })
      }

      // Map user data to customer format
      customerData = {
        id: customer.id,
        name: customer.name || 'Unnamed Customer',
        email: customer.email,
        phone: customer.phone || 'N/A',
        whatsappNumber: customer.phone || 'N/A', // Using phone as whatsapp number
        companyName: customer.companyName || undefined,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
      finalCustomerId = customerId
    } else {
      return NextResponse.json({ error: "Either enquiryId or customerId is required" }, { status: 400 })
    }

    // Fetch itineraries based on the available IDs
    let itineraryFilter: ItineraryFilter = {}
    if (itineraryId) {
      // Only filter by specific itinerary ID if explicitly requested
      itineraryFilter = { id: itineraryId }
    } else if (enquiryId) {
      // Get ALL itineraries for this enquiry
      itineraryFilter = { enquiryId: enquiryId }
    } else if (customerId) {
      // Get itineraries for this customer
      itineraryFilter = { customerId: customerId }
    }

    console.log("Itinerary Filter:", itineraryFilter)

    const itineraries = await prisma.itineraries.findMany({
      where: itineraryFilter,
      select: {
        id: true,
        createdAt: true,
        pdfUrl: true,
        activeStatus: true,
        status: true,
        destinations: true,
        startDate: true,
        endDate: true,
        budget: true,
        currency: true,
        enquiryId: true,
        customerId: true,
        updatedAt: true,
        enquiry: {
          select: {
            name: true,
            locations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log("Found itineraries:", itineraries.length)

    // Transform itineraries to match frontend interface - show ALL existing data
    const transformedItineraries = itineraries.map((itinerary: Itinerary) => ({
      id: itinerary.id,
      dateGenerated: new Date(itinerary.createdAt).toLocaleDateString("en-GB").replace(/\//g, " . "),
      pdf: itinerary.pdfUrl ? "Available" : "Not Generated",
      pdfStatus: itinerary.pdfUrl ? "available" : "missing",
      activeStatus: itinerary.activeStatus ?? false,
      itinerary: "View Details",
      status: itinerary.status || "draft",
      customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
      destinations: (itinerary.destinations || itinerary.enquiry?.locations || "Not specified").split(',').map(d => d.trim()),
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      budget: itinerary.budget,
      currency: itinerary.currency,
      pdfUrl: itinerary.pdfUrl,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
    }))

    // Fetch customer feedbacks - get ALL feedbacks
    let feedbackFilter: PrismaFilter = {}
    if (itineraryId) {
      feedbackFilter = { itineraryId: itineraryId }
    } else if (enquiryId) {
      feedbackFilter = { customerId: enquiryId }
    } else if (customerId) {
      feedbackFilter = { customerId: customerId }
    }

    const feedbacks = await prisma.customer_feedbacks.findMany({
      where: feedbackFilter,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        status: true,
        documentUrl: true,
        documentName: true,
        createdAt: true,
        updatedAt: true,
        customerId: true,
        itineraryId: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform feedbacks to match frontend interface
    const transformedFeedbacks = feedbacks.map((feedback: CustomerFeedback) => ({
      id: feedback.id,
      customerId: feedback.customerId || finalCustomerId,
      itineraryId: feedback.itineraryId,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      status: feedback.status,
      documentUrl: feedback.documentUrl,
      documentName: feedback.documentName,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    }));

    // Fetch ALL sent itineraries history
    let sentItineraryFilter: PrismaFilter = {}
    if (itineraryId) {
      sentItineraryFilter = { itineraryId: itineraryId }
    } else if (enquiryId) {
      sentItineraryFilter = { enquiryId: enquiryId }
    } else if (customerId) {
      sentItineraryFilter = { customerId: customerId }
    }

    const sentItineraries = await prisma.sent_itineraries.findMany({
      where: sentItineraryFilter,
      select: {
        id: true,
        customerName: true,
        email: true,
        whatsappNumber: true,
        notes: true,
        status: true,
        sentDate: true,
        createdAt: true,
        customerId: true,
        enquiryId: true,
        itineraryId: true,
        pdfUrl: true,
        isEdited: true,
      },
      orderBy: { sentDate: "desc" },
    })

    // Transform sent itineraries to match frontend interface
    const transformedSentItineraries = sentItineraries.map((sent: SentItinerary) => ({
      id: sent.id,
      date: new Date(sent.sentDate).toLocaleDateString("en-GB").replace(/\//g, " . "),
      customerId: sent.customerId || finalCustomerId,
      customerName: sent.customerName,
      email: sent.email,
      whatsappNumber: sent.whatsappNumber,
      notes: sent.notes,
      status: sent.status,
      pdfUrl: sent.pdfUrl,
      isEdited: sent.isEdited,
      createdAt: sent.createdAt,
      updatedAt: sent.updatedAt,
    }));

    console.log("Response Summary:", {
      customer: customerData?.name,
      itinerariesCount: transformedItineraries.length,
      feedbacksCount: transformedFeedbacks.length,
      sentItinerariesCount: transformedSentItineraries.length,
    })

    return NextResponse.json({
      success: true,
      customer: customerData,
      itineraries: transformedItineraries,
      feedbacks: transformedFeedbacks,
      sentItineraries: transformedSentItineraries,
    })
  } catch (error) {
    console.error("Error fetching customer share dashboard data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch customer data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, enquiryId, itineraryId, type, title, useEditedPdf = false } = body

    if ((!customerId && !enquiryId) || !type || !title) {
      return NextResponse.json({ error: "Customer ID or Enquiry ID, type, and title are required" }, { status: 400 })
    }

    // For enquiry-based flow, use enquiryId as customerId
    const finalCustomerId = customerId || enquiryId

    // Get the itinerary to check for PDF
    let pdfUrl: string | null = null;
    const isEdited = false;
    
    if (itineraryId) {
      const itinerary = await prisma.itineraries.findUnique({
        where: { id: itineraryId },
        select: {
          pdfUrl: true,
        },
      });

      if (itinerary) {
        pdfUrl = itinerary.pdfUrl;
        // Set isEdited based on your business logic if needed
        // For example: isEdited = itinerary.isEdited || false;
      }
    }

    // Create a new sent itinerary record
    const sentItinerary = await prisma.sent_itineraries.create({
      data: {
        customerId: finalCustomerId,
        enquiryId: enquiryId || null,
        itineraryId: itineraryId || null,
        customerName: body.customerName || 'Unknown Customer',
        email: body.email,
        whatsappNumber: body.whatsappNumber || null,
        notes: body.notes || null,
        status: 'sent',
        sentDate: new Date(),
        pdfUrl: pdfUrl || null,
        isEdited: isEdited || false,
        emailSent: type === 'email',
        whatsappSent: type === 'whatsapp',
      },
    });

    // Here you would typically send the email/WhatsApp with the PDF
    // For now, we'll just log which PDF was used
    console.log(`Sending ${useEditedPdf ? 'edited' : 'original'} PDF:`, pdfUrl);

    return NextResponse.json({
      success: true,
      message: "Itinerary sent successfully",
      sentItinerary: {
        id: sentItinerary.id,
        customerId: sentItinerary.customerId,
        enquiryId: sentItinerary.enquiryId,
        itineraryId: sentItinerary.itineraryId,
        customerName: sentItinerary.customerName,
        email: sentItinerary.email,
        whatsappNumber: sentItinerary.whatsappNumber,
        notes: sentItinerary.notes,
        status: sentItinerary.status,
        sentDate: sentItinerary.sentDate?.toISOString(),
        emailSent: sentItinerary.emailSent,
        whatsappSent: sentItinerary.whatsappSent,
        pdfUrl: sentItinerary.pdfUrl,
        isEditedVersion: sentItinerary.isEdited,
        createdAt: sentItinerary.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error sending itinerary:", error)
    return NextResponse.json(
      {
        error: "Failed to send itinerary",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { feedbackId, status, title, description } = body

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 })
    }

    // Update feedback
    const updatedFeedback = await prisma.customer_feedbacks.update({
      where: { id: feedbackId },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Feedback updated successfully",
      feedback: {
        id: updatedFeedback.id,
        customerId: updatedFeedback.customerId,
        itineraryId: updatedFeedback.itineraryId,
        type: updatedFeedback.type,
        title: updatedFeedback.title,
        description: updatedFeedback.description,
        status: updatedFeedback.status,
        time: formatDateTime(updatedFeedback.updatedAt),
        customerName: "Customer", // We don't have customer relation in update
        documentUrl: updatedFeedback.documentUrl,
        documentName: updatedFeedback.documentName,
        createdAt: updatedFeedback.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating customer feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to update feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const feedbackId = searchParams.get("feedbackId")

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 })
    }

    await prisma.customer_feedbacks.delete({
      where: { id: feedbackId },
    })

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting customer feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to delete feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to format date and time
function formatDateTime(date: Date): string {
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return (
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) + ", Today"
    )
  } else if (diffInHours < 48) {
    return (
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) + ", Yesterday"
    )
  } else {
    return (
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      ", " +
      date.toLocaleDateString()
    )
  }
}