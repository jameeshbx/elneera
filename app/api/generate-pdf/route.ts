import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { S3Service } from "@/lib/s3-service"
import path from "path"
import fs from "fs/promises"

// Define types for the daily itinerary structure
interface Activity {
  time?: string
  title: string
  description?: string
}

interface DailyItineraryItem {
  day: number
  title?: string
  date?: string
  activities?: Activity[]
}

export async function POST(req: Request) {
  try {
    const {
      itineraryId,

      formData,
      isInitialGeneration = true,
    } = await req.json()

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    // Get the itinerary data
    const itinerary = await prisma.itineraries.findUnique({
      where: { id: itineraryId },
      include: {
        pdfVersions: true,
        enquiry: true,
      },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    console.log("[generated-pdf] Starting PDF generation...")

    // Get the PDF template
    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf")

    try {
      await fs.access(pdfTemplatePath)
    } catch (error) {
      console.error("[generated-pdf] PDF template not found:", error)
      return NextResponse.json(
        {
          error: "PDF template not found",
          details: `lib/itinerary.pdf file is missing at ${pdfTemplatePath}`,
        },
        { status: 500 },
      )
    }

    // Load the PDF template
    const formBytes = await fs.readFile(pdfTemplatePath)
    const pdfDoc = await PDFDocument.load(formBytes)

    const pages = pdfDoc.getPages()
    let currentPage = pages[0]
    const { height } = currentPage.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper function to safely encode text for WinAnsi
    const safeEncodeText = (text: string): string => {
      return text
        .replace(/₹/g, "INR ")
        .replace(/€/g, "EUR ")
        .replace(/£/g, "GBP ")
        .replace(/¥/g, "JPY ")
        .replace(/₦/g, "NGN ")
        .replace(/[^\x00-\x7F]/g, "?")
        .trim()
    }

    const drawText = (
      text: string,
      x: number,
      y: number,
      size = 10,
      page = currentPage,
      fontType = font,
      color = rgb(0, 0, 0),
    ) => {
      const safeText = safeEncodeText(text)
      page.drawText(safeText, {
        x,
        y,
        size,
        font: fontType,
        color,
      })
    }

    // Format currency safely
    const formatCurrency = (currency: string, amount: number | string): string => {
      const currencyMap: { [key: string]: string } = {
        INR: "INR ",
        USD: "USD ",
        EUR: "EUR ",
        GBP: "GBP ",
        JPY: "JPY ",
        NGN: "NGN ",
      }

      const safeCurrency = currencyMap[currency] || currency + " "
      return `${safeCurrency}${amount}`
    }

    const itineraryData = {
      date: new Date().toLocaleDateString(),
      travelerName: formData?.customerName || itinerary.enquiry?.name || "Valued Customer",
      email: formData?.customerEmail || itinerary.enquiry?.email || "customer@example.com",
      phone: formData?.customerPhone || itinerary.enquiry?.phone || "+91-9876543210",
      destination: itinerary.destinations || "Amazing Destination",
      travelDates: `${itinerary.startDate ? new Date(itinerary.startDate).toLocaleDateString() : new Date().toLocaleDateString()} to ${itinerary.endDate ? new Date(itinerary.endDate).toLocaleDateString() : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      groupSize: `${itinerary.adults || 2} Adults${itinerary.children ? `, ${itinerary.children} Children` : ""}${itinerary.under6 ? `, ${itinerary.under6} Under 6` : ""}${itinerary.from7to12 ? `, ${itinerary.from7to12} Age 7-12` : ""}`,
      travelType: itinerary.travelType || "Family",
      budgetRange: formatCurrency(itinerary.currency || "USD", itinerary.budget || 1000),
      duration: "Multi-day Experience",
      totalCost: formatCurrency(itinerary.currency || "USD", itinerary.budget || 1000),
      packageName: `${itinerary.destinations || "Premium"} Package`,
    }

    console.log("[generated-pdf] Itinerary data prepared:", itineraryData)

    let yPosition = height - 750

    // Header Information
    drawText(itineraryData.packageName, 600, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1))
    drawText(itineraryData.date, 2000, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1))

    yPosition -= 125

    // Customer Information
    drawText(
      `${itineraryData.travelerName}`,
      600,
      yPosition,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )
    drawText(`${itineraryData.email}`, 1300, yPosition, 30, currentPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(`${itineraryData.phone}`, 2000, yPosition, 30, currentPage, font, rgb(178 / 255, 190 / 255, 181 / 255))
    drawText(
      `${itineraryData.travelDates}`,
      600,
      yPosition - 60,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )
    drawText(
      `${itineraryData.destination}`,
      600,
      yPosition - 110,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )
    drawText(
      `${itineraryData.groupSize}`,
      600,
      yPosition - 170,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )
    drawText(
      `${itineraryData.travelType}`,
      600,
      yPosition - 220,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )
    drawText(
      `${itineraryData.budgetRange}`,
      600,
      yPosition - 280,
      40,
      currentPage,
      font,
      rgb(178 / 255, 190 / 255, 181 / 255),
    )

    yPosition -= 550

    // Add daily itinerary content with proper type checking
    if (itinerary.dailyItinerary && Array.isArray(itinerary.dailyItinerary)) {
      // Type assertion for the daily itinerary array
      const dailyItineraryItems = itinerary.dailyItinerary as unknown as DailyItineraryItem[]

      for (const day of dailyItineraryItems) {
        // Add null check for day object
        if (!day || typeof day !== "object") {
          continue
        }

        if (yPosition < 200) {
          const newPage = pdfDoc.addPage([currentPage.getWidth(), height])
          yPosition = height - 80
          currentPage = newPage
        }

        // Safe access to day properties with fallbacks
        const dayNumber = day.day || 1
        const dayTitle = day.title || day.date || ""

        drawText(`Day ${dayNumber} - ${dayTitle}`, 150, yPosition, 24, currentPage, boldFont)
        yPosition -= 45

        // Check if activities exist and is an array
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            // Add null check for activity object
            if (!activity || typeof activity !== "object") {
              continue
            }

            if (yPosition < 150) {
              const newPage = pdfDoc.addPage([currentPage.getWidth(), height])
              yPosition = height - 80
              currentPage = newPage
            }

            const activityTime = activity.time || "All Day"
            const activityTitle = activity.title || "Activity"

            drawText(`${activityTime}:`, 170, yPosition, 16, currentPage, boldFont)
            drawText(activityTitle, 300, yPosition, 16, currentPage, font)
            yPosition -= 30

            if (activity.description) {
              const description = activity.description
              const words = description.split(" ")
              let currentLine = ""
              const maxLineLength = 70

              for (const word of words) {
                if ((currentLine + word).length > maxLineLength) {
                  if (currentLine.trim()) {
                    if (yPosition < 150) {
                      const newPage = pdfDoc.addPage([currentPage.getWidth(), height])
                      yPosition = height - 80
                      currentPage = newPage
                    }
                    drawText(currentLine.trim(), 190, yPosition, 14, currentPage, font, rgb(0.4, 0.4, 0.4))
                    yPosition -= 25
                  }
                  currentLine = word + " "
                } else {
                  currentLine += word + " "
                }
              }

              if (currentLine.trim()) {
                if (yPosition < 150) {
                  const newPage = pdfDoc.addPage([currentPage.getWidth(), height])
                  yPosition = height - 80
                  currentPage = newPage
                }
                drawText(currentLine.trim(), 190, yPosition, 14, currentPage, font, rgb(0.4, 0.4, 0.4))
                yPosition -= 25
              }
            }

            yPosition -= 20
          }
        }
        yPosition -= 40
      }
    } else {
      drawText("Itinerary details will be provided upon confirmation.", 150, yPosition, 16, currentPage, font)
      yPosition -= 35
      drawText("This is your initial travel itinerary.", 150, yPosition, 14, currentPage, font)
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    console.log("[generated-pdf] PDF generated, size:", pdfBytes.length)

    // Upload to S3
    const timestamp = Date.now()
    const pdfFileName = `itinerary-${itineraryId}-${timestamp}-generated.pdf`

    console.log("[generated-pdf] Uploading to S3:", pdfFileName)

    const uploadResult = await S3Service.uploadFile(
      Buffer.from(pdfBytes),
      pdfFileName,
      "application/pdf",
      "itinerary-pdfs",
    )

    // Check if this is the first PDF version
    const existingVersions = await prisma.pDFVersion.count({
      where: { itineraryId },
    })

    const versionNumber = existingVersions + 1

    // Create new PDF version
    const newVersion = await prisma.pDFVersion.create({
      data: {
        itineraryId,
        url: uploadResult.url,
        version: versionNumber,
        isActive: true,
        metadata: {
          isEdited: false,
          generatedAt: new Date().toISOString(),
          s3Key: uploadResult.key || null,
          filename: pdfFileName,
          isInitialGeneration: isInitialGeneration,
        },
      },
    })

    // Update the itinerary record
    await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        pdfUrl: uploadResult.url,
        activePdfVersion: newVersion.id,
        lastPdfRegeneratedAt: new Date(),
        status: "generated",
      },
    })

    console.log("[generated-pdf] PDF generated successfully:", uploadResult.url)

    return NextResponse.json(
      {
        success: true,
        pdfUrl: uploadResult.url,
        version: newVersion.version,
        versionId: newVersion.id,
        isEdited: false,
        generatedAt: new Date().toISOString(),
        s3Key: uploadResult.key,
        filename: pdfFileName,
        message: "PDF generated successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[generated-pdf] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
