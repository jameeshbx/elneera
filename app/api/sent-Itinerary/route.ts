// app/api/sent-itinerary/route.ts
import { S3Service } from "@/lib/s3-service"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import path from "path"
import fs from "fs/promises"


import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()



export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, itineraryId, enquiryId, customerName, email, whatsappNumber, notes } = body

    // Validate required fields
    if (!customerName || !email || !whatsappNumber) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, email, or whatsappNumber" },
        { status: 400 }
      )
    }

    if (!customerId && !enquiryId) {
      return NextResponse.json({ error: "Either customerId or enquiryId is required" }, { status: 400 })
    }

    if (!itineraryId) {
      return NextResponse.json({ error: "itineraryId is required" }, { status: 400 })
    }

    try {
      // First, try to find the itinerary in S3
      const s3Key = `itinerary-pdfs/itinerary-${itineraryId}.pdf`
      let s3FileInfo = await S3Service.getFileInfo(s3Key)

      if (!s3FileInfo) {
        // If not found in S3, check if there's a local file (for backward compatibility)
        const localPdfPath = path.join(process.cwd(), "public", "generated-pdfs", `itinerary-${itineraryId}.pdf`)
        try {
          const fileBuffer = await fs.readFile(localPdfPath)
          
          // Upload the local file to S3 for future use
          await S3Service.uploadFile(
            fileBuffer,
            `itinerary-${itineraryId}.pdf`,
            'application/pdf',
            'itinerary-pdfs'
          )
          
          // Use the newly uploaded file
          const newFileInfo = await S3Service.getFileInfo(s3Key)
          if (!newFileInfo) {
            throw new Error("Failed to upload file to S3")
          }
          s3FileInfo = newFileInfo
        } catch (localError) {
          console.error("Error reading local PDF file:", localError)
          return NextResponse.json(
            { 
              error: "PDF not found",
              details: "The itinerary PDF could not be found. Please regenerate the PDF.",
              code: "PDF_NOT_FOUND"
            },
            { status: 404 }
          )
        }
      }

      // Send email with the S3 URL
      const emailResult = await sendEmail({
        to: email,
        subject: `Your Travel Itinerary - ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Your Travel Itinerary</h2>
            <p>Hello ${customerName},</p>
            <p>Thank you for choosing our travel services! We're excited to share your travel itinerary with you.</p>
            
            <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #2d3748;">Trip Details</h3>
              <p>We've attached your detailed itinerary for your upcoming trip. Please review it carefully and don't hesitate to reach out if you have any questions.</p>
              ${notes ? `<p><strong>Your Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            <p>If you need to make any changes or have questions about your itinerary, please contact our support team.</p>
            
            <p>Safe travels,<br>The Travel Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096;">
              <p>Contact us: ${whatsappNumber} | support@elneera.com</p>
              <p>  ${new Date().getFullYear()} Elneera Travel. All rights reserved.</p>
            </div>
          </div>
        `,
        attachments: [{
          filename: `itinerary-${itineraryId}.pdf`,
          path: s3FileInfo.url,
          contentType: 'application/pdf'
        }]
      })

      // In sent-itinerary/route.ts, update the database save operation:
const sentItinerary = await prisma.sent_itineraries.create({
  data: {
    customerId: customerId || null,
    enquiryId: enquiryId || null,
    itineraryId,
    customerName,
    email,
    whatsappNumber,
    notes: notes || null,
    sentDate: new Date(), // Use sentDate instead of sentBy
    pdfUrl: s3FileInfo.url,
    status: 'SENT',
    emailSent: true
  }
})

      return NextResponse.json({ 
        success: true, 
        message: 'Itinerary sent successfully',
        data: {
          sentItinerary,
          emailResult
        }
      })
    } catch (error) {
      console.error("Error sending itinerary:", error)
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : "Failed to send itinerary",
          details: error instanceof Error ? error.stack : undefined,
          code: "SEND_ITINERARY_ERROR"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in sent-itinerary API:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    )
  } finally {
    // No need to manually disconnect with Drizzle + pg-pool
    // The pool will handle connection management automatically
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Please use POST method to send itinerary via email",
    requiredFields: ["customerName", "email", "whatsappNumber", "itineraryId", "(customerId or enquiryId)"],
    optionalFields: ["notes"],
  })
}
