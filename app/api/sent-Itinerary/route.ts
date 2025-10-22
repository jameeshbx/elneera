// app/api/sent-itinerary/route.ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { getFileStream, getSignedFileUrl } from "@/lib/s3-utils"
import { PrismaClient } from "@prisma/client"
import { EmailAttachment } from "@/lib/email"

const prisma = new PrismaClient()

interface SentItineraryWhereClause {
  customerId?: string;
  enquiryId?: string;
  itineraryId?: string;
}

interface ItineraryAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType: string;
  encoding?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerId,
      itineraryId,
      enquiryId,
      customerName,
      email,
      whatsappNumber,
      notes,
      pdfUrl,
      pdfVersion,
      isEditedVersion,
    } = body

    // Debug logging
    console.log("=== Sent Itinerary Request ===")
    console.log("itineraryId received:", itineraryId)
    console.log("itineraryId type:", typeof itineraryId)

    // Clean the itineraryId - remove version suffix if present (e.g., "-v1", "-v2")
    const cleanItineraryId = itineraryId.replace(/-v\d+$/, '');
    console.log("Cleaned itineraryId:", cleanItineraryId)

    // Validate required fields
    if (!customerName || !email || !whatsappNumber) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, email, or whatsappNumber" },
        { status: 400 },
      )
    }

    if (!customerId && !enquiryId) {
      return NextResponse.json({ error: "Either customerId or enquiryId is required" }, { status: 400 })
    }

    if (!itineraryId) {
      return NextResponse.json({ error: "itineraryId is required" }, { status: 400 })
    }

    if (!pdfUrl) {
      return NextResponse.json({ error: "pdfUrl is required" }, { status: 400 })
    }

    // Fetch itinerary details from database with better error handling
    console.log("Fetching itinerary with ID:", cleanItineraryId)
    
    const itinerary = await prisma.itineraries.findUnique({
      where: { id: cleanItineraryId },
      select: {
        id: true,
        destinations: true,
        startDate: true,
        endDate: true,
        numberOfTravellers: true,
        budget: true,
        currency: true,
      }
    })

    console.log("Itinerary found:", itinerary ? "Yes" : "No")
    
    if (!itinerary) {
      // Check if itinerary exists at all
      const allItineraries = await prisma.itineraries.findMany({
        select: { id: true },
        take: 5
      })
      
      console.log("Sample itinerary IDs in database:", allItineraries.map(i => i.id))
      
      return NextResponse.json(
        { 
          error: "Itinerary not found",
          details: `No itinerary found with ID: ${cleanItineraryId}`,
          receivedId: itineraryId,
          cleanedId: cleanItineraryId,
          idType: typeof itineraryId,
          hint: "Check if the itineraryId is correct and exists in the database"
        },
        { status: 404 }
      )
    }

    console.log("Itinerary data:", itinerary)

    try {
      let pdfBuffer: Buffer
      let finalPdfUrl = pdfUrl

      // Handle S3 URLs
      if (pdfUrl.includes("amazonaws.com")) {
        try {
          const url = new URL(pdfUrl)
          const key = url.pathname.substring(1)

          console.log("Fetching PDF from S3 with key:", key)

          finalPdfUrl = await getSignedFileUrl(key, 3600)
          console.log("Generated signed URL")

          pdfBuffer = await getFileStream(key)

          console.log("Successfully retrieved PDF from S3, size:", pdfBuffer.length)
        } catch (s3Error) {
          console.error("Error retrieving PDF from S3:", s3Error)
          return NextResponse.json(
            {
              error: "PDF not found in S3",
              details: "The itinerary PDF could not be found in S3 storage. Please regenerate the PDF.",
              code: "S3_PDF_NOT_FOUND",
            },
            { status: 404 },
          )
        }
      } else {
        return NextResponse.json(
          {
            error: "Invalid PDF URL",
            details: "Only S3 URLs are supported for PDF attachments.",
            code: "INVALID_PDF_URL",
          },
          { status: 400 },
        )
      }

      // Format destinations
      const destinationsText = itinerary.destinations 
        ? (Array.isArray(itinerary.destinations) 
            ? itinerary.destinations.join(', ') 
            : itinerary.destinations)
        : 'Not specified';

      // Format dates
      const formatDate = (date: Date | string | null) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      const startDateFormatted = formatDate(itinerary.startDate);
      const endDateFormatted = formatDate(itinerary.endDate);

      // Build trip details section
      const tripDetailsHtml = `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Trip Details:</h3>
          ${itinerary.destinations ? 
            `<p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Destination:</strong> ${destinationsText}
            </p>` : ''}
          ${startDateFormatted ? 
            `<p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Travel Dates:</strong> ${startDateFormatted}${endDateFormatted ? ` to ${endDateFormatted}` : ''}
            </p>` : ''}
          ${itinerary.numberOfTravellers ? 
            `<p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Travelers:</strong> ${itinerary.numberOfTravellers} ${itinerary.numberOfTravellers > 1 ? 'people' : 'person'}
            </p>` : ''}
          ${itinerary.budget ? 
            `<p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Package Budget:</strong> ${itinerary.currency || '₹'}${Number(itinerary.budget).toLocaleString()}
            </p>` : ''}
        </div>
      `;

      // Enhanced email template
      const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0; font-size: 28px;">Your Travel Itinerary</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ready for your adventure!</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${customerName},</p>
      
      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        We're excited to share your personalized travel itinerary! Your journey has been carefully planned to ensure you have an unforgettable experience.
      </p>
      
      ${tripDetailsHtml}
      
      ${notes ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #1976d2;">Special Notes:</h4>
          <p style="margin: 0; color: #333; font-style: italic;">${notes}</p>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 20px;">
        Please find your detailed itinerary attached as a PDF. If you have any questions or need modifications, 
        please don't hesitate to contact us.
      </p>
      
      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
        This email was sent by your travel consultant. Safe travels!<br>
        Contact us: ${whatsappNumber} | support@elneera.com<br>
        © ${new Date().getFullYear()} Elneera Travel. All rights reserved.
      </p>
    </div>
  </div>
`

      console.log("PDF buffer size:", pdfBuffer?.length || 0, "bytes")

      let attachment: ItineraryAttachment | undefined;
      try {
        if (pdfBuffer) {
          attachment = {
            filename: `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          };
          console.log("Using existing PDF buffer for attachment");
        } else {
          console.log("Downloading PDF from URL:", finalPdfUrl);
          const response = await fetch(finalPdfUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          if (buffer.length === 0) {
            throw new Error("Downloaded PDF is empty");
          }

          const header = buffer.toString('utf8', 0, 4);
          if (header !== '%PDF') {
            console.warn("Warning: Downloaded file may not be a valid PDF");
          }

          attachment = {
            filename: `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
            content: buffer,
            contentType: "application/pdf",
            encoding: "binary"
          };
          
          console.log("Successfully downloaded PDF for attachment");
        }
      } catch (error) {
        console.error("Error preparing PDF attachment:", error);
        attachment = {
          filename: `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
          path: finalPdfUrl,
          contentType: "application/pdf"
        };
        console.log("Falling back to URL-based attachment");
      }

      console.log("Attachment details:", {
        filename: attachment.filename,
        size: attachment.content?.length || 0,
        hasBuffer: Buffer.isBuffer(attachment.content)
      });

      // Send email with the attachment
      const emailResult = await sendEmail({
        to: email,
        subject: `Your Travel Itinerary - ${customerName}`,
        html: emailHtml,
        attachments: [attachment as EmailAttachment]
      });

      console.log("Email sent successfully:", emailResult.success)

      // Save sent itinerary record to database (use original itineraryId with version)
      const sentItinerary = await prisma.sent_itineraries.create({
        data: {
          customerId: customerId || null,
          enquiryId: enquiryId || null,
          itineraryId: cleanItineraryId, // Use cleaned ID for database relation
          customerName,
          email,
          whatsappNumber,
          notes: notes || null,
          sentDate: new Date(),
          pdfUrl: finalPdfUrl,
          status: "SENT",
          emailSent: true,
          isEdited: isEditedVersion || false,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Itinerary sent successfully",
        sentItinerary: {
          id: sentItinerary.id,
          customerName: sentItinerary.customerName,
          email: sentItinerary.email,
          pdfVersion: isEditedVersion ? 2 : 1,
          isEdited: sentItinerary.isEdited,
          status: sentItinerary.status,
          sentAt: sentItinerary.sentDate.toISOString(),
          date: sentItinerary.sentDate.toLocaleDateString(),
        },
        emailResult,
      })
    } catch (error) {
      console.error("Error sending itinerary:", error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to send itinerary",
          details: error instanceof Error ? error.stack : undefined,
          code: "SEND_ITINERARY_ERROR",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in sent-itinerary API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const enquiryId = searchParams.get("enquiryId")
    const itineraryId = searchParams.get("itineraryId")

    const whereClause: SentItineraryWhereClause = {}
    if (customerId) whereClause.customerId = customerId
    if (enquiryId) whereClause.enquiryId = enquiryId
    if (itineraryId) whereClause.itineraryId = itineraryId

    const sentItineraries = await prisma.sent_itineraries.findMany({
      where: whereClause,
      orderBy: {
        sentDate: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      sentItineraries: sentItineraries.map((item) => ({
        ...item,
        sentAt: item.sentDate.toISOString(),
        date: item.sentDate.toLocaleDateString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching sent itineraries:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch sent itineraries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}