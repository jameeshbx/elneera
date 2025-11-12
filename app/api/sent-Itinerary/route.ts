// app/api/sent-itinerary/route.ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { getFileStream, getSignedFileUrl } from "@/lib/s3-utils"
import { PrismaClient } from "@prisma/client"
import { EmailAttachment } from "@/lib/email"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const prisma = new PrismaClient()

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

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

    const contentType = request.headers.get("content-type") || ""
    let customerId: string
    let enquiryId: string | null
    let itineraryId: string | null = null
    let customerName: string
    let email: string
    let whatsappNumber: string
    let notes: string | null
    let pdfUrl: string | null = null
    let pdfVersion: number | null = null
    let isEditedVersion: boolean = false
    let isManualUpload: boolean = false
    let manualPdfFile: File | null = null

    // Handle FormData (for manual PDF upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      
      customerId = formData.get("customerId") as string
      enquiryId = formData.get("enquiryId") as string | null
      itineraryId = formData.get("itineraryId") as string | null
      customerName = formData.get("customerName") as string
      email = formData.get("email") as string
      whatsappNumber = formData.get("whatsappNumber") as string
      notes = formData.get("notes") as string | null
      isManualUpload = formData.get("isManualUpload") === "true"
      
      if (isManualUpload) {
        manualPdfFile = formData.get("manualPdf") as File | null
      } else {
        pdfUrl = formData.get("pdfUrl") as string | null
        const versionStr = formData.get("pdfVersion") as string | null
        pdfVersion = versionStr ? parseInt(versionStr) : null
        isEditedVersion = formData.get("isEditedVersion") === "true"
      }
    } else {
      // Handle JSON (for generated PDF)
      const body = await request.json()
      customerId = body.customerId
      enquiryId = body.enquiryId
      itineraryId = body.itineraryId
      customerName = body.customerName
      email = body.email
      whatsappNumber = body.whatsappNumber
      notes = body.notes
      pdfUrl = body.pdfUrl
      pdfVersion = body.pdfVersion
      isEditedVersion = body.isEditedVersion || false
    }

    // Debug logging
    console.log("=== Sent Itinerary Request ===")
    console.log("itineraryId received:", itineraryId)
    console.log("isManualUpload:", isManualUpload)
    console.log("Has manual file:", !!manualPdfFile)

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

    if (!pdfUrl && !manualPdfFile) {
      return NextResponse.json({ error: "Either pdfUrl or manual PDF file is required" }, { status: 400 })
    }

    let finalPdfUrl = pdfUrl
    let uploadedS3Key: string | null = null
    let pdfBuffer: Buffer | null = null
    let itinerary: any = null

    // Handle manual PDF upload to S3
    if (manualPdfFile && isManualUpload) {
      try {
        const fileBuffer = Buffer.from(await manualPdfFile.arrayBuffer())
        const timestamp = Date.now()
        const sanitizedFileName = manualPdfFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const s3Key = `manual-itineraries/${customerId}/${timestamp}-${sanitizedFileName}`

        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME || "",
          Key: s3Key,
          Body: fileBuffer,
          ContentType: "application/pdf",
          Metadata: {
            customerId: customerId,
            uploadedBy: "manual",
            originalFileName: manualPdfFile.name,
          },
        })

        await s3Client.send(uploadCommand)
        uploadedS3Key = s3Key
        pdfBuffer = fileBuffer

        // Generate signed URL for the uploaded file
        finalPdfUrl = await getSignedFileUrl(s3Key, 3600)
        
        console.log("Manual PDF uploaded to S3:", s3Key)
      } catch (uploadError) {
        console.error("Error uploading manual PDF to S3:", uploadError)
        return NextResponse.json(
          { error: "Failed to upload PDF to storage" },
          { status: 500 }
        )
      }
    } else if (itineraryId) {
      // Clean the itineraryId - remove version suffix if present (e.g., "-v1", "-v2")
      const cleanItineraryId = itineraryId.replace(/-v\d+$/, '');
      console.log("Cleaned itineraryId:", cleanItineraryId)

      // Fetch itinerary details from database
      console.log("Fetching itinerary with ID:", cleanItineraryId)
      
      itinerary = await prisma.itineraries.findUnique({
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
        return NextResponse.json(
          { 
            error: "Itinerary not found",
            details: `No itinerary found with ID: ${cleanItineraryId}`,
            receivedId: itineraryId,
            cleanedId: cleanItineraryId,
            hint: "Check if the itineraryId is correct and exists in the database"
          },
          { status: 404 }
        )
      }

      // Update itineraryId to cleaned version
      itineraryId = cleanItineraryId
    }

    // Fetch PDF for generated itineraries
    if (!isManualUpload && pdfUrl) {
      try {
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
      } catch (error) {
        console.error("Error fetching PDF:", error)
        return NextResponse.json(
          {
            error: "Failed to fetch PDF",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    }

    // Build email content
    let tripDetailsHtml = ''
    
    if (itinerary) {
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

      tripDetailsHtml = `
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
    }

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
        ${isManualUpload 
          ? "We have prepared a custom itinerary document for your upcoming trip. Please find the attached PDF with all the details."
          : "We're excited to share your personalized travel itinerary! Your journey has been carefully planned to ensure you have an unforgettable experience."
        }
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
          filename: isManualUpload 
            ? (manualPdfFile?.name || `itinerary-${customerName.replace(/\s+/g, "-")}.pdf`)
            : `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        };
        console.log("Using existing PDF buffer for attachment");
      } else if (finalPdfUrl) {
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
          filename: isManualUpload 
            ? (manualPdfFile?.name || `itinerary-${customerName.replace(/\s+/g, "-")}.pdf`)
            : `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
          content: buffer,
          contentType: "application/pdf",
          encoding: "binary"
        };
        
        console.log("Successfully downloaded PDF for attachment");
      }
    } catch (error) {
      console.error("Error preparing PDF attachment:", error);
      if (finalPdfUrl) {
        attachment = {
          filename: isManualUpload 
            ? (manualPdfFile?.name || `itinerary-${customerName.replace(/\s+/g, "-")}.pdf`)
            : `itinerary-${customerName.replace(/\s+/g, "-")}-v${pdfVersion || (isEditedVersion ? "2" : "1")}.pdf`,
          path: finalPdfUrl,
          contentType: "application/pdf"
        };
        console.log("Falling back to URL-based attachment");
      }
    }

    if (!attachment) {
      return NextResponse.json(
        { error: "Failed to prepare PDF attachment" },
        { status: 500 }
      )
    }

    console.log("Attachment details:", {
      filename: attachment.filename,
      size: attachment.content?.length || 0,
      hasBuffer: Buffer.isBuffer(attachment.content)
    });

    // Send email with the attachment
    const emailResult = await sendEmail({
      to: email,
      subject: isManualUpload 
        ? `Your Custom Travel Itinerary`
        : `Your Travel Itinerary - ${customerName}`,
      html: emailHtml,
      attachments: [attachment as EmailAttachment]
    });

    console.log("Email sent successfully:", emailResult.success)

    // Save sent itinerary record to database
    const sentItinerary = await prisma.sent_itineraries.create({
      data: {
        customerId: customerId,
        enquiryId: enquiryId || null,
        itineraryId: itineraryId || null,
        customerName,
        email,
        whatsappNumber,
        notes: notes || null,
        sentDate: new Date(),
        pdfUrl: finalPdfUrl,
        status: "SENT",
        emailSent: true,
        isEdited: isEditedVersion,
        isManualUpload: isManualUpload,
        manualPdfS3Key: uploadedS3Key,
        pdfVersion: pdfVersion || (isEditedVersion ? 2 : 1),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Itinerary sent successfully",
      sentItinerary: {
        id: sentItinerary.id,
        customerName: sentItinerary.customerName,
        email: sentItinerary.email,
        date: sentItinerary.sentDate.toLocaleDateString("en-GB").replace(/\//g, " . "),
        status: sentItinerary.status,
        pdfUrl: finalPdfUrl,
        isEdited: sentItinerary.isEdited,
        pdfVersion: sentItinerary.pdfVersion,
        isManualUpload: sentItinerary.isManualUpload,
        notes: sentItinerary.notes,
      },
      emailResult,
    })
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
      sentItineraries: sentItineraries.map((item: { sentDate: { toISOString: () => any; toLocaleDateString: (arg0: string) => string }; pdfVersion: any; isEdited: any }) => ({
        ...item,
        sentAt: item.sentDate.toISOString(),
        date: item.sentDate.toLocaleDateString("en-GB").replace(/\//g, " . "),
        pdfVersion: item.pdfVersion || (item.isEdited ? 2 : 1),
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