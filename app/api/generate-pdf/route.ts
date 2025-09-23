import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { S3Service } from "@/lib/s3-service"
import { PrismaClient } from "@prisma/client"

interface ItineraryFormData {
  [key: string]: unknown;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  name?: string;
  email?: string;
  whatsappNumber?: string;
  startDate?: string;
  endDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
  destinations?: string[];
  travelType?: string;
  budget?: number;
  currency?: string;
  adults?: number;
  children?: number;
  under6?: number;
  from7to12?: number;
}

export async function POST(request: Request) {
  try {
    console.log("[v1] PDF generation started")
    const body = await request.json()
    console.log("[v1] Request body:", body)
    const { 
      enquiryId, 
      itineraryId, 
      formData,
      isEditedVersion = false
    } = body as {
      enquiryId?: string;
      itineraryId?: string;
      formData: ItineraryFormData;
      isEditedVersion?: boolean;
    }

    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf")
    const itineraryDir = path.join(process.cwd(), "public", "itinerary")

    console.log("[v1] PDF template path:", pdfTemplatePath)
    console.log("[v1] Looking for CSV files in:", itineraryDir)

    try {
      await fs.access(pdfTemplatePath)
      console.log("[v1] itinerary.pdf file exists at:", pdfTemplatePath)
    } catch (error) {
      console.error("[v1] itinerary.pdf file not found:", error)
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

    console.log("[v1] Selected CSV file:", csvFileName)
    console.log("[v1] CSV file path:", csvFilePath)

    try {
      await fs.access(csvFilePath)
      console.log("[v1] CSV file exists at:", csvFilePath)
    } catch (error) {
      console.error("[v1] CSV file not found:", error)
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
    console.log("[v1] PDF template loaded, size:", formBytes.length)

    const pdfDoc = await PDFDocument.load(formBytes)
    console.log("[v1] PDF document loaded successfully")

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
    console.log("[v1] CSV data loaded from:", csvFilePath)

    const csvLines = csvData.trim().split("\n")
    console.log("[v1] CSV lines:", csvLines.length)

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

    console.log("[v1] Parsed activities:", itineraryActivities.length)

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

    console.log("[v1] Enhanced itinerary data:", itineraryData)

    let yPosition = height - 750

    // Header Information
    
    drawText(itineraryData.packageName, 600, yPosition, 40, firstPage, boldFont, rgb(1, 1, 1))
    drawText(itineraryData.date, 2000, yPosition , 40, firstPage, boldFont, rgb(1, 1, 1))

    yPosition -= 125

    // Customer Information
    drawText(`${itineraryData.travelerName}`, 600, yPosition, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.email}`, 1300, yPosition, 30, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.phone}`, 2000, yPosition, 30, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.travelDates}`, 600, yPosition - 60, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.destination}`, 600, yPosition - 110, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.groupSize}`, 600, yPosition - 170, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.travelType}`, 600, yPosition - 220, 40, firstPage, font, rgb(178/255, 190/255, 181/255))
    drawText(`${itineraryData.budgetRange}`, 600, yPosition - 280, 40, firstPage, font, rgb(178/255, 190/255, 181/255))

    yPosition -= 550

    // Day-wise Itinerary
    for (let day = 1; day <= itineraryData.totalDays; day++) {
      const activities = dayWiseActivities[day] || []

      if (activities.length > 0) {
        // Check if we need a new page (leave at least 100pt at bottom for content)
        if (yPosition < 150) {
          const newPage = pdfDoc.addPage([width, height])
          yPosition = height - 50
          firstPage = newPage
        }

        // Day header
        drawText(`Day ${day}`, 150, yPosition, 20, firstPage, boldFont, rgb(0, 0, 0))
        yPosition -= 30

        // Activities for the day
        activities.forEach((activity) => {
          // Check if we need a new page before adding activity
          if (yPosition < 150) {
            const newPage = pdfDoc.addPage([width, height])
            yPosition = height - 50
            firstPage = newPage
            // Redraw day header at top of new page
            drawText(`Day ${day} (continued)`, 50, yPosition, 24, firstPage, boldFont, rgb(0, 0, 0))
            yPosition -= 30
          }

          // Activity time and title with larger font
          drawText(`${activity.time || 'All Day'}:`, 70, yPosition, 16, firstPage, boldFont)
          drawText(activity.activity, 200, yPosition, 16, firstPage)
          yPosition -= 25

          // Activity description with larger font
          if (activity.description && activity.description !== activity.activity) {
            drawText(activity.description, 90, yPosition, 14, firstPage, undefined, rgb(0.3, 0.3, 0.3))
            yPosition -= 25
          }

          // Activity details with larger font
          const details = []
          if (activity.transport) details.push(`Transport: ${activity.transport}`)
          if (activity.meal) details.push(`Meal: ${activity.meal}`)
          if (activity.cost) details.push(`Cost: $${activity.cost}`)
          
          if (details.length > 0) {
            drawText(details.join(' | '), 90, yPosition, 12, firstPage, undefined, rgb(0.5, 0.5, 0.5))
            yPosition -= 20
          }

          // Add some space between activities
          yPosition -= 35
        })

        // Add more space between days
        yPosition -= 20
      }
    }

    const pdfBytes = await pdfDoc.save()
    console.log("[v1] Enhanced PDF generated successfully, size:", pdfBytes.length)

    // Upload to S3 - no fallback to local storage
    const pdfFileName = `itinerary-${itineraryId || 'new'}-${Date.now()}.pdf`
    
    // Check if S3 is configured before attempting upload
    if (!S3Service.isConfigured()) {
      console.error("[v1] S3 is not configured, cannot upload PDF")
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
      
      console.log("[v1] PDF uploaded to S3:", s3FileInfo.key)
      
      // Create a new itinerary entry for each PDF generation
      const prisma = new PrismaClient();
      try {
        if (isEditedVersion) {
          // Create a new itinerary entry for edited version
          const newItinerary = await prisma.itineraries.create({
            data: {
              enquiryId: enquiryId || '',
              destinations: formData.destinations?.join(', ') || '',
              startDate: formData.startDate || formData.checkInDate || null,
              endDate: formData.endDate || formData.checkOutDate || null,
              budget: formData.budget || 0,
              currency: formData.currency || 'USD',
              status: 'generated',
              pdfUrl: s3FileInfo.url,
              editedPdfUrl: s3FileInfo.url, // Store as edited PDF URL
              isEdited: true,
              activeStatus: true, // Set as active by default
              customerId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });

          // Deactivate all other itineraries for this enquiry
          if (enquiryId) {
            await prisma.itineraries.updateMany({
              where: { 
                enquiryId: enquiryId,
                id: { not: newItinerary.id }
              },
              data: { activeStatus: false },
            });
          }

          console.log("[v1] Created new edited itinerary:", newItinerary.id);
          
          return NextResponse.json({
            success: true,
            message: `Edited PDF generated and uploaded successfully`,
            pdfUrl: s3FileInfo.url,
            s3Key: s3FileInfo.key,
            filename: pdfFileName,
            isEditedVersion: true,
            itineraryId: newItinerary.id
          })
        } else {
          // Create a new itinerary entry for original version
          const newItinerary = await prisma.itineraries.create({
            data: {
              enquiryId: enquiryId || '',
              destinations: formData.destinations?.join(', ') || '',
              startDate: formData.startDate || formData.checkInDate || null,
              endDate: formData.endDate || formData.checkOutDate || null,
              budget: formData.budget || 0,
              currency: formData.currency || 'USD',
              status: 'generated',
              pdfUrl: s3FileInfo.url,
              isEdited: false,
              activeStatus: true, // Set as active by default
              customerId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });

          // Deactivate all other itineraries for this enquiry
          if (enquiryId) {
            await prisma.itineraries.updateMany({
              where: { 
                enquiryId: enquiryId,
                id: { not: newItinerary.id }
              },
              data: { activeStatus: false },
            });
          }

          console.log("[v1] Created new original itinerary:", newItinerary.id);
          
          return NextResponse.json({
            success: true,
            message: `PDF generated and uploaded successfully`,
            pdfUrl: s3FileInfo.url,
            s3Key: s3FileInfo.key,
            filename: pdfFileName,
            isEditedVersion: false,
            itineraryId: newItinerary.id
          })
        }
      } catch (dbError) {
        console.error("Error creating itinerary in database:", dbError);
        // Still return success since PDF was uploaded
        return NextResponse.json({
          success: true,
          message: `PDF uploaded but database update failed`,
          pdfUrl: s3FileInfo.url,
          s3Key: s3FileInfo.key,
          filename: pdfFileName,
          isEditedVersion,
          warning: "Database update failed"
        })
      } finally {
        await prisma.$disconnect();
      }
    } catch (s3Error) {
      console.error("[v1] Error uploading to S3:", s3Error)
      
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
    console.error("[v1] Error generating PDF:", error)
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


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itineraryId = searchParams.get('itineraryId');
    const filename = searchParams.get('filename');

    if (!itineraryId || !filename) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Generate the PDF using a library like Puppeteer, jsPDF, or a third-party service
    // 2. Upload the PDF to a storage service (e.g., AWS S3, Google Cloud Storage)
    // 3. Return the public URL of the uploaded PDF

    // For now, we'll return a placeholder URL
    // Replace this with your actual PDF generation and upload logic
    const pdfUrl = `/placeholder-pdf/${filename}`;

    // Update the itinerary with the PDF URL
     const prisma = new PrismaClient();
    await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        pdfUrl,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  } finally {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  }
}
