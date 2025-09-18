import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type FeedbackRecord = {
  id: string
  customerId: string
  itineraryId: string | null
  type: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  status: string
  documentUrl: string | null
  documentName: string | null
}


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customerId")
    const enquiryId = searchParams.get("enquiryId")
    const itineraryId = searchParams.get("itineraryId")

    if (!customerId && !enquiryId) {
      return NextResponse.json({ error: "Customer ID or Enquiry ID is required" }, { status: 400 })
    }

    // Build filter based on available parameters
    let filter = {}
    if (itineraryId) {
      filter = { itineraryId: itineraryId }
    } else if (enquiryId) {
      filter = { customerId: enquiryId } // For enquiry-based flow
    } else if (customerId) {
      filter = { customerId: customerId }
    }

    const feedbacks = await prisma.customer_feedbacks.findMany({
      where: filter,
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
   const transformedFeedbacks = feedbacks.map((feedback: FeedbackRecord) => ({
  id: feedback.id,
  customerId: feedback.customerId,
  itineraryId: feedback.itineraryId,
  type: feedback.type,
  title: feedback.title,
  description: feedback.description || "",
  time: formatDateTime(feedback.createdAt),
  status: feedback.status,
  documentUrl: feedback.documentUrl,
  documentName: feedback.documentName,
  createdAt: feedback.createdAt.toISOString(),
}))


    return NextResponse.json({
      success: true,
      feedbacks: transformedFeedbacks,
    })
  } catch (error) {
    console.error("Error fetching customer feedbacks:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch feedbacks",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, enquiryId, itineraryId, type, title, description } = body

    if ((!customerId && !enquiryId) || !type || !title) {
      return NextResponse.json({ error: "Customer ID or Enquiry ID, type, and title are required" }, { status: 400 })
    }

    // For enquiry-based flow, use enquiryId as customerId
    const finalCustomerId = customerId || enquiryId

    // Create new customer feedback
    const feedback = await prisma.customer_feedbacks.create({
      data: {
        customerId: finalCustomerId,
        itineraryId: itineraryId || null,
        type,
        title,
        description: description || "",
        status: "pending",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Feedback added successfully",
      feedback: {
        id: feedback.id,
        customerId: feedback.customerId,
        itineraryId: feedback.itineraryId,
        type: feedback.type,
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        time: formatDateTime(feedback.createdAt),
        documentUrl: feedback.documentUrl,
        documentName: feedback.documentName,
        createdAt: feedback.createdAt.toISOString(),
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