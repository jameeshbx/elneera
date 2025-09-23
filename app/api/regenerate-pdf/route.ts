import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePDF } from '@/lib/pdf-generator'; // Adjust import based on your actual PDF generation utility
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const {
      itineraryId,
      enquiryId,
      formData,
      editedContent,
      isEditedVersion
    } = await req.json();

    if (!itineraryId || !enquiryId) {
      return NextResponse.json(
        { error: "Missing required IDs" },
        { status: 400 }
      );
    }

    // Generate the PDF
    const pdfResult = await generatePDF({
      itineraryId,
      enquiryId,
      formData,
      content: editedContent,
      isEdited: isEditedVersion
    });

    if (!pdfResult.success) {
      throw new Error(pdfResult.error || "Failed to generate PDF");
    }

    // Update the itinerary with the new PDF URL
    const updateData: Prisma.itinerariesUpdateArgs = {
      where: { id: itineraryId },
      data: {
        updatedAt: new Date(),
        ...(isEditedVersion ? {
          editedPdfUrl: pdfResult.pdfUrl,
          isEdited: true,
          editedAt: new Date()
        } : {
          pdfUrl: pdfResult.pdfUrl
        })
      }
    };

    const updatedItinerary = await prisma.itineraries.update(updateData);

    return NextResponse.json({
      success: true,
      editedPdfUrl: updatedItinerary.editedPdfUrl,
      isEdited: updatedItinerary.isEdited,
      editedAt: updatedItinerary.editedAt,
      message: "PDF generated successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}