import { NextResponse } from "next/server"

// Define the expected form data structure
interface ItineraryFormData {
  [key: string]: unknown;
  // Add specific form fields as needed
  // Example:
  // title?: string;
  // description?: string;
  // Add other fields that formData might contain
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Edited PDF generation started")
    const body = await request.json()
    console.log("[v0] Request body:", body)
    
    const { 
      enquiryId, 
      itineraryId, 
      formData,
    } = body as {
      enquiryId?: string;
      itineraryId?: string;
      formData: ItineraryFormData;
    }

    // Use the existing generate-pdf endpoint but mark it as an edited version
    const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enquiryId,
        itineraryId,
        formData,
        isEditedVersion: true,
        forceRegenerate: true
      }),
    });

    if (!pdfResponse.ok) {
      const error = await pdfResponse.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to generate edited PDF');
    }

    const result = await pdfResponse.json();
    
    // Update the itinerary with the new edited PDF URL
    if (result.pdfUrl && itineraryId) {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/itineraries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itineraryId,
          editedPdfUrl: result.pdfUrl,
          isEdited: true,
          editedAt: new Date().toISOString()
        }),
      });

      if (!updateResponse.ok) {
        console.error("Failed to update itinerary with edited PDF URL");
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[v0] Error generating edited PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate edited PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
