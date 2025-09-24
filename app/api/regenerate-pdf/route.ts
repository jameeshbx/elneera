import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { S3Service } from '@/lib/s3-service';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const {
      itineraryId,
      editedData,
      isEditedVersion = false,
      editedContent
    } = await req.json();

    if (!itineraryId) {
      return NextResponse.json(
        { error: "Itinerary ID is required" },
        { status: 400 }
      );
    }

    // Get the current itinerary data with all relationships
    const itinerary = await prisma.itineraries.findUnique({
      where: { id: itineraryId },
      include: {
        pdfVersions: true,
        enquiry: true
      }
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    console.log('[regenerate-pdf] Starting PDF regeneration...');

    // Get the PDF template
    const pdfTemplatePath = path.join(process.cwd(), "lib", "itinerary.pdf");
    
    try {
      await fs.access(pdfTemplatePath);
      console.log('[regenerate-pdf] PDF template found:', pdfTemplatePath);
    } catch (error) {
      console.error('[regenerate-pdf] PDF template not found:', error);
      return NextResponse.json(
        {
          error: "PDF template not found",
          details: `lib/itinerary.pdf file is missing at ${pdfTemplatePath}`,
        },
        { status: 500 }
      );
    }

    // Load the PDF template
    const formBytes = await fs.readFile(pdfTemplatePath);
    const pdfDoc = await PDFDocument.load(formBytes);
    
    // Get first page and fonts
    const pages = pdfDoc.getPages();
    let currentPage = pages[0]; // Changed from const to let
    const { height } = currentPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper function to safely encode text for WinAnsi
    const safeEncodeText = (text: string): string => {
      // Replace problematic Unicode characters with ASCII equivalents
      return text
        .replace(/₹/g, 'INR ')  // Replace ₹ with INR
        .replace(/€/g, 'EUR ')  // Replace € with EUR
        .replace(/£/g, 'GBP ')  // Replace £ with GBP
        .replace(/¥/g, 'JPY ')  // Replace ¥ with JPY
        .replace(/₦/g, 'NGN ')  // Replace ₦ with NGN
        .replace(/[^\x00-\x7F]/g, '?')  // Replace other non-ASCII characters with ?
        .trim();
    };

    // Helper function to draw text with safe encoding
    const drawText = (text: string, x: number, y: number, size = 10, page = currentPage, fontType = font, color = rgb(0, 0, 0)) => {
      const safeText = safeEncodeText(text);
      page.drawText(safeText, {
        x,
        y,
        size,
        font: fontType,
        color,
      });
    };

    // Prepare itinerary data (use editedData if provided, otherwise use existing data)
    const finalData = editedData ? { ...itinerary, ...editedData } : itinerary;
    
    // Helper function to format currency safely
    const formatCurrency = (currency: string, amount: number | string): string => {
      const currencyMap: { [key: string]: string } = {
        'INR': 'INR ',
        'USD': 'USD ',
        'EUR': 'EUR ',
        'GBP': 'GBP ',
        'JPY': 'JPY ',
        'NGN': 'NGN '
      };
      
      const safeCurrency = currencyMap[currency] || currency + ' ';
      return `${safeCurrency}${amount}`;
    };
    
    const itineraryData = {
      // Basic Info
      date: new Date().toLocaleDateString(),
      travelerName: finalData.enquiry?.name || "Valued Customer",
      email: finalData.enquiry?.email || "customer@example.com",
      phone: finalData.enquiry?.phone || "+91-9876543210",

      // Travel Details
      destination: finalData.destinations || "Amazing Destination",
      travelDates: `${finalData.startDate ? new Date(finalData.startDate).toLocaleDateString() : new Date().toLocaleDateString()} to ${finalData.endDate ? new Date(finalData.endDate).toLocaleDateString() : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      groupSize: `${finalData.adults || 2} Adults${finalData.children ? `, ${finalData.children} Children` : ""}${finalData.under6 ? `, ${finalData.under6} Under 6` : ""}${finalData.from7to12 ? `, ${finalData.from7to12} Age 7-12` : ""}`,
      travelType: finalData.travelType || "Family",
      budgetRange: formatCurrency(finalData.currency || "USD", finalData.budget || 1000),

      // Package Details
      duration: "Multi-day Experience",
      totalCost: formatCurrency(finalData.currency || "USD", finalData.budget || 1000),
      packageName: `${finalData.destinations || "Premium"} Package`,
    };

    console.log('[regenerate-pdf] Itinerary data prepared:', itineraryData);

    let yPosition = height - 750;

    // Header Information
    drawText(itineraryData.packageName, 600, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1));
    drawText(itineraryData.date, 2000, yPosition, 40, currentPage, boldFont, rgb(1, 1, 1));

    yPosition -= 125;

    // Customer Information
    drawText(`${itineraryData.travelerName}`, 600, yPosition, 40, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.email}`, 1300, yPosition, 30, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.phone}`, 2000, yPosition, 30, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.travelDates}`, 600, yPosition - 60, 40, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.destination}`, 600, yPosition - 110, 40, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.groupSize}`, 600, yPosition - 170, 40, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.travelType}`, 600, yPosition - 220, 40, currentPage, font, rgb(178/255, 190/255, 181/255));
    drawText(`${itineraryData.budgetRange}`, 600, yPosition - 280, 40, currentPage, font, rgb(178/255, 190/255, 181/255));

    yPosition -= 550;

    // If there's edited content (HTML), convert it to text for PDF
    if (editedContent) {
      // Simple HTML to text conversion for PDF
      const textContent = editedContent
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
        .trim();

      // Split content into manageable chunks for PDF
      const words = textContent.split(' ');
      let currentLine = '';
      const maxLineLength = 80; // Adjust based on your PDF width

      for (const word of words) {
        if ((currentLine + word).length > maxLineLength) {
          if (currentLine.trim()) {
            // Check if we need a new page
            if (yPosition < 150) {
              const newPage = pdfDoc.addPage([currentPage.getWidth(), height]);
              yPosition = height - 50;
              currentPage = newPage; // Now we can reassign currentPage
            }
            
            drawText(currentLine.trim(), 150, yPosition, 12, currentPage, font);
            yPosition -= 20;
          }
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }

      // Draw the last line
      if (currentLine.trim()) {
        if (yPosition < 150) {
          const newPage = pdfDoc.addPage([currentPage.getWidth(), height]);
          yPosition = height - 50;
          currentPage = newPage;
        }
        drawText(currentLine.trim(), 150, yPosition, 12, currentPage, font);
      }
    } else if (finalData.dailyItinerary && Array.isArray(finalData.dailyItinerary)) {
      // Use existing daily itinerary data
      for (const day of finalData.dailyItinerary) {
        // Check if we need a new page
        if (yPosition < 150) {
          const newPage = pdfDoc.addPage([currentPage.getWidth(), height]);
          yPosition = height - 50;
          currentPage = newPage;
        }

        // Day header
        drawText(`Day ${day.day} - ${day.title || day.date}`, 150, yPosition, 20, currentPage, boldFont);
        yPosition -= 30;

        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            if (yPosition < 100) {
              const newPage = pdfDoc.addPage([currentPage.getWidth(), height]);
              yPosition = height - 50;
              currentPage = newPage;
            }

            drawText(`${activity.time || 'All Day'}: ${activity.title}`, 170, yPosition, 14, currentPage, font);
            yPosition -= 20;
            
            if (activity.description) {
              drawText(activity.description, 190, yPosition, 12, currentPage, font, rgb(0.3, 0.3, 0.3));
              yPosition -= 18;
            }
            
            yPosition -= 10; // Space between activities
          }
        }
        yPosition -= 20; // Space between days
      }
    } else {
      // Default content if no itinerary data
      drawText("Itinerary details will be provided upon confirmation.", 150, yPosition, 16, currentPage, font);
      yPosition -= 30;
      drawText("This is a regenerated version of your travel itinerary.", 150, yPosition, 14, currentPage, font);
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    console.log('[regenerate-pdf] PDF generated, size:', pdfBytes.length);

    // Upload to S3
    const timestamp = Date.now();
    const pdfFileName = `itinerary-${itineraryId}-${timestamp}${isEditedVersion ? '-edited' : '-regenerated'}.pdf`;
    
    console.log('[regenerate-pdf] Uploading to S3:', pdfFileName);
    
    const uploadResult = await S3Service.uploadFile(
      Buffer.from(pdfBytes),
      pdfFileName,
      'application/pdf',
      'itinerary-pdfs'
    );

    console.log('[regenerate-pdf] Upload result:', uploadResult);

    // Deactivate previous versions
    await prisma.pDFVersion.updateMany({
      where: { itineraryId },
      data: { isActive: false }
    });

    // Create new PDF version
    const newVersion = await prisma.pDFVersion.create({
      data: {
        itineraryId,
        url: uploadResult.url,
        version: (itinerary.pdfVersions?.length || 0) + 1,
        isActive: true,
        metadata: {
          isEdited: isEditedVersion,
          regeneratedAt: new Date().toISOString(),
          editedData: editedData || null,
          editedContent: editedContent || null,
          s3Key: uploadResult.key || null,
          filename: pdfFileName
        }
      }
    });

    // Update the itinerary record
    const updatedItinerary = await prisma.itineraries.update({
      where: { id: itineraryId },
      data: {
        activePdfVersion: newVersion.id,
        lastPdfRegeneratedAt: new Date(),
        ...(isEditedVersion ? {
          isEdited: true,
          editedAt: new Date(),
          editedData: editedData ? JSON.stringify(editedData) : undefined,
          editedContent: editedContent || undefined,
          editedPdfUrl: uploadResult.url
        } : {
          pdfUrl: uploadResult.url
        })
      }
    });

    console.log('[regenerate-pdf] PDF regenerated successfully:', uploadResult.url);

    return NextResponse.json({
      success: true,
      pdfUrl: uploadResult.url,
      version: newVersion.version,
      versionId: newVersion.id,
      isEdited: isEditedVersion,
      editedAt: updatedItinerary.editedAt,
      s3Key: uploadResult.key,
      filename: pdfFileName,
      message: "PDF regenerated successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("[regenerate-pdf] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to regenerate PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}