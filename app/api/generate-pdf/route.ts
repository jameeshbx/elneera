import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { S3Service } from "@/lib/s3-service"

export async function POST(request: Request) {
  try {
    console.log("[v0] PDF generation started")
    const body = await request.json()
    console.log("[v0] Request body:", body)
    const { enquiryId, itineraryId, formData } = body

    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf")
    const itineraryDir = path.join(process.cwd(), "public", "itinerary")

    console.log("[v0] PDF template path:", pdfTemplatePath)
    console.log("[v0] Looking for CSV files in:", itineraryDir)

    try {
      await fs.access(pdfTemplatePath)
      console.log("[v0] itinerary.pdf file exists at:", pdfTemplatePath)
    } catch (error) {
      console.error("[v0] itinerary.pdf file not found:", error)
      return NextResponse.json(
        {
          error: "PDF template not found",
          details: `lib/itinerary.pdf file is missing at ${pdfTemplatePath}`,
          path: pdfTemplatePath,
        },
        { status: 500 },
      )
    }

    let csvFilePath = null
    let csvFileName = null

    if (enquiryId) {
      const availableCSVFiles = ["EVER001.csv", "GOA001.csv", "KASH001.csv", "KER001.csv", "RAJ001.csv", "THAI001.csv"]
      const matchingFile = availableCSVFiles.find((file) => file.toLowerCase().includes(enquiryId.toLowerCase()))
      if (matchingFile) {
        csvFilePath = path.join(itineraryDir, matchingFile)
        csvFileName = matchingFile
      }
    }

    if (!csvFilePath && formData.destinations?.[0]) {
      const destination = formData.destinations[0].toLowerCase()
      const destinationMap: { [key: string]: string } = {
        kerala: "EVER001.csv",
        kochi: "EVER001.csv",
        munnar: "EVER001.csv",
        alleppey: "EVER001.csv",
        goa: "GOA001.csv",
        "north goa": "GOA001.csv",
        "south goa": "GOA001.csv",
        kashmir: "KASH001.csv",
        srinagar: "KASH001.csv",
        gulmarg: "KASH001.csv",
        rajasthan: "RAJ001.csv",
        jaipur: "RAJ001.csv",
        jodhpur: "RAJ001.csv",
        thailand: "THAI001.csv",
        bangkok: "THAI001.csv",
        phuket: "THAI001.csv",
      }

      for (const [dest, file] of Object.entries(destinationMap)) {
        if (destination.includes(dest)) {
          csvFilePath = path.join(itineraryDir, file)
          csvFileName = file
          break
        }
      }
    }

    if (!csvFilePath) {
      const availableCSVFiles = ["EVER001.csv", "GOA001.csv", "KASH001.csv", "KER001.csv", "RAJ001.csv", "THAI001.csv"]
      csvFileName = availableCSVFiles[0]
      csvFilePath = path.join(itineraryDir, csvFileName)
    }

    console.log("[v0] Selected CSV file:", csvFileName)
    console.log("[v0] CSV file path:", csvFilePath)

    try {
      await fs.access(csvFilePath)
      console.log("[v0] CSV file exists at:", csvFilePath)
    } catch (error) {
      console.error("[v0] CSV file not found:", error)
      return NextResponse.json(
        {
          error: "CSV template not found",
          details: `CSV file ${csvFileName} is missing at ${csvFilePath}`,
          path: csvFilePath,
          availableFiles: ["EVER001.csv", "GOA001.csv", "KASH001.csv", "KER001.csv", "RAJ001.csv", "THAI001.csv"],
        },
        { status: 500 },
      )
    }

    const formBytes = await fs.readFile(pdfTemplatePath)
    console.log("[v0] PDF template loaded, size:", formBytes.length)

    const pdfDoc = await PDFDocument.load(formBytes)
    console.log("[v0] PDF document loaded successfully")

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

    const csvData = await fs.readFile(csvFilePath, "utf-8")
    console.log("[v0] CSV data loaded from:", csvFilePath)

    const csvLines = csvData.trim().split("\n")
    console.log("[v0] CSV lines:", csvLines.length)

    // Parse package info from first section
    let packageInfo = null
    const itineraryActivities = []
    let isActivitySection = false

    for (let i = 0; i < csvLines.length; i++) {
      const line = csvLines[i].trim()
      if (!line) continue

      if (line.startsWith("quoteId,")) {
        // Package info header
        continue
      } else if (line.startsWith("day,time,activity")) {
        // Activity section header
        isActivitySection = true
        continue
      } else if (!isActivitySection && line.includes(",")) {
        // Package info data
        const parts = line.split(",")
        if (parts.length >= 10) {
          packageInfo = {
            quoteId: parts[0]?.trim(),
            name: parts[1]?.trim(),
            days: Number.parseInt(parts[2]?.trim()) || 4,
            nights: Number.parseInt(parts[3]?.trim()) || 3,
            startDate: parts[4]?.trim(),
            costINR: Number.parseInt(parts[5]?.trim()) || 0,
            costUSD: Number.parseInt(parts[6]?.trim()) || 0,
            guests: Number.parseInt(parts[7]?.trim()) || 2,
            adults: Number.parseInt(parts[8]?.trim()) || 2,
            kids: Number.parseInt(parts[9]?.trim()) || 0,
          }
        }
      } else if (isActivitySection && line.includes(",")) {
        // Activity data
        const parts = line.split(",")
        if (parts.length >= 3) {
          const activity = {
            day: Number.parseInt(parts[0]?.trim()) || 1,
            time: parts[1]?.trim(),
            activity: parts[2]?.trim(),
            description: parts[2]?.trim(), // Use activity as description for now
            meal: parts[2]?.includes("Breakfast") || parts[2]?.includes("Lunch") || parts[2]?.includes("Dinner") ? parts[2] : "",
            transport: parts[2]?.includes("Pickup") ? "Private Vehicle" : "",
            cost: 0, // Will be calculated from package total
          }
          itineraryActivities.push(activity)
        }
      }
    }

    console.log("[v0] Parsed activities:", itineraryActivities.length)

    // Group activities by day
    const dayWiseActivities = itineraryActivities.reduce(
      (acc, activity) => {
        if (!acc[activity.day]) {
          acc[activity.day] = []
        }
        acc[activity.day].push(activity)
        return acc
      },
      {} as Record<number, typeof itineraryActivities>,
    )

    // Calculate totals
    const totalDays = packageInfo?.days || Math.max(...itineraryActivities.map((a) => a.day))
    const totalCost = packageInfo?.costUSD || packageInfo?.costINR || formData.budget || 1000
    const destination = packageInfo?.name?.split(" ")[1] || formData.destinations?.[0] || "Unknown"

    const itineraryData = {
      // Basic Info
      date: new Date().toLocaleDateString(),
      travelerName: formData.customerName || formData.name || "Valued Customer",
      email: formData.customerEmail || formData.email || "customer@example.com",
      phone: formData.customerPhone || formData.whatsappNumber || "+91-9876543210",

      // Travel Details
      destination: destination,
      travelDates: `${formData.startDate || formData.checkInDate || new Date().toLocaleDateString()} to ${formData.endDate || formData.checkOutDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      groupSize: `${formData.adults || 2} Adults${formData.children ? `, ${formData.children} Children` : ""}${formData.under6 ? `, ${formData.under6} Under 6` : ""}${formData.from7to12 ? `, ${formData.from7to12} Age 7-12` : ""}`,
      travelType: formData.travelType || "Family",
      budgetRange: `${formData.currency || "USD"} ${formData.budget || totalCost}`,

      // Package Details
      duration: `${totalDays} Days / ${totalDays - 1} Nights`,
      totalCost: `${formData.currency || "USD"} ${totalCost}`,
      packageName: packageInfo?.name || `${destination} ${formData.travelType || "Premium"} Package`,

      // Activities
      dayWiseActivities: dayWiseActivities,
      totalDays: totalDays,
    }

    console.log("[v0] Enhanced itinerary data:", itineraryData)

    let yPosition = height - 750

    // Header Information
    
    drawText(itineraryData.packageName, 600, yPosition, 40, firstPage, boldFont, rgb(1, 1, 1))
    drawText(itineraryData.date, 2000, yPosition , 40, firstPage, boldFont, rgb(1, 1, 1))

    yPosition -= 125

    // Customer Information
    // drawText("Traveler Details:", 60, yPosition, 12, firstPage, boldFont)
    
    drawText(`${itineraryData.travelerName}`, 600, yPosition, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.email}`, 1300, yPosition, 30, firstPage, font, rgb(178/255, 190/255, 181/255))
    //yPosition -= 20
    drawText(`${itineraryData.phone}`, 2000, yPosition, 30, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.travelDates}`, 600, yPosition - 60, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.destination}`, 600, yPosition - 110, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.groupSize}`, 600, yPosition - 170, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    //yPosition -= 20
    drawText(`${itineraryData.travelType}`, 600, yPosition - 220, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.budgetRange}`, 600, yPosition - 280, 40, firstPage, font, rgb(178/255, 190/255, 181/255))

    // yPosition -= 40

    // // Package Summary
    // drawText("Package Summary:", 60, yPosition, 12, firstPage, boldFont)
    // yPosition -= 25
    // drawText(`Destination: ${itineraryData.destination}`, 60, yPosition, 10)
    // drawText(`Duration: ${itineraryData.duration}`, 300, yPosition, 10)
    // yPosition -= 20
    // drawText(`Travel Dates: ${itineraryData.travelDates}`, 60, yPosition, 10)
    // drawText(`Total Cost: ${itineraryData.totalCost}`, 300, yPosition, 10)

    yPosition -= 550

    // // Day-wise Itinerary
    // drawText("Detailed Itinerary:", 60, yPosition, 12, firstPage, boldFont)
    // yPosition -= 30

    for (let day = 1; day <= itineraryData.totalDays; day++) {
      const activities = dayWiseActivities[day] || []

      if (activities.length > 0) {
        // Check if we need a new page
        if (yPosition < 150) {
          const newPage = pdfDoc.addPage([width, height])
          yPosition = height - 50
          firstPage = newPage
        }

        drawText(`Day ${day}:`, 500, yPosition, 30, firstPage, boldFont)
        yPosition -= 30

        activities.forEach((activity, ) => {
          if (yPosition < 100) {
            const newPage = pdfDoc.addPage([width, height])
            yPosition = height - 50
            firstPage = newPage
          }

          drawText(`${activity.time} - ${activity.activity}`, 580, yPosition, 25)
          yPosition -= 35
          drawText(`${activity.description}`, 650, yPosition, 25)
          yPosition -= 30
          drawText(
            `Transport: ${activity.transport} | Meal: ${activity.meal} | Cost: $${activity.cost}`,
            650,
            yPosition,
            20,
          )
          yPosition -= 50
        })

        yPosition -= 35
      }
    }

    const pdfBytes = await pdfDoc.save()
    console.log("[v0] Enhanced PDF generated successfully, size:", pdfBytes.length)

    // Upload to S3 - no fallback to local storage
    const pdfFileName = `itinerary-${itineraryId}-${Date.now()}.pdf`
    
    // Check if S3 is configured before attempting upload
    if (!S3Service.isConfigured()) {
      console.error("[v0] S3 is not configured, cannot upload PDF")
      return NextResponse.json(
        {
          error: "S3 configuration missing",
          message: "PDF generation failed - S3 is not properly configured",
          details: "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables",
        },
        { status: 500 }
      )
    }

    try {
      const s3FileInfo = await S3Service.uploadFile(
        Buffer.from(pdfBytes),
        pdfFileName,
        'application/pdf',
        'itinerary-pdfs'
      )
      
      console.log("[v0] PDF uploaded to S3:", s3FileInfo.key)
      
      // Return JSON response with S3 URL
      return NextResponse.json({
        success: true,
        message: "PDF generated and uploaded to S3 successfully",
        pdfUrl: s3FileInfo.url,
        s3Key: s3FileInfo.key,
        filename: pdfFileName,
      })
    } catch (s3Error) {
      console.error("[v0] Error uploading to S3:", s3Error)
      
      // Return error instead of falling back to local storage
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
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Please use POST method to generate itinerary PDF",
    example: 'curl -X POST /api/generate-pdf -d \'{"enquiryId":"123","itineraryId":"456","formData":{}}\'',
    templateRequired: "lib/itinerary.pdf",
    csvData: "public/itinerary/[EVER001|GOA001|KASH001|KER001|RAJ001|THAI001].csv",
  })
}
