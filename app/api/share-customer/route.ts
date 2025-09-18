import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const enquiryId = searchParams.get("enquiryId")
    const customerId = searchParams.get("customerId")
    const itineraryId = searchParams.get("itineraryId")

    console.log("API Parameters:", { enquiryId, customerId, itineraryId })

    // Handle both enquiryId and customerId parameters
    let customerData = null
    let finalCustomerId = null

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
        createdAt: enquiry.enquiryDate,
        updatedAt: new Date().toISOString(),
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
        whatsappNumber: customer.phone, // Using phone as whatsapp number
        companyName: customer.companyName,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
      finalCustomerId = customerId
    } else {
      return NextResponse.json({ error: "Either enquiryId or customerId is required" }, { status: 400 })
    }

    // Fetch itineraries based on the available IDs
    let itineraryFilter = {}
    if (itineraryId) {
      // Only filter by specific itinerary ID if explicitly requested
      itineraryFilter = { id: itineraryId }
    } else if (enquiryId) {
      // Get ALL itineraries for this enquiry
      itineraryFilter = { enquiryId: enquiryId }
    } else if (customerId) {
      // Get itineraries for this customer - you'll need to adjust this based on your actual schema
      // This is a placeholder - update according to how itineraries are linked to users in your schema
      itineraryFilter = {
        OR: [
          { customerId: customerId },
          { userId: customerId } // If itineraries are linked via userId
        ]
      }
    }

    console.log("Itinerary Filter:", itineraryFilter)

    const itineraries = await prisma.itineraries.findMany({
      where: itineraryFilter,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
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
    const transformedItineraries = itineraries.map((itinerary) => ({
      id: itinerary.id,
      dateGenerated: new Date(itinerary.createdAt).toLocaleDateString("en-GB").replace(/\//g, " . "),
      pdf: itinerary.pdfUrl ? "Available" : "Not Generated", // Clear status
      pdfStatus: itinerary.pdfUrl ? "available" : "missing", // For styling
      activeStatus: itinerary.activeStatus || false,
      itinerary: "View Details", // Changed from "Download"
      status: itinerary.status || "draft",
      customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
      destinations: itinerary.destinations || itinerary.enquiry?.locations || "Not specified",
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      budget: itinerary.budget,
      currency: itinerary.currency,
      pdfUrl: itinerary.pdfUrl,
      createdAt: itinerary.createdAt,
      updatedAt: itinerary.updatedAt,
    }))

    // Fetch customer feedbacks - get ALL feedbacks
    let feedbackFilter = {}
    if (itineraryId) {
      feedbackFilter = { itineraryId: itineraryId }
    } else if (enquiryId) {
      // For enquiry-based flow, get feedbacks by customer ID that matches enquiry ID
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
    const transformedFeedbacks = feedbacks.map((feedback) => ({
      id: feedback.id,
      customerId: feedback.customerId || finalCustomerId,
      itineraryId: feedback.itineraryId,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      time: formatDateTime(feedback.createdAt),
      status: feedback.status,
      customerName: customerData?.name || "Unknown",
      documentUrl: feedback.documentUrl,
      documentName: feedback.documentName,
      createdAt: feedback.createdAt.toISOString(),
    }))

    // Fetch ALL sent itineraries history
    let sentItineraryFilter = {}
    if (itineraryId) {
      sentItineraryFilter = { itineraryId: itineraryId }
    } else if (enquiryId) {
      // Get ALL sent itineraries for this enquiry/customer
      sentItineraryFilter = { customerId: enquiryId }
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
        itineraryId: true,
      },
      orderBy: { sentDate: "desc" },
    })

    // Transform sent itineraries to match frontend interface
    const transformedSentItineraries = sentItineraries.map((sent) => ({
      id: sent.id,
      date: new Date(sent.sentDate).toLocaleDateString("en-GB").replace(/\//g, " . "),
      customerId: sent.customerId || finalCustomerId,
      customerName: sent.customerName,
      email: sent.email,
      whatsappNumber: sent.whatsappNumber || "",
      notes: sent.notes || "",
     
      status: sent.status,
      
      sentDate: sent.sentDate.toISOString(),
      itineraryId: sent.itineraryId,
    }))

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
    const { customerId, enquiryId, itineraryId, type, title,  } = body

    if ((!customerId && !enquiryId) || !type || !title) {
      return NextResponse.json({ error: "Customer ID or Enquiry ID, type, and title are required" }, { status: 400 })
    }

    // For enquiry-based flow, use enquiryId as customerId
    const finalCustomerId = customerId || enquiryId

    // Create a new sent itinerary record
    const sentItinerary = await prisma.sent_itineraries.create({
      data: {
        customerId: finalCustomerId,
        itineraryId: itineraryId || null,
        customerName: body.customerName || "Unknown Customer",
        email: body.email,
        whatsappNumber: body.whatsappNumber || null,
        notes: body.notes || "",
        status: "sent",
        emailSent: type === "email",
        whatsappSent: type === "whatsapp"
      },
    })

    // Get customer name for response

    return NextResponse.json({
      success: true,
      message: "Itinerary sent successfully",
      sentItinerary: {
        id: sentItinerary.id,
        customerId: sentItinerary.customerId,
        itineraryId: sentItinerary.itineraryId,
        customerName: sentItinerary.customerName,
        email: sentItinerary.email,
        whatsappNumber: sentItinerary.whatsappNumber,
        notes: sentItinerary.notes,
        status: sentItinerary.status,
        sentDate: sentItinerary.sentDate.toISOString(),
        emailSent: sentItinerary.emailSent,
        whatsappSent: sentItinerary.whatsappSent,
        createdAt: sentItinerary.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating customer feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to create feedback",
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
