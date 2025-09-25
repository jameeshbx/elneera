import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getSignedFileUrl } from "@/lib/s3-utils"

const prisma = new PrismaClient()

interface CustomerData {
  id: string
  name: string
  email: string
  phone: string
  whatsappNumber: string
  companyName?: string
  createdAt: Date
  updatedAt: Date
}

interface CustomerFeedback {
  id: string
  customerId: string | null
  itineraryId: string | null
  type: string
  title: string
  description: string | null
  status: string
  documentUrl: string | null
  documentName: string | null
  createdAt: Date
  updatedAt: Date
}

type PrismaFilter = {
  itineraryId?: string
  customerId?: string
  enquiryId?: string
}

type ItineraryFilter = {
  id?: string
  enquiryId?: string
  customerId?: string
}

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
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        whatsappNumber: enquiry.phone,
        createdAt: new Date(enquiry.enquiryDate),
        updatedAt: new Date(),
      }
      finalCustomerId = enquiry.id
    } else if (customerId) {
      // Fetch user with CUSTOMER role
      const customer = await prisma.user.findUnique({
        where: {
          id: customerId,
          role: "CUSTOMER",
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

      customerData = {
        id: customer.id,
        name: customer.name || "Unnamed Customer",
        email: customer.email,
        phone: customer.phone || "N/A",
        whatsappNumber: customer.phone || "N/A",
        companyName: customer.companyName || undefined,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
      finalCustomerId = customerId
    } else {
      return NextResponse.json({ error: "Either enquiryId or customerId is required" }, { status: 400 })
    }

    // Fetch itineraries with enhanced PDF version handling
    let itineraryFilter: ItineraryFilter = {}
    if (itineraryId) {
      itineraryFilter = { id: itineraryId }
    } else if (enquiryId) {
      itineraryFilter = { enquiryId: enquiryId }
    } else if (customerId) {
      itineraryFilter = { customerId: customerId }
    }

    console.log("Itinerary Filter:", itineraryFilter)

    const itineraries = await prisma.itineraries.findMany({
      where: itineraryFilter,
      select: {
        id: true,
        createdAt: true,
        pdfUrl: true,
        editedPdfUrl: true,
        isEdited: true,
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
        editedAt: true,
        lastPdfRegeneratedAt: true,
        activePdfVersion: true,
        enquiry: {
          select: {
            name: true,
            locations: true,
          },
        },
        pdfVersions: {
          select: {
            id: true,
            url: true,
            version: true,
            isActive: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: {
            version: "desc",
          },
        },
      },
      orderBy: [{ lastPdfRegeneratedAt: "desc" }, { editedAt: "desc" }, { createdAt: "desc" }],
    })

    console.log("Found itineraries:", itineraries.length)



// Add a type guard function
function getPdfUrl(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'url' in value && typeof (value as { url: unknown }).url === 'string') {
    return (value as { url: string }).url;
  }
  return null;
}

    // Transform itineraries to create separate rows for each PDF version
    const transformedItineraries = await Promise.all(
      itineraries.map(async (itinerary) => {
        const processedVersions = []

        // Process PDF versions from pdfVersions table
        if (itinerary.pdfVersions && itinerary.pdfVersions.length > 0) {
          for (const version of itinerary.pdfVersions) {
            let signedUrl = version.url

            // Generate signed URL for S3 URLs
            if (version.url && typeof version.url === "string" && version.url.includes("amazonaws.com")) {
              try {
                const url = new URL(version.url)
                const key = url.pathname.substring(1)
                signedUrl = await getSignedFileUrl(key, 3600)
              } catch (error) {
                console.error("Error generating signed URL for version:", error)
              }
            }

            const metadata = (version.metadata as Record<string, unknown>) || {}
            const isEdited = metadata.isEdited || false

            processedVersions.push({
              id: `${itinerary.id}-v${version.version}`,
              originalId: itinerary.id,
              dateGenerated: new Date(version.createdAt).toLocaleDateString("en-GB").replace(/\//g, " . "),
              pdf: "Available",
              pdfStatus: "available",
              activeStatus: version.isActive,
              itinerary: "View Details",
              status: itinerary.status || "draft",
              customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
              destinations: (itinerary.destinations || itinerary.enquiry?.locations || "Not specified")
                .split(",")
                .map((d) => d.trim()),
              startDate: itinerary.startDate,
              endDate: itinerary.endDate,
              budget: itinerary.budget,
              currency: itinerary.currency,
              isEdited,
              displayVersion: isEdited ? `REGENERATED (V${version.version})` : `GENERATED (V${version.version})`,
              versionNumber: version.version,
              activePdfUrl: signedUrl,
              pdfUrl: signedUrl,
              editedPdfUrl: isEdited ? signedUrl : null,
              pdfVersions: [version],
              createdAt: version.createdAt,
              updatedAt: itinerary.updatedAt,
              editedAt: itinerary.editedAt,
              lastPdfRegeneratedAt: itinerary.lastPdfRegeneratedAt,
              isLatestVersion: version.isActive,
            })
          }
        }

        // Handle legacy PDFs (fallback for older records without pdfVersions)
        if (processedVersions.length === 0) {
          // Check for original PDF
          if (itinerary.pdfUrl) {
            let pdfUrl = itinerary.pdfUrl
            const pdfUrlStr = getPdfUrl(pdfUrl);
            if (pdfUrlStr && typeof pdfUrlStr === "string" && pdfUrlStr.includes("amazonaws.com")) {
              try {
                const url = new URL(pdfUrlStr)
                const key = url.pathname.substring(1)
                pdfUrl = await getSignedFileUrl(key, 3600)
              } catch (error) {
                console.error("Error generating signed URL for original PDF:", error)
                pdfUrl = pdfUrlStr
              }
            }

            processedVersions.push({
              id: `${itinerary.id}-v1`,
              originalId: itinerary.id,
              dateGenerated: new Date(itinerary.createdAt).toLocaleDateString("en-GB").replace(/\//g, " . "),
              pdf: "Available",
              pdfStatus: "available",
              activeStatus: !itinerary.isEdited,
              itinerary: "View Details",
              status: itinerary.status || "draft",
              customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
              destinations: (itinerary.destinations || itinerary.enquiry?.locations || "Not specified")
                .split(",")
                .map((d) => d.trim()),
              startDate: itinerary.startDate,
              endDate: itinerary.endDate,
              budget: itinerary.budget,
              currency: itinerary.currency,
              isEdited: false,
              displayVersion: "GENERATED (V1)",
              versionNumber: 1,
              activePdfUrl: pdfUrl,
              pdfUrl: pdfUrl,
              editedPdfUrl: null,
              pdfVersions: [],
              createdAt: itinerary.createdAt,
              updatedAt: itinerary.updatedAt,
              editedAt: itinerary.editedAt,
              lastPdfRegeneratedAt: itinerary.lastPdfRegeneratedAt,
              isLatestVersion: !itinerary.isEdited,
            })
          }

          // Check for edited PDF
          if (itinerary.editedPdfUrl && itinerary.isEdited) {
            let editedPdfUrl = itinerary.editedPdfUrl
            const editedPdfUrlStr = getPdfUrl(editedPdfUrl);
            if (editedPdfUrlStr && typeof editedPdfUrlStr === "string" && editedPdfUrlStr.includes("amazonaws.com")) {
              try {
                const url = new URL(editedPdfUrlStr)
                const key = url.pathname.substring(1)
                editedPdfUrl = await getSignedFileUrl(key, 3600)
              } catch (error) {
                console.error("Error generating signed URL for edited PDF:", error)
                editedPdfUrl = editedPdfUrlStr
              }
            }

            processedVersions.push({
              id: `${itinerary.id}-v2`,
              originalId: itinerary.id,
              dateGenerated: new Date(itinerary.editedAt || itinerary.updatedAt)
                .toLocaleDateString("en-GB")
                .replace(/\//g, " . "),
              pdf: "Available",
              pdfStatus: "available",
              activeStatus: true,
              itinerary: "View Details",
              status: itinerary.status || "draft",
              customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
              destinations: (itinerary.destinations || itinerary.enquiry?.locations || "Not specified")
                .split(",")
                .map((d) => d.trim()),
              startDate: itinerary.startDate,
              endDate: itinerary.endDate,
              budget: itinerary.budget,
              currency: itinerary.currency,
              isEdited: true,
              displayVersion: "REGENERATED (V2)",
              versionNumber: 2,
              activePdfUrl: editedPdfUrl,
              pdfUrl: null,
              editedPdfUrl: editedPdfUrl,
              pdfVersions: [],
              createdAt: itinerary.createdAt,
              updatedAt: itinerary.updatedAt,
              editedAt: itinerary.editedAt,
              lastPdfRegeneratedAt: itinerary.lastPdfRegeneratedAt,
              isLatestVersion: true,
            })
          }
        }

        // If no PDFs found, create a placeholder entry
        if (processedVersions.length === 0) {
          processedVersions.push({
            id: `${itinerary.id}-no-pdf`,
            originalId: itinerary.id,
            dateGenerated: new Date(itinerary.createdAt).toLocaleDateString("en-GB").replace(/\//g, " . "),
            pdf: "Not Generated",
            pdfStatus: "missing",
            activeStatus: false,
            itinerary: "View Details",
            status: itinerary.status || "draft",
            customerName: itinerary.enquiry?.name || customerData?.name || "Unknown",
            destinations: (itinerary.destinations || itinerary.enquiry?.locations || "Not specified")
              .split(",")
              .map((d) => d.trim()),
            startDate: itinerary.startDate,
            endDate: itinerary.endDate,
            budget: itinerary.budget,
            currency: itinerary.currency,
            isEdited: false,
            displayVersion: "NO PDF",
            versionNumber: 0,
            activePdfUrl: null,
            pdfUrl: null,
            editedPdfUrl: null,
            pdfVersions: [],
            createdAt: itinerary.createdAt,
            updatedAt: itinerary.updatedAt,
            editedAt: itinerary.editedAt,
            lastPdfRegeneratedAt: itinerary.lastPdfRegeneratedAt,
            isLatestVersion: false,
          })
        }

        return processedVersions
      }),
    )

    // Flatten the array and sort by version and date
    const allVersions = transformedItineraries.flat().sort((a, b) => {
      // First sort by version number (latest first)
      if (b.versionNumber !== a.versionNumber) {
        return b.versionNumber - a.versionNumber
      }
      // Then by creation date (latest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log("Processed itineraries:", allVersions.length)

    // Fetch customer feedbacks
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
    }))

    // Fetch sent itineraries
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
        updatedAt: true,
        customerId: true,
        enquiryId: true,
        itineraryId: true,
        pdfUrl: true,
        isEdited: true,
      },
      orderBy: { sentDate: "desc" },
    })

    const transformedSentItineraries = sentItineraries.map((sent) => ({
      id: sent.id,
      date: new Date(sent.sentDate).toLocaleDateString("en-GB").replace(/\//g, " . "),
      customerId: sent.customerId || finalCustomerId,
      customerName: sent.customerName,
      email: sent.email,
      whatsappNumber: sent.whatsappNumber,
      notes: sent.notes,
      status: sent.status,
      pdfUrl: typeof sent.pdfUrl === "string" ? sent.pdfUrl : sent.pdfUrl === null ? null : String(sent.pdfUrl),
      isEdited: sent.isEdited,
      pdfVersion: sent.isEdited ? "V2" : "V1",
      createdAt: sent.createdAt,
      updatedAt: sent.updatedAt,
    }))

    console.log("Response Summary:", {
      customer: customerData?.name,
      itinerariesCount: allVersions.length,
      feedbacksCount: transformedFeedbacks.length,
      sentItinerariesCount: transformedSentItineraries.length,
    })

    return NextResponse.json({
      success: true,
      customer: customerData,
      itineraries: allVersions,
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
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, enquiryId, itineraryId, type, title, description } = body

    if ((!customerId && !enquiryId) || !type || !title) {
      return NextResponse.json({ error: "Customer ID or Enquiry ID, type, and title are required" }, { status: 400 })
    }

    const finalCustomerId = customerId || enquiryId

    const feedback = await prisma.customer_feedbacks.create({
      data: {
        customerId: finalCustomerId,
        enquiryId: enquiryId || null,
        itineraryId: itineraryId || null,
        type: type,
        title: title,
        description: description || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Feedback added successfully",
      feedback: {
        id: feedback.id,
        customerId: feedback.customerId,
        enquiryId: feedback.enquiryId,
        itineraryId: feedback.itineraryId,
        type: feedback.type,
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        documentUrl: feedback.documentUrl,
        documentName: feedback.documentName,
        createdAt: feedback.createdAt.toISOString(),
        updatedAt: feedback.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error adding customer feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to add feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { feedbackId, status, title, description } = body

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 })
    }

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
        customerName: "Customer",
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
  } finally {
    await prisma.$disconnect()
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
  } finally {
    await prisma.$disconnect()
  }
}

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
