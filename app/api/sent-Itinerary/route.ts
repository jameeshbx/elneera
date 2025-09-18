import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendEmail } from "@/lib/email"
import fs from "fs/promises"
import path from "path"

const prisma = new PrismaClient()

// Types for sent itineraries

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Email sending API called")
    const body = await request.json()
    console.log("[v0] Request body:", body)

    const {
      customerId,
      itineraryId,
      enquiryId,
      customerName,
      email,
      whatsappNumber,
      notes,
    } = body

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

    const generatedPdfsDir = path.join(process.cwd(), "public", "generated-pdfs")
    let pdfFilePath = null
    let pdfUrl = null

    try {
      const files = await fs.readdir(generatedPdfsDir)
      console.log("[v0] Available PDF files:", files)

      // Find the most recent PDF file for this itinerary
      const pdfFiles = files.filter((file) => file.startsWith(`itinerary-${itineraryId}`) && file.endsWith(".pdf"))

      if (pdfFiles.length === 0) {
        // Try to find any recent PDF file as fallback
        const allPdfFiles = files.filter((file) => file.endsWith(".pdf"))
        if (allPdfFiles.length > 0) {
          // Sort by creation time (newest first) based on timestamp in filename
          allPdfFiles.sort((a, b) => {
            const timestampA = a.match(/-(\d+)\.pdf$/)?.[1] || "0"
            const timestampB = b.match(/-(\d+)\.pdf$/)?.[1] || "0"
            return Number.parseInt(timestampB) - Number.parseInt(timestampA)
          })
          pdfFilePath = path.join(generatedPdfsDir, allPdfFiles[0])
          pdfUrl = `/generated-pdfs/${allPdfFiles[0]}`
          console.log("[v0] Using fallback PDF:", allPdfFiles[0])
        } else {
          throw new Error("No PDF files found in generated-pdfs directory")
        }
      } else {
        // Sort by timestamp (newest first)
        pdfFiles.sort((a, b) => {
          const timestampA = a.match(/-(\d+)\.pdf$/)?.[1] || "0"
          const timestampB = b.match(/-(\d+)\.pdf$/)?.[1] || "0"
          return Number.parseInt(timestampB) - Number.parseInt(timestampA)
        })

        const selectedPdf = pdfFiles[0]
        pdfFilePath = path.join(generatedPdfsDir, selectedPdf)
        pdfUrl = `/generated-pdfs/${selectedPdf}`
        console.log("[v0] Using PDF:", selectedPdf)
      }

      // Verify the PDF file exists
      await fs.access(pdfFilePath)
      console.log("[v0] PDF file verified at:", pdfFilePath)
    } catch (error) {
      console.error("[v0] Error finding PDF file:", error)
      return NextResponse.json(
        {
          error: "PDF not found",
          details: "The itinerary PDF could not be found. Please regenerate the PDF first.",
          searchPath: generatedPdfsDir,
        },
        { status: 404 },
      )
    }

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: `Your Travel Itinerary - ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">Your Travel Itinerary</h2>
            <p>Dear ${customerName},</p>
            <p>Thank you for choosing our travel services! Please find your detailed itinerary attached to this email.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5530; margin-top: 0;">Contact Information</h3>
              <p><strong>WhatsApp:</strong> ${whatsappNumber}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
            </div>
            
            <p>If you have any questions or need to make changes to your itinerary, please don't hesitate to contact us.</p>
            
            <p>Have a wonderful trip!</p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
              <p>Best regards,<br>Your Travel Team</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `itinerary-${customerName.replace(/\s+/g, "-")}.pdf`,
            path: pdfFilePath,
            contentType: "application/pdf",
          },
        ],
      })

      console.log("[v0] Email sent successfully:", emailResult)

      // Persist a sent itinerary record
    const finalCustomerId: string = customerId || enquiryId || "";
    
    // Create sent itinerary record
    const sentItinerary = await prisma.sent_itineraries.create({
      data: {
        customerId: finalCustomerId,
        customerName: customerName || "",
        email,
        whatsappNumber: whatsappNumber || null,
        notes: notes || null,
        status: "sent",
        sentDate: new Date(),
        itineraryId,
        emailSent: true,
        whatsappSent: false, // Set based on your logic
      },
    })

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
        sentDate: sentItinerary.sentDate,
        emailSent: sentItinerary.emailSent,
        whatsappSent: sentItinerary.whatsappSent,
        createdAt: sentItinerary.createdAt,
        updatedAt: sentItinerary.updatedAt,
      },
      emailResult,
      pdfUrl,
    })
    } catch (emailError) {
      console.error("[v0] Email sending failed:", emailError)

      let errorMessage = "Failed to send email"
      if (emailError instanceof Error) {
        if (emailError.message.includes("connection")) {
          errorMessage = "Email server connection failed. Please check email configuration."
        } else if (emailError.message.includes("authentication")) {
          errorMessage = "Email authentication failed. Please check email credentials."
        } else {
          errorMessage = emailError.message
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: emailError instanceof Error ? emailError.message : "Unknown email error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] API Error:", error)
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

export async function GET() {
  return NextResponse.json({
    message: "Please use POST method to send itinerary via email",
    requiredFields: ["customerName", "email", "whatsappNumber", "customerId or enquiryId"],
    optionalFields: ["notes"],
  })
}
