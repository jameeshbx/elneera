import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { S3Service } from "@/lib/s3-service"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    console.log("[PDF] PDF generation started")
    const body = await request.json()
    console.log("[PDF] Request body:", body)
    const { enquiryId, itineraryId, formData } = body

    if (!itineraryId) {
      return NextResponse.json(
        {
          error: "Itinerary ID is required",
          details: "itineraryId must be provided to generate PDF",
        },
        { status: 400 }
      )
    }

    // Test database connection
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("[PDF] Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unable to connect to database",
        },
        { status: 500 }
      )
    }

    // Fetch itinerary data from database (includes AI-generated dailyItinerary and accommodation)
    const itinerary = await prisma.itineraries.findUnique({
      where: { id: itineraryId },
      include: {
        enquiry: true,
      },
    })

    if (!itinerary) {
      return NextResponse.json(
        {
          error: "Itinerary not found",
          details: `Itinerary with ID ${itineraryId} does not exist`,
        },
        { status: 404 }
      )
    }

    console.log("[PDF] Itinerary loaded from database:", {
      id: itinerary.id,
      days: Array.isArray(itinerary.dailyItinerary) ? itinerary.dailyItinerary.length : 0,
      hotels: Array.isArray(itinerary.accommodation) ? itinerary.accommodation.length : 0,
    })

    // Fetch enquiry data if not included
    let enquiry = itinerary.enquiry
    if (!enquiry && enquiryId) {
      const fetchedEnquiry = await prisma.enquiries.findUnique({
        where: { id: enquiryId },
      })
      if (fetchedEnquiry) {
        enquiry = fetchedEnquiry
      }
    }

    if (!enquiry) {
      return NextResponse.json(
        {
          error: "Enquiry not found",
          details: "Enquiry data is required to generate PDF",
        },
        { status: 404 }
      )
    }

    console.log("[PDF] Enquiry loaded:", {
      id: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
    })

    // Load PDF template
    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf")

    try {
      await fs.access(pdfTemplatePath)
      console.log("[PDF] PDF template found at:", pdfTemplatePath)
    } catch (error) {
      console.error("[PDF] PDF template not found:", error)
      return NextResponse.json(
        {
          error: "PDF template not found",
          details: `lib/itinerary.pdf file is missing at ${pdfTemplatePath}`,
          path: pdfTemplatePath,
        },
        { status: 500 },
      )
    }

    const formBytes = await fs.readFile(pdfTemplatePath)
    console.log("[PDF] PDF template loaded, size:", formBytes.length)

    const pdfDoc = await PDFDocument.load(formBytes)
    console.log("[PDF] PDF document loaded successfully")

    const pages = pdfDoc.getPages()
    let firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const drawText = (text: string, x: number, y: number, size = 10, page = firstPage, fontType = font, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: fontType,
        color,
      })
    }

    // Parse AI-generated dailyItinerary (stored as JSON in database)
    let dailyItinerary: Array<{
      day: number
      date: string
      title: string
      activities: Array<{
        time: string
        title: string
        type: string
        description: string
      }>
    }> = []

    if (itinerary.dailyItinerary) {
      if (typeof itinerary.dailyItinerary === "string") {
        try {
          dailyItinerary = JSON.parse(itinerary.dailyItinerary) as typeof dailyItinerary
        } catch (parseError) {
          console.error("[PDF] Error parsing dailyItinerary:", parseError)
          dailyItinerary = []
        }
      } else if (Array.isArray(itinerary.dailyItinerary)) {
        dailyItinerary = itinerary.dailyItinerary as typeof dailyItinerary
      }
    }

    // Parse accommodation data
    let accommodation: Array<{
      name: string
      rating: number
      nights: number
      image: string
    }> = []

    if (itinerary.accommodation) {
      if (typeof itinerary.accommodation === "string") {
        try {
          accommodation = JSON.parse(itinerary.accommodation) as typeof accommodation
        } catch (parseError) {
          console.error("[PDF] Error parsing accommodation:", parseError)
          accommodation = []
        }
      } else if (Array.isArray(itinerary.accommodation)) {
        accommodation = itinerary.accommodation as typeof accommodation
      }
    }

    // Parse budgetEstimation (stored as JSON in database)
    type BudgetEstimationType = { amount: number; currency: string; costTourist?: number }
    let budgetEstimation: BudgetEstimationType | null = null
    if (itinerary.budgetEstimation) {
      if (typeof itinerary.budgetEstimation === "string") {
        try {
          budgetEstimation = JSON.parse(itinerary.budgetEstimation) as BudgetEstimationType
        } catch (parseError) {
          console.error("[PDF] Error parsing budgetEstimation:", parseError)
        }
      } else if (typeof itinerary.budgetEstimation === "object" && itinerary.budgetEstimation !== null && !Array.isArray(itinerary.budgetEstimation)) {
        budgetEstimation = itinerary.budgetEstimation as unknown as BudgetEstimationType
      }
    }

    console.log("[PDF] Parsed itinerary data:", {
      days: dailyItinerary.length,
      hotels: accommodation.length,
    })

    // Calculate totals from actual data
    const totalDays = dailyItinerary.length || 1
    const totalNights = totalDays > 0 ? totalDays - 1 : 0
    const totalCost = (budgetEstimation && 'amount' in budgetEstimation ? budgetEstimation.amount : null) || itinerary.budget || 0
    const currency = itinerary.currency || (budgetEstimation && 'currency' in budgetEstimation ? budgetEstimation.currency : null) || "USD"
    const destination = itinerary.destinations || enquiry.locations || "Unknown"

    // Build group size string from actual data
    const groupSizeParts = []
    if (itinerary.adults && itinerary.adults > 0) {
      groupSizeParts.push(`${itinerary.adults} Adults`)
    }
    if (itinerary.children && itinerary.children > 0) {
      groupSizeParts.push(`${itinerary.children} Children`)
    }
    if (itinerary.under6 && itinerary.under6 > 0) {
      groupSizeParts.push(`${itinerary.under6} Under 6`)
    }
    if (itinerary.from7to12 && itinerary.from7to12 > 0) {
      groupSizeParts.push(`${itinerary.from7to12} Age 7-12`)
    }
    const groupSize = groupSizeParts.length > 0 ? groupSizeParts.join(", ") : "2 Adults"

    // Format dates
    const startDate = itinerary.startDate || enquiry.estimatedDates?.split(" - ")[0] || new Date().toLocaleDateString()
    const endDate = itinerary.endDate || enquiry.estimatedDates?.split(" - ")[1] || new Date().toLocaleDateString()
    const travelDates = `${startDate} to ${endDate}`

    // Get currency symbol
    const getCurrencySymbol = (code: string) => {
      switch (code) {
        case "USD": return "$"
        case "EUR": return "€"
        case "GBP": return "£"
        case "INR": return "₹"
        default: return code || "$"
      }
    }

    // Prepare itinerary data for PDF
    const itineraryData = {
      date: new Date().toLocaleDateString(),
      travelerName: enquiry.name || "Valued Customer",
      email: enquiry.email || "",
      phone: enquiry.phone || "",
      destination: destination,
      travelDates: travelDates,
      groupSize: groupSize,
      travelType: itinerary.travelType || enquiry.tourType || "Family",
      budgetRange: `${currency} ${totalCost}`,
      duration: `${totalDays} Days / ${totalNights} Nights`,
      totalCost: `${getCurrencySymbol(currency)}${totalCost}`,
      packageName: `${destination} ${itinerary.travelType || "Premium"} Package`,
      dailyItinerary: dailyItinerary,
      totalDays: totalDays,
    }

    console.log("[PDF] Prepared itinerary data for PDF:", {
      travelerName: itineraryData.travelerName,
      destination: itineraryData.destination,
      days: itineraryData.totalDays,
    })

    let yPosition = height - 750

    // Header Information
    drawText(itineraryData.packageName, 600, yPosition, 40, firstPage, boldFont, rgb(1, 1, 1))
    drawText(itineraryData.date, 2000, yPosition, 40, firstPage, boldFont, rgb(1, 1, 1))

    yPosition -= 125

    // Customer Information
    drawText(itineraryData.travelerName, 600, yPosition, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.email, 1300, yPosition, 30, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.phone, 2000, yPosition, 30, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.travelDates, 600, yPosition - 60, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.destination, 600, yPosition - 110, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.groupSize, 600, yPosition - 170, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.travelType, 600, yPosition - 220, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(itineraryData.budgetRange, 600, yPosition - 280, 40, firstPage, font, rgb(178 / 255, 190 / 255, 181 / 255))

    yPosition -= 550

    // Day-wise Itinerary using AI-generated data
    for (const dayItinerary of dailyItinerary) {
      const day = dayItinerary.day
      const activities = dayItinerary.activities || []

      if (activities.length > 0) {
        if (yPosition < 150) {
          const newPage = pdfDoc.addPage([width, height])
          yPosition = height - 50
          firstPage = newPage
        }

        // Day header with title and date
        const dayTitle = dayItinerary.title || `Day ${day}`
        drawText(`${dayTitle} (${dayItinerary.date || ""})`, 500, yPosition, 30, firstPage, boldFont)
        yPosition -= 40

        // Activities for this day
        activities.forEach((activity) => {
          if (yPosition < 100) {
            const newPage = pdfDoc.addPage([width, height])
            yPosition = height - 50
            firstPage = newPage
          }

          // Activity time and title
          const activityTitle = activity.title || activity.description || ""
          drawText(`${activity.time || ""} - ${activityTitle}`, 580, yPosition, 25, firstPage, font)
          yPosition -= 35

          // Activity description
          if (activity.description && activity.description !== activityTitle) {
            // Truncate long descriptions to fit on page
            const maxLength = 80
            const description = activity.description.length > maxLength
              ? activity.description.substring(0, maxLength) + "..."
              : activity.description
            drawText(description, 650, yPosition, 20, firstPage, font, rgb(0.5, 0.5, 0.5))
            yPosition -= 30
          }

          // Activity type indicator
          if (activity.type) {
            drawText(`Type: ${activity.type}`, 650, yPosition, 18, firstPage, font, rgb(0.6, 0.6, 0.6))
            yPosition -= 25
          }

          yPosition -= 20
        })

        yPosition -= 35
      }
    }

    const pdfBytes = await pdfDoc.save()
    console.log("[PDF] PDF generated successfully, size:", pdfBytes.length)

    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      console.error("[PDF] S3 is not configured")
      return NextResponse.json(
        {
          error: "S3 configuration missing",
          message: "PDF generation failed - S3 is not properly configured",
          details: "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables",
        },
        { status: 500 }
      )
    }

    // Upload to S3
    const timestamp = Date.now()
    const pdfFileName = `itinerary-${itineraryId}-${timestamp}.pdf`

    try {
      const s3FileInfo = await S3Service.uploadFile(
        Buffer.from(pdfBytes),
        pdfFileName,
        'application/pdf',
        'itinerary-pdfs'
      )

      console.log("[PDF] PDF uploaded to S3:", s3FileInfo.key)

      // Deactivate all previous versions
      await prisma.pDFVersion.updateMany({
        where: { itineraryId },
        data: { isActive: false },
      })

      // Get version number
      const existingVersions = await prisma.pDFVersion.count({ where: { itineraryId } })
      const versionNumber = existingVersions + 1

      // Create new PDF version in database
      const newVersion = await prisma.pDFVersion.create({
        data: {
          itineraryId,
          url: s3FileInfo.url,
          version: versionNumber,
          isActive: true,
          metadata: {
            isEdited: false,
            fileSize: pdfBytes.length,
            s3Key: s3FileInfo.key,
            filename: pdfFileName,
            createdAt: new Date().toISOString(),
          },
        },
      })

      // Update itinerary with PDF URL and version reference
      await prisma.itineraries.update({
        where: { id: itineraryId },
        data: {
          pdfUrl: s3FileInfo.url,
          activePdfVersion: newVersion.id,
          status: 'generated',
          updatedAt: new Date(),
        },
      })

      console.log("[PDF] Database updated with PDF version")

      return NextResponse.json({
        success: true,
        message: "PDF generated and uploaded successfully",
        pdfUrl: s3FileInfo.url,
        s3Key: s3FileInfo.key,
        filename: pdfFileName,
        version: versionNumber,
        versionId: newVersion.id,
      })
    } catch (s3Error) {
      console.error("[PDF] Error uploading to S3:", s3Error)

      return NextResponse.json(
        {
          error: "S3 upload failed",
          message: "PDF generation failed - could not upload to S3",
          details: s3Error instanceof Error ? s3Error.message : "Unknown S3 error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Please use POST method to generate itinerary PDF",
    example: 'curl -X POST /api/generate-pdf -d \'{"enquiryId":"123","itineraryId":"456","formData":{}}\'',
    templateRequired: "lib/itinerary.pdf",
    note: "PDF generation now uses AI-generated itinerary data from the database instead of CSV files",
  })
}