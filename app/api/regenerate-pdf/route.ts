import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { S3Service } from "@/lib/s3-service"
import path from "path"
import fs from "fs/promises"

type Block =
  | { type: "day"; text: string }
  | { type: "heading"; text: string }
  | { type: "timeActivity"; time: string; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string }

export async function POST(req: Request) {
  try {
    const { itineraryId, formData, editedContent, editedData, isEditedVersion = true } = await req.json()

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 })
    }

    // Test database connection first
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("[v0] [regenerated-pdf] Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unable to connect to database",
          hint: "Check DATABASE_URL in .env and run 'npx prisma generate'"
        },
        { status: 500 }
      )
    }

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

    console.log("[v0] [regenerated-pdf] Start - itineraryId:", itineraryId)

    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf")

    try {
      await fs.access(pdfTemplatePath)
    } catch (error) {
      console.error("[v0] [regenerated-pdf] PDF template not found:", error)
      return NextResponse.json(
        {
          error: "PDF template not found",
          details: `lib/itinerary.pdf file is missing at ${pdfTemplatePath}`,
        },
        { status: 500 },
      )
    }

    const formBytes = await fs.readFile(pdfTemplatePath)
    const pdfDoc = await PDFDocument.load(formBytes)

    const pages = pdfDoc.getPages()
    let currentPage = pages[0]
    let { width, height } = currentPage.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const safeEncodeText = (text: string): string => {
      return text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
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
      page.drawText(safeText, { x, y, size, font: fontType, color })
    }

    const wrapTextByWidth = (text: string, maxWidth: number, size: number, fontType = font): string[] => {
      const words = safeEncodeText(text).split(/\s+/).filter(Boolean)
      const lines: string[] = []
      let current = ""
      for (const w of words) {
        const tentative = current ? current + " " + w : w
        if (fontType.widthOfTextAtSize(tentative, size) <= maxWidth) {
          current = tentative
        } else {
          if (current) lines.push(current)
          current = w
        }
      }
      if (current) lines.push(current)
      return lines
    }

    const ensureRoom = (neededY: number) => {
      if (neededY < 150) {
        const newPage = pdfDoc.addPage([width, height])
        currentPage = newPage
        ;({ width, height } = currentPage.getSize())
        return height - 80
      }
      return neededY
    }

    // Parse HTML preserving structure: headings, paragraphs, list items, and <br>
    const htmlToBlocks = (html: string): Block[] => {
      let h = html
      h = h.replace(/\r\n/g, "\n")
      h = h.replace(/<br\s*\/?>/gi, "\n")
      h = h.replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, "\n")
      h = h.replace(/<li[^>]*>/gi, "- ")
      h = h.replace(/<p[^>]*>|<div[^>]*>/gi, "")
      h = h.replace(/<h[1-6][^>]*>/gi, "")
      h = h.replace(/<[^>]+>/g, "")
      h = h.replace(/[ \t]+\n/g, "\n")
      h = h.replace(/\n{3,}/g, "\n\n")

      const lines = h
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      const blocks: Block[] = []
      for (const line of lines) {
        const dayMatch = /^day\s*\d+[:.-]?\s*(.*)$/i.exec(line)
        if (dayMatch) {
          blocks.push({ type: "day", text: dayMatch[0].replace(/\s+/g, " ") })
          continue
        }

        const bullet = /^-\s*(.*)$/.exec(line)
        if (bullet) {
          blocks.push({ type: "bullet", text: bullet[1] })
          continue
        }

        const timeRow = /^\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–—]?\s*(.+)$/i.exec(line)
        if (timeRow) {
          blocks.push({ type: "timeActivity", time: timeRow[1], text: timeRow[2] })
          continue
        }

        if (line.length <= 60 && /^[A-Z0-9][A-Z0-9\s\-:,/()]*$/.test(line)) {
          blocks.push({ type: "heading", text: line })
          continue
        }

        blocks.push({ type: "paragraph", text: line })
      }
      return blocks
    }

    // Prepare itinerary meta
    const finalData = editedData ? { ...itinerary, ...editedData } : itinerary
    const formatCurrency = (currency: string, amount: number | string): string => {
      const map: Record<string, string> = {
        INR: "INR ",
        USD: "USD ",
        EUR: "EUR ",
        GBP: "GBP ",
        JPY: "JPY ",
        NGN: "NGN ",
      }
      return `${map[currency] ?? currency + " "}${amount}`
    }

    const itineraryData = {
      date: new Date().toLocaleDateString(),
      travelerName: formData?.customerName || finalData.enquiry?.name || "Valued Customer",
      email: formData?.customerEmail || finalData.enquiry?.email || "customer@example.com",
      phone: formData?.customerPhone || finalData.enquiry?.phone || "+91-9876543210",
      destination: finalData.destinations || "Amazing Destination",
      travelDates: `${finalData.startDate ? new Date(finalData.startDate).toLocaleDateString() : new Date().toLocaleDateString()} to ${finalData.endDate ? new Date(finalData.endDate).toLocaleDateString() : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      groupSize: `${finalData.adults || 2} Adults${finalData.children ? `, ${finalData.children} Children` : ""}${finalData.under6 ? `, ${finalData.under6} Under 6` : ""}${finalData.from7to12 ? `, ${finalData.from7to12} Age 7-12` : ""}`,
      travelType: finalData.travelType || "Family",
      budgetRange: formatCurrency(finalData.currency || "USD", finalData.budget || 1000),
      duration: "Multi-day Experience",
      totalCost: formatCurrency(finalData.currency || "USD", finalData.budget || 1000),
      packageName: `${finalData.destinations || "Premium"} Package - REGENERATED`,
    }

    let yPosition = height - 750

    // Header block
    drawText(itineraryData.packageName, 600, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1))
    drawText(itineraryData.date, 2000, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1))

    yPosition -= 125

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

    // Section header
    drawText("REGENERATED ITINERARY", 150, yPosition, 20, currentPage, boldFont, rgb(0.8, 0.2, 0.2))
    yPosition -= 40

    const contentLeft = 150
    const timeLeft = 170
    const textLeft = 300
    const maxTextWidth = width - textLeft - 150
    const paragraphWidth = width - contentLeft - 150
    const lineHeight = 26

    if (editedContent) {
      console.log("[v0] [regenerated-pdf] Formatting editedContent")
      const blocks = htmlToBlocks(editedContent)

      for (const b of blocks) {
        if (b.type === "day") {
          yPosition = ensureRoom(yPosition - 10)
          drawText(b.text, contentLeft, yPosition, 24, currentPage, boldFont)
          yPosition -= 38
          continue
        }

        if (b.type === "heading") {
          yPosition = ensureRoom(yPosition - 10)
          drawText(b.text, contentLeft, yPosition, 18, currentPage, boldFont)
          yPosition -= 32
          continue
        }

        if (b.type === "timeActivity") {
          const timeStr = b.time
          const descLines = wrapTextByWidth(b.text, maxTextWidth, 16, font)

          yPosition = ensureRoom(yPosition - 0)
          drawText(timeStr + ":", timeLeft, yPosition, 16, currentPage, boldFont)
          if (descLines.length > 0) {
            drawText(descLines[0], textLeft, yPosition, 16, currentPage, font)
          }
          yPosition -= lineHeight

          for (let i = 1; i < descLines.length; i++) {
            yPosition = ensureRoom(yPosition)
            drawText(descLines[i], textLeft, yPosition, 16, currentPage, font)
            yPosition -= lineHeight
          }

          yPosition -= 6
          continue
        }

        if (b.type === "bullet") {
          const lines = wrapTextByWidth(b.text, paragraphWidth - 40, 16, font)
          yPosition = ensureRoom(yPosition)
          drawText("•", contentLeft, yPosition, 16, currentPage, boldFont)
          drawText(lines[0], contentLeft + 30, yPosition, 16, currentPage, font)
          yPosition -= lineHeight
          for (let i = 1; i < lines.length; i++) {
            yPosition = ensureRoom(yPosition)
            drawText(lines[i], contentLeft + 30, yPosition, 16, currentPage, font)
            yPosition -= lineHeight
          }
          yPosition -= 6
          continue
        }

        const paraLines = wrapTextByWidth(b.text, paragraphWidth, 16, font)
        for (const ln of paraLines) {
          yPosition = ensureRoom(yPosition)
          drawText(ln, contentLeft, yPosition, 16, currentPage, font)
          yPosition -= lineHeight
        }
        yPosition -= 8
      }
    } else if (finalData.dailyItinerary && Array.isArray(finalData.dailyItinerary)) {
      for (const day of finalData.dailyItinerary) {
        if (yPosition < 200) {
          const newPage = pdfDoc.addPage([width, height])
          currentPage = newPage
          ;({ width, height } = currentPage.getSize())
          yPosition = height - 80
        }

        drawText(
          `Day ${day.day} - ${day.title || day.date} [UPDATED]`,
          contentLeft,
          yPosition,
          24,
          currentPage,
          boldFont,
        )
        yPosition -= 45

        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            if (yPosition < 150) {
              const newPage = pdfDoc.addPage([width, height])
              currentPage = newPage
              ;({ width, height } = currentPage.getSize())
              yPosition = height - 80
            }

            drawText(`${activity.time || "All Day"}:`, timeLeft, yPosition, 16, currentPage, boldFont)
            const lines = wrapTextByWidth(activity.title, maxTextWidth, 16, font)
            drawText(lines[0], textLeft, yPosition, 16, currentPage, font)
            yPosition -= lineHeight
            for (let i = 1; i < lines.length; i++) {
              yPosition = ensureRoom(yPosition)
              drawText(lines[i], textLeft, yPosition, 16, currentPage, font)
              yPosition -= lineHeight
            }

            if (activity.description) {
              const descLines = wrapTextByWidth(activity.description, maxTextWidth, 14, font)
              for (const ln of descLines) {
                yPosition = ensureRoom(yPosition)
                drawText(ln, textLeft, yPosition, 14, currentPage, font, rgb(0.4, 0.4, 0.4))
                yPosition -= 22
              }
            }

            yPosition -= 10
          }
        }
        yPosition -= 20
      }
    } else {
      drawText(
        "Itinerary details have been updated based on your requirements.",
        contentLeft,
        yPosition,
        16,
        currentPage,
        font,
      )
      yPosition -= 35
      drawText("This is a regenerated version of your travel itinerary.", contentLeft, yPosition, 14, currentPage, font)
    }

    const pdfBytes = await pdfDoc.save()
    console.log("[v0] [regenerated-pdf] PDF regenerated size:", pdfBytes.length)

    const timestamp = Date.now()
    const pdfFileName = `itinerary-${itineraryId}-${timestamp}-regenerated.pdf`

    const uploadResult = await S3Service.uploadFile(
      Buffer.from(pdfBytes),
      pdfFileName,
      "application/pdf",
      "itinerary-pdfs",
    )

    await prisma.pDFVersion.updateMany({
      where: { itineraryId },
      data: { isActive: false },
    })

    const existingVersions = await prisma.pDFVersion.count({ where: { itineraryId } })
    const versionNumber = existingVersions + 1

    const newVersion = await prisma.pDFVersion.create({
      data: {
        itineraryId,
        url: uploadResult.url,
        version: versionNumber,
        isActive: true,
        metadata: {
          isEdited: isEditedVersion,
          regeneratedAt: new Date().toISOString(),
          editedData: editedData || null,
          editedContent: editedContent || null,
          s3Key: uploadResult.key || null,
          filename: pdfFileName,
        },
      },
    })

    const updatedItinerary = await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        activePdfVersion: newVersion.id,
        lastPdfRegeneratedAt: new Date(),
        isEdited: isEditedVersion,
        editedAt: new Date(),
        editedData: editedData ? JSON.stringify(editedData) : undefined,
        editedContent: editedContent || undefined,
        editedPdfUrl: uploadResult.url,
        status: "regenerated",
      },
    })

    console.log("[v0] [regenerated-pdf] Success:", uploadResult.url)

    return NextResponse.json(
      {
        success: true,
        pdfUrl: uploadResult.url,
        editedPdfUrl: uploadResult.url,
        version: newVersion.version,
        versionId: newVersion.id,
        isEdited: isEditedVersion,
        editedAt: updatedItinerary.editedAt,
        regeneratedAt: new Date().toISOString(),
        s3Key: uploadResult.key,
        filename: pdfFileName,
        message: "PDF regenerated successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] [regenerated-pdf] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}